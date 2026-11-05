// core/squads (spec §4.4, architecture §6.3). Owner WP-5.
// Squad streak with joker, exam day, freeze and recovery; automatic pause; low activity and the
// regroup route; invite moments. Pure functions over user_day facts; the day close (steps 4 and 5)
// feeds them and stores the result.
import { addDays, compareDays, daysBetween, isDayInRange, weekKey, type FocusDay } from '../time/index.ts';

/** The squad slice of the parameter set (params.squads). */
export interface SquadParams {
  readonly min_size: number;
  readonly max_size: number;
  readonly streak_min_met: number;
  readonly streak_share: number;
  readonly freeze_below_active: number;
  readonly jokers_per_week: number;
  readonly recovery_days: number;
  readonly recoveries_per_break: number;
  readonly auto_pause_after_days: number;
  readonly regroup_after_days: number;
  readonly regroup_below_active: number;
  readonly archive_after_days: number;
  readonly invite_max_uses: number;
  readonly invite_valid_days: number;
}

export type SquadDayResult = 'success' | 'fail' | 'frozen' | 'vacation';

/** Streak state kept on the squad row (architecture §3.4). */
export interface StreakState {
  streak: number;
  /** Length before the last break while a recovery is still possible; otherwise null. */
  beforeBreak: number | null;
  /** Successful squad days since the break (0 … recovery_days − 1). */
  recoveryProgress: number;
}

export const EMPTY_STREAK: Readonly<StreakState> = Object.freeze({ streak: 0, beforeBreak: null, recoveryProgress: 0 });

/** One active member on one squad day. */
export interface MemberDayFacts {
  goalMet: boolean;
  examDay: boolean;
  jokerUsed: boolean;
}

export interface SquadDayInput {
  vacation: boolean;
  /** Only the active members of that day (not paused, active_from_day ≤ day, not left before). */
  members: readonly MemberDayFacts[];
  state: StreakState;
}

export interface SquadDayOutcome {
  result: SquadDayResult;
  activeMembers: number;
  met: number;
  jokers: number;
  examDays: number;
  needed: number;
  /** True when this day completed a recovery to the old length. */
  recovered: boolean;
  state: StreakState;
}

/** Members needed for a successful squad day: half of the active members rounded up, at least 2. */
export function neededForSuccess(activeMembers: number, p: Pick<SquadParams, 'streak_min_met' | 'streak_share'>): number {
  return Math.max(p.streak_min_met, Math.ceil(activeMembers * p.streak_share - 1e-9));
}

/**
 * Evaluates one squad day (spec §4.4 Squadstreak, Rustdag-joker, Streakherstel, Onder 3 actieve
 * leden, Vakantiepauze). A member counts towards success with a met goal, a joker or an exam day
 * (an exam day suspends the goal without a joker, spec §3.13).
 */
export function evaluateSquadDay(input: SquadDayInput, p: SquadParams): SquadDayOutcome {
  const active = input.members.length;
  let met = 0;
  let jokers = 0;
  let examDays = 0;
  for (const m of input.members) {
    if (m.goalMet) met += 1;
    else if (m.examDay) examDays += 1;
    else if (m.jokerUsed) jokers += 1;
  }
  const needed = neededForSuccess(active, p);
  const base = { activeMembers: active, met, jokers, examDays, needed };
  const state = { ...input.state };
  if (input.vacation) return { ...base, result: 'vacation', recovered: false, state };
  if (active < p.freeze_below_active) return { ...base, result: 'frozen', recovered: false, state };

  if (met + jokers + examDays >= needed) {
    state.streak += 1;
    let recovered = false;
    if (state.beforeBreak !== null) {
      state.recoveryProgress += 1;
      if (state.recoveryProgress >= p.recovery_days) {
        // Back to the old length (spec §4.4: "herstelt tot de oude lengte"); never shorter.
        state.streak = Math.max(state.streak, state.beforeBreak);
        state.beforeBreak = null;
        state.recoveryProgress = 0;
        recovered = true;
      }
    }
    return { ...base, result: 'success', recovered, state };
  }
  // A break. One recovery per break: a new break replaces the chance of the previous one.
  const before = state.streak;
  state.streak = 0;
  state.recoveryProgress = 0;
  state.beforeBreak = before > 0 && p.recoveries_per_break > 0 ? before : null;
  return { ...base, result: 'fail', recovered: false, state };
}

/** One day of a member for the joker: whether the member was an active squad member that day. */
export interface JokerDay {
  day: FocusDay;
  active: boolean;
  goalMet: boolean;
  examDay: boolean;
  vacation: boolean;
}

/**
 * Rustdag-joker (spec §4.4): one per member per week, used automatically on the first missed goal
 * of the week on which the member was active; not saved up. An exam day or a vacation day uses
 * none. Returns the day the joker was used, or null.
 */
export function jokerDayOfWeek(days: readonly JokerDay[], p: Pick<SquadParams, 'jokers_per_week'>, weekStartIsoWeekday = 1): FocusDay | null {
  if (p.jokers_per_week < 1 || days.length === 0) return null;
  const sorted = [...days].sort((a, b) => compareDays(a.day, b.day));
  const week = weekKey(sorted[0]!.day, weekStartIsoWeekday);
  for (const d of sorted) {
    if (weekKey(d.day, weekStartIsoWeekday) !== week) break;
    if (!d.active || d.vacation || d.examDay || d.goalMet) continue;
    return d.day;
  }
  return null;
}

