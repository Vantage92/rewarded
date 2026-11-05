// Stub (WP-0). Owner WP-3. Double-submit token plus Origin check (architecture §10.3).
import type { MiddlewareHandler } from 'hono';

export interface CsrfOptions {
  appOrigin?: string;
}

export function csrf(_opts: CsrfOptions = {}): MiddlewareHandler {
  return async (_c, next) => {
    await next();
  };
}
