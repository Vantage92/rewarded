// Playwright fixtures for the chain specs: a worker-scoped API process (support/api.ts), a fresh
// state per test, and pages whose /api/v1 calls go to the worker's API instead of the shared dev
// proxy. The browser keeps its own cookies; Origin stays the web app (http://localhost:5173).
import { test as base, expect, type BrowserContext, type Page } from '@playwright/test';
import { startWorkerApi, type WorkerApi } from './api.ts';

export interface ChainFixtures {
  /** The worker API, reset to the empty seed (three admins) before the test. */
  api: WorkerApi;
  /** Routes this context's /api/v1 requests to the worker API. */
  wire(context: BrowserContext): Promise<void>;
}

export const test = base.extend<ChainFixtures, { workerApi: WorkerApi }>({
  workerApi: [
    // Playwright needs a destructuring pattern here, even without dependencies.
    // oxlint-disable-next-line no-empty-pattern
    async ({}, provide, info) => {
      const api = await startWorkerApi(info.workerIndex);
      await provide(api);
      await api.stop();
    },
    { scope: 'worker', timeout: 60_000 },
  ],
  api: async ({ workerApi }, provide) => {
    await workerApi.reset('empty');
    await provide(workerApi);
  },
  wire: async ({ workerApi }, provide) => {
    await provide(async (context) => {
      await context.route('**/api/v1/**', async (route) => {
        const url = new URL(route.request().url());
        const target = `${workerApi.base}${url.pathname.replace(/^\/api\/v1/, '')}${url.search}`;
        const response = await route.fetch({ url: target });
        await route.fulfill({ response });
      });
    });
  },
  page: async ({ page, wire }, provide) => {
    await wire(page.context());
    await provide(page);
  },
});

export { expect };
export type { Page };
