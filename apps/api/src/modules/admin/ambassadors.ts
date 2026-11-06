// Ambassadors (spec §4.9; architecture §6.5; voorregistratie §7.4). A code is attribution only, no
// referral points. The count per ambassador: users with ≥ 5 completed sessions on day 14, an
// institution anchor and no suspect judgement in a sample; at most cap_users per month. Before every
// payout a targeted sample of five counted accounts must be judged, and the payout needs four eyes.
import { DomainError, type Ambassador, type AmbassadorCreate } from '@rewarded/contracts';
import { CURRENT_PARAMS } from '@rewarded/core';
import type { Db } from '../../db/types.ts';
import type { ModuleDeps } from '../../module.ts';
import type { AdminActor } from '../../services/flags.ts';
import { drawAmbassadorSample, suspectUserIds } from '../fraud/lib/sample.ts';
import { hasTables, idsOf } from '../fraud/lib/util.ts';

interface AmbassadorRow {
  id: string;
  code_invite_id: string;
  name_ref: string;
  is_board_member_of: string | null;
  cap_users: number;
}

export function listAmbassadors(db: Db): Ambassador[] {
  return db
    .all<AmbassadorRow & { registered: number }>(
      'SELECT a.id, a.code_invite_id, a.name_ref, a.is_board_member_of, a.cap_users, (SELECT count(*) FROM user u WHERE u.registration_invite_id = a.code_invite_id) AS registered FROM ambassador a ORDER BY a.created_at',
    )
    .map((a) => ({ id: a.id, code_invite_id: a.code_invite_id, name_ref: a.name_ref, is_board_member_of: a.is_board_member_of, cap_users: a.cap_users, registered: a.registered }));
}

/** A board member of a participating club cannot be an ambassador (spec §4.9). */
export function createAmbassador(deps: ModuleDeps, tx: Db, body: AmbassadorCreate, actor: AdminActor): Ambassador {
  if (body.is_board_member_of && hasTables(tx, 'club')) {
    const club = tx.get<{ status: string }>('SELECT status FROM club WHERE id = ?', [body.is_board_member_of]);
    if (!club || club.status !== 'archived') throw new DomainError('BOARD_MEMBER_CONFLICT');
  }
  const ids = idsOf(deps);
  const now = deps.platform.clock.now();
  const inviteId = ids.ulid();
  // Ambassador code: an invite with source `ambassador` (attribution, no points).
  tx.run("INSERT INTO invite (id, token, source, max_uses, uses, expires_at, created_at) VALUES (?, ?, 'ambassador', ?, 0, ?, ?)", [
    inviteId,
    ids.token(16),
    Math.max(1, body.cap_users * 12),
    new Date(now.getTime() + 365 * 86_400_000).toISOString(),
    now.toISOString(),
  ]);
  const id = ids.ulid();
  tx.run('INSERT INTO ambassador (id, code_invite_id, name_ref, is_board_member_of, cap_users, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)', [
    id,
    inviteId,
    body.name_ref,
    body.is_board_member_of ?? null,
    body.cap_users,
    actor,
    now.toISOString(),
  ]);
  deps.services.audit.audit(tx, { actor, action: 'ambassador_created', objectType: 'ambassador', objectRef: id });
  return { id, code_invite_id: inviteId, name_ref: body.name_ref, is_board_member_of: body.is_board_member_of ?? null, cap_users: body.cap_users, registered: 0 };
}

/** Counted users of an ambassador for a month (spec §4.9), without suspect or fraud judgements. */
export function countedUsers(db: Db, ambassadorId: string, monthKey: string): string[] {
  const a = db.get<AmbassadorRow>('SELECT * FROM ambassador WHERE id = ?', [ambassadorId]);
  if (!a) throw new DomainError('NOT_FOUND');
  const P = CURRENT_PARAMS.ambassadors;
  const rows = db.all<{ id: string; created_at: string; n: number }>(
    `SELECT u.id, u.created_at,
            (SELECT count(*) FROM focus_session s WHERE s.user_id = u.id AND s.status = 'completed' AND s.is_practice = 0 AND s.review_status IN ('none', 'released')
               AND s.server_start_at < (CAST(strftime('%s', u.created_at) AS INTEGER) + ? * 86400) * 1000) AS n
       FROM user u WHERE u.registration_invite_id = ? AND u.institution_email_hash IS NOT NULL AND u.status = 'active' AND substr(u.created_at, 1, 7) = ?
        -- Accounts with an open flag do not count (the only path where web sessions lead to money).
        AND NOT EXISTS (SELECT 1 FROM fraud_flag f LEFT JOIN fraud_flag_session l ON l.flag_id = f.id
                         WHERE f.status = 'open' AND (l.user_id = u.id OR (f.subject_type = 'account' AND f.subject_id = u.id)))
      ORDER BY u.created_at, u.id`,
    [P.eval_day, a.code_invite_id, monthKey],
  );
  const suspect = suspectUserIds(db);
  return rows.filter((r) => r.n >= P.min_sessions && !suspect.has(r.id)).map((r) => r.id).slice(0, Math.min(a.cap_users, P.max_users_per_month));
}

