// core/belofte (spec §3.12, §4.12; architecture §3.4, §6.1 step 6). Owner WP-5.
// Offer day per arm and calendar, the suggestion from the last 14 days, the end day without
// vacation days, the day result and the reflection. No ledger entry ever hangs on a Belofte.
import { addDays, compareDays, dayRange, type FocusDay } from '../time/index.ts';

/** The belofte slice of the parameter set (params.belofte). */
export interface BelofteParams {
  readonly days_per_week_min: number;
  readonly days_per_week_max: number;
  readonly minutes_options: readonly number[];
  readonly duration_days: number;
  readonly suggestion_lookback_days: number;
  readonly outside_experiment_offer_after_days: number;
}

export type BelofteOfferTrigger = 'early' | 'late' | 'outside';

/** The calendar dates the offer needs (spec §4.13): T and the last day of the April window A. */
export interface BelofteCalendar {
  tDay: FocusDay;
  aEndDay: FocusDay | null;
}

/**
 * Offer day (spec §4.12 Aanbod): early arm on T − 6 of the unit's calendar, late arm the day after
 * A; the expansion cohort on day 14 after registration. A user who opted out of the research gets
 * the early offer if he did not get one yet (spec §4.10).
 */
export function offerDueDay(
  input: { cohort: 'experiment' | 'expansion'; arm: 'early' | 'late' | null; optedOut: boolean; registeredDay: FocusDay; calendar: BelofteCalendar | null },
  p: Pick<BelofteParams, 'outside_experiment_offer_after_days'>,
): { trigger: BelofteOfferTrigger; dueDay: FocusDay } | null {
  if (input.cohort === 'expansion' || input.arm === null) {
    return { trigger: 'outside', dueDay: addDays(input.registeredDay, p.outside_experiment_offer_after_days) };
  }
  if (!input.calendar) return null;
  if (input.arm === 'early' || input.optedOut) return { trigger: 'early', dueDay: addDays(input.calendar.tDay, -6) };
  if (!input.calendar.aEndDay) return null;
  return { trigger: 'late', dueDay: addDays(input.calendar.aEndDay, 1) };
}

/** Largest option not above `value`, at least the smallest option. */
export function floorToOption(value: number, options: readonly number[]): number {
  const sorted = [...options].sort((a, b) => a - b);
  let out = sorted[0] ?? 25;
  for (const o of sorted) if (o <= value) out = o;
  return out;
}

/**
 * Suggestion (spec §4.12 Voorstel): what the user actually did in the last 14 days, rounded down to
 * the fixed values: active days per week (3–7) and the median minutes of the active days.
 */
export function suggestBelofte(lastDays: readonly { verifiedMin: number }[], p: BelofteParams): { daysPerWeek: number; minPerDay: number } {
  const active = lastDays.map((d) => d.verifiedMin).filter((m) => m > 0).sort((a, b) => a - b);
  const weeks = Math.max(1, p.suggestion_lookback_days / 7);
  const perWeek = Math.floor(active.length / weeks);
  const daysPerWeek = Math.min(p.days_per_week_max, Math.max(p.days_per_week_min, perWeek));
  let median = 0;
  if (active.length > 0) {
    const mid = Math.floor(active.length / 2);
    median = active.length % 2 === 1 ? active[mid]! : (active[mid - 1]! + active[mid]!) / 2;
  }
  return { daysPerWeek, minPerDay: floorToOption(median, p.minutes_options) };
}

/** End day: 14 counted days from the start; vacation days do not count (spec §4.12 Looptijd). */
export function belofteEndDay(startDay: FocusDay, isVacation: (d: FocusDay) => boolean, p: Pick<BelofteParams, 'duration_days'>): FocusDay {
  let d = startDay;
  let counted = isVacation(d) ? 0 : 1;
  while (counted < p.duration_days) {
    d = addDays(d, 1);
    if (!isVacation(d)) counted += 1;
  }
  return d;
}

/**
 * Day result (spec §4.12 Belofte-dag gehaald): minutes of that day ≥ promised minutes. The API passes
 * `counted_min`, in which a flagged session counts provisionally and a rejected one not at all.
 */
export function belofteDayMet(minutes: number, minPerDay: number): boolean {
  return minutes >= minPerDay;
}

/** Days the Belofte runs on (vacation days left out). */
export function belofteDays(startDay: FocusDay, endDay: FocusDay, isVacation: (d: FocusDay) => boolean): FocusDay[] {
  return dayRange(startDay, endDay).filter((d) => !isVacation(d));
}

/** "Je haalde je Belofte op 9 van 12 dagen": met days against days per week × weeks. */
export function belofteSummary(results: readonly { met: boolean }[], daysPerWeek: number, p: Pick<BelofteParams, 'duration_days'>): { met: number; target: number } {
  return { met: results.filter((r) => r.met).length, target: daysPerWeek * Math.ceil(p.duration_days / 7) };
}

/** Whether the reflection is due: the Belofte reached its end day and was not stopped. */
export function reflectionDue(b: { endDay: FocusDay; status: 'active' | 'completed' | 'stopped' }, today: FocusDay): boolean {
  return b.status !== 'stopped' && compareDays(today, b.endDay) > 0;
}

/** Ratio of the promise to history (event belofte_made.verhouding_tot_historie). */
export function ratioToHistory(minPerDay: number, daysPerWeek: number, suggestion: { daysPerWeek: number; minPerDay: number }): number | null {
  const hist = suggestion.daysPerWeek * suggestion.minPerDay;
  if (hist <= 0) return null;
  return Math.round(((minPerDay * daysPerWeek) / hist) * 100) / 100;
}

/** The renewal offer (spec §4.12 Reflectie): early arm only, once, for another 14 days. */
export function renewalOffered(arm: BelofteOfferTrigger, alreadyOffered: boolean): boolean {
  return arm === 'early' && !alreadyOffered;
}
