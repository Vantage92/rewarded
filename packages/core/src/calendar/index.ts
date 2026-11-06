// Exam calendar per club and the calendar rule (spec §4.13, architecture §3.4, §12.5).
// Every pilot date (season, bonus stop, prize weeks, January actives, Belofte offers, rest
// period, N, A) is derived from one calendar. Fixed dates in params only feed the default
// calendar for units without a club (`is_default`). Pure: no I/O, no clock.
import type { Params } from '../params/index.ts';
import { addDays, compareDays, isDayInRange, isoWeekday, type FocusDay } from '../time/index.ts';

export interface CalendarRange {
  first_day: FocusDay;
  last_day: FocusDay;
}

/** One stored calendar (table exam_calendar), or the default calendar built from params. */
export interface ExamCalendar {
  id: string | null;
  isDefault: boolean;
  /** T: the Sunday that ends the last regular exam week of the January/February period. */
  tDay: FocusDay;
  nStartDay: FocusDay | null;
  nEndDay: FocusDay | null;
  aStartDay: FocusDay | null;
  aEndDay: FocusDay | null;
  /** Days in A that are resits of an earlier period: outside the after-effect measure (G-S6). */
  aResitDays: readonly FocusDay[];
  /** Periods in which regrouping is open; empty = derived (pilot start…T, A with the week before). */
  examPeriods: readonly CalendarRange[];
}

/** All derived dates of one calendar (spec §4.13 "Moment" table). */
export interface CalendarDates {
  calendarId: string | null;
  isDefault: boolean;
  tDay: FocusDay;
  /** Goal bonus season: pilot start … T (the vacation pause is excluded per day). */
  season: CalendarRange;
  /** Local time of the bonus stop: 04:00 on T + 1 (a Monday). */
  bonusStopAt: string;
  /** Prize period: the two focus weeks T − 13 … T − 7 and T − 6 … T. */
  prizeWeeks: [CalendarRange, CalendarRange];
  /** Definition window of the January actives (conditions c and d): T − 13 … T − 7. */
  januaryActives: CalendarRange;
  /** Announcement of the stop, early Belofte offer, rest-arm announcement; rest arm per person from here. */
  earlyOfferDay: FocusDay;
  restArmFixedFrom: FocusDay;
  /** Rest period: T + 1 … end of A. */
  restPeriod: CalendarRange;
  sensitivityWindow: CalendarRange;
  reflectionWindow: CalendarRange;
  /** Post-season window N. */
  n: CalendarRange;
  /** April window A, or null if the calendar has none yet. */
  a: CalendarRange | null;
  aResitDays: readonly FocusDay[];
  /** Second early Belofte offer: A start − 7. */
  early2OfferDay: FocusDay | null;
  /** One-time repeat notice for the rest group: A start. */
  restRepeatNoticeDay: FocusDay | null;
  /** Measurement after A: A end + 1 … A end + 7. */
  afterAWindow: CalendarRange | null;
  /** Late Belofte offer: the day after A. */
  lateOfferDay: FocusDay;
  /** Registration up to and including T belongs to the experiment population. */
  registrationLastDay: FocusDay;
  examPeriods: CalendarRange[];
}

type CalendarParams = Pick<Params, 'goal_bonus' | 'rest_period' | 'vacation_pause'>;

/**
 * Default calendar for units without a club (spec §4.13): the only place where the fixed dates of
 * params are read. T = last day of `goal_bonus.season`, end of A = last day of `rest_period`.
 */
export function defaultCalendar(params: CalendarParams): ExamCalendar {
  return {
    id: null,
    isDefault: true,
    tDay: params.goal_bonus.season.last_day,
    nStartDay: null,
    nEndDay: null,
    aStartDay: null,
    aEndDay: params.rest_period.last_day,
    aResitDays: [],
    examPeriods: [],
  };
}

/** Pilot start S (schuifregel, voorregistratie §3.5); the same for every calendar. */
export function pilotStartDay(params: Pick<Params, 'goal_bonus'>): FocusDay {
  return params.goal_bonus.season.first_day;
}

