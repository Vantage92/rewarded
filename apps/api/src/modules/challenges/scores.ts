// Challenge scores (architecture §6.2; spec §4.6). Day close step 8 writes the snapshot per club and
// week into challenge_score (is_final = 0); the leaderboard and the board read only that table.
import { addDays, compareDays, dayRange, focusDayEnd, weekKey, type FocusDay } from '@rewarded/core';
import { participationWeek, prizePeriodScore, prizeWeeksFor, rankPools, type PoolKey } from '@rewarded/core/challenges';
import type { Db } from '../../db/types.ts';
import type { ModuleDeps } from '../../module.ts';
import type { ClubRow } from '../clubs/link.ts';
import { clubLinks, memberDays } from '../clubs/stats.ts';
import { P, calendarById, isVacation, nowIso } from '../squads/lib/social.ts';

export interface ChallengeRow {
  id: string;
  type: 'club_warmup' | 'club_prize' | 'performance';
  title_nl: string;
  title_en: string;
  period_start_day: string;
  period_end_day: string;
  pool: PoolKey | null;
  rules: string;
  prizes: string;
  status: 'draft' | 'published' | 'running' | 'review' | 'final';
  created_by: string;
  published_by: string | null;
  proposed_by: string | null;
  proposal: string | null;
  final_by: string | null;
  final_confirmed_by: string | null;
  created_at: string;
}

export interface ScoreRow {
  challenge_id: string;
  club_id: string;
  week_start: string;
  pool: PoolKey;
  participation_rate: number;
  intensity_min: number;
  numerator: number;
  denominator: number;
  linked_members: number;
  active_members: number;
  anchored_members: number;
  rank: number | null;
  is_final: number;
  computed_at: string;
}

/** Whether `weekStart` is a prize week of the club's calendar (the two weeks ending on T). */
export function isPrizeWeek(db: Db, club: ClubRow, weekStart: FocusDay): boolean {
  const cal = calendarById(db, club.exam_calendar_id);
  return prizeWeeksFor(cal.tDay).includes(weekStart);
}

/** Computes and stores the scores of the week of `day` for every active club (idempotent). */
export function computeChallengeWeek(db: Db, deps: ModuleDeps, ch: ChallengeRow, day: FocusDay): void {
  const weekStart = weekKey(day, P.time.week_start_iso_weekday);
  const clubs = db.all<ClubRow>("SELECT * FROM club WHERE status = 'active' ORDER BY id");
  const until = compareDays(day, addDays(weekStart, 6)) < 0 ? day : addDays(weekStart, 6);
  const vacationDays = dayRange(weekStart, addDays(weekStart, 6)).filter((d) => isVacation(db, d));
  for (const club of clubs) {
    if (ch.pool && club.pool !== ch.pool) continue;
    const links = clubLinks(db, club.id);
    const users = [...new Set(links.map((l) => l.userId).filter((u): u is string => u !== null))];
    const days = memberDays(deps, users, weekStart, until);
    const prizeWeek = ch.type === 'club_prize' && isPrizeWeek(db, club, weekStart);
    const score = participationWeek(
      { weekStart, links, days, declaredMembers: club.declared_members, prizeWeek, weekEndAt: focusDayEnd(addDays(weekStart, 6), P), vacationDays },
      P.challenges,
    );
    const anchored = links.filter((l) => l.anchorAt !== null && l.anchorAt < focusDayEnd(addDays(weekStart, 6), P)).length;
    db.run(
      `INSERT INTO challenge_score (challenge_id, club_id, week_start, pool, participation_rate, intensity_min, numerator, denominator, linked_members, active_members, anchored_members, rank, is_final, computed_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, 0, ?)
       ON CONFLICT (challenge_id, club_id, week_start) DO UPDATE SET pool = excluded.pool, participation_rate = excluded.participation_rate,
         intensity_min = excluded.intensity_min, numerator = excluded.numerator, denominator = excluded.denominator, linked_members = excluded.linked_members,
         active_members = excluded.active_members, anchored_members = excluded.anchored_members, computed_at = excluded.computed_at
       WHERE challenge_score.is_final = 0`,
      [ch.id, club.id, weekStart, club.pool, Math.min(1, score.participationRate), score.intensityMin, score.numerator, score.denominator, score.linkedMembers, score.activeMembers, anchored, nowIso(deps)],
    );
  }
  const rows = db.all<ScoreRow>('SELECT * FROM challenge_score WHERE challenge_id = ? AND week_start = ?', [ch.id, weekStart]);
  const ranked = rankPools(
    rows.map((r) => ({ clubId: r.club_id, pool: r.pool, linkedMembers: r.linked_members, participationRate: r.participation_rate, intensityMin: r.intensity_min })),
    P.challenges,
  );
  const rankOf = new Map<string, number>();
  for (const g of ranked) for (const r of g.rows) rankOf.set(r.clubId, r.rank);
  for (const r of rows) db.run('UPDATE challenge_score SET rank = ? WHERE challenge_id = ? AND club_id = ? AND week_start = ? AND is_final = 0', [rankOf.get(r.club_id) ?? null, ch.id, r.club_id, weekStart]);
}

export interface BoardRow {
  clubId: string;
  pool: PoolKey;
  linkedMembers: number;
  participationRate: number;
  intensityMin: number;
}

/**
 * Leaderboard rows of a challenge: the latest week for a warm-up, the mean of the prize weeks
 * computed so far for a prize challenge (spec §4.6 Prijsperiode).
 */
export function leaderboardRows(db: Db, ch: ChallengeRow): { rows: BoardRow[]; computedAt: string | null; isFinal: boolean } {
  const all = db.all<ScoreRow>('SELECT * FROM challenge_score WHERE challenge_id = ? ORDER BY week_start', [ch.id]);
  if (all.length === 0) return { rows: [], computedAt: null, isFinal: false };
  const byClub = new Map<string, ScoreRow[]>();
  for (const r of all) byClub.set(r.club_id, [...(byClub.get(r.club_id) ?? []), r]);
  const latestWeek = all[all.length - 1]!.week_start;
  const rows: BoardRow[] = [];
  for (const [clubId, list] of byClub) {
    const last = list[list.length - 1]!;
    if (ch.type === 'club_prize') {
      const club = db.get<ClubRow>('SELECT * FROM club WHERE id = ?', [clubId]);
      const prize = club ? list.filter((r) => isPrizeWeek(db, club, r.week_start)) : [];
      const used = prize.length > 0 ? prize : [last];
      rows.push({
        clubId,
        pool: last.pool,
        linkedMembers: last.linked_members,
        participationRate: prizePeriodScore(used.map((r) => r.participation_rate)),
        intensityMin: used.reduce((a, r) => a + r.intensity_min, 0) / used.length,
      });
    } else if (last.week_start === latestWeek) {
      rows.push({ clubId, pool: last.pool, linkedMembers: last.linked_members, participationRate: last.participation_rate, intensityMin: last.intensity_min });
    }
  }
  return { rows, computedAt: all.reduce((a, r) => (r.computed_at > a ? r.computed_at : a), all[0]!.computed_at), isFinal: all.every((r) => r.is_final === 1) };
}
