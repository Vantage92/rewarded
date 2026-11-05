// Typed API client (WP-0 skeleton). WP-2/WP-7 add one typed function per endpoint on top of
// the zod schemas in @rewarded/contracts; CSRF header and idempotency keys follow architecture §8.1.
import type { ApiErrorBody } from '@rewarded/contracts';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface RequestOptions {
  body?: unknown;
  idempotencyKey?: string;
  signal?: AbortSignal;
}

export class ApiClientError extends Error {
  readonly status: number;
  readonly code: string;
  readonly messageKey: string;
  readonly details: Record<string, unknown> | undefined;
  constructor(status: number, body: ApiErrorBody['error']) {
    super(body.code);
    this.status = status;
    this.code = body.code;
    this.messageKey = body.message_key;
    this.details = body.details;
  }
}

export interface ApiClient {
  request<TResponse>(method: HttpMethod, path: string, opts?: RequestOptions): Promise<TResponse>;
}

export interface ApiClientOptions {
  baseUrl?: string;
  fetch?: typeof fetch;
}

export function createApiClient({ baseUrl = '/api/v1', fetch: doFetch = globalThis.fetch.bind(globalThis) }: ApiClientOptions = {}): ApiClient {
  return {
    async request<TResponse>(method: HttpMethod, path: string, opts: RequestOptions = {}): Promise<TResponse> {
      const headers: Record<string, string> = { Accept: 'application/json' };
      if (opts.body !== undefined) headers['Content-Type'] = 'application/json';
      if (opts.idempotencyKey) headers['Idempotency-Key'] = opts.idempotencyKey;
      const init: RequestInit = { method, headers, credentials: 'same-origin' };
      if (opts.body !== undefined) init.body = JSON.stringify(opts.body);
      if (opts.signal) init.signal = opts.signal;
      const res = await doFetch(`${baseUrl}${path}`, init);
      const data: unknown = res.status === 204 ? undefined : await res.json().catch(() => undefined);
      if (!res.ok) {
        const err = (data as ApiErrorBody | undefined)?.error ?? { code: 'INTERNAL', message_key: 'errors.common.internal' };
        throw new ApiClientError(res.status, err);
      }
      return data as TResponse;
    },
  };
}
