// Data rows that migrations insert (0110: system ledger accounts; 0211: the default calendar).
// POST /dev/reset empties every table (WP-3); without these rows every posting fails on a foreign
// key and units without a club lose their calendar. resetDatabase puts them back (integration fix).
import type { Db } from './types.ts';

export function restoreMigrationRows(db: Db): void {
  const has = (t: string) => db.get("SELECT 1 AS x FROM sqlite_master WHERE type = 'table' AND name = ?", [t]) !== undefined;
  if (has('ledger_account')) {
    for (const kind of ['issuance', 'redeemed', 'lapsed', 'reversed', 'expired']) {
      db.run("INSERT OR IGNORE INTO ledger_account (id, owner_type, kind, account_set) VALUES (?, 'system', ?, NULL)", [`system:${kind}`, kind]);
    }
  }
  if (has('exam_calendar') && db.all<{ name: string }>('PRAGMA table_info(exam_calendar)').some((c) => c.name === 'is_default')) {
    db.run(
      `INSERT INTO exam_calendar (id, institution, faculty, is_default, t_day, n_start_day, n_end_day, a_start_day, a_end_day, a_resit_days, exam_periods,
         source_ref, checked_at, club_confirmation_ref, created_at)
       SELECT '0000000000000000000000DEF0', 'Standaardkalender', NULL, 1, '2027-01-17', NULL, NULL, NULL, '2027-03-31', '[]', '[]',
         'werkhypothese voorregistratie §3.1', '2026-11-05', NULL, '2026-11-05T00:00:00.000Z'
       WHERE NOT EXISTS (SELECT 1 FROM exam_calendar WHERE is_default = 1)`,
    );
  }
}
