// Duels (spec §3.6, §4.5; architecture §3.4 duel, §6.3). Seven days from the next day 04:00, won on
// days with goal_met_final (a joker or exam day does not count), a badge and no points. Outside the
// squad only between 18_plus players. One open or running duel per player.
import { addDays, compareDays, dayRange, type FocusDay } from '@rewarded/core';
import { DomainError, type DuelDto } from '@rewarded/contracts';
import type { Db } from '../../db/types.ts';
import type { ModuleDeps } from '../../module.ts';
import { P, nowIso, openMembership, today, userById, userDays, type InviteRow } from '../squads/lib/social.ts';

export interface DuelRow {
  id: string;
  challenger_id: string | null;
  opponent_id: string | null;
  invite_id: string | null;
  in_squad: number;
  status: 'open' | 'expired' | 'running' | 'pending_review' | 'finished';
  start_day: string | null;
  end_day: string | null;
  result: 'challenger' | 'opponent' | 'tie' | null;
  created_at: string;
  expires_at: string;
  accepted_at: string | null;
}

/** Expires open duels whose invite window passed (lazily on read and in the day close). */
export function expireOpenDuels(tx: Db, deps: ModuleDeps): void {
  tx.run("UPDATE duel SET status = 'expired' WHERE status = 'open' AND expires_at <= ?", [nowIso(deps)]);
}

export function activeDuelOf(db: Db, userId: string): DuelRow | undefined {
  return db.get<DuelRow>("SELECT * FROM duel WHERE (challenger_id = ? OR opponent_id = ?) AND status IN ('open', 'running') ORDER BY created_at DESC LIMIT 1", [userId, userId]);
}

export function sameSquad(db: Db, a: string, b: string): boolean {
  const ma = openMembership(db, a);
  const mb = openMembership(db, b);
  return ma !== undefined && mb !== undefined && ma.squad_id === mb.squad_id;
}

export function duelDto(db: Db, d: DuelRow, viewerId: string): DuelDto {
  const otherId = d.challenger_id === viewerId ? d.opponent_id : d.challenger_id;
  const other = otherId ? userById(db, otherId) : undefined;
  return { id: d.id, status: d.status, in_squad: d.in_squad === 1, start_day: d.start_day, end_day: d.end_day, opponent_first_name: other?.first_name ?? null };
}

/** Accepting a duel link: the acceptance is the opt-in for the comparison (spec §3.6 step 2). */
export function acceptDuel(tx: Db, deps: ModuleDeps, inv: InviteRow, me: { id: string; pseudonym: string; ageBand: '16_17' | '18_plus' }): DuelRow {
  expireOpenDuels(tx, deps);
  const duel = tx.get<DuelRow>('SELECT * FROM duel WHERE id = ?', [inv.duel_id]);
  if (!duel || duel.status === 'expired') throw new DomainError('INVITE_EXPIRED');
  if (duel.status !== 'open') {
    if (duel.opponent_id === me.id || duel.challenger_id === me.id) return duel;
    throw new DomainError('INVITE_EXHAUSTED');
  }
  if (duel.challenger_id === me.id) throw new DomainError('INVITE_INVALID');
  if (duel.opponent_id !== null && duel.opponent_id !== me.id) throw new DomainError('INVITE_INVALID');
  const other = activeDuelOf(tx, me.id);
  if (other && other.id !== duel.id) throw new DomainError('DUEL_ACTIVE');
  const challenger = duel.challenger_id ? userById(tx, duel.challenger_id) : undefined;
  if (!challenger) throw new DomainError('INVITE_INVALID');
  const inSquad = sameSquad(tx, challenger.id, me.id);
  // Outside the squad only between 18-plussers (spec §4.5; founder JS3).
  if (!inSquad && (me.ageBand !== '18_plus' || challenger.age_band !== '18_plus')) throw new DomainError('AGE_RESTRICTED');
  const start = addDays(today(deps), 1);
  const end = addDays(start, P.duels.length_days - 1);
  tx.run("UPDATE duel SET opponent_id = ?, in_squad = ?, status = 'running', start_day = ?, end_day = ?, accepted_at = ? WHERE id = ?", [
    me.id,
    inSquad ? 1 : 0,
    start,
    end,
    nowIso(deps),
    duel.id,
  ]);
  deps.services.events.event(tx, 'duel_accepted', { duel_id: duel.id, invite_id: inv.id }, { pseudonym: me.pseudonym });
  return tx.get<DuelRow>('SELECT * FROM duel WHERE id = ?', [duel.id])!;
}

