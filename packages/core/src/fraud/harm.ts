// Harm signals S1–S3, the absolute harm threshold, the stop rule of arm B and the guard rule of the
// rest arm (spec §6.6; voorregistratie §8.3). Harm signals are not fraud signals: they cost nothing
// and are only shown to the student; the team sees counts per arm and per code.
import { addDays, daysBetween, type FocusDay } from '../time/days.ts';
import type { HarmRules } from './rules.ts';

export type HarmCode = 'S1' | 'S2' | 'S3' | 'S4';
export const HARM_CODES: readonly HarmCode[] = ['S1', 'S2', 'S3', 'S4'];

export interface HarmDayFact {
  focusDay: FocusDay;
  /** All verified minutes of the day (also above 300). */
  verifiedMin: number;
  /** A session started between 01:00 and 04:00 (late_start). */
  lateStart: boolean;
  /** At least one completed session. */
  completed: boolean;
}

export interface StreakBreak {
  /** First focus day without the streak. */
  breakDay: FocusDay;
  /** Length of the streak before the break. */
  streakBefore: number;
}

export interface HarmInput {
  userId: string;
  day: FocusDay;
  days: readonly HarmDayFact[];
  breaks?: readonly StreakBreak[];
  /** Last focus day a signal was raised, per code (cool-down of 14 days). */
  lastRaised?: Partial<Record<HarmCode, FocusDay>>;
}

const inWindow = (d: FocusDay, end: FocusDay, len: number): boolean => d <= end && d > addDays(end, -len);

/** S1–S3 for one user on day D, after the cool-down. */
export function harmSignals(input: HarmInput, rules: HarmRules): HarmCode[] {
  const out: HarmCode[] = [];
  const { day, days } = input;
  const cooled = (code: HarmCode): boolean => {
    const last = input.lastRaised?.[code];
    return last === undefined || daysBetween(last, day) >= rules.cooldownDays;
  };
  const s1 = days.filter((d) => d.lateStart && inWindow(d.focusDay, day, rules.s1WindowDays)).length;
  if (s1 >= rules.s1Nights && cooled('S1')) out.push('S1');
  const s2 = days.filter((d) => d.verifiedMin > rules.s2DailyMin && inWindow(d.focusDay, day, rules.s2WindowDays)).length;
  if (s2 >= rules.s2Days && cooled('S2')) out.push('S2');
  if (cooled('S3') && s3(input, rules)) out.push('S3');
  return out;
}

/** S3: after a broken streak of ≥ 7 days no completed session for 7 days, after ≥ 5 focus days in the 7 before. */
export function s3(input: HarmInput, rules: HarmRules): boolean {
  const done = new Set(input.days.filter((d) => d.completed).map((d) => d.focusDay));
  return (input.breaks ?? []).some((b) => {
    if (b.streakBefore < rules.s3MinStreak) return false;
    const lastQuiet = addDays(b.breakDay, rules.s3InactiveDays - 1);
    if (lastQuiet > input.day) return false;
    for (let i = 0; i < rules.s3InactiveDays; i++) if (done.has(addDays(b.breakDay, i))) return false;
    let prior = 0;
    for (let i = 1; i <= 7; i++) if (done.has(addDays(b.breakDay, -i))) prior++;
    return prior >= rules.s3PriorFocusDays;
  });
}

export interface ArmCount {
  /** Users with ≥ 1 approved session in the week (the denominator). */
  actives: number;
  /** Of those, users with ≥ 1 harm signal in the week. */
  withSignal: number;
}

export const share = (c: ArmCount): number => (c.actives === 0 ? 0 : c.withSignal / c.actives);

export interface AbsoluteHarmResult {
  sharePct: number;
  perCode: Record<HarmCode, { count: number; sharePct: number }>;
  /** ≥ 2% of the weekly actives: no expansion before the researcher's review (spec §6.6). */
  exceeded: boolean;
}

/** Absolute harm threshold over all arms, also per code side by side (G-S5). */
export function absoluteHarm(actives: number, usersWithSignal: number, perCode: Readonly<Record<HarmCode, number>>, rules: HarmRules): AbsoluteHarmResult {
  const pct = (n: number): number => (actives === 0 ? 0 : (n * 100) / actives);
  const sharePct = pct(usersWithSignal);
  return {
    sharePct,
    perCode: Object.fromEntries(HARM_CODES.map((c) => [c, { count: perCode[c] ?? 0, sharePct: pct(perCode[c] ?? 0) }])) as AbsoluteHarmResult['perCode'],
    exceeded: actives > 0 && sharePct >= rules.absoluteThresholdPct,
  };
}

/** Ratio criterion: the treated group has more than `ratio` times the share of the control group. */
export function ratioExceeded(treated: ArmCount, control: ArmCount, ratio: number): boolean {
  if (treated.withSignal === 0 || treated.actives === 0) return false;
  return share(treated) > ratio * share(control);
}

export interface WellbeingWeek {
  /** Mean score per arm (higher = more stress, worse), the pooled SD and the answers per arm. */
  meanA: number;
  meanB: number;
  sd: number;
  answersA: number;
  answersB: number;
}

export interface StopRuleInput {
  harm: { A: ArmCount; B: ArmCount };
  /** The last weeks of the two-item measure, oldest first. */
  wellbeing?: readonly WellbeingWeek[];
}

export interface StopRuleResult {
  criterion1: boolean;
  criterion1Tested: boolean;
  criterion2: boolean;
  triggered: boolean;
}

/**
 * Stop rule of arm B (voorregistratie §8.3). The correction for repeated looks is to be set by the
 * statistician; until then the working hypotheses are applied as they stand.
 */
export function stopRuleArmB(input: StopRuleInput, rules: HarmRules): StopRuleResult {
  const criterion2 = ratioExceeded(input.harm.B, input.harm.A, rules.armRatio);
  const weeks = (input.wellbeing ?? []).slice(-rules.wellbeingWeeks);
  const tested = weeks.length === rules.wellbeingWeeks && weeks.every((w) => w.answersA >= rules.wellbeingMinPerArm && w.answersB >= rules.wellbeingMinPerArm);
  const criterion1 = tested && weeks.every((w) => w.sd > 0 && (w.meanB - w.meanA) / w.sd >= rules.wellbeingSdDiff);
  return { criterion1, criterion1Tested: tested, criterion2, triggered: criterion1 || criterion2 };
}

/** Guard rule of the rest arm (T + 1 to A-end): rest share more than twice the continuing share. */
export function guardRuleRestArm(rest: ArmCount, cont: ArmCount, rules: HarmRules): boolean {
  return ratioExceeded(rest, cont, rules.armRatio);
}
