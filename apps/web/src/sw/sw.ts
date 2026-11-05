/// <reference lib="webworker" />
// Service worker (architecture §9.4): precache the app shell and translations, serve index.html
// for navigations when offline, and never touch /api/* (a cached answer would break the nonce chain).
import { cleanupOutdatedCaches, createHandlerBoundToURL, matchPrecache, precacheAndRoute, type PrecacheEntry } from 'workbox-precaching';
import { NavigationRoute, registerRoute, setCatchHandler } from 'workbox-routing';

declare const self: ServiceWorkerGlobalScope & { __WB_MANIFEST: Array<PrecacheEntry | string> };

/** Paths the worker must never answer from a cache. */
const NETWORK_ONLY = [/^\/api\//];

cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST);
registerRoute(new NavigationRoute(createHandlerBoundToURL('index.html'), { denylist: NETWORK_ONLY }));

// Last resort for a navigation that cannot be served (e.g. the precache was evicted): the static
// offline page from public/. Everything else fails as it would without a worker.
setCatchHandler(async ({ request }) => {
  if (request.mode === 'navigate') return (await matchPrecache('offline.html')) ?? Response.error();
  return Response.error();
});

// The first install takes control at once so the shell works offline after the first visit.
// A later version waits: the app sends SKIP_WAITING only while no session runs ('idle').
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});
self.addEventListener('message', (event) => {
  if ((event.data as { type?: string } | null)?.type === 'SKIP_WAITING') void self.skipWaiting();
});