export type PayoutStep = { status: 'sampled' | 'proposed' | 'recorded'; sampleId: string; counted: number; feeCents: number };

/**
 * Payout of a month (architecture §8.2 POST /admin/ambassadors/:id/payouts; the route is not in
 * contracts v1). First call draws the sample; once every item is judged an admin proposes and a
 * second admin records it. The payment itself runs outside the app.
 */
export function ambassadorPayout(deps: ModuleDeps, tx: Db, ambassadorId: string, monthKey: string, actor: AdminActor): PayoutStep {
  const existing = tx.get<{ id: string; status: PayoutStep['status']; sample_id: string; proposed_by: string | null; counted_users: number | null }>('SELECT id, status, sample_id, proposed_by, counted_users FROM ambassador_payout WHERE ambassador_id = ? AND month_key = ?', [
    ambassadorId,
    monthKey,
  ]);
  const now = deps.platform.clock.now().toISOString();
  const fee = CURRENT_PARAMS.ambassadors.fee_cents;
  if (!existing) {
    const counted = countedUsers(tx, ambassadorId, monthKey);
    const sampleId = drawAmbassadorSample(deps, tx, ambassadorId, monthKey, counted);
    // The count is frozen when the sample is drawn; later it can only go down (a new flag), never up.
    tx.run("INSERT INTO ambassador_payout (id, ambassador_id, month_key, sample_id, status, created_at, counted_users) VALUES (?, ?, ?, ?, 'sampled', ?, ?)", [idsOf(deps).ulid(), ambassadorId, monthKey, sampleId, now, counted.length]);
    deps.services.audit.audit(tx, { actor, action: 'ambassador_sample_drawn', objectType: 'ambassador', objectRef: ambassadorId, reason: monthKey });
    return { status: 'sampled', sampleId, counted: counted.length, feeCents: 0 };
  }
  const open = tx.get<{ n: number }>('SELECT count(*) AS n FROM fraud_sample_item WHERE sample_id = ? AND judged_at IS NULL', [existing.sample_id])?.n ?? 0;
  if (open > 0) throw new DomainError('AMBASSADOR_SAMPLE_REQUIRED', { open_items: open });
  const now_ = countedUsers(tx, ambassadorId, monthKey).length;
  const counted = existing.counted_users === null ? now_ : Math.min(existing.counted_users, now_);
  if (existing.status === 'sampled') {
    tx.run("UPDATE ambassador_payout SET status = 'proposed', proposed_by = ?, counted_users = ? WHERE id = ?", [actor, counted, existing.id]);
    deps.services.audit.audit(tx, { actor, action: 'ambassador_payout_proposed', objectType: 'ambassador', objectRef: ambassadorId, reason: `${monthKey}:${counted}` });
    return { status: 'proposed', sampleId: existing.sample_id, counted, feeCents: counted * fee };
  }
  if (existing.status === 'proposed') {
    if (existing.proposed_by === actor) throw new DomainError('FOUR_EYES_REQUIRED');
    tx.run("UPDATE ambassador_payout SET status = 'recorded', recorded_by = ?, recorded_at = ?, counted_users = ? WHERE id = ?", [actor, now, counted, existing.id]);
    deps.services.audit.audit(tx, { actor, action: 'ambassador_payout_recorded', objectType: 'ambassador', objectRef: ambassadorId, reason: `${monthKey}:${counted}` });
  }
  return { status: 'recorded', sampleId: existing.sample_id, counted, feeCents: counted * fee };
}
