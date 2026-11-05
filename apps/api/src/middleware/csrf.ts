// CSRF (architecture §8.1, §10.3): SameSite=Lax on the session cookie, a double-submit token
// (`rw_csrf` cookie, readable by the app, echoed in `X-CSRF-Token`) and an Origin check.
// Every response sets `rw_csrf` when it is missing, so the app gets one with its first GET.
// The beacon route POST /sessions/:id/events sends the token in the body instead (sendBeacon sets
// no headers); its owner checks it with `csrfValueMatches` and lists it in `bodyTokenPaths`.
import { DomainError } from '@rewarded/contracts';
import type { Context, MiddlewareHandler } from 'hono';
import { getCookie, setCookie } from 'hono/cookie';
import { timingSafeEqual } from 'node:crypto';
import { randomToken } from '../db/ids.ts';
import type { Random } from '../platform/types.ts';
import type { AppEnv } from './context.ts';

export const CSRF_COOKIE = 'rw_csrf';
export const CSRF_HEADER = 'X-CSRF-Token';
const SAFE = new Set(['GET', 'HEAD', 'OPTIONS']);

export interface CsrfOptions {
  /** Overrides HttpConfig.appOrigin. */
  appOrigin?: string;
  random?: Random;
  /** Path patterns (below /api/v1) whose token comes in the body; Origin is still checked. */
  bodyTokenPaths?: readonly RegExp[];
}

/** Paths whose CSRF token is in the body (sendBeacon, architecture §8.1). */
export const BODY_TOKEN_PATHS: readonly RegExp[] = [/^\/api\/v1\/sessions\/[^/]+\/events$/];

function equal(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

/** For routes listed in bodyTokenPaths: compares the body token with the cookie. */
export function csrfValueMatches(c: Context<AppEnv>, value: string | undefined): boolean {
  const cookie = getCookie(c, CSRF_COOKIE);
  return cookie !== undefined && value !== undefined && cookie.length >= 16 && equal(cookie, value);
}

export function csrf(opts: CsrfOptions = {}): MiddlewareHandler<AppEnv> {
  const bodyPaths = opts.bodyTokenPaths ?? BODY_TOKEN_PATHS;
  return async (c, next) => {
    let cookie = getCookie(c, CSRF_COOKIE);
    if (!cookie || cookie.length < 16) {
      cookie = randomToken(opts.random ?? { bytes: (n) => crypto.getRandomValues(new Uint8Array(n)), int: () => 0 }, 24);
      // Readable by the app (not HttpOnly) for the double submit.
      setCookie(c, CSRF_COOKIE, cookie, { httpOnly: false, sameSite: 'Lax', secure: c.var.http.secureCookies, path: '/' });
      if (!SAFE.has(c.req.method)) throw new DomainError('CSRF_INVALID', { reason: 'missing_cookie' });
    }
    if (!SAFE.has(c.req.method)) {
      const origin = c.req.header('Origin');
      if (origin !== (opts.appOrigin ?? c.var.http.appOrigin)) throw new DomainError('CSRF_INVALID', { reason: 'origin' });
      if (!bodyPaths.some((p) => p.test(c.req.path))) {
        const header = c.req.header(CSRF_HEADER);
        if (header === undefined || !equal(header, cookie)) throw new DomainError('CSRF_INVALID', { reason: 'token' });
      }
    }
    await next();
  };
}
