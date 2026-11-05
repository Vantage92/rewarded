// Age check (spec §3.1 step 5, §4.10): only the band and the day someone turns 18 are kept; the
// birth date is used in memory and never stored or logged. "Today" is the calendar date in
// Europe/Amsterdam.
import { addDays, formatDay, isDay, parseDay, toLocalParts, type FocusDay } from '@rewarded/core';

export const MIN_AGE = 16;
export const ADULT_AGE = 18;

export function localDate(now: Date): FocusDay {
  const p = toLocalParts(now.getTime());
  return formatDay(p.year, p.month, p.day);
}

export function ageOn(birthDate: string, today: FocusDay): number {
  const b = parseDay(birthDate);
  const t = parseDay(today);
  let age = t.year - b.year;
  if (t.month < b.month || (t.month === b.month && t.day < b.day)) age -= 1;
  return age;
}

/** Day of the 18th birthday; 29 February becomes 1 March in a non-leap year. */
export function turns18On(birthDate: string): FocusDay {
  const b = parseDay(birthDate);
  const candidate = formatDay(b.year + ADULT_AGE, b.month, b.day);
  return isDay(candidate) ? candidate : addDays(formatDay(b.year + ADULT_AGE, 2, 28), 1);
}

export type AgeCheck = { ok: false; reason: 'below_minimum' | 'implausible' } | { ok: true; band: '16_17' | '18_plus'; turns18On: FocusDay | null };

export function checkAge(birthDate: string, today: FocusDay): AgeCheck {
  if (!isDay(birthDate) || birthDate > today) return { ok: false, reason: 'implausible' };
  const age = ageOn(birthDate, today);
  if (age > 120) return { ok: false, reason: 'implausible' };
  if (age < MIN_AGE) return { ok: false, reason: 'below_minimum' };
  if (age < ADULT_AGE) return { ok: true, band: '16_17', turns18On: turns18On(birthDate) };
  return { ok: true, band: '18_plus', turns18On: null };
}
