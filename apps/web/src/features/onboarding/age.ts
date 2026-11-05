// Age check in the browser (UX O5): only to choose the next step and the confirmation below 16.
// The server decides the age band (spec §3.1 step 5, §4.10); the date is never stored.

export interface DateParts {
  year: number;
  month: number;
  day: number;
}

/** A real calendar date, or null. */
export function parseBirthDate(day: string, month: string, year: string): DateParts | null {
  const d = Number(day);
  const m = Number(month);
  const y = Number(year);
  if (!Number.isInteger(d) || !Number.isInteger(m) || !Number.isInteger(y)) return null;
  if (y < 1900 || m < 1 || m > 12 || d < 1) return null;
  const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
  if (d > last) return null;
  return { year: y, month: m, day: d };
}

export function isoDate(p: DateParts): string {
  return `${String(p.year).padStart(4, '0')}-${String(p.month).padStart(2, '0')}-${String(p.day).padStart(2, '0')}`;
}

/** Completed years on `today` (a 29 February birthday counts from 1 March in other years). */
export function ageOn(birth: DateParts, today: DateParts): number {
  let age = today.year - birth.year;
  if (today.month < birth.month || (today.month === birth.month && today.day < birth.day)) age--;
  return age;
}

export type AgeClass = 'under_16' | '16_17' | '18_plus';

export function ageClass(age: number): AgeClass {
  if (age < 16) return 'under_16';
  if (age < 18) return '16_17';
  return '18_plus';
}

/** Today's date in Europe/Amsterdam. */
export function todayParts(now: number = Date.now()): DateParts {
  const f = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Amsterdam', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now);
  const get = (t: string) => Number(f.find((p) => p.type === t)?.value);
  return { year: get('year'), month: get('month'), day: get('day') };
}
