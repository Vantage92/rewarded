// Typed API client derived from the route registry (architecture §8.1). Transport-agnostic: the web
// app passes its fetch and CSRF reader, so this package stays free of DOM globals.
import type { ErrorCode } from './errors.ts';
import { isErrorCode } from './errors.ts';
import type { RouteDef, RouteInput, RouteOutput } from './route.ts';
import { buildPath, routes, type RouteId, type Routes } from './routes.ts';

/** Minimal fetch surface the client needs (structurally compatible with the browser fetch). */
export type FetchLike = (
  url: string,
  init: { method: string; headers: Record<string, string>; body?: string; credentials?: 'same-origin' | 'include'; signal?: unknown },
) => Promise<{ status: number; ok: boolean; text(): Promise<string> }>;

export class ApiClientError extends Error {
  readonly status: number;
  readonly code: ErrorCode | (string & {});
  readonly messageKey: string;
  readonly details: Record<string, unknown> | undefined;
  constructor(status: number, error: { code: string; message_key: string; details?: Record<string, unknown> | undefined }) {
    super(error.code);
    this.name = 'ApiClientError';
    this.status = status;
    this.code = error.code;
    this.messageKey = error.message_key;
    this.details = error.details;
  }
  /** Narrowing helper: `if (err.is('WEEKLY_CAP')) …`. */
  is<C extends ErrorCode>(code: C): this is ApiClientError & { code: C } {
    return this.code === code;
  }
  get known(): boolean {
    return isErrorCode(this.code);
  }
}

type Args<R extends RouteDef> = object extends RouteInput<R> ? [input?: RouteInput<R>] : [input: RouteInput<R>];

/** One typed function for every route id; implemented by the HTTP client and the mock client. */
export interface RewardedApi {
  call<K extends RouteId>(id: K, ...args: Args<Routes[K]>): Promise<RouteOutput<Routes[K]>>;
}

export interface ApiClientOptions {
  fetch: FetchLike;
  /** Default `/api/v1`. */
  baseUrl?: string;
  /** Reads the `rw_csrf` cookie for the X-CSRF-Token header (double submit, §8.1). */
  csrfToken?: () => string | undefined;
  /** Validate responses against the schema (default true in dev and tests). */
  validateResponses?: boolean;
}

type AnyInput = { params?: Record<string, string | number>; query?: Record<string, unknown>; body?: unknown; idempotencyKey?: string; signal?: unknown };

export function queryString(query: Record<string, unknown> | undefined): string {
  if (!query) return '';
  const parts: string[] = [];
  for (const [k, v] of Object.entries(query)) {
    if (v === undefined || v === null) continue;
    parts.push(`${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`);
  }
  return parts.length ? `?${parts.join('&')}` : '';
}

export function createApiClient({ fetch, baseUrl = '/api/v1', csrfToken, validateResponses = true }: ApiClientOptions): RewardedApi {
  async function call(id: RouteId, input: AnyInput = {}): Promise<unknown> {
    const route: RouteDef = routes[id];
    const body = route.body && input.body !== undefined ? route.body.parse(input.body) : input.body;
    const url = `${baseUrl}${buildPath(route.path, input.params)}${queryString(input.query)}`;
    const headers: Record<string, string> = { Accept: route.responseKind === 'svg' ? 'image/svg+xml' : 'application/json' };
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    if (route.method !== 'GET') {
      const token = csrfToken?.();
      if (token) headers['X-CSRF-Token'] = token;
    }
    if (input.idempotencyKey) headers['Idempotency-Key'] = input.idempotencyKey;
    const init: Parameters<FetchLike>[1] = { method: route.method, headers, credentials: 'same-origin' };
    if (body !== undefined) init.body = JSON.stringify(body);
    if (input.signal !== undefined) init.signal = input.signal;
    const res = await fetch(url, init);
    const text = res.status === 204 ? '' : await res.text();
    if (!res.ok) {
      let parsed: unknown;
      try {
        parsed = JSON.parse(text);
      } catch {
        parsed = undefined;
      }
      const err = (parsed as { error?: { code: string; message_key: string; details?: Record<string, unknown> } } | undefined)?.error;
      throw new ApiClientError(res.status, err ?? { code: 'INTERNAL', message_key: 'errors.common.internal' });
    }
    if (route.responseKind === 'empty') return undefined;
    const data: unknown = route.responseKind === 'svg' ? text : JSON.parse(text);
    return validateResponses ? route.response.parse(data) : data;
  }
  return { call: call as RewardedApi['call'] };
}
