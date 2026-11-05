// Day close step 10: the nightly checks of architecture §5.5. Owner WP-4.
// Every non-empty result becomes a ledger_alert in the admin overview (and fails the integration test).
import { idsFor } from '../../db/ids.ts';
import type { Db } from '../../db/types.ts';
import { hasWp4Tables } from '../../modules/points/tables.ts';
import type { DayCloseStep } from '../scheduler.ts';

export interface LedgerFinding {
  check: 'zero_sum' | 'one_earn_per_session' | 'session_points_counted';
  ref: string;
  details: Record<string, unknown>;
}

/** The three queries of §5.5 for focus day D (zero-sum over the whole journal). */
export function ledgerChecks(db: Db, day: string): LedgerFinding[] {
  const out: LedgerFinding[] = [];
  for (const r of db.all<{ entry_id: string; total: number }>('SELECT entry_id, SUM(amount) AS total FROM posting GROUP BY entry_id HAVING SUM(amount) <> 0')) {
    out.push({ check: 'zero_sum', ref: r.entry_id, details: { sum: Number(r.total) } });
  }
  // Exactly one earn entry for every completed, non-practice session that has counted minutes;
  // never more than one for any session (the key is unique, so this guards the key format).
  for (const r of db.all<{ id: string; n: number; counted_min: number }>(
    `SELECT s.id, s.counted_min, (SELECT COUNT(*) FROM journal_entry e WHERE e.idempotency_key = 'earn:' || s.id) AS n
       FROM focus_session s WHERE s.focus_day = ? AND s.status = 'completed' AND s.is_practice = 0`,
    [day],
  )) {
    if ((r.counted_min > 0 && Number(r.n) !== 1) || Number(r.n) > 1) out.push({ check: 'one_earn_per_session', ref: r.id, details: { entries: Number(r.n) } });
  }
  for (const r of db.all<{ id: string; counted_min: number; review_status: string; total: number }>(
    `SELECT s.id, s.counted_min, s.review_status,
            (SELECT COALESCE(SUM(p.amount), 0) FROM journal_entry e JOIN posting p ON p.entry_id = e.id JOIN ledger_account a ON a.id = p.account_id
              WHERE e.ref_type = 'session' AND e.ref_id = s.id AND a.owner_type = 'user') AS total
       FROM focus_session s WHERE s.focus_day = ? AND s.is_practice = 0`,
    [day],
  )) {
    const expected = r.review_status === 'rejected' ? 0 : r.counted_min;
    if (Number(r.total) !== expected) out.push({ check: 'session_points_counted', ref: r.id, details: { points: Number(r.total), expected } });
  }
  return out;
}

export const step: DayCloseStep = {
  no: 10,
  name: 'ledger-checks',
  owner: 'WP-4',
  run({ day, deps, now }) {
    if (!hasWp4Tables(deps.db)) return;
    const ids = idsFor(deps.platform);
    const findings = ledgerChecks(deps.db, day);
    deps.db.transaction(() => {
      for (const f of findings) {
        deps.db.run('INSERT OR IGNORE INTO ledger_alert (id, check_name, day, ref, details, created_at) VALUES (?, ?, ?, ?, ?, ?)', [ids.ulid(), f.check, day, f.ref, JSON.stringify(f.details), now.toISOString()]);
      }
    });
    if (findings.length > 0) deps.platform.logger?.log('error', 'ledger_alert', { route: '/jobs/day_close/10-ledger-checks', error_code: 'LEDGER_ALERT' });
  },
};
