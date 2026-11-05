// Stub (WP-0). Owner WP-3. Authorisation levels from architecture §8.1.
import type { MiddlewareHandler } from 'hono';

export type AuthLevel = 'public' | 'pre' | 'student' | 'adult' | 'board' | 'admin' | 'dev';

/** Will check the `rw_sid` session cookie against the level. Passes through for now. */
export function requireAuth(_level: AuthLevel): MiddlewareHandler {
  return async (_c, next) => {
    await next();
  };
}
