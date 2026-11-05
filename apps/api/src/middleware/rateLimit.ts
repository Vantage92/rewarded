// Rate limiting (architecture §10.2): an in-memory token bucket per key in the API process.
// One process in the pilot; several processes need shared storage (open question 9).
import { DomainError, type NetClass } from '@rewarded/contracts';
import type { Context, MiddlewareHandler } from 'hono';
import type { Clock } from '../platform/types.ts';
import type { AppEnv } from './context.ts';

interface Bucket {
  tokens: number;
  updatedMs: number;
}

/** Token bucket: `limit` tokens, refilled evenly over `windowSec`. */
export class RateLimiter {
  private readonly buckets = new Map<string, Bucket>();
  private readonly clock: Clock;
  private readonly maxKeys: number;
  constructor(clock: Clock, maxKeys = 100_000) {
    this.clock = clock;
    this.maxKeys = maxKeys;
  }

  /** Takes one token; false when the bucket is empty. */
  take(bucket: string, key: string, limit: number, windowSec: number): boolean {
    const now = this.clock.now().getTime();
    const id = `${bucket}|${key}`;
    const b = this.buckets.get(id) ?? { tokens: limit, updatedMs: now };
    const refill = ((now - b.updatedMs) / (windowSec * 1000)) * limit;
    b.tokens = Math.min(limit, b.tokens + Math.max(0, refill));
    b.updatedMs = now;
    if (b.tokens < 1) {
      this.buckets.set(id, b);
      return false;
    }
    b.tokens -= 1;
    if (!this.buckets.has(id) && this.buckets.size >= this.maxKeys) this.evict(now);
    this.buckets.set(id, b);
    return true;
  }

  /** Remaining whole tokens (for tests). */
  remaining(bucket: string, key: string, limit: number, windowSec: number): number {
    const b = this.buckets.get(`${bucket}|${key}`);
    if (!b) return limit;
    const refill = ((this.clock.now().getTime() - b.updatedMs) / (windowSec * 1000)) * limit;
    return Math.floor(Math.min(limit, b.tokens + Math.max(0, refill)));
  }

  reset(): void {
    this.buckets.clear();
  }

  private evict(now: number): void {
    // Drop buckets untouched for an hour; a full bucket after an hour carries no state.
    for (const [k, b] of this.buckets) if (now - b.updatedMs > 3_600_000) this.buckets.delete(k);
  }
}

/** Key a limit applies to (architecture §10.2: IP hash, email hash, user or session). */
export type RateKey = 'ip' | 'user' | 'session';

export interface RateLimitOptions {
  bucket: string;
  limit: number;
  windowSec: number;
  /** Default: user when signed in, else IP hash. */
  key?: RateKey;
  /** Higher limit for campus and mobile CGNAT addresses (shared IPs, §10.2). */
  sharedNetLimit?: number;
}

/** Limits of architecture §10.2 (choice, to adjust after the first pilot week). */
export const RATE_LIMITS = {
  waitlistEmail: { bucket: 'waitlist:email', limit: 5, windowSec: 3600 },
  waitlistIp: { bucket: 'waitlist:ip', limit: 30, windowSec: 3600, key: 'ip', sharedNetLimit: 300 },
  magicLinkEmail: { bucket: 'magic:email', limit: 5, windowSec: 3600 },
  magicLinkIp: { bucket: 'magic:ip', limit: 20, windowSec: 3600, key: 'ip', sharedNetLimit: 200 },
  loginCodeEmail: { bucket: 'code:email', limit: 20, windowSec: 3600 },
  phoneStart: { bucket: 'phone:start', limit: 3, windowSec: 3600, key: 'user' },
  sessionsStart: { bucket: 'sessions:start', limit: 12, windowSec: 3600, key: 'user' },
  redemptions: { bucket: 'redemptions', limit: 10, windowSec: 3600, key: 'user' },
  events: { bucket: 'events', limit: 120, windowSec: 3600, key: 'session' },
  mfaVerify: { bucket: 'mfa:verify', limit: 5, windowSec: 900, key: 'user' },
  mutating: { bucket: 'mutating', limit: 60, windowSec: 60 },
} as const satisfies Record<string, RateLimitOptions>;

export function limitFor(opts: RateLimitOptions, netClass: NetClass): number {
  return opts.sharedNetLimit !== undefined && netClass !== 'other' ? opts.sharedNetLimit : opts.limit;
}

function keyFor(c: Context<AppEnv>, key: RateKey | undefined): string {
  const auth = c.var.auth;
  const sessionId = auth.kind === 'none' ? undefined : auth.sessionId;
  const userId = auth.kind === 'user' ? auth.user.id : undefined;
  switch (key ?? (userId ? 'user' : 'ip')) {
    case 'user':
      return userId ? `u:${userId}` : sessionId ? `s:${sessionId}` : `ip:${c.var.ipHash}`;
    case 'session':
      return sessionId ? `s:${sessionId}` : `ip:${c.var.ipHash}`;
    case 'ip':
      return `ip:${c.var.ipHash}`;
  }
}

/** Throws RATE_LIMITED when the bucket for this request is empty. */
export function enforceRateLimit(c: Context<AppEnv>, opts: RateLimitOptions, explicitKey?: string): void {
  const key = explicitKey ?? keyFor(c, opts.key);
  if (!c.var.limiter.take(opts.bucket, key, limitFor(opts, c.var.netClass), opts.windowSec)) {
    throw new DomainError('RATE_LIMITED', { retry_after_s: Math.ceil(opts.windowSec / limitFor(opts, c.var.netClass)) });
  }
}

export function rateLimit(opts: RateLimitOptions): MiddlewareHandler<AppEnv> {
  return async (c, next) => {
    enforceRateLimit(c, opts);
    await next();
  };
}
