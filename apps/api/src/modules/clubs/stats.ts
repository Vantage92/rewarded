// Club facts for the ranking and the board (architecture §6.2, §6.4). Club links, member days and the
// weekly snapshot `club_week_stat` that the board reads: a closed week never changes afterwards.
import { addDays, compareDays, focusDayEnd, type FocusDay } from '@rewarded/core';
import type { ChallengeMemberDay, ClubLink } from '@rewarded/core/challenges';
import type { Db } from '../../db/types.ts';
import type { ModuleDeps } from '../../module.ts';
import { P, nowIso, userDays } from '../squads/lib/social.ts';

interface LinkRow {
  user_id: string | null;
  linked_day: string;
  left_day: string | null;
  qr_source: string | null;
  institution_verified_at: string | null;
  phone_verified_at: string | null;
}

/** Approved links of a club with their anchor instant (identity anchor: institution mail or phone). */
export function clubLinks(db: Db, clubId: string): (ClubLink & { qrSource: string | null })[] {
  const rows = db.all<LinkRow>(
    `SELECT m.user_id, m.linked_day, m.left_day, m.qr_source, u.institution_verified_at, u.phone_verified_at
       FROM club_membership m LEFT JOIN user u ON u.id = m.user_id
      WHERE m.club_id = ? AND m.pending_admin = 0 AND (m.decision IS NULL OR m.decision = 'approve')`,
    [clubId],
  );
  return rows.map((r) => {
    const anchors = [r.institution_verified_at, r.phone_verified_at].filter((x): x is string => x !== null).map((x) => Date.parse(x));
    return {
      userId: r.user_id,
      linkedFromDay: r.linked_day,
      linkedUntilDay: r.left_day,
      anchorAt: anchors.length > 0 ? Math.min(...anchors) : null,
      qrSource: r.qr_source,
    };
  });
}

/** Member days of the linked users in [from, to] from user_day and focus_session (read only). */
export function memberDays(deps: ModuleDeps, userIds: readonly string[], from: FocusDay, to: FocusDay): ChallengeMemberDay[] {
  if (userIds.length === 0) return [];
  const rows = userDays(deps).range(userIds, from, to);
  const marks = userIds.map(() => '?').join(', ');
  let sessions: { user_id: string; focus_day: string }[] = [];
  let known = true;
  try {
    sessions = deps.db.all<{ user_id: string; focus_day: string }>(
      `SELECT DISTINCT user_id, focus_day FROM focus_session WHERE user_id IN (${marks}) AND focus_day >= ? AND focus_day <= ?
         AND status = 'completed' AND is_practice = 0 AND review_status <> 'rejected'`,
      [...userIds, from, to],
    );
  } catch {
    known = false;
  }
  const withSession = new Set(sessions.map((s) => `${s.user_id}|${s.focus_day}`));
  const out: ChallengeMemberDay[] = rows.map((r) => ({
    userId: r.userId,
    day: r.focusDay,
    goalMetFinal: r.goalMetFinal,
    examDay: r.examDay,
    countedMinFinal: r.countedMinFinal,
    completedSession: known ? withSession.has(`${r.userId}|${r.focusDay}`) : r.verifiedMin > 0,
  }));
  return out;
}

function linkedInWeek(l: ClubLink, weekStart: FocusDay, last: FocusDay): boolean {
  return compareDays(l.linkedFromDay, last) <= 0 && (l.linkedUntilDay === null || compareDays(l.linkedUntilDay, weekStart) >= 0);
}

/** Writes the snapshot of the week of `day` for one club, using data up to `day`. */
export function snapshotClubWeek(db: Db, deps: ModuleDeps, clubId: string, weekStart: FocusDay, day: FocusDay): void {
  const links = clubLinks(db, clubId).filter((l) => linkedInWeek(l, weekStart, day));
  const users = links.map((l) => l.userId).filter((u): u is string => u !== null);
  const weekEndAt = focusDayEnd(addDays(weekStart, 6), P);
  const anchored = links.filter((l) => l.anchorAt !== null && l.anchorAt < weekEndAt).length;
  const days = memberDays(deps, users, weekStart, day);
  const active = new Set(days.filter((d) => d.completedSession).map((d) => d.userId)).size;
  let sessions = 0;
  let flagged = 0;
  if (users.length > 0) {
    try {
      const r = db.get<{ n: number; f: number }>(
        `SELECT count(*) AS n, sum(CASE WHEN review_status IN ('pending', 'rejected') THEN 1 ELSE 0 END) AS f FROM focus_session
          WHERE user_id IN (${users.map(() => '?').join(', ')}) AND focus_day >= ? AND focus_day <= ? AND status = 'completed' AND is_practice = 0`,
        [...users, weekStart, day],
      );
      sessions = r?.n ?? 0;
      flagged = r?.f ?? 0;
    } catch {
      sessions = 0;
    }
  }
  const pending = db.get<{ n: number }>('SELECT count(*) AS n FROM club_membership WHERE club_id = ? AND pending_admin = 1 AND left_at IS NULL', [clubId])!.n;
  const byQr: Record<string, number> = {};
  for (const l of links) {
    const k = l.qrSource ?? 'code';
    byQr[k] = (byQr[k] ?? 0) + 1;
  }
  db.run(
    `INSERT INTO club_week_stat (club_id, week_start, linked, pending, anchored, active, sessions, flagged, by_qr_source, computed_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT (club_id, week_start) DO UPDATE SET linked = excluded.linked, pending = excluded.pending, anchored = excluded.anchored, active = excluded.active,
       sessions = excluded.sessions, flagged = excluded.flagged, by_qr_source = excluded.by_qr_source, computed_at = excluded.computed_at`,
    [clubId, weekStart, links.length, pending, anchored, active, sessions, flagged, JSON.stringify(byQr), nowIso(deps)],
  );
}

export interface ClubWeekStat {
  club_id: string;
  week_start: string;
  linked: number;
  pending: number;
  anchored: number;
  active: number;
  sessions: number;
  flagged: number;
  by_qr_source: string;
  computed_at: string;
}

export function clubWeekStats(db: Db, clubId: string): ClubWeekStat[] {
  return db.all<ClubWeekStat>('SELECT * FROM club_week_stat WHERE club_id = ? ORDER BY week_start', [clubId]);
}
