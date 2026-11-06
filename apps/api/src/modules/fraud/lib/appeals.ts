// Appeals (spec §6.5; architecture §3.2, §10.8). Within 14 days after a rejection, reversal or block;
// decided within 5 workdays by an admin who did not work on the original decision. With only two
// admins and a confirmed block nobody is left: the appeal waits for a third person.
import { DomainError, type AppealObjectType, type MyDecision } from '@rewarded/contracts';
import { CURRENT_PARAMS, focusDayOf } from '@rewarded/core';
import { appealWindowOpen, dueDay, eligibleAppealReviewers } from '@rewarded/core/fraud';
import type { Db } from '../../../db/types.ts';
import type { ModuleDeps } from '../../../module.ts';
import type { AdminActor } from '../../../services/flags.ts';
import { applyToSessions, liftBlock } from './decisions.ts';
import { flagSessionIds, flagUserIds, loadFlag, type FlagRow } from './flags.ts';
import { loadPrize } from './prizes.ts';
import { adminActors, assertNotOwnSubject, eventFor, idsOf } from './util.ts';

export interface AppealRow {
  id: string;
  object_type: AppealObjectType;
  object_id: string;
  user_id: string | null;
  text: string | null;
  status: 'open' | 'decided' | 'closed';
  submitted_at: string;
  due_day: string;
  waiting_for_third: number;
  decided_by: string | null;
  decided_at: string | null;
  outcome: 'upheld' | 'rejected' | null;
  motivation: string | null;
}

interface Target {
  decidedAt: string;
  involved: (string | null)[];
  flag?: FlagRow;
}

/** The negative decision an appeal is about, checked against the appellant. */
function targetOf(db: Db, type: AppealObjectType, id: string, userId: string): Target {
  if (type === 'flag' || type === 'block') {
    const f = loadFlag(db, id);
    if (!f || !flagUserIds(db, f).includes(userId)) throw new DomainError('NOT_FOUND');
    if (type === 'flag' && f.status !== 'rejected') throw new DomainError('NOT_FOUND', { reason: 'nothing_to_appeal' });
    if (type === 'block' && f.status !== 'blocked') throw new DomainError('NOT_FOUND', { reason: 'nothing_to_appeal' });
    return { decidedAt: (type === 'block' ? f.block_confirmed_at : f.decided_at) ?? f.created_at, involved: [f.decided_by, f.block_confirmed_by], flag: f };
  }
  if (type === 'prize') {
    const p = loadPrize(db, id);
    if (!p || p.winner_user_id !== userId || p.status !== 'rejected') throw new DomainError('NOT_FOUND');
    return { decidedAt: p.age_checked_at ?? p.verified_at ?? '', involved: [p.verified_by, p.age_checked_by] };
  }
  const r = db.get<{ user_id: string | null; status: string; created_at: string }>('SELECT user_id, status, created_at FROM redemption WHERE id = ?', [id]);
  if (!r || r.user_id !== userId) throw new DomainError('NOT_FOUND');
  const audit = db.get<{ actor_ref: string; at: string }>("SELECT actor_ref, at FROM audit_log WHERE object_type = 'redemption' AND object_ref = ? ORDER BY at DESC LIMIT 1", [id]);
  return { decidedAt: audit?.at ?? r.created_at, involved: [audit?.actor_ref ?? null] };
}

/** POST /appeals. */
export function submitAppeal(deps: ModuleDeps, tx: Db, userId: string, type: AppealObjectType, objectId: string, text: string): string {
  const now = deps.platform.clock.now();
  const target = targetOf(tx, type, objectId, userId);
  if (!appealWindowOpen(Date.parse(target.decidedAt), now.getTime(), CURRENT_PARAMS.review.appeal_window_days)) throw new DomainError('APPEAL_WINDOW_CLOSED');
  if (tx.get('SELECT 1 AS x FROM appeal WHERE object_id = ? AND object_type = ?', [objectId, type])) throw new DomainError('ALREADY_APPEALED');
  const id = idsOf(deps).ulid();
  const today = focusDayOf(now.getTime(), CURRENT_PARAMS);
  const waiting = eligibleAppealReviewers(adminActors(deps, tx), target.involved).length === 0 ? 1 : 0;
  tx.run('INSERT INTO appeal (id, object_type, object_id, user_id, text, status, submitted_at, due_day, waiting_for_third) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [
    id,
    type,
    objectId,
    userId,
    text,
    'open',
    now.toISOString(),
    dueDay(today, CURRENT_PARAMS.review.appeal_decision_workdays),
    waiting,
  ]);
  eventFor(deps, tx, userId, 'appeal_submitted', { object_id: objectId });
  return id;
}

