// Joining and leaving a squad (spec §4.4, §5 Toewijzing; architecture §3.4, §6.3). Used by the
// squads and invites modules of WP-5.
import { activeFromDay } from '@rewarded/core/squads';
import { DomainError, type ExperimentFactor } from '@rewarded/contracts';
import type { Db } from '../../../db/types.ts';
import { afterJoinSquad, beforeLeaveSquad } from '../../points/restarm.ts';
import type { ModuleDeps } from '../../../module.ts';
import { P, ids, nowIso, openMembers, openMembership, squadEventCtx, today, userById, type SquadRow } from './social.ts';

/** Belofte arm is only taken over when the user's own offer was not shown yet (spec §5 Toewijzing). */
function beloftOfferShown(db: Db, userId: string): boolean {
  return db.get<{ x: number }>('SELECT 1 AS x FROM belofte_offer WHERE user_id = ? AND offered_at IS NOT NULL', [userId]) !== undefined;
}

/**
 * Logs the arm switches of a user who joins an experiment squad (`arm_switched`, spec §5): bonus
 * and rest arm from the next Monday, the Belofte arm only if the own offer was not shown yet.
 * Minors keep their personal A and `continue` (the ExperimentService applies that).
 */
export function logJoinSwitches(tx: Db, deps: ModuleDeps, userId: string, squad: SquadRow, reason: 'join' | 'merge', fromSquad?: SquadRow): void {
  if (squad.cohort !== 'experiment') return;
  const user = userById(tx, userId);
  if (!user || user.cohort !== 'experiment') return;
  const solo = fromSquad ? undefined : deps.services.experiments.get({ type: 'solo', id: userId, stratum: '' });
  const from: Partial<Record<ExperimentFactor, string | null>> = fromSquad
    ? { bonus: fromSquad.arm_bonus, belofte: fromSquad.arm_belofte, rest: fromSquad.arm_rest }
    : solo
      ? { bonus: solo.arms.bonus, belofte: solo.arms.belofte, rest: solo.arms.rest }
      : {};
  const to: Partial<Record<ExperimentFactor, string | null>> = { bonus: squad.arm_bonus, rest: squad.arm_rest, belofte: squad.arm_belofte };
  for (const factor of ['bonus', 'rest', 'belofte'] as const) {
    const a = from[factor];
    const b = to[factor];
    if (!a || !b || a === b) continue;
    if (factor === 'belofte' && beloftOfferShown(tx, userId)) continue;
    deps.services.experiments.switchArm(tx, { userId, factor, from: a, to: b, reason });
  }
}

/** Adds an open membership; SQUAD_FULL and ALREADY_IN_SQUAD are checked here as well. */
export function addMember(
  tx: Db,
  deps: ModuleDeps,
  squad: SquadRow,
  user: { id: string; pseudonym: string },
  o: { role: 'maker' | 'member'; inviteId: string | null; event: 'squad_created' | 'squad_joined' | null; switchReason?: 'join' | 'merge' },
): void {
  if (openMembership(tx, user.id)) throw new DomainError('ALREADY_IN_SQUAD');
  const members = openMembers(tx, squad.id);
  if (members.length >= P.squads.max_size) throw new DomainError('SQUAD_FULL');
  const day = today(deps);
  tx.run(
    `INSERT INTO squad_membership (id, squad_id, user_id, role, joined_at, active_from_day, invite_id) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [ids(deps).ulid(), squad.id, user.id, o.role, nowIso(deps), activeFromDay(day), o.inviteId],
  );
  if (o.switchReason) logJoinSwitches(tx, deps, user.id, squad, o.switchReason);
  // Rest arm per person from T − 6; a switch to a continuing squad counts as a rest exit (spec §3.16).
  if (deps.services.pointsContext) afterJoinSquad(tx, deps, user.id, squad.cohort === 'experiment' ? squad.arm_rest : null);
  const count = members.length + 1;
  if (o.event) {
    deps.services.events.event(tx, o.event, { squad_id: squad.id, invite_id: o.inviteId, ledental_na: count }, { pseudonym: user.pseudonym, squadId: squad.id });
  }
  if (count >= P.squads.min_size && squad.became_active_at === null) {
    tx.run("UPDATE squad SET status = 'active', became_active_at = ? WHERE id = ?", [nowIso(deps), squad.id]);
    deps.services.events.event(tx, 'squad_became_active', { squad_id: squad.id }, squadEventCtx(tx, squad.id));
  } else if (count >= P.squads.min_size && squad.status === 'building') {
    tx.run("UPDATE squad SET status = 'active' WHERE id = ?", [squad.id]);
  }
}

/**
 * Leaves the open membership (spec §4.4 Lid vertrekt): counts until the end of today, not from the
 * next day. The maker or admin hands over to the longest-sitting member.
 */
export function leaveSquad(tx: Db, deps: ModuleDeps, user: { id: string; pseudonym: string }, o: { event: boolean } = { event: true }): string | null {
  const m = openMembership(tx, user.id);
  if (!m) return null;
  if (deps.services.pointsContext) beforeLeaveSquad(tx, deps, user.id);
  const day = today(deps);
  tx.run('UPDATE squad_membership SET left_at = ?, left_day = ? WHERE id = ?', [nowIso(deps), day, m.id]);
  const rest = openMembers(tx, m.squad_id);
  const squad = tx.get<{ admin_user_id: string | null }>('SELECT admin_user_id FROM squad WHERE id = ?', [m.squad_id]);
  if (squad && squad.admin_user_id === user.id) {
    tx.run('UPDATE squad SET admin_user_id = ? WHERE id = ?', [rest[0]?.user_id ?? null, m.squad_id]);
  }
  if (rest.length < P.squads.min_size) tx.run("UPDATE squad SET status = 'building' WHERE id = ? AND status = 'active'", [m.squad_id]);
  if (o.event) {
    deps.services.events.event(tx, 'squad_left', { squad_id: m.squad_id, invite_id: m.invite_id, ledental_na: rest.length }, { pseudonym: user.pseudonym, squadId: m.squad_id });
  }
  return m.squad_id;
}
