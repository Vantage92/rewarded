// Content fingerprint of a database: every table (except the migration log), rows sorted, hashed.
// Used to prove that the demo seed is deterministic and idempotent (architecture §11).
import { createHash } from 'node:crypto';
import type { Db } from '../../apps/api/src/db/types.ts';

export function tableCounts(db: Db): Record<string, number> {
  const out: Record<string, number> = {};
  for (const t of userTables(db)) out[t] = db.get<{ n: number }>(`SELECT count(*) AS n FROM "${t}"`)!.n;
  return out;
}

function userTables(db: Db): string[] {
  return db
    .all<{ name: string }>("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' AND name <> 'schema_migration' ORDER BY name")
    .map((r) => r.name);
}

export function dumpHash(db: Db): string {
  const h = createHash('sha256');
  for (const t of userTables(db)) {
    const rows = db.all<Record<string, unknown>>(`SELECT * FROM "${t}"`).map((r) => JSON.stringify(r, (_k, v: unknown) => (typeof v === 'bigint' ? v.toString() : v)));
    rows.sort();
    h.update(`${t}\n${rows.join('\n')}\n`);
  }
  return h.digest('hex');
}
