// Europe/Amsterdam wall-clock maths without Intl or a tz database, so client and server agree
// byte for byte. EU rule (since 1996): summer time (UTC+2) from the last Sunday of March 01:00 UTC
// to the last Sunday of October 01:00 UTC; otherwise UTC+1.

/** Milliseconds since the Unix epoch, UTC. Server time is always an Instant (architecture §3). */
export type Instant = number;

export const MS_PER_MINUTE = 60_000;
export const MS_PER_HOUR = 3_600_000;
export const MS_PER_DAY = 86_400_000;

/** Local wall-clock parts in Europe/Amsterdam. `isoWeekday`: 1 = Monday … 7 = Sunday. */
export interface LocalParts {
  year: number;
  month: number; // 1–12
  day: number; // 1–31
  hour: number;
  minute: number;
  second: number;
  millisecond: number;
  isoWeekday: number;
}

function lastSundayUtc(year: number, monthIndex: number): number {
  const lastDay = Date.UTC(year, monthIndex + 1, 0);
  const weekday = new Date(lastDay).getUTCDay(); // 0 = Sunday
  return lastDay - weekday * MS_PER_DAY;
}

/** Start and end (exclusive) of EU summer time in a given year, as instants. */
export function summerTimeWindow(year: number): { start: Instant; end: Instant } {
  return {
    start: lastSundayUtc(year, 2) + MS_PER_HOUR,
    end: lastSundayUtc(year, 9) + MS_PER_HOUR,
  };
}

/** UTC offset of Europe/Amsterdam at an instant, in minutes (60 or 120). */
export function amsterdamOffsetMin(instant: Instant): number {
  const year = new Date(instant).getUTCFullYear();
  const { start, end } = summerTimeWindow(year);
  return instant >= start && instant < end ? 120 : 60;
}

export function toLocalParts(instant: Instant): LocalParts {
  const d = new Date(instant + amsterdamOffsetMin(instant) * MS_PER_MINUTE);
  const weekday = d.getUTCDay();
  return {
    year: d.getUTCFullYear(),
    month: d.getUTCMonth() + 1,
    day: d.getUTCDate(),
    hour: d.getUTCHours(),
    minute: d.getUTCMinutes(),
    second: d.getUTCSeconds(),
    millisecond: d.getUTCMilliseconds(),
    isoWeekday: weekday === 0 ? 7 : weekday,
  };
}

/**
 * Instant for a local wall-clock time. In the autumn overlap (02:00–03:00 twice) the earlier
 * instant wins; a time inside the spring gap (02:00–03:00 missing) moves forward by the gap.
 */
export function fromLocal(year: number, month: number, day: number, hour = 0, minute = 0): Instant {
  const wall = Date.UTC(year, month - 1, day, hour, minute);
  const asSummer = wall - 120 * MS_PER_MINUTE;
  const asWinter = wall - 60 * MS_PER_MINUTE;
  if (amsterdamOffsetMin(asSummer) === 120) return asSummer;
  if (amsterdamOffsetMin(asWinter) === 60) return asWinter;
  return asWinter; // spring gap: 02:30 does not exist, this yields 03:30 summer time
}

/** Parses `HH:MM` into minutes after midnight. */
export function parseLocalTime(hhmm: string): number {
  const m = /^(\d{2}):(\d{2})$/.exec(hhmm);
  if (!m) throw new Error(`invalid local time ${hhmm}`);
  return Number(m[1]) * 60 + Number(m[2]);
}

/** Instant for a local `YYYY-MM-DDTHH:MM` string in Europe/Amsterdam. */
export function parseLocalDateTime(value: string): Instant {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);
  if (!m) throw new Error(`invalid local date-time ${value}`);
  return fromLocal(Number(m[1]), Number(m[2]), Number(m[3]), Number(m[4]), Number(m[5]));
}
