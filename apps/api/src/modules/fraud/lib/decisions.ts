// Consequences of human decisions (spec §6.4–6.5; architecture §5.1, §10.8). Only the /admin routes
// call these functions, always with an admin actor, a reason code and an audit line in the same
// transaction. A heuristic or job never reaches this file (test: no negative decision outside /admin).
import type { Cause } from '@rewarded/core/ledger';
import { auditRef } from '../../../db/services/audit.ts';
import type { Db } from '../../../db/types.ts';
import { deleteUserSessions } from '../../../middleware/auth.ts';
import type { ModuleDeps } from '../../../module.ts';
import type { AdminActor, FlagRecord } from '../../../services/flags.ts';
import { flagSessionIds, flagUserIds, loadFlag, type FlagRow } from './flags.ts';
import { eventFor, hasTables } from './util.ts';

export interface BookedPosting {
  type: string;
  amount: number;
  idempotency_key: string;
}

const BLOCK_KEEP_MS = 2 * 365 * 86_400_000;

/** Review status a completed session should have given all its flags and appeals. */
export function reviewStatusOf(tx: Db, sessionId: string): 'pending' | 'released' | 'rejected' | 'none' {
  const rows = tx.all<{ status: string; upheld: number }>(
    `SELECT f.status, EXISTS (SELECT 1 FROM appeal a WHERE a.object_id = f.id AND a.object_type IN ('flag', 'block') AND a.outcome = 'upheld') AS upheld
       FROM fraud_flag f JOIN fraud_flag_session l ON l.flag_id = f.id WHERE l.session_id = ?`,
    [sessionId],
  );
  if (rows.length === 0) return 'none';
  if (rows.some((r) => (r.status === 'rejected' || r.status === 'blocked') && r.upheld === 0)) return 'rejected';
  if (rows.some((r) => r.status === 'open')) return 'pending';
  return 'released';
}

/**
 * Updates review_status of the touched completed sessions and recomputes their user days with
 * reconcileDay; returns the journal entries that were booked (architecture §5.1).
 */
export function applyToSessions(deps: ModuleDeps, tx: Db, sessionIds: readonly string[], cause: Cause): BookedPosting[] {
  const s = deps.services as Partial<ModuleDeps['services']>;
  const sessions = s.sessions;
  if (!sessions || !hasTables(tx, 'focus_session')) return [];
  const days = new Map<string, { userId: string; day: string }>();
  for (const id of new Set(sessionIds)) {
    const row = sessions.get(id);
    if (!row || row.status !== 'completed') continue;
    const status = reviewStatusOf(tx, id);
    if (status !== 'none' && status !== row.reviewStatus) sessions.setReviewStatus(tx, [id], status);
    days.set(`${row.userId}|${row.focusDay}`, { userId: row.userId, day: row.focusDay });
  }
  const out: BookedPosting[] = [];
  if (!s.ledger) return out;
  for (const { userId, day } of [...days.values()].sort((a, b) => (a.userId + a.day).localeCompare(b.userId + b.day))) {
    for (const e of s.ledger.reconcileDay(tx, userId, day, cause)) {
      const amount = e.postings.reduce((n, p) => n + (p.amount > 0 ? p.amount : 0), 0);
      out.push({ type: e.type, amount, idempotency_key: e.idempotencyKey });
    }
  }
  return out;
}

/** Hours between raising and deciding a flag (event flag_reviewed.doorlooptijd_u). */
function leadHours(r: FlagRow, at: Date): number {
  return Math.max(0, Math.round(((at.getTime() - Date.parse(r.created_at)) / 3_600_000) * 10) / 10);
}

export interface DecisionOutcome {
  flag: FlagRecord;
  postings: BookedPosting[];
  blockPending: boolean;
}

/** POST /admin/flags/:id/decision. */
export function decideFlag(deps: ModuleDeps, tx: Db, flagId: string, decision: 'release' | 'reject' | 'block', actor: AdminActor, reasonCode: string, note: string): DecisionOutcome {
  const res = deps.services.flags.decide(tx, flagId, decision, actor, reasonCode);
  tx.run('UPDATE fraud_flag SET note = ? WHERE id = ?', [note || null, flagId]);
  const row = loadFlag(tx, flagId) as FlagRow;
  const at = deps.platform.clock.now();
  const postings = decision === 'block' ? [] : applyToSessions(deps, tx, res.affectedSessionIds, { type: 'flag_decision', flagId });
  deps.services.audit.audit(tx, { actor, action: decision === 'block' ? 'flag_block_requested' : 'flag_decided', objectType: 'fraud_flag', objectRef: flagId, reason: reasonCode });
  if (decision !== 'block') flagReviewedEvents(deps, tx, row, decision, reasonCode, at);
  return { flag: res.flag, postings, blockPending: decision === 'block' };
}

