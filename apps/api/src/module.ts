import type { Hono } from 'hono';
import type { Db } from './db/types.ts';
import type { Platform } from './platform/types.ts';
import type { Services } from './services/index.ts';

// Intentionally empty: filled by later work packages.
export type AppEnv = { Variables: {} };

export interface ModuleDeps {
  db: Db;
  platform: Platform;
  services: Services;
}

/**
 * Every API module exports `module` from modules/<name>/index.ts. tooling/scripts/gen-modules.ts
 * collects them into modules.gen.ts, so no work package edits app.ts (architecture §2).
 */
export interface ApiModule {
  name: string;
  /** Owning work package (architecture §12.1). */
  owner: string;
  /** Registers routes on the /api/v1 router; paths include the module prefix. */
  register(api: Hono<AppEnv>, deps: ModuleDeps): void;
}
