import { createHash } from 'node:crypto';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Clock } from '../platform/types.ts';
import type { Db } from './types.ts';

export interface Migration {
  version: string;
  name: string;
  sql: string;
  checksum: string;
}

const FILE = /^(\d{4})_([a-z0-9_]+)\.sql$/;

/** Reads `NNNN_name.sql` files in version order. Non-SQL files (README.md) are ignored. */
export function loadMigrations(dir: string): Migration[] {
  const seen = new Set<string>();
  return readdirSync(dir)
    .filter((f) => f.endsWith('.sql'))
    .sort()
    .map((file) => {
      const m = FILE.exec(file);
      if (!m) throw new Error(`Invalid migration file name: ${file} (expected NNNN_name.sql)`);
      const [, version, name] = m as unknown as [string, string, string];
      if (seen.has(version)) throw new Error(`Duplicate migration version ${version}`);
      seen.add(version);
      const sql = readFileSync(join(dir, file), 'utf8');
      return { version, name, sql, checksum: createHash('sha256').update(sql).digest('hex') };
    });
}

/** Number ranges per work package (architecture §12.3); a file outside every range is refused. */
export const MIGRATION_SERIES: readonly { from: number; to: number; owner: string }[] = [
  { from: 1, to: 79, owner: 'WP-3' },
  { from: 80, to: 99, owner: 'WP-6' },
  { from: 100, to: 199, owner: 'WP-4' },
  { from: 200, to: 299, owner: 'WP-5' },
  { from: 300, to: 399, owner: 'WP-6' },
];

export function migrationOwner(version: string): string | undefined {
  const n = Number(version);
  return MIGRATION_SERIES.find((s) => n >= s.from && n <= s.to)?.owner;
}

export interface MigrateOptions {
  dir: string;
  clock: Clock;
  /** Tolerate applied versions that no longer exist on disk (switching branches in dev). */
  allowMissing?: boolean;
}

export interface MigrationStatus {
  version: string;
  name: string;
  applied_at: string | null;
}

/** Applied and pending migrations, in version order. */
export function migrationStatus(db: Db, dir: string): MigrationStatus[] {
  const done = new Map(
    tableExists(db, 'schema_migration')
      ? db.all<{ version: string; applied_at: string }>('SELECT version, applied_at FROM schema_migration').map((r) => [r.version, r.applied_at])
      : [],
  );
  return loadMigrations(dir).map((m) => ({ version: m.version, name: m.name, applied_at: done.get(m.version) ?? null }));
}

function tableExists(db: Db, name: string): boolean {
  return db.get("SELECT 1 AS x FROM sqlite_master WHERE type = 'table' AND name = ?", [name]) !== undefined;
}

/**
 * Applies pending migrations, each in its own transaction. Refuses edited migrations, files outside
 * the work-package ranges, and (unless allowMissing) applied versions that disappeared from disk.
 */
export function migrate(db: Db, opts: MigrateOptions): { applied: string[] } {
  db.exec(`CREATE TABLE IF NOT EXISTS schema_migration (
    version TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    checksum TEXT NOT NULL,
    applied_at TEXT NOT NULL
  ) STRICT`);
  const done = new Map(
    db.all<{ version: string; checksum: string }>('SELECT version, checksum FROM schema_migration').map((r) => [r.version, r.checksum]),
  );
  const all = loadMigrations(opts.dir);
  for (const m of all) {
    if (migrationOwner(m.version) === undefined) throw new Error(`Migration ${m.version}_${m.name} is outside every work-package range`);
  }
  if (!opts.allowMissing) {
    const onDisk = new Set(all.map((m) => m.version));
    const missing = [...done.keys()].filter((v) => !onDisk.has(v));
    if (missing.length > 0) throw new Error(`Applied migrations missing on disk: ${missing.join(', ')}`);
  }
  const applied: string[] = [];
  for (const m of all) {
    const prev = done.get(m.version);
    if (prev !== undefined) {
      if (prev !== m.checksum) throw new Error(`Migration ${m.version}_${m.name} was changed after it was applied`);
      continue;
    }
    db.transaction(() => {
      db.exec(m.sql);
      db.run('INSERT INTO schema_migration (version, name, checksum, applied_at) VALUES (?, ?, ?, ?)', [
        m.version,
        m.name,
        m.checksum,
        opts.clock.now().toISOString(),
      ]);
    });
    applied.push(`${m.version}_${m.name}`);
  }
  return { applied };
}