/** Derives every date of the calendar rule (spec §4.13). */
export function calendarDates(cal: ExamCalendar, params: CalendarParams): CalendarDates {
  const t = cal.tDay;
  const aEnd = cal.aEndDay ?? params.rest_period.last_day;
  const a = cal.aStartDay && cal.aEndDay ? { first_day: cal.aStartDay, last_day: cal.aEndDay } : null;
  const n = cal.nStartDay && cal.nEndDay ? { first_day: cal.nStartDay, last_day: cal.nEndDay } : { first_day: addDays(t, 1), last_day: addDays(t, 14) };
  const examPeriods = cal.examPeriods.length > 0 ? cal.examPeriods.map((p) => ({ ...p })) : derivedExamPeriods(pilotStartDay(params), t, cal.aStartDay, cal.aEndDay);
  return {
    calendarId: cal.id,
    isDefault: cal.isDefault,
    tDay: t,
    season: { first_day: pilotStartDay(params), last_day: t },
    bonusStopAt: `${addDays(t, 1)}T04:00`,
    prizeWeeks: [
      { first_day: addDays(t, -13), last_day: addDays(t, -7) },
      { first_day: addDays(t, -6), last_day: t },
    ],
    januaryActives: { first_day: addDays(t, -13), last_day: addDays(t, -7) },
    earlyOfferDay: addDays(t, -6),
    restArmFixedFrom: addDays(t, -6),
    restPeriod: { first_day: addDays(t, 1), last_day: aEnd },
    sensitivityWindow: { first_day: addDays(t, 1), last_day: addDays(t, 14) },
    reflectionWindow: { first_day: addDays(t, 1), last_day: addDays(t, 7) },
    n,
    a,
    aResitDays: [...cal.aResitDays],
    early2OfferDay: cal.aStartDay ? addDays(cal.aStartDay, -7) : null,
    restRepeatNoticeDay: cal.aStartDay,
    afterAWindow: cal.aEndDay ? { first_day: addDays(cal.aEndDay, 1), last_day: addDays(cal.aEndDay, 7) } : null,
    lateOfferDay: addDays(aEnd, 1),
    registrationLastDay: t,
    examPeriods,
  };
}

/** Exam periods (spec §4.13, working hypothesis): pilot start … T, and A with the week before it. */
export function derivedExamPeriods(start: FocusDay, t: FocusDay, aStart: FocusDay | null, aEnd: FocusDay | null): CalendarRange[] {
  const out: CalendarRange[] = [{ first_day: start, last_day: t }];
  if (aStart && aEnd) out.push({ first_day: addDays(aStart, -7), last_day: aEnd });
  return out;
}

/** Goal bonus day of this calendar: in the season and not in the vacation pause (spec §4.2). */
export function isSeasonDay(dates: Pick<CalendarDates, 'season'>, params: Pick<Params, 'vacation_pause'>, day: FocusDay): boolean {
  return isDayInRange(day, dates.season) && !isDayInRange(day, params.vacation_pause);
}

/** Rest period day of this calendar (spec §3.16). */
export function isRestDay(dates: Pick<CalendarDates, 'restPeriod'>, day: FocusDay): boolean {
  return isDayInRange(day, dates.restPeriod);
}

/** Experiment population up to and including T of the unit's calendar; after that the expansion cohort. */
export function cohortForRegistration(dates: Pick<CalendarDates, 'registrationLastDay'>, registeredDay: FocusDay): 'experiment' | 'expansion' {
  return compareDays(registeredDay, dates.registrationLastDay) <= 0 ? 'experiment' : 'expansion';
}

/** Whether the rest arm is fixed to the person on this day (from T − 6, spec §3.16 step 2). */
export function restArmFixedOn(dates: Pick<CalendarDates, 'restArmFixedFrom'>, day: FocusDay): boolean {
  return compareDays(day, dates.restArmFixedFrom) >= 0;
}

/** Validation of a calendar entered by an admin (spec §4.13): T is a Sunday, windows are ordered. */
export function validateCalendar(cal: Pick<ExamCalendar, 'tDay' | 'nStartDay' | 'nEndDay' | 'aStartDay' | 'aEndDay' | 'aResitDays'>): string[] {
  const errors: string[] = [];
  if (isoWeekday(cal.tDay) !== 7) errors.push('t_day_not_sunday');
  if ((cal.nStartDay === null) !== (cal.nEndDay === null)) errors.push('n_incomplete');
  if (cal.nStartDay && cal.nEndDay && (compareDays(cal.nStartDay, cal.tDay) <= 0 || compareDays(cal.nEndDay, cal.nStartDay) < 0)) errors.push('n_order');
  if ((cal.aStartDay === null) !== (cal.aEndDay === null)) errors.push('a_incomplete');
  if (cal.aStartDay && cal.aEndDay && (compareDays(cal.aStartDay, cal.tDay) <= 0 || compareDays(cal.aEndDay, cal.aStartDay) < 0)) errors.push('a_order');
  if (cal.aResitDays.length > 0 && !(cal.aStartDay && cal.aEndDay && cal.aResitDays.every((r) => isDayInRange(r, { first_day: cal.aStartDay as string, last_day: cal.aEndDay as string })))) errors.push('resit_outside_a');
  return errors;
}
