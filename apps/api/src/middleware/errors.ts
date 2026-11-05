// Owner WP-3. One error shape for every response (architecture §8.1); no free text to users.
// DomainError (contracts) carries a code with its status and message key; zod errors become
// VALIDATION_FAILED with field paths only (never the submitted values, which may hold personal data).
import { DomainError, errorBody, isErrorCode, type ApiErrorBody } from '@rewarded/contracts';
import type { Context, ErrorHandler, NotFoundHandler } from 'hono';
import { HTTPException } from 'hono/http-exception';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import { ZodError } from 'zod';
import type { AppEnv } from './context.ts';

/** Kept for WP-0 callers; new code throws DomainError from contracts. */
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

/** Field paths and issue codes of a zod error; values are left out on purpose. */
export function zodDetails(err: ZodError): Record<string, unknown> {
  return { issues: err.issues.slice(0, 20).map((i) => ({ path: i.path.map(String).join('.'), code: i.code })) };
}

export function toErrorResponse(err: unknown, c: Context<AppEnv>): Response {
  if (err instanceof DomainError) return c.json(errorBody(err.code, err.details), err.status as ContentfulStatusCode);
  if (err instanceof ApiError) return c.json(body(err.code, err.messageKey, err.details), err.status);
  if (err instanceof ZodError) return c.json(errorBody('VALIDATION_FAILED', zodDetails(err)), 422);
  if (err instanceof HTTPException && err.status < 500) {
    // Hono raises these for malformed input (e.g. a body that is not JSON).
    return c.json(errorBody('VALIDATION_FAILED'), 422);
  }
  return c.json(body('INTERNAL', 'errors.common.internal'), 500);
}

export const errorHandler: ErrorHandler<AppEnv> = (err, c) => {
  const res = toErrorResponse(err, c);
  if (res.status >= 500) {
    // Stack frames only: the message may carry arguments (architecture §10.9).
    c.var.logger?.log('error', 'unhandled_error', { route: c.req.method + ' ' + c.req.routePath, request_id: c.var.requestId, stack: err instanceof Error ? (err.stack ?? '') : '' });
  }
  return res;
};

export const notFoundHandler: NotFoundHandler = (c) => c.json(body('NOT_FOUND', 'errors.common.not_found'), 404);

/** Throws the DomainError for a code from contracts (convenience for handlers). */
export function fail(code: string, details?: Record<string, unknown>): never {
  if (!isErrorCode(code)) throw new Error(`Unknown error code ${code}`);
  throw new DomainError(code, details);
}
