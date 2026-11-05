// Owner WP-3. One error shape for every response (architecture §8.1); no free text to users.
import type { ErrorHandler, NotFoundHandler } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import type { ApiErrorBody } from '@rewarded/contracts';

export class ApiError extends Error {
  readonly code: string;
  readonly status: ContentfulStatusCode;
  readonly messageKey: string;
  readonly details: Record<string, unknown> | undefined;
  constructor(code: string, status: ContentfulStatusCode, messageKey: string, details?: Record<string, unknown>) {
    super(code);
    this.code = code;
    this.status = status;
    this.messageKey = messageKey;
    this.details = details;
  }
}

function body(code: string, messageKey: string, details?: Record<string, unknown>): ApiErrorBody {
  return { error: details ? { code, message_key: messageKey, details } : { code, message_key: messageKey } };
}

export const errorHandler: ErrorHandler = (err, c) => {
  if (err instanceof ApiError) return c.json(body(err.code, err.messageKey, err.details), err.status);
  return c.json(body('INTERNAL', 'errors.common.internal'), 500);
};

export const notFoundHandler: NotFoundHandler = (c) => c.json(body('NOT_FOUND', 'errors.common.not_found'), 404);
