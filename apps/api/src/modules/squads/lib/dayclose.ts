// Squad parts of the day close (architecture §6.1 steps 4 and 5; spec §4.4). Step 4: automatic
// pauses, low activity with the regroup offer inside an exam period, archive. Step 5: squad_day with
// streak, joker, freeze and recovery. Both are idempotent per focus day.
import { addDays, weekKey, type FocusDay } from '@rewarded/core';
import {
  activityWindow,
  archiveDue,
  evaluateSquadDay,
  isLowActivity,
  memberCountsOn,
  pauseDue,
  regroupOpen,
  type MemberDayFacts,
  type StreakState,
} from '@rewarded/core/squads';
import type { Db } from '../../../db/types.ts';
import type { ModuleDeps } from '../../../module.ts';
import { P, calendarById, isVacation, membershipsOnDay, nowIso, openMembers, sessionDays, squadEventCtx, userById, userDays, type MembershipRow, type SquadRow } from './social.ts';

function liveSquads(db: Db): SquadRow[] {
  return db.all<SquadRow>("SELECT * FROM squad WHERE status <> 'archived' ORDER BY id");
}

/** Step 4 for focus day `day`. */
export function closeSquadActivity(db: Db, deps: ModuleDeps, day: FocusDay): { paused: number; resumed: number; regroupOffered: number; archived: number } {
  const out = { paused: 0, resumed: 0, regroupOffered: 0, archived: 0 };
  const vac = (d: FocusDay) => isVacation(db, d);
  const window = activityWindow(day, P.squads);
  for (const squad of liveSquads(db)) {
    db.transaction(() => {
      const members = openMembers(db, squad.id).filter((m) => m.user_id !== null);
      let withSession = 0;
      let activeToday = false;
      for (const m of members) {
        const uid = m.user_id!;
        const days = sessionDays(db, uid, addDays(day, -60), day);
        if (days.some((d) => d >= window.first_day && d <= window.last_day)) withSession += 1;
        if (days.includes(day)) activeToday = true;
        const paused = m.paused_since_day !== null;
        const u = userById(db, uid);
        if (paused && days.includes(day)) {
          // Back with the next session, active from the day after (spec §4.4).
          const inactive = Math.max(0, Math.round((Date.parse(day) - Date.parse(m.paused_since_day!)) / 86_400_000));
          db.run('UPDATE squad_membership SET paused_since_day = NULL, active_from_day = ? WHERE id = ?', [addDays(day, 1), m.id]);
          if (u) deps.services.events.event(db, 'member_resumed', { squad_id: squad.id, dagen_inactief: inactive }, { pseudonym: u.pseudonym, squadId: squad.id });
          out.resumed += 1;
        } else if (!paused && pauseDue(days, day, addDays(m.active_from_day, -1), P.squads, vac)) {
          db.run('UPDATE squad_membership SET paused_since_day = ? WHERE id = ?', [addDays(day, 1), m.id]);
          if (u) deps.services.events.event(db, 'member_paused', { squad_id: squad.id, dagen_inactief: P.squads.auto_pause_after_days }, { pseudonym: u.pseudonym, squadId: squad.id });
          out.paused += 1;
        }
      }
      if (activeToday) db.run('UPDATE squad SET last_active_day = ? WHERE id = ?', [day, squad.id]);
      // Low activity: < 2 members with a completed session in the last 7 days (spec §3.5 step 7).
      if (members.length > 0 && isLowActivity(withSession, P.squads) && squad.created_day <= window.first_day) {
        if (squad.low_activity_since_day === null) db.run('UPDATE squad SET low_activity_since_day = ? WHERE id = ?', [day, squad.id]);
        const open = regroupOpen(addDays(day, 1), calendarById(db, squad.calendar_id).examPeriods);
        if (open && squad.regroup_offered_at === null) {
          db.run('UPDATE squad SET regroup_offered_at = ? WHERE id = ?', [nowIso(deps), squad.id]);
          deps.services.events.event(db, 'squad_regroup_offered', { squad_id: squad.id }, squadEventCtx(db, squad.id));
          out.regroupOffered += 1;
        }
      } else if (!isLowActivity(withSession, P.squads)) {
        db.run('UPDATE squad SET low_activity_since_day = NULL, regroup_offered_at = NULL WHERE id = ?', [squad.id]);
      }
      const last = activeToday ? day : (squad.last_active_day ?? squad.created_day);
      if (members.length === 0 || archiveDue(last, day, P.squads)) {
        db.run("UPDATE squad SET status = 'archived' WHERE id = ?", [squad.id]);
        out.archived += 1;
      }
    });
  }
  return out;
}

