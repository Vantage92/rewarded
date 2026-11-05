// React bindings for the typed client: ApiProvider, useApi and TanStack Query helpers (§9.2).
import { useMutation, useQuery, type UseMutationOptions, type UseQueryOptions } from '@tanstack/react-query';
import { createContext, useContext, useMemo, type ReactNode } from 'react';
import type { ApiClientError, RewardedApi, RouteId, RouteInput, RouteOutput, Routes } from '@rewarded/contracts';
import { createWebApi, type WebApi } from './web.ts';

const ApiContext = createContext<WebApi | null>(null);

export function ApiProvider({ value, children }: { value?: WebApi; children: ReactNode }) {
  const api = useMemo(() => value ?? createWebApi(), [value]);
  return <ApiContext value={api}>{children}</ApiContext>;
}

/** The typed client: `const api = useApi(); await api.call('points.balance')`. */
export function useApi(): RewardedApi {
  return useApiContext().api;
}

export function useApiContext(): WebApi {
  const ctx = useContext(ApiContext);
  if (!ctx) throw new Error('useApi() needs <ApiProvider> (src/app/App.tsx provides it)');
  return ctx;
}

export type CallInput<K extends RouteId> = Omit<RouteInput<Routes[K]>, 'signal'>;

/** Untyped bridge to RewardedApi.call, whose rest-tuple signature cannot be spread generically. */
function invoke<K extends RouteId>(api: RewardedApi, id: K, input: CallInput<K> | undefined, signal?: AbortSignal): Promise<RouteOutput<Routes[K]>> {
  const call = api.call as (id: RouteId, input?: object) => Promise<unknown>;
  return call(id, { ...(input ?? {}), ...(signal ? { signal } : {}) }) as Promise<RouteOutput<Routes[K]>>;
}

/** Query key per resource: ['api', routeId, input]. Invalidate with ['api', routeId]. */
export function apiKey<K extends RouteId>(id: K, input?: CallInput<K>): readonly unknown[] {
  return input === undefined ? ['api', id] : ['api', id, input];
}

export type ApiQueryOptions<K extends RouteId> = Omit<UseQueryOptions<RouteOutput<Routes[K]>, ApiClientError>, 'queryKey' | 'queryFn'>;

/** TanStack Query over one GET route. */
export function useApiQuery<K extends RouteId>(id: K, input?: CallInput<K>, options?: ApiQueryOptions<K>) {
  const api = useApi();
  return useQuery<RouteOutput<Routes[K]>, ApiClientError>({
    ...options,
    queryKey: apiKey(id, input),
    queryFn: ({ signal }) => invoke(api, id, input, signal),
  });
}

export type ApiMutationOptions<K extends RouteId> = Omit<UseMutationOptions<RouteOutput<Routes[K]>, ApiClientError, CallInput<K>>, 'mutationFn'>;

/** TanStack mutation over one route; pass the call input to mutate(). */
export function useApiMutation<K extends RouteId>(id: K, options?: ApiMutationOptions<K>) {
  const api = useApi();
  return useMutation<RouteOutput<Routes[K]>, ApiClientError, CallInput<K>>({ ...options, mutationFn: (input) => invoke(api, id, input) });
}
