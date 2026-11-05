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

/** Applies pending migrations, each in its own transaction. Refuses edited migrations. */
export function migrate(db: Db, opts: { dir: string; clock: Clock }): { applied: string[] } {
  db.exec(`CREATE TABLE IF NOT EXISTS schema_migration (
    version TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    checksum TEXT NOT NULL,
    applied_at TEXT NOT NULL
  ) STRICT`);
  const done = new Map(
    db.all<{ version: string; checksum: string }>('SELECT version, checksum FROM schema_migration').map((r) => [r.version, r.checksum]),
  );
  const applied: string[] = [];
  for (const m of loadMigrations(opts.dir)) {
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
