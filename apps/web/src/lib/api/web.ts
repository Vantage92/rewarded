// Typed API client for the web app (architecture §8.1, §9.2): the contracts client over the
// browser fetch with the CSRF cookie, or the contracts mock client in mock mode.
//
// Mock mode: VITE_API_MODE=mock at build time, or in dev `?api=mock` (remembered for the tab;
// `?api=http` switches back). Features add mock handlers in features/<name>/mock.ts with
// `export const handlers: MockHandlers`; they are loaded by glob, only in mock mode.
import { createApiClient } from '@rewarded/contracts/client';
import type { FetchLike, MockApiClient, MockHandlers, RewardedApi } from '@rewarded/contracts';
import { readCsrfCookie } from './csrf.ts';

export type ApiMode = 'http' | 'mock';

const MODE_KEY = 'rw_api_mode';

/** Resolves the API mode from the build env and, in dev only, the URL or the tab's storage. */
export function resolveApiMode(env: { VITE_API_MODE?: string; DEV?: boolean } = import.meta.env, search: string = typeof location === 'undefined' ? '' : location.search): ApiMode {
  if (env.VITE_API_MODE === 'mock') return 'mock';
  if (!env.DEV) return 'http';
  const fromUrl = new URLSearchParams(search).get('api');
  try {
    if (fromUrl === 'mock' || fromUrl === 'http') sessionStorage.setItem(MODE_KEY, fromUrl);
    const stored = sessionStorage.getItem(MODE_KEY);
    if (stored === 'mock' || stored === 'http') return stored;
  } catch {
    // Storage unavailable: only the URL counts.
  }
  return fromUrl === 'mock' ? 'mock' : 'http';
}

export interface WebApiOptions {
  mode?: ApiMode;
  baseUrl?: string;
  fetch?: FetchLike;
  /** Extra mock handlers (tests); feature handlers are loaded by glob in mock mode. */
  handlers?: MockHandlers;
  /** Artificial latency for the mock in ms, to see loading states. */
  mockDelayMs?: number;
  /** Load features/*\/mock.ts in mock mode (default true). */
  loadFeatureMocks?: boolean;
}

const featureMocks = import.meta.glob<{ handlers?: MockHandlers }>('../../features/*/mock.ts');

/** Adds the handlers of every features/<name>/mock.ts to a mock client. */
export async function loadFeatureMocks(client: MockApiClient): Promise<number> {
  let count = 0;
  for (const load of Object.values(featureMocks)) {
    const { handlers } = await load();
    for (const [id, handler] of Object.entries(handlers ?? {})) {
      // Handler types are checked in the feature module against MockHandlers.
      client.on(id as keyof MockHandlers, handler as never);
      count++;
    }
  }
  return count;
}

/** Waits for the mock and the feature mocks (and an optional delay) before every call. */
function gated(client: Promise<MockApiClient>, ms: number): RewardedApi {
  const call = (async (...args: Parameters<MockApiClient['call']>) => {
    const mock = await client;
    if (ms > 0) await new Promise((r) => setTimeout(r, ms));
    return mock.call(...args);
  }) as RewardedApi['call'];
  return { call };
}

export interface WebApi {
  api: RewardedApi;
  mode: ApiMode;
  /** The underlying mock in mock mode, set once `ready` resolves (tests, dev tools). */
  mock?: MockApiClient | undefined;
  /** Resolves when feature mocks are loaded (immediately in http mode). */
  ready: Promise<void>;
}

export function createWebApi({ mode = resolveApiMode(), baseUrl = '/api/v1', fetch, handlers, mockDelayMs = 0, loadFeatureMocks: loadMocks = true }: WebApiOptions = {}): WebApi {
  if (mode === 'mock') {
    // Loaded lazily so the mock and its examples stay out of the production bundle.
    const web: WebApi = { mode, api: { call: (() => Promise.reject(new Error('mock not ready'))) as RewardedApi['call'] }, ready: Promise.resolve() };
    const mockReady = import('@rewarded/contracts/mock').then(async ({ createMockApiClient }) => {
      const mock = createMockApiClient();
      // Feature mocks first, then the explicit handlers, so a test can override a feature mock.
      if (loadMocks) await loadFeatureMocks(mock);
      for (const [id, handler] of Object.entries(handlers ?? {})) mock.on(id as keyof MockHandlers, handler as never);
      web.mock = mock;
      return mock;
    });
    web.ready = mockReady.then(() => undefined);
    web.api = gated(mockReady, mockDelayMs);
    return web;
  }
  const doFetch: FetchLike = fetch ?? ((url, init) => globalThis.fetch(url, init as RequestInit));
  return {
    api: createApiClient({ fetch: doFetch, baseUrl, csrfToken: () => readCsrfCookie(), validateResponses: import.meta.env.DEV }),
    mode,
    ready: Promise.resolve(),
  };
}