/** Per day: goal met (goal_met_final and not an exam day) for both players, up to `until`. */
export function duelDays(deps: ModuleDeps, d: DuelRow, until: FocusDay): { day: FocusDay; challenger: boolean; opponent: boolean }[] {
  if (!d.start_day || !d.end_day) return [];
  const last = compareDays(until, d.end_day) < 0 ? until : d.end_day;
  if (compareDays(last, d.start_day) < 0) return [];
  const reader = userDays(deps);
  const ids = [d.challenger_id, d.opponent_id].filter((x): x is string => x !== null);
  const rows = reader.range(ids, d.start_day, last);
  const met = (u: string | null, day: FocusDay) => u !== null && rows.some((r) => r.userId === u && r.focusDay === day && r.goalMetFinal && !r.examDay);
  return dayRange(d.start_day, last).map((day) => ({ day, challenger: met(d.challenger_id, day), opponent: met(d.opponent_id, day) }));
}

/** Sessions of both players in the duel period, for the open-flag check (pending_review). */
function periodSessions(db: Db, d: DuelRow): string[] {
  const ids = [d.challenger_id, d.opponent_id].filter((x): x is string => x !== null);
  if (ids.length === 0 || !d.start_day || !d.end_day) return [];
  return db
    .all<{ id: string }>(`SELECT id FROM focus_session WHERE user_id IN (${ids.map(() => '?').join(', ')}) AND focus_day >= ? AND focus_day <= ? AND status = 'completed'`, [
      ...ids,
      d.start_day,
      d.end_day,
    ])
    .map((r) => r.id);
}

/**
 * Finishes running duels whose last day is closed. A player with an open flag in the period gets a
 * result only after the decision (spec §4.5): the duel waits in pending_review.
 */
export function finishDuels(tx: Db, deps: ModuleDeps, closedDay: FocusDay): number {
  const due = tx.all<DuelRow>("SELECT * FROM duel WHERE status IN ('running', 'pending_review') AND end_day <= ?", [closedDay]);
  let n = 0;
  for (const d of due) {
    const sessions = periodSessions(tx, d);
    const open = sessions.length > 0 && [...deps.services.flags.openForSessions(sessions).values()].some((f) => f.length > 0);
    if (open) {
      if (d.status !== 'pending_review') tx.run("UPDATE duel SET status = 'pending_review' WHERE id = ?", [d.id]);
      continue;
    }
    const days = duelDays(deps, d, d.end_day!);
    const a = days.filter((x) => x.challenger).length;
    const b = days.filter((x) => x.opponent).length;
    const result = a > b ? 'challenger' : b > a ? 'opponent' : 'tie';
    tx.run("UPDATE duel SET status = 'finished', result = ?, finished_at = ? WHERE id = ?", [result, nowIso(deps), d.id]);
    // One event per duel, under the challenger (or the opponent after a deletion).
    const owner = [d.challenger_id, d.opponent_id].map((uid) => (uid ? userById(tx, uid) : undefined)).find((u) => u !== undefined);
    deps.services.events.event(tx, 'duel_finished', { duel_id: d.id, invite_id: d.invite_id, uitslag: result }, owner ? { pseudonym: owner.pseudonym } : {});
    n += 1;
  }
  return n;
}
