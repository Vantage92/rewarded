// Stub (WP-0). Owner WP-3. Replays stored responses for a repeated Idempotency-Key (architecture §4.7, §5.4).
import type { MiddlewareHandler } from 'hono';

export interface IdempotencyOptions {
  scope: string;
}

export function idempotency(_opts: IdempotencyOptions): MiddlewareHandler {
  return async (_c, next) => {
    await next();
  };
}
