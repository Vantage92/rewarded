// core/goals: daily goal, overreach brake, suggestion, exam days and the goal bonus season and budget
// (spec §4.2, §4.4, §3.13, §5; architecture §5.1).
import type { Params } from '../params/index.ts';
import { addDays, compareDays, dayRange, isGoalBonusDay, weekKey } from '../time/index.ts';
import type { FocusDay, WeekKey } from '../time/index.ts';
import type { BonusArm, EarnArm } from '../ledger/types.ts';

export type GoalMinutes = 25 | 50 | 90 | 120;

export function isGoalOption(params: Pick<Params, 'goals'>, minutes: number): minutes is GoalMinutes {
  return params.goals.options_min.includes(minutes);
}

/** A goal change applies from the next focus day (spec §4.4 Dagdoel). */
export function goalEffectiveFrom(today: FocusDay): FocusDay {
  return addDays(today, 1);
}

/** Goal of a day: the latest change effective on or before it, else the default (spec §5). */
export function goalForDay(changes: readonly { goalMin: number; effectiveFrom: FocusDay }[], day: FocusDay, fallback: number): number {
  let best: { goalMin: number; effectiveFrom: FocusDay } | null = null;
  for (const c of changes) {
    if (compareDays(c.effectiveFrom, day) <= 0 && (best === null || compareDays(c.effectiveFrom, best.effectiveFrom) >= 0)) best = c;
  }
  return best ? best.goalMin : fallback;
}

/** Overreach brake: in the first 7 days, 90 or 120 needs a confirmation (spec §4.4). */
export function needsOverreachConfirm(params: Pick<Params, 'goals'>, minutes: number, daysSinceRegistration: number): boolean {
  return daysSinceRegistration < params.goals.confirm_window_days && params.goals.confirm_min.includes(minutes);
}

/**
 * Goal suggestion after 7 days: the highest option not above the median of verified minutes on
 * active days, at least 25 (spec §4.4 Overmoedrem). Null when there are no active days.
 */
export function goalSuggestion(params: Pick<Params, 'goals'>, activeDayMinutes: readonly number[]): GoalMinutes | null {
  const active = activeDayMinutes.filter((m) => m > 0).sort((a, b) => a - b);
  if (active.length === 0) return null;
  const mid = Math.floor(active.length / 2);
  const median = active.length % 2 ? (active[mid] as number) : ((active[mid - 1] as number) + (active[mid] as number)) / 2;
  const options = [...params.goals.options_min].sort((a, b) => a - b);
  let pick = params.goals.suggestion_floor_min;
  for (const o of options) if (o <= median) pick = Math.max(pick, o);
  return pick as GoalMinutes;
}

/** Exam days: at most 3 per calendar week (Monday–Sunday), set for today or later (spec §3.13). */
export function examDayAllowed(params: Pick<Params, 'goals' | 'time'>, today: FocusDay, day: FocusDay, existingInWeek: readonly FocusDay[]): 'ok' | 'EXAM_DAY_LIMIT' | 'PERIOD_LOCKED' {
  if (compareDays(day, today) < 0) return 'PERIOD_LOCKED';
  if (existingInWeek.includes(day)) return 'ok';
  const week = weekKey(day, params.time.week_start_iso_weekday);
  const count = existingInWeek.filter((d) => weekKey(d, params.time.week_start_iso_weekday) === week).length;
  return count >= params.goals.exam_days_per_week ? 'EXAM_DAY_LIMIT' : 'ok';
}

/** Whether a focus day is in the goal bonus season and not in the vacation pause (spec §4.2). */
export function inGoalSeason(params: Pick<Params, 'goal_bonus' | 'vacation_pause'>, day: FocusDay): boolean {
  return isGoalBonusDay(day, params);
}

/**
 * Arm B weekly budget: 20 per remaining bonus day of the week from `fromDay` (140 on a full
 * week; at a mid-week entry 20 × remaining days, spec §5). Vacation and off-season days give nothing.
 */
export function armBWeeklyGrant(params: Pick<Params, 'goal_bonus' | 'vacation_pause' | 'time'>, week: WeekKey, fromDay: FocusDay): number {
  const end = addDays(week, 6);
  const start = compareDays(fromDay, week) > 0 ? fromDay : week;
  if (compareDays(start, end) > 0) return 0;
  const days = dayRange(start, end).filter((d) => isGoalBonusDay(d, params)).length;
  return Math.min(params.goal_bonus.arm_b_weekly_budget, days * params.goal_bonus.arm_b_points_per_remaining_day);
}

/** Maximum bonus per week for an arm: equal for A and B (spec §5, verliesarm). */
export function weeklyMaxBonus(params: Pick<Params, 'goal_bonus'>, arm: BonusArm): number {
  return arm === 'A' ? params.goal_bonus.arm_a_weekly_max : params.goal_bonus.arm_b_weekly_budget;
}

export interface EarnArmInput {
  ageBand: '16_17' | '18_plus';
  optedOut: boolean;
  restArm: 'rest' | 'continue';
  restPeriodEnabled: boolean;
  /** First focus day with points again after a rest exit (the day after the exit). */
  restExitFromDay: FocusDay | null;
}

/** earnArm for a day (architecture §5.1 rule 5): rest only in the rest arm during the rest period. */
export function earnArmFor(params: Pick<Params, 'rest_period'>, day: FocusDay, input: EarnArmInput): EarnArm {
  if (!input.restPeriodEnabled || input.restArm !== 'rest') return 'earn';
  if (input.ageBand === '16_17' || input.optedOut) return 'earn';
  if (input.restExitFromDay !== null && compareDays(day, input.restExitFromDay) >= 0) return 'earn';
  return compareDays(day, params.rest_period.first_day) >= 0 && compareDays(day, params.rest_period.last_day) <= 0 ? 'rest' : 'earn';
}

/** Personal bonus arm: minors and opted-out users always get arm A (spec §5 Toewijzing). */
export function personalBonusArm(assigned: BonusArm, ageBand: '16_17' | '18_plus', optedOut: boolean): BonusArm {
  return ageBand === '16_17' || optedOut ? 'A' : assigned;
}
