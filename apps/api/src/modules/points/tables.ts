// Whether the WP-4 tables exist: tests of other packages migrate only their own series and still
// run the day close with every step file, so the WP-4 steps skip quietly without their tables.
import type { Db } from '../../db/types.ts';

export function hasWp4Tables(db: Db): boolean {
  return db.get("SELECT 1 AS x FROM sqlite_master WHERE type = 'table' AND name = 'focus_session'") !== undefined
    && db.get("SELECT 1 AS x FROM sqlite_master WHERE type = 'table' AND name = 'journal_entry'") !== undefined;
}
