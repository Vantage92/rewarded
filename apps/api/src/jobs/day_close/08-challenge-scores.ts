// Day close step 8 (architecture §6.1, §6.2). Owner WP-5.
// Snapshot of the challenge scores per club and week (challenge_score, is_final = 0) and of the
// weekly board numbers (club_week_stat); performance challenge statuses after the period; then the
// referral vesting (spec §4.9), which needs the same closed user days.
import { compareDays, weekKey } from '@rewarded/core';
import { performanceProgress } from '@rewarded/core/challenges';
import { computeChallengeWeek, type ChallengeRow } from '../../modules/challenges/scores.ts';
import { snapshotClubWeek } from '../../modules/clubs/stats.ts';
import { evaluateReferrals } from '../../modules/referral/logic.ts';
import { P, hasSessionTables, hasSocialTables, userDays } from '../../modules/squads/lib/social.ts';
import type { DayCloseStep } from '../scheduler.ts';

export const step: DayCloseStep = {
  no: 8,
  name: 'challenge-scores',
  owner: 'WP-5',
  run({ day, deps }) {
    const { db } = deps;
    if (!hasSocialTables(db) || !hasSessionTables(db)) return;
    const week = weekKey(day, P.time.week_start_iso_weekday);
    db.transaction(() => {
      for (const c of db.all<{ id: string }>("SELECT id FROM club WHERE status = 'active'")) snapshotClubWeek(db, deps, c.id, week, day);
      const challenges = db.all<ChallengeRow>("SELECT * FROM challenge WHERE status IN ('published', 'running', 'review') AND period_start_day <= ? AND period_end_day >= ?", [day, week]);
      for (const ch of challenges) {
        if (ch.status === 'published' && compareDays(day, ch.period_start_day) >= 0) db.run("UPDATE challenge SET status = 'running' WHERE id = ?", [ch.id]);
        if (ch.type === 'performance') continue;
        if (ch.status === 'review') continue;
        computeChallengeWeek(db, deps, ch, day);
      }
      // Performance challenges: achieved or failed once the period is closed (spec §3.8 step 3).
      const ended = db.all<ChallengeRow>("SELECT * FROM challenge WHERE type = 'performance' AND status IN ('published', 'running') AND period_end_day <= ?", [day]);
      for (const ch of ended) {
        const rules = JSON.parse(ch.rules) as { day_minutes?: number; required_days?: number };
        for (const e of db.all<{ id: string; user_id: string | null }>("SELECT id, user_id FROM challenge_enrollment WHERE challenge_id = ? AND status = 'enrolled'", [ch.id])) {
          if (!e.user_id) continue;
          const rows = userDays(deps).range([e.user_id], ch.period_start_day, ch.period_end_day).map((r) => ({ day: r.focusDay, countedMinFinal: r.countedMinFinal }));
          const p = performanceProgress({ first_day: ch.period_start_day, last_day: ch.period_end_day }, rows, { dayMinutes: rules.day_minutes ?? 120, ...(rules.required_days ? { requiredDays: rules.required_days } : {}) }, day);
          db.run('UPDATE challenge_enrollment SET status = ? WHERE id = ?', [p.status === 'achieved' ? 'achieved' : 'failed', e.id]);
        }
        db.run("UPDATE challenge SET status = 'review' WHERE id = ?", [ch.id]);
      }
      evaluateReferrals(db, deps);
    });
  },
};
