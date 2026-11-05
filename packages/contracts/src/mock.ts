// In-memory implementation of RewardedApi for the web builders (WP-7..WP-10) and component tests.
// It validates every request and response against the contracts, so a mock never drifts from the API.
import { ApiClientError, type RewardedApi } from './client.ts';
import { errorBody, errorStatus, type ErrorCode } from './errors.ts';
import { responseExamples } from './examples.ts';
import type { RouteDef, RouteOutput } from './route.ts';
import { routes, type RouteId, type Routes } from './routes.ts';

/** Parsed input a handler receives. */
export interface MockInput {
  params: Record<string, unknown>;
  query: Record<string, unknown>;
  body: unknown;
  idempotencyKey: string | undefined;
}

export type MockHandler<K extends RouteId> = (input: MockInput) => RouteOutput<Routes[K]> | Promise<RouteOutput<Routes[K]>>;
export type MockHandlers = { [K in RouteId]?: MockHandler<K> };

/** Throw from a handler to answer with a contract error, e.g. `throw mockError('WEEKLY_CAP')`. */
export class MockApiError extends Error {
  readonly code: ErrorCode;
  readonly details: Record<string, unknown> | undefined;
  constructor(code: ErrorCode, details?: Record<string, unknown>) {
    super(code);
    this.code = code;
    this.details = details;
  }
}
export function mockError(code: ErrorCode, details?: Record<string, unknown>): MockApiError {
  return new MockApiError(code, details);
}

export interface MockCall {
  id: RouteId;
  input: MockInput;
}

export interface MockApiClient extends RewardedApi {
  readonly calls: readonly MockCall[];
  /** Replace or add a handler at runtime (e.g. per test). */
  on<K extends RouteId>(id: K, handler: MockHandler<K>): void;
  reset(): void;
}

export interface MockOptions {
  /** Use the examples from examples.ts for routes without a handler (default true). */
  useExamples?: boolean;
}

function toClientError(code: ErrorCode, details?: Record<string, unknown>): ApiClientError {
  return new ApiClientError(errorStatus(code), errorBody(code, details).error);
}

function validate(route: RouteDef, input: { params?: unknown; query?: unknown; body?: unknown }): Omit<MockInput, 'idempotencyKey'> {
  const issues: unknown[] = [];
  const parse = (schema: RouteDef['body'], value: unknown, where: string): unknown => {
    if (!schema) {
      if (value !== undefined && !(typeof value === 'object' && value !== null && Object.keys(value).length === 0)) issues.push({ where, message: 'not_allowed' });
      return undefined;
    }
    const r = schema.safeParse(value ?? (where === 'body' ? undefined : {}));
    if (!r.success) issues.push({ where, issues: r.error.issues });
    return r.success ? r.data : undefined;
  };
  const params = parse(route.params, input.params, 'params') as Record<string, unknown> | undefined;
  const query = parse(route.query, input.query, 'query') as Record<string, unknown> | undefined;
  const body = parse(route.body, input.body, 'body');
  if (issues.length) throw toClientError('VALIDATION_FAILED', { issues });
  return { params: params ?? {}, query: query ?? {}, body };
}

export function createMockApiClient(initial: MockHandlers = {}, { useExamples = true }: MockOptions = {}): MockApiClient {
  let handlers: MockHandlers = { ...initial };
  const calls: MockCall[] = [];

  async function call(id: RouteId, raw: { params?: unknown; query?: unknown; body?: unknown; idempotencyKey?: string } = {}): Promise<unknown> {
    const route: RouteDef = routes[id];
    calls.push({ id, input: { params: (raw.params ?? {}) as Record<string, unknown>, query: (raw.query ?? {}) as Record<string, unknown>, body: raw.body, idempotencyKey: raw.idempotencyKey } });
    if (route.idempotencyKey === 'required' && !raw.idempotencyKey) throw toClientError('VALIDATION_FAILED', { missing: 'Idempotency-Key' });
    const parsed = validate(route, raw);
    const input: MockInput = { params: parsed.params, query: parsed.query, body: parsed.body, idempotencyKey: raw.idempotencyKey };
    const handler = handlers[id] as ((i: MockInput) => unknown) | undefined;
    let out: unknown;
    try {
      if (handler) out = await handler(input);
      else if (route.responseKind === 'empty') out = undefined;
      else if (useExamples && id in responseExamples) out = JSON.parse(JSON.stringify(responseExamples[id as keyof typeof responseExamples])) as unknown;
      else throw mockError('NOT_FOUND', { mock: 'no_handler', route: id });
    } catch (e) {
      if (e instanceof MockApiError) throw toClientError(e.code, e.details);
      throw e;
    }
    // A wrong mock is a bug in the test, not an API error: let the zod error surface.
    return route.response.parse(out);
  }

  return {
    call: call as RewardedApi['call'],
    get calls() {
      return calls;
    },
    on(id, handler) {
      handlers = { ...handlers, [id]: handler };
    },
    reset() {
      handlers = { ...initial };
      calls.length = 0;
    },
  };
}
