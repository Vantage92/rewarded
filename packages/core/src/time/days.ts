// Plain calendar dates `YYYY-MM-DD` and arithmetic on them. A FocusDay is such a date, assigned
// by the 04:00 day boundary (focus.ts). Day arithmetic runs in UTC so DST never shifts a date.

/** Calendar date `YYYY-MM-DD`. A focus day, a week key (its Monday) or a plain local date. */
export type FocusDay = string;
/** Monday of the focus week, `YYYY-MM-DD` (architecture §5.2: week_key). */
export type WeekKey = string;
/** Calendar month in Europe/Amsterdam, `YYYY-MM` (architecture §5.2: month_key). */
export type MonthKey = string;

const DAY_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const MS_PER_DAY = 86_400_000;

function pad(n: number, width = 2): string {
  return String(n).padStart(width, '0');
}

export function formatDay(year: number, month: number, day: number): FocusDay {
  return `${pad(year, 4)}-${pad(month)}-${pad(day)}`;
}

/** True for a real calendar date in `YYYY-MM-DD` form (rejects 2026-02-30). */
export function isDay(value: string): boolean {
  const m = DAY_RE.exec(value);
  if (!m) return false;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const t = new Date(Date.UTC(y, mo - 1, d));
  return t.getUTCFullYear() === y && t.getUTCMonth() === mo - 1 && t.getUTCDate() === d;
}

export function parseDay(day: FocusDay): { year: number; month: number; day: number } {
  if (!isDay(day)) throw new Error(`invalid day ${day}`);
  const m = DAY_RE.exec(day) as RegExpExecArray;
  return { year: Number(m[1]), month: Number(m[2]), day: Number(m[3]) };
}

function dayToUtcMs(day: FocusDay): number {
  const p = parseDay(day);
  return Date.UTC(p.year, p.month - 1, p.day);
}

function utcMsToDay(ms: number): FocusDay {
  const d = new Date(ms);
  return formatDay(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate());
}

export function addDays(day: FocusDay, n: number): FocusDay {
  return utcMsToDay(dayToUtcMs(day) + n * MS_PER_DAY);
}

/** Whole days from `from` to `to` (positive if `to` is later). */
export function daysBetween(from: FocusDay, to: FocusDay): number {
  return Math.round((dayToUtcMs(to) - dayToUtcMs(from)) / MS_PER_DAY);
}

export function compareDays(a: FocusDay, b: FocusDay): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

/** Inclusive range check on `YYYY-MM-DD` strings (lexicographic order is calendar order). */
export function isDayInRange(day: FocusDay, range: { readonly first_day: string; readonly last_day: string }): boolean {
  return day >= range.first_day && day <= range.last_day;
}

/** All days from `from` to `to`, inclusive. Empty if `to` is before `from`. */
export function dayRange(from: FocusDay, to: FocusDay): FocusDay[] {
  const out: FocusDay[] = [];
  for (let d = from; d <= to; d = addDays(d, 1)) out.push(d);
  return out;
}

/** ISO weekday of a date: 1 = Monday … 7 = Sunday. */
export function isoWeekday(day: FocusDay): number {
  const w = new Date(dayToUtcMs(day)).getUTCDay();
  return w === 0 ? 7 : w;
}

/** Monday of the focus week that contains `day` (spec §4.2: the week starts Monday 04:00). */
export function weekKey(day: FocusDay, weekStartIsoWeekday = 1): WeekKey {
  const offset = (isoWeekday(day) - weekStartIsoWeekday + 7) % 7;
  return addDays(day, -offset);
}

/** Focus days left in the week of `day`, counting `day` itself (Monday → 7, Sunday → 1). */
export function daysLeftInWeekInclusive(day: FocusDay, weekStartIsoWeekday = 1): number {
  return 7 - daysBetween(weekKey(day, weekStartIsoWeekday), day);
}

export function monthKeyOfDay(day: FocusDay): MonthKey {
  parseDay(day);
  return day.slice(0, 7);
}

/** Adds working days (Monday–Friday). Public holidays are not modelled (spec §6.4 "werkdagen"). */
export function addWorkdays(day: FocusDay, n: number): FocusDay {
  if (n < 0) throw new Error('addWorkdays expects n ≥ 0');
  let d = day;
  let left = n;
  while (left > 0) {
    d = addDays(d, 1);
    if (isoWeekday(d) <= 5) left -= 1;
  }
  return d;
}
