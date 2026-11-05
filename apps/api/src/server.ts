import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { serve } from '@hono/node-server';
import type { Hono } from 'hono';
import { openDb } from './db/open.ts';
import { migrate } from './db/migrate.ts';
import type { Db } from './db/types.ts';
import type { Clock } from './platform/types.ts';
import { MIGRATIONS_DIR, type Config } from './config.ts';
import type { AppEnv } from './module.ts';

export interface RunningServer {
  port: number;
  close(): Promise<void>;
}

/** Listens on the given port (8787 by default, 0 for a free port in tests). */
export function startServer(app: Hono<AppEnv>, port: number): Promise<RunningServer> {
  return new Promise((resolveStart) => {
    const server = serve({ fetch: app.fetch, port }, (info) => {
      resolveStart({
        port: info.port,
        close: () => new Promise((done, fail) => server.close((err) => (err ? fail(err) : done()))),
      });
    });
  });
}

/** Opens the database from config and applies pending migrations. */
export function openMigratedDb(config: Config, clock: Clock): Db {
  if (config.databasePath !== ':memory:') mkdirSync(dirname(config.databasePath), { recursive: true });
  const db = openDb({ path: config.databasePath, driver: config.dbDriver });
  migrate(db, { dir: MIGRATIONS_DIR, clock });
  return db;
}
