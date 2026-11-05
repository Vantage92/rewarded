// pnpm db:migrate — applies pending SQL migrations to DATABASE_PATH.
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { MIGRATIONS_DIR, loadConfig, loadDotEnv } from '../config.ts';
import { migrate } from '../db/migrate.ts';
import { openDb } from '../db/open.ts';
import { SystemClock } from '../platform/system.ts';

loadDotEnv();
const config = loadConfig();
if (config.databasePath !== ':memory:') mkdirSync(dirname(config.databasePath), { recursive: true });
const db = openDb({ path: config.databasePath, driver: config.dbDriver });
const { applied } = migrate(db, { dir: MIGRATIONS_DIR, clock: new SystemClock() });
console.info(`[db:migrate] ${config.databasePath} (${db.driver}): ${applied.length ? applied.join(', ') : 'nothing to apply'}`);
db.close();
