// Per-request state (architecture §8.1, §10.4): who is calling, the net class and the hashed IP.
// The raw IP address is only read in memory here and never put on the context, in a table or a log.
import type { AgeBand, AdminRole, Locale, NetClass, UaClass } from '@rewarded/contracts';
import type { Db } from '../db/types.ts';
import type { Logger } from '../platform/log.ts';
import type { Clock } from '../platform/types.ts';
import type { RateLimiter } from './rateLimit.ts';

export interface AuthUser {
  id: string;
  pseudonym: string;
  email: string;
  ageBand: AgeBand;
  status: 'active' | 'blocked' | 'deleted';
  isTeam: boolean;
  locale: Locale;
  adminRole: AdminRole | null;
  researchOptedOut: boolean;
}

export type AuthState =
  | { kind: 'none' }
  /** Login confirmed, onboarding not done (architecture §8.1 `pre`). */
  | { kind: 'pre'; sessionId: string; email: string; prePseudonym: string; inviteToken: string | null; createdAt: string }
  | { kind: 'user'; sessionId: string; user: AuthUser; mfaAt: string | null; createdAt: string };

/** Settings of the HTTP layer; defaults suit local dev (web on :5173 proxying /api to :8787). */
export interface HttpConfig {
  /** Origin of the web app; mutating requests must carry it (architecture §10.3). */
  appOrigin: string;
  /** Read the client IP from X-Forwarded-For (only behind our own reverse proxy). */
  trustProxy: boolean;
  /** Secure flag on cookies (off on localhost). */
  secureCookies: boolean;
  /** Release tag written on events. */
  release: string;
}

export const DEFAULT_HTTP_CONFIG: HttpConfig = {
  appOrigin: 'http://localhost:5173',
  trustProxy: false,
  secureCookies: false,
  release: 'dev',
};

export interface RequestVars {
  requestId: string;
  auth: AuthState;
  netClass: NetClass;
  /** HMAC(ip, pepper_ip); used for rate limits and stored where the architecture allows it. */
  ipHash: string;
  uaClass: UaClass;
  limiter: RateLimiter;
  /** The app database and clock, for middleware that runs outside a module (idempotency). */
  db: Db;
  clock: Clock;
  logger: Logger;
  http: HttpConfig;
  /** Set when an Idempotency-Key was checked (middleware/idempotency.ts). */
  idempotency?: { scopeRef: string; key: string; route: string; requestHash: string; saved: boolean };
}

export type AppEnv = { Variables: RequestVars };
