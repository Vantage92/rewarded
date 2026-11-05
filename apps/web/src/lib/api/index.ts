// Typed API client on @rewarded/contracts (architecture §8.1, §9.2). Owner: WP-7.
export { ApiClientError, createApiClient, type ApiClient, type ApiClientOptions, type HttpMethod, type RequestOptions } from './client.ts';
export { CSRF_COOKIE, readCsrfCookie } from './csrf.ts';
export { createWebApi, loadFeatureMocks, resolveApiMode, type ApiMode, type WebApi, type WebApiOptions } from './web.ts';
export { ApiProvider, apiKey, useApi, useApiContext, useApiMutation, useApiQuery, type ApiMutationOptions, type ApiQueryOptions, type CallInput } from './react.tsx';
export { errorText } from './errors.ts';
