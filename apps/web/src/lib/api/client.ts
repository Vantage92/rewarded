// Low-level untyped client (WP-0 skeleton), kept for backward compatibility. New code uses the
// typed client from web.ts (`createWebApi`, `useApi`), which is derived from @rewarded/contracts.
import { ApiClientError } from '@rewarded/contracts/client';
import type { ApiErrorBody } from '@rewarded/contracts/errors';
import { readCsrfCookie } from './csrf.ts';

export { ApiClientError };

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface RequestOptions {
  body?: unknown;
  idempotencyKey?: string;
  signal?: AbortSignal;
}

export interface ApiClient {
  request<TResponse>(method: HttpMethod, path: string, opts?: RequestOptions): Promise<TResponse>;
}

export interface ApiClientOptions {
  baseUrl?: string;
  fetch?: typeof fetch;
}

/** @deprecated Use createWebApi() for typed calls. */
export function createApiClient({ baseUrl = '/api/v1', fetch: doFetch = globalThis.fetch.bind(globalThis) }: ApiClientOptions = {}): ApiClient {
  return {
    async request<TResponse>(method: HttpMethod, path: string, opts: RequestOptions = {}): Promise<TResponse> {
      const headers: Record<string, string> = { Accept: 'application/json' };
      if (opts.body !== undefined) headers['Content-Type'] = 'application/json';
      if (opts.idempotencyKey) headers['Idempotency-Key'] = opts.idempotencyKey;
      if (method !== 'GET') {
        const csrf = readCsrfCookie();
        if (csrf) headers['X-CSRF-Token'] = csrf;
      }
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
