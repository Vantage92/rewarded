// Mounts a contracts RouteDef on the router (architecture §8.1): authorisation from `def.auth`,
// rate limit, zod validation of params, query and body (strict objects, VALIDATION_FAILED), the
// Idempotency-Key check, and validation of the response against the contract before it is sent.
// Every module can use it:  mount(api, routes['auth.confirm'], async ({ body, c }) => ({ next: '/' }))
import { DomainError, type RouteDef } from '@rewarded/contracts';
import type { Context, Hono } from 'hono';
import type { ContentfulStatusCode, StatusCode } from 'hono/utils/http-status';
import type { z } from 'zod';
import type { AppEnv, AuthState } from './context.ts';
import { checkAuth, type RequireAuthOptions } from './auth.ts';
import { zodDetails } from './errors.ts';
import { checkIdempotency, saveIdempotentResponse } from './idempotency.ts';
import { enforceRateLimit, RATE_LIMITS, type RateLimitOptions } from './rateLimit.ts';

type Out<S> = S extends z.ZodType ? z.output<S> : undefined;
type In<S> = S extends z.ZodType ? z.input<S> : undefined;

export interface HandlerArgs<R extends RouteDef> {
  c: Context<AppEnv>;
  auth: AuthState;
  params: Out<R['params']>;
  query: Out<R['query']>;
  body: Out<R['body']>;
}

/** Explicit status (e.g. 201 vs 200) next to the data. */
export interface Reply<T> {
  readonly __reply: true;
  status: number;
  data: T;
}
export function reply<T>(status: number, data: T): Reply<T> {
  return { __reply: true, status, data };
}

export type HandlerResult<R extends RouteDef> = In<R['response']> | Reply<In<R['response']>> | Response;

export interface MountOptions extends RequireAuthOptions {
  /** Rate limits checked after authorisation. Default for mutating routes: 60/min per user (§10.2). */
  rateLimits?: readonly RateLimitOptions[];
  /** Skip the default limit (e.g. heartbeats have their own rule). */
  noDefaultRateLimit?: boolean;
}

function isReply(v: unknown): v is Reply<unknown> {
  return typeof v === 'object' && v !== null && (v as { __reply?: unknown }).__reply === true;
}

async function readBody(c: Context<AppEnv>): Promise<unknown> {
  const text = await c.req.text();
  if (text === '') return undefined;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new DomainError('VALIDATION_FAILED', { reason: 'invalid_json' });
  }
}

function parse(schema: z.ZodType | undefined, value: unknown): unknown {
  if (!schema) return undefined;
  const r = schema.safeParse(value);
  if (!r.success) throw new DomainError('VALIDATION_FAILED', zodDetails(r.error));
  return r.data;
}

/** Registers `def` on `api` with the full middleware chain of §8.1. */
export function mount<R extends RouteDef>(
  api: Hono<AppEnv>,
  def: R,
  handler: (args: HandlerArgs<R>) => HandlerResult<R> | Promise<HandlerResult<R>>,
  opts: MountOptions = {},
): void {
  const mutating = def.method !== 'GET';
  api.on(def.method, def.path, async (c) => {
    checkAuth(c.var.auth, def.auth, opts);
    for (const rl of opts.rateLimits ?? []) enforceRateLimit(c, rl);
    if (mutating && !opts.noDefaultRateLimit && c.var.auth.kind !== 'none') enforceRateLimit(c, RATE_LIMITS.mutating);

    const params = parse(def.params, c.req.param());
    const query = parse(def.query, Object.fromEntries(new URL(c.req.url).searchParams));
    const rawBody = def.body ? await readBody(c) : undefined;
    const body = parse(def.body, rawBody);

    if (def.idempotencyKey === 'required') {
      const replay = checkIdempotency(c, c.var.db, c.var.clock, `${def.method} ${def.path}`, rawBody);
      if (replay) return replay;
    }

    const result = await handler({ c, auth: c.var.auth, params, query, body } as HandlerArgs<R>);
    if (result instanceof Response) return result;
    const status = isReply(result) ? result.status : def.status[0];
    const data: unknown = isReply(result) ? result.data : result;
    if (!def.status.includes(status)) throw new Error(`Status ${status} not in contract for ${def.method} ${def.path}`);

    let out: unknown;
    if (def.responseKind === 'empty') {
      out = undefined;
    } else {
      const r = def.response.safeParse(data);
      if (!r.success) {
        c.var.logger.log('error', 'response_contract_violation', { route: `${def.method} ${def.path}`, request_id: c.var.requestId });
        throw new Error('Response does not match the contract');
      }
      out = r.data;
    }
    if (c.var.idempotency && !c.var.idempotency.saved && status < 300) saveIdempotentResponse(c.var.db, c, c.var.clock, status, out);
    if (out === undefined) return c.body(null, status as StatusCode);
    return c.json(out, status as ContentfulStatusCode);
  });
}
