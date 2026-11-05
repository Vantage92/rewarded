import { existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, isAbsolute, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { DriverName } from './db/types.ts';

/** Repository root; relative paths in env vars resolve against it. */
export const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
export const MIGRATIONS_DIR = join(REPO_ROOT, 'apps/api/migrations');
export const DEFAULT_PORT = 8787;

/**
 * Loads the repo-root .env if present; existing environment variables win.
 * (Not via --env-file-if-exists: combined with --watch, Node 22 crashes when the file is missing.)
 */
export function loadDotEnv(): void {
  const file = join(REPO_ROOT, '.env');
  if (existsSync(file)) process.loadEnvFile(file);
}

export interface Config {
  port: number;
  databasePath: string;
  dbDriver: 'auto' | DriverName;
  secretsDir: string;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const fromRoot = (p: string) => (p === ':memory:' || isAbsolute(p) ? p : join(REPO_ROOT, p));
  const driver = env.REWARDED_DB_DRIVER ?? 'auto';
  if (driver !== 'auto' && driver !== 'better-sqlite3' && driver !== 'node:sqlite') {
    throw new Error(`Invalid REWARDED_DB_DRIVER: ${driver}`);
  }
  return {
    port: Number(env.PORT ?? DEFAULT_PORT),
    databasePath: fromRoot(env.DATABASE_PATH ?? '.data/rewarded.sqlite'),
    dbDriver: driver,
    secretsDir: env.REWARDED_SECRETS_DIR || join(env.XDG_CONFIG_HOME || join(homedir(), '.config'), 'rewarded/secrets'),
  };
}
