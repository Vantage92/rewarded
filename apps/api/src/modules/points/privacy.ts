// Erasers and exporters of the WP-4 tables (architecture §10.7). DELETE /me first books an `expire`
// that sets every balance to zero, then empties ledger_account_owner: the accounts and the journal
// stay unchanged and can no longer be linked to anyone. Sessions, signals, user_day and the phone
// code are deleted; a redemption keeps its row without user_id.
import type { Db } from '../../db/types.ts';
import type { ModuleDeps } from '../../module.ts';

export function registerWp4Privacy(deps: ModuleDeps): void {
  const { services } = deps;
  const p = services.privacy;
  p.registerEraser('points', (tx: Db, userId: string) => {
    services.ledger.expireAll(tx, userId, 'account_deleted');
    tx.run('DELETE FROM user_day WHERE user_id = ?', [userId]);
    tx.run('DELETE FROM ledger_account_owner WHERE user_id = ?', [userId]);
  });
  p.registerEraser('sessions', (tx: Db, userId: string) => {
    const sel = 'SELECT id FROM focus_session WHERE user_id = ?';
    tx.run(`DELETE FROM session_heartbeat WHERE session_id IN (${sel})`, [userId]);
    tx.run(`DELETE FROM visibility_event WHERE session_id IN (${sel})`, [userId]);
    tx.run(`DELETE FROM session_summary WHERE session_id IN (${sel})`, [userId]);
    tx.run('DELETE FROM focus_session WHERE user_id = ?', [userId]);
  });
  p.registerEraser('redemptions', (tx: Db, userId: string) => {
    tx.run('UPDATE redemption SET user_id = NULL WHERE user_id = ?', [userId]);
  });
  p.registerEraser('phone', (tx: Db, userId: string) => {
    tx.run('DELETE FROM phone_verification WHERE user_id = ?', [userId]);
  });

  const db = deps.db;
  p.registerExporter('points', (userId: string) => ({
    balances: services.ledger.balances(userId),
    days: db.all('SELECT focus_day, verified_min, counted_min, goal_min, goal_met, exam_day, goal_state FROM user_day WHERE user_id = ? ORDER BY focus_day', [userId]),
    journal: db.all(
      `SELECT e.type, e.idempotency_key AS rule_key, e.focus_day, e.created_at, o.kind AS account, p.amount FROM ledger_account_owner o
         JOIN posting p ON p.account_id = o.account_id JOIN journal_entry e ON e.id = p.entry_id WHERE o.user_id = ? ORDER BY e.id`,
      [userId],
    ),
  }));
  p.registerExporter('sessions', (userId: string) => ({
    sessions: db.all(
      `SELECT id, planned_min, is_practice, status, server_start_at, planned_end_at, server_end_at, abort_reason, verified_min, counted_min, focus_day,
              late_start, review_status, flag_codes FROM focus_session WHERE user_id = ? ORDER BY server_start_at`,
      [userId],
    ),
  }));
  p.registerExporter('redemptions', (userId: string) => ({
    redemptions: db.all('SELECT id, reward_id, points, points_from_referral, week_key, month_key, status, created_at FROM redemption WHERE user_id = ? ORDER BY created_at', [userId]),
  }));
  p.registerExporter('phone', (userId: string) => ({
    phone_verified: db.get<{ v: string | null }>('SELECT phone_verified_at AS v FROM user WHERE id = ?', [userId])?.v ?? null,
  }));
}
