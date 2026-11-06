// Typed client on contracts (architecture §8.1, §9.2): mock mode, HTTP mode with CSRF and errors,
// and the TanStack Query helpers.
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { ApiClientError, mockError, responseExamples, routes, type RouteId } from '@rewarded/contracts';
import { afterEach, describe, expect, it } from 'vitest';
import { AppProviders } from '../src/app/providers.tsx';
import { apiKey, createWebApi, errorText, readCsrfCookie, resolveApiMode, useApiQuery } from '../src/lib/api/index.ts';

afterEach(cleanup);

const firstGet = (Object.keys(routes) as RouteId[]).find((id) => routes[id].method === 'GET' && !('params' in routes[id]) && !('query' in routes[id]) && id in responseExamples)!;
const firstPost = (Object.keys(routes) as RouteId[]).find((id) => routes[id].method === 'POST' && !('params' in routes[id]) && !('body' in routes[id]) && !('idempotencyKey' in routes[id]))!;

describe('API mode (architecture §9.2)', () => {
  it('is http in production, mock with VITE_API_MODE=mock, and ?api=mock only in dev', () => {
    expect(resolveApiMode({ DEV: false }, '?api=mock')).toBe('http');
    expect(resolveApiMode({ DEV: false, VITE_API_MODE: 'mock' }, '')).toBe('mock');
    expect(resolveApiMode({ DEV: true }, '?api=mock')).toBe('mock');
    expect(resolveApiMode({ DEV: true }, '?api=http')).toBe('http');
  });
});

describe('mock client', () => {
  it(`answers ${firstGet} with the contract example and validates against the schema`, async () => {
    const web = createWebApi({ mode: 'mock', loadFeatureMocks: false });
    const call = web.api.call as (id: RouteId, input?: object) => Promise<unknown>;
    expect(await call(firstGet)).toEqual(responseExamples[firstGet as keyof typeof responseExamples]);
    expect(web.mock?.calls.map((c) => c.id)).toEqual([firstGet]);
  });

  it('turns mockError into an ApiClientError with the message key of the owning module', async () => {
    const web = createWebApi({ mode: 'mock', loadFeatureMocks: false, handlers: { [firstGet]: () => { throw mockError('RATE_LIMITED'); } } });
    const call = web.api.call as (id: RouteId) => Promise<unknown>;
    const err = await call(firstGet).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ApiClientError);
    expect((err as ApiClientError).code).toBe('RATE_LIMITED');
    expect(errorText('nl', err)).toBeTypeOf('string');
    expect(errorText('nl', new Error('x'))).toBe('Dit konden we niet ophalen. Je gegevens zijn veilig.');
  });
});

describe('http client', () => {
  it('sends the rw_csrf cookie as X-CSRF-Token on mutations and maps error bodies (§8.1)', async () => {
    document.cookie = 'rw_csrf=abc%3D123; path=/';
    expect(readCsrfCookie()).toBe('abc=123');
    expect(readCsrfCookie('a=1; rw_csrf=x')).toBe('x');
    const seen: { url: string; headers: Record<string, string> }[] = [];
    const web = createWebApi({
      mode: 'http',
      fetch: async (url, init) => {
        seen.push({ url, headers: init.headers });
        return { status: 429, ok: false, text: async () => JSON.stringify({ error: { code: 'RATE_LIMITED', message_key: 'errors.common.rate_limited' } }) };
      },
    });
    const call = web.api.call as (id: RouteId) => Promise<unknown>;
    const err = (await call(firstPost).catch((e: unknown) => e)) as ApiClientError;
    expect(err.status).toBe(429);
    expect(err.code).toBe('RATE_LIMITED');
    expect(seen[0]!.url.startsWith('/api/v1/')).toBe(true);
    expect(seen[0]!.headers['X-CSRF-Token']).toBe('abc=123');
    document.cookie = 'rw_csrf=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
  });

  it('retries a mutation once with the rw_csrf cookie from the 403 when it had none (QA: first login from /login)', async () => {
    document.cookie = 'rw_csrf=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
    const seen: { headers: Record<string, string> }[] = [];
    const web = createWebApi({
      mode: 'http',
      fetch: async (_url, init) => {
        seen.push({ headers: init.headers });
        if (seen.length === 1) {
          document.cookie = 'rw_csrf=fresh; path=/';
          return { status: 403, ok: false, text: async () => JSON.stringify({ error: { code: 'CSRF_INVALID', message_key: 'errors.common.csrf_invalid' } }) };
        }
        return { status: 429, ok: false, text: async () => JSON.stringify({ error: { code: 'RATE_LIMITED', message_key: 'errors.common.rate_limited' } }) };
      },
    });
    const call = web.api.call as (id: RouteId) => Promise<unknown>;
    const err = (await call(firstPost).catch((e: unknown) => e)) as ApiClientError;
    expect(err.code).toBe('RATE_LIMITED');
    expect(seen).toHaveLength(2);
    expect(seen[0]!.headers['X-CSRF-Token']).toBeUndefined();
    expect(seen[1]!.headers['X-CSRF-Token']).toBe('fresh');
    document.cookie = 'rw_csrf=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
  });
});

describe('TanStack Query helpers (§9.2)', () => {
  it('useApiQuery loads through the provider with a per-resource key', async () => {
    expect(apiKey(firstGet)).toEqual(['api', firstGet]);
    function Probe() {
      const q = useApiQuery(firstGet);
      return <p>{q.isSuccess ? 'ok' : q.isError ? 'error' : 'loading'}</p>;
    }
    render(
      <AppProviders locale="nl" api={createWebApi({ mode: 'mock', loadFeatureMocks: false })}>
        <Probe />
      </AppProviders>,
    );
    await waitFor(() => expect(screen.getByText('ok')).toBeTruthy());
  });
});