function flagReviewedEvents(deps: ModuleDeps, tx: Db, row: FlagRow, decision: 'release' | 'reject' | 'block', reasonCode: string, at: Date): void {
  for (const userId of flagUserIds(tx, row)) {
    const sid = tx.get<{ id: string }>(
      `SELECT s.id FROM fraud_flag_session l JOIN focus_session s ON s.id = l.session_id WHERE l.flag_id = ? AND s.user_id = ? ORDER BY s.id LIMIT 1`,
      [row.id, userId],
    )?.id;
    eventFor(deps, tx, userId, 'flag_reviewed', { session_id: sid ?? null, besluit: decision, redencode: reasonCode, doorlooptijd_u: leadHours(row, at) });
  }
}

export interface BlockOutcome {
  flag: FlagRecord;
  phoneHashBlocked: boolean;
}

/** POST /admin/blocks/:id/confirm: four eyes, then the account is blocked and its hashes kept 2 years. */
export function confirmBlock(deps: ModuleDeps, tx: Db, flagId: string, actor: AdminActor, note: string): BlockOutcome {
  const flag = deps.services.flags.confirmBlock(tx, flagId, actor);
  const row = loadFlag(tx, flagId) as FlagRow;
  const now = deps.platform.clock.now();
  const expires = new Date(now.getTime() + BLOCK_KEEP_MS).toISOString();
  applyToSessions(deps, tx, flagSessionIds(tx, flagId), { type: 'flag_decision', flagId });
  let phoneHashBlocked = false;
  for (const userId of flagUserIds(tx, row)) {
    const u = tx.get<{ phone_hash: string | null; institution_email_hash: string | null }>('SELECT phone_hash, institution_email_hash FROM user WHERE id = ?', [userId]);
    if (!u) continue;
    tx.run("UPDATE user SET status = 'blocked' WHERE id = ? AND status = 'active'", [userId]);
    deleteUserSessions(tx, userId);
    if (u.phone_hash) {
      tx.run('INSERT INTO blocked_phone_hash (phone_hash, blocked_at, expires_at, flag_id) VALUES (?, ?, ?, ?) ON CONFLICT (phone_hash) DO UPDATE SET expires_at = excluded.expires_at, flag_id = excluded.flag_id', [
        u.phone_hash,
        now.toISOString(),
        expires,
        flagId,
      ]);
      phoneHashBlocked = true;
    }
    if (u.institution_email_hash) {
      tx.run(
        'INSERT INTO blocked_institution_hash (institution_email_hash, blocked_at, expires_at, flag_id) VALUES (?, ?, ?, ?) ON CONFLICT (institution_email_hash) DO UPDATE SET expires_at = excluded.expires_at, flag_id = excluded.flag_id',
        [u.institution_email_hash, now.toISOString(), expires, flagId],
      );
    }
    deps.services.audit.audit(tx, { actor, action: 'account_blocked', objectType: 'user', objectRef: auditRef(deps.platform.hasher, userId), reason: row.reason_code ?? 'block' });
  }
  if (note) tx.run("UPDATE fraud_flag SET note = trim(coalesce(note, '') || ' | ' || ?) WHERE id = ?", [note, flagId]);
  deps.services.audit.audit(tx, { actor, action: 'flag_block_confirmed', objectType: 'fraud_flag', objectRef: flagId, reason: row.reason_code ?? 'block' });
  flagReviewedEvents(deps, tx, row, 'block', row.reason_code ?? 'fraud_confirmed', now);
  return { flag, phoneHashBlocked };
}

/** Undoes a block after an upheld appeal: account active again, hashes of this flag released. */
export function liftBlock(deps: ModuleDeps, tx: Db, row: FlagRow, actor: AdminActor): void {
  for (const userId of flagUserIds(tx, row)) {
    tx.run("UPDATE user SET status = 'active' WHERE id = ? AND status = 'blocked'", [userId]);
    deps.services.audit.audit(tx, { actor, action: 'account_unblocked', objectType: 'user', objectRef: auditRef(deps.platform.hasher, userId), reason: 'appeal_upheld' });
  }
  tx.run('DELETE FROM blocked_phone_hash WHERE flag_id = ?', [row.id]);
  tx.run('DELETE FROM blocked_institution_hash WHERE flag_id = ?', [row.id]);
}
