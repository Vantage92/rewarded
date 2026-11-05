// Stub (WP-0). Owner WP-3. Buckets and limits from architecture §10.2.
import type { MiddlewareHandler } from 'hono';

export interface RateLimitOptions {
  bucket: string;
  limit: number;
  windowSec: number;
}

export function rateLimit(_opts: RateLimitOptions): MiddlewareHandler {
  return async (_c, next) => {
    await next();
  };
}
