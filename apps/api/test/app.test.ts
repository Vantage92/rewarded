import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { modules } from '../src/modules.gen.ts';
import { devModules } from '../src/modules.dev.gen.ts';
import { startServer, type RunningServer } from '../src/server.ts';
import type { DriverName } from '../src/db/types.ts';
import { testApp } from './helpers.ts';

describe('API over HTTP', () => {
  let server: RunningServer;
  let base: string;

  beforeAll(async () => {
    server = await startServer(testApp([...modules, ...devModules]).app, 0);
    base = `http://127.0.0.1:${server.port}/api/v1`;
  });
  afterAll(() => server.close());

  it('serves the health route', async () => {
    const res = await fetch(`${base}/health`);
    expect(res.status).toBe(200);
    const body = (await res.json()) as { status: string; db: string; modules: string[] };
    expect(body.status).toBe('ok');
    expect(body.db).toBe('better-sqlite3');
    // 24 production modules: modules/draws was removed in the integration wave (architecture §12.5).
    expect(body.modules).toHaveLength(24);
  });

  it('serves a health route for every module stub', async () => {
    // Built modules may answer 'ok' or drop the route (a module route can shadow it); stubs answer 'stub'.
    const bodies = (await Promise.all(modules.map(async (m) => (await fetch(`${base}/${m.name}/health`)).json()))) as { module?: string; status?: string }[];
    bodies.forEach((b, i) => {
      if (b.module === undefined) return;
      expect(b.module).toBe(modules[i]!.name);
      expect(['stub', 'ok']).toContain(b.status);
    });
  });

  it('answers unknown routes with the error shape', async () => {
    const res = await fetch(`${base}/does-not-exist`);
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: { code: 'NOT_FOUND', message_key: 'errors.common.not_found' } });
  });
});

describe.each<DriverName>(['better-sqlite3', 'node:sqlite'])('app on %s', (driver) => {
  it('reports the driver in /health', async () => {
    const res = await testApp(modules, driver).app.request('/api/v1/health');
    expect(((await res.json()) as { db: string }).db).toBe(driver);
  });
});

describe('production module list', () => {
  it('has no dev routes', async () => {
    const res = await testApp(modules).app.request('/api/v1/dev/health');
    expect(res.status).toBe(404);
  });
});
