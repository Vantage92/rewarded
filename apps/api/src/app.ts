import { Hono } from 'hono';
import { errorHandler, notFoundHandler } from './middleware/errors.ts';
import type { ApiModule, AppEnv, ModuleDeps } from './module.ts';

export interface CreateAppOptions {
  /** From modules.gen.ts (and modules.dev.gen.ts in the dev entry only). */
  modules: readonly ApiModule[];
  deps: ModuleDeps;
}

export function createApp({ modules, deps }: CreateAppOptions): Hono<AppEnv> {
  const app = new Hono<AppEnv>();
  app.onError(errorHandler);
  app.notFound(notFoundHandler);

  const api = new Hono<AppEnv>();
  // Global middleware (security headers, logging, CSRF) is added here by WP-3.
  api.get('/health', (c) => c.json({ status: 'ok', db: deps.db.driver, modules: modules.map((m) => m.name) }));

  const seen = new Set<string>();
  for (const m of modules) {
    if (seen.has(m.name)) throw new Error(`Duplicate API module ${m.name}`);
    seen.add(m.name);
    m.register(api, deps);
  }

  app.route('/api/v1', api);
  return app;
}