/**
 * First day of a window of `n` counted days ending on `day`; vacation days do not count (spec §4.4
 * Vakantiepauze: pause counters freeze). Stops after a year to stay finite.
 */
export function countingWindowStart(day: FocusDay, n: number, isVacation: (d: FocusDay) => boolean = () => false): FocusDay {
  let d = day;
  let counted = isVacation(d) ? 0 : 1;
  let guard = 0;
  while (counted < n && guard < 366) {
    d = addDays(d, -1);
    if (!isVacation(d)) counted += 1;
    guard += 1;
  }
  return d;
}

/**
 * Automatic pause (spec §4.4): after `auto_pause_after_days` days without a completed session.
 * `sessionDays` are the focus days with a completed session; `memberSince` the first day the
 * member could have focused in the squad. Evaluated at the close of `day`; the pause applies from
 * the next day. Vacation days do not count.
 */
export function pauseDue(
  sessionDays: readonly FocusDay[],
  day: FocusDay,
  memberSince: FocusDay,
  p: Pick<SquadParams, 'auto_pause_after_days'>,
  isVacation: (d: FocusDay) => boolean = () => false,
): boolean {
  if (isVacation(day)) return false;
  const from = countingWindowStart(day, p.auto_pause_after_days, isVacation);
  if (compareDays(memberSince, from) > 0) return false;
  return !sessionDays.some((d) => compareDays(d, from) >= 0 && compareDays(d, day) <= 0);
}

/** A paused member comes back with a session on `day` and counts from the next day (spec §4.4). */
export function resumeFromDay(sessionDay: FocusDay): FocusDay {
  return addDays(sessionDay, 1);
}

/**
 * Low activity (spec §3.5 step 7, §4.4 Squad uit elkaar): fewer than `regroup_below_active`
 * members with a completed session in the last `regroup_after_days` days.
 */
export function isLowActivity(membersWithSessionInWindow: number, p: Pick<SquadParams, 'regroup_below_active'>): boolean {
  return membersWithSessionInWindow < p.regroup_below_active;
}

/** A closed range of focus days (exam period, activity window). */
export interface SquadDayRange {
  readonly first_day: FocusDay;
  readonly last_day: FocusDay;
}

/** The regroup route only runs inside an exam period of the squad's calendar (spec §4.13). */
export function regroupOpen(day: FocusDay, examPeriods: readonly SquadDayRange[]): boolean {
  return examPeriods.some((r) => isDayInRange(day, r));
}

/** Window of the low-activity count that ends on `day`. */
export function activityWindow(day: FocusDay, p: Pick<SquadParams, 'regroup_after_days'>): SquadDayRange {
  return { first_day: addDays(day, -(p.regroup_after_days - 1)), last_day: day };
}

/** Archive after `archive_after_days` days without active members (spec §4.4 Archief). */
export function archiveDue(lastActiveDay: FocusDay, day: FocusDay, p: Pick<SquadParams, 'archive_after_days'>): boolean {
  return daysBetween(lastActiveDay, day) >= p.archive_after_days;
}

/**
 * Invite moments (spec §4.4 Uitnodigingsmomenten): at creation, at a free spot at most once per
 * week, and after 7 days "in opbouw" once more. All later moments come down to: a free spot and no
 * squad invite in the last `invite_valid_days` days.
 */
export function inviteMomentAllowed(input: { openSpots: number; lastInviteAt: number | null; now: number }, p: Pick<SquadParams, 'invite_valid_days'>): boolean {
  if (input.openSpots <= 0) return false;
  if (input.lastInviteAt === null) return true;
  return input.now - input.lastInviteAt >= p.invite_valid_days * 86_400_000;
}

/** Merging needs the same club and the same rest-period arm, both below 2 active (spec §4.4). */
export function mergeAllowed(
  a: { clubId: string | null; armRest: string | null; lowActivity: boolean; cohort: string },
  b: { clubId: string | null; armRest: string | null; lowActivity: boolean; cohort: string },
): 'ok' | 'arm_mismatch' | 'not_eligible' {
  if (!a.lowActivity || !b.lowActivity) return 'not_eligible';
  if (a.clubId === null || a.clubId !== b.clubId) return 'not_eligible';
  if (a.cohort !== b.cohort || a.armRest !== b.armRest) return 'arm_mismatch';
  return 'ok';
}

/** The day a membership starts counting: the day after joining (architecture §6.3). */
export function activeFromDay(joinDay: FocusDay): FocusDay {
  return addDays(joinDay, 1);
}

/** Whether a member counts on `day` (spec §4.4: joins and returns count from the next day, a leaver until the day of leaving). */
export function memberCountsOn(
  m: { activeFromDay: FocusDay; leftDay: FocusDay | null; pausedSinceDay: FocusDay | null },
  day: FocusDay,
): boolean {
  if (compareDays(m.activeFromDay, day) > 0) return false;
  if (m.leftDay !== null && compareDays(day, m.leftDay) > 0) return false;
  if (m.pausedSinceDay !== null && compareDays(m.pausedSinceDay, day) <= 0) return false;
  return true;
}