/** Joker of a member on `day` (spec §4.4): the first missed goal of the week uses the week's joker. */
function jokerOn(db: Db, userId: string, day: FocusDay, missed: boolean): boolean {
  const week = weekKey(day, P.time.week_start_iso_weekday);
  const row = db.get<{ used_day: string }>('SELECT used_day FROM squad_joker WHERE user_id = ? AND week_start = ?', [userId, week]);
  if (row) return row.used_day === day;
  if (!missed || P.squads.jokers_per_week < 1) return false;
  db.run('INSERT INTO squad_joker (user_id, week_start, used_day) VALUES (?, ?, ?)', [userId, week, day]);
  return true;
}

function counts(m: MembershipRow, day: FocusDay): boolean {
  return memberCountsOn({ activeFromDay: m.active_from_day, leftDay: m.left_day, pausedSinceDay: m.paused_since_day }, day);
}

/** Step 5 for focus day `day`: one squad_day per squad; a rerun finds the row and changes nothing. */
export function closeSquadDays(db: Db, deps: ModuleDeps, day: FocusDay): { evaluated: number; recovered: number } {
  const out = { evaluated: 0, recovered: 0 };
  const vacation = isVacation(db, day);
  const reader = userDays(deps);
  for (const squad of liveSquads(db)) {
    if (db.get('SELECT 1 AS x FROM squad_day WHERE squad_id = ? AND focus_day = ?', [squad.id, day])) continue;
    db.transaction(() => {
      const members = membershipsOnDay(db, squad.id, day).filter((m) => counts(m, day));
      const facts: MemberDayFacts[] = members.map((m) => {
        const d = reader.get(m.user_id!, day);
        // goal_met counts flagged sessions provisionally (spec §6.4); an exam day uses no joker (§3.13).
        const goalMet = d?.goalMet === true;
        const examDay = d?.examDay === true;
        const jokerUsed = !vacation && !goalMet && !examDay && jokerOn(db, m.user_id!, day, true);
        return { goalMet, examDay, jokerUsed };
      });
      const state: StreakState = { streak: squad.streak, beforeBreak: squad.streak_before_break, recoveryProgress: squad.recovery_progress };
      const r = evaluateSquadDay({ vacation, members: facts, state }, P.squads);
      db.run(
        `INSERT INTO squad_day (squad_id, focus_day, active_members, met, jokers, exam_days, result, recovered, streak_after, computed_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [squad.id, day, r.activeMembers, r.met, r.jokers, r.examDays, r.result, r.recovered ? 1 : 0, r.state.streak, nowIso(deps)],
      );
      db.run('UPDATE squad SET streak = ?, streak_before_break = ?, recovery_progress = ? WHERE id = ?', [r.state.streak, r.state.beforeBreak, r.state.recoveryProgress, squad.id]);
      if (r.result !== 'vacation') {
        deps.services.events.event(
          db,
          'squad_day_evaluated',
          { squad_id: squad.id, datum: day, geslaagd: r.result === 'success', actieve_leden: r.activeMembers, jokers: r.jokers, streak: r.state.streak },
          squadEventCtx(db, squad.id),
        );
      }
      if (r.recovered) {
        deps.services.events.event(db, 'streak_recovered', { squad_id: squad.id, lengte: r.state.streak }, squadEventCtx(db, squad.id));
        out.recovered += 1;
      }
      out.evaluated += 1;
    });
  }
  return out;
}
