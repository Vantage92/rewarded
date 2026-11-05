// Focus day (04:00–04:00 Europe/Amsterdam, spec §4.2), day close moment (architecture §6.1),
// focus week, month key and the calendar windows from params (season, vacation, rest period).
import type { Params } from '../params/index.ts';
import { dayCloseOffsetMin } from '../params/index.ts';
import { addDays, formatDay, isDayInRange, parseDay, weekKey } from './days.ts';
import type { FocusDay, MonthKey, WeekKey } from './days.ts';
import { MS_PER_MINUTE, fromLocal, parseLocalDateTime, parseLocalTime, toLocalParts } from './zone.ts';
import type { Instant } from './zone.ts';

/** Minimal params slice the time helpers need, so callers can pass a full Params or a test double. */
type TimeSlice = Pick<Params, 'time'>;

/** Focus day of an instant: the local date, minus one day before the 04:00 boundary. */
export function focusDayOf(instant: Instant, params: TimeSlice): FocusDay {
  const p = toLocalParts(instant);
  const local = formatDay(p.year, p.month, p.day);
  const minutes = p.hour * 60 + p.minute;
  return minutes < parseLocalTime(params.time.day_boundary) ? addDays(local, -1) : local;
}

/** Instant at which a focus day starts (its date at 04:00 local). */
export function focusDayStart(day: FocusDay, params: TimeSlice): Instant {
  const { year, month, day: d } = parseDay(day);
  const b = parseLocalTime(params.time.day_boundary);
  return fromLocal(year, month, d, Math.floor(b / 60), b % 60);
}

/** Instant at which a focus day ends (exclusive): the next day's start. 23 or 25 hours on DST days. */
export function focusDayEnd(day: FocusDay, params: TimeSlice): Instant {
  return focusDayStart(addDays(day, 1), params);
}

/**
 * Moment the day close for focus day D may run (architecture §6.1): end of D plus the longest
 * session, the end grace and the sweep margin. With v1 that is 05:45 local on D + 1.
 */
export function closeAt(day: FocusDay, params: Pick<Params, 'time' | 'session'>): Instant {
  return focusDayEnd(day, params) + dayCloseOffsetMin(params) * MS_PER_MINUTE;
}

/** True if local wall time of `instant` lies in [from, to) of a local window (may wrap midnight). */
export function isInLocalWindow(instant: Instant, window: { readonly from: string; readonly to: string }): boolean {
  const p = toLocalParts(instant);
  const m = p.hour * 60 + p.minute;
  const from = parseLocalTime(window.from);
  const to = parseLocalTime(window.to);
  return from <= to ? m >= from && m < to : m >= from || m < to;
}

/** Night rule (spec §4.2): a session that starts between 01:00 and 04:00 is a late start. */
export function isLateStart(serverStartAt: Instant, params: TimeSlice): boolean {
  return isInLocalWindow(serverStartAt, params.time.night_window);
}

/** Week key (Monday of the focus week) of an instant. */
export function weekKeyOf(instant: Instant, params: TimeSlice): WeekKey {
  return weekKey(focusDayOf(instant, params), params.time.week_start_iso_weekday);
}

/** Instant at which a focus week starts: Monday 04:00 local. */
export function weekStartAt(week: WeekKey, params: TimeSlice): Instant {
  return focusDayStart(week, params);
}

/** Calendar month in Europe/Amsterdam of an instant (architecture §5.2: month_key; not the focus day). */
export function monthKeyOf(instant: Instant): MonthKey {
  const p = toLocalParts(instant);
  return `${String(p.year).padStart(4, '0')}-${String(p.month).padStart(2, '0')}`;
}

/** Vacation pause (spec §5): streaks, pause counters, Belofte days and goal bonus freeze. */
export function isVacationDay(day: FocusDay, params: Pick<Params, 'vacation_pause'>): boolean {
  return isDayInRange(day, params.vacation_pause);
}

/**
 * Goal bonus season (spec §4.2, architecture §5.1): focus days 2 December 2026 to 17 January 2027,
 * minus the vacation pause. Checked on the focus day, never on the booking moment.
 */
export function isGoalBonusDay(day: FocusDay, params: Pick<Params, 'goal_bonus' | 'vacation_pause'>): boolean {
  return isDayInRange(day, params.goal_bonus.season) && !isVacationDay(day, params);
}

/** Instant at which the goal bonus stops (spec §4.2: Monday 18 January 2027 04:00). */
export function goalBonusSeasonEndsAt(params: Pick<Params, 'goal_bonus'>): Instant {
  return parseLocalDateTime(params.goal_bonus.season_ends_at);
}

/** Rest period arm (spec §3.16): no earn_session on these focus days for squads in the rest arm. */
export function isRestPeriodDay(day: FocusDay, params: Pick<Params, 'rest_period'>): boolean {
  return isDayInRange(day, params.rest_period);
}

/** Length of a focus day in hours (24, or 23/25 on DST transition days). */
export function focusDayHours(day: FocusDay, params: TimeSlice): number {
  return (focusDayEnd(day, params) - focusDayStart(day, params)) / 3_600_000;
}
