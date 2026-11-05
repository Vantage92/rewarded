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
    expect(body.modules).toHaveLength(25);
  });

  it('serves a health route for every module stub', async () => {
    const bodies = await Promise.all(modules.map(async (m) => (await fetch(`${base}/${m.name}/health`)).json()));
    expect(bodies).toEqual(modules.map((m) => ({ module: m.name, status: 'stub' })));
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