export function loadAppeal(db: Db, id: string): AppealRow | undefined {
  return db.get<AppealRow>('SELECT * FROM appeal WHERE id = ?', [id]);
}

/** POST /admin/appeals/:id/decision. */
export function decideAppeal(deps: ModuleDeps, tx: Db, id: string, outcome: 'upheld' | 'rejected', motivation: string, actor: AdminActor): AppealRow {
  const a = loadAppeal(tx, id);
  if (!a) throw new DomainError('NOT_FOUND');
  if (a.status !== 'open') throw new DomainError('NOT_FOUND', { reason: 'appeal_closed' });
  if (!motivation.trim()) throw new DomainError('REASON_REQUIRED');
  assertNotOwnSubject(deps, actor, [a.user_id]);
  const involved = a.user_id ? targetOf(tx, a.object_type, a.object_id, a.user_id).involved : involvedWithoutUser(tx, a);
  if (involved.includes(actor)) {
    const others = eligibleAppealReviewers(adminActors(deps, tx), involved);
    throw new DomainError(others.length === 0 ? 'NO_ELIGIBLE_REVIEWER' : 'SAME_REVIEWER');
  }
  const at = deps.platform.clock.now().toISOString();
  tx.run("UPDATE appeal SET status = 'decided', outcome = ?, motivation = ?, decided_by = ?, decided_at = ?, waiting_for_third = 0 WHERE id = ?", [outcome, motivation, actor, at, id]);
  if (outcome === 'upheld') {
    if (a.object_type === 'flag' || a.object_type === 'block') {
      const f = loadFlag(tx, a.object_id) as FlagRow;
      applyToSessions(deps, tx, flagSessionIds(tx, f.id), { type: 'appeal', appealId: id });
      if (a.object_type === 'block' || f.status === 'blocked') liftBlock(deps, tx, f, actor);
    }
    if (a.object_type === 'prize') tx.run("UPDATE prize SET status = 'candidate', age_check_outcome = NULL, age_checked_by = NULL, age_checked_at = NULL WHERE id = ? AND status = 'rejected'", [a.object_id]);
  }
  deps.services.audit.audit(tx, { actor, action: 'appeal_decided', objectType: 'appeal', objectRef: id, reason: outcome });
  eventFor(deps, tx, a.user_id, 'appeal_decided', { object_id: a.object_id, uitkomst: outcome });
  return loadAppeal(tx, id) as AppealRow;
}

function involvedWithoutUser(db: Db, a: AppealRow): (string | null)[] {
  if (a.object_type === 'flag' || a.object_type === 'block') {
    const f = loadFlag(db, a.object_id);
    return f ? [f.decided_by, f.block_confirmed_by] : [];
  }
  return [];
}

/** GET /appeals/mine: decisions about the user's own sessions or account, with appeal state (F8, P4). */
export function myDecisions(deps: ModuleDeps, db: Db, userId: string): MyDecision[] {
  const flags = db.all<FlagRow>(
    `SELECT DISTINCT f.* FROM fraud_flag f
      WHERE (f.subject_type = 'account' AND f.subject_id = ?)
         OR (f.subject_type = 'session' AND f.subject_id IN (SELECT id FROM focus_session WHERE user_id = ?))
         OR f.id IN (SELECT l.flag_id FROM fraud_flag_session l LEFT JOIN focus_session s ON s.id = l.session_id WHERE l.user_id = ? OR s.user_id = ?)
      ORDER BY f.created_at DESC LIMIT 200`,
    [userId, userId, userId, userId],
  );
  const now = deps.platform.clock.now().getTime();
  const days = CURRENT_PARAMS.review.appeal_window_days;
  return flags.map((f) => {
    const kind = f.status === 'blocked' ? ('block' as const) : ('review' as const);
    const a = db.get<AppealRow>('SELECT * FROM appeal WHERE object_id = ? ORDER BY submitted_at DESC LIMIT 1', [f.id]);
    const decidedAt = kind === 'block' ? (f.block_confirmed_at ?? f.decided_at) : f.decided_at;
    const appealable = (f.status === 'rejected' || f.status === 'blocked') && decidedAt !== null && !a && appealWindowOpen(Date.parse(decidedAt), now, days);
    return {
      flag_id: f.id,
      kind,
      status: f.status,
      reason_code: f.reason_code,
      decided_at: decidedAt,
      appeal_until: appealable && decidedAt ? new Date(Date.parse(decidedAt) + days * 86_400_000).toISOString() : null,
      appeal: a ? { id: a.id, status: a.status, outcome: a.outcome, motivation: a.status === 'decided' ? a.motivation : null } : null,
    };
  });
}
