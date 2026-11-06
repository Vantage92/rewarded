// spec §4.13 / architecture §12.5: the calendar rule per exam calendar, for two calendars with a
// different T and the default calendar; plus the round-3 earnArm rules (spec §3.16 step 3).
import { describe, expect, it } from 'vitest';
import { PARAMS_V1, calendarDates, cohortForRegistration, defaultCalendar, earnArmFor, isRestDay, isSeasonDay, validateCalendar, type ExamCalendar } from '../src/index.ts';

const cal = (id: string, tDay: string, a: [string, string] | null = null): ExamCalendar => ({
  id, isDefault: false, tDay, nStartDay: null, nEndDay: null, aStartDay: a?.[0] ?? null, aEndDay: a?.[1] ?? null, aResitDays: [], examPeriods: [],
});

describe('spec §4.13 kalenderregel per tentamenkalender', () => {
  const early = calendarDates(cal('k1', '2027-01-24', ['2027-04-05', '2027-04-18']), PARAMS_V1);
  const late = calendarDates(cal('k2', '2027-02-07', ['2027-04-12', '2027-04-25']), PARAMS_V1);

  it('§4.13 two calendars with a different T give different derived dates', () => {
    expect(early.bonusStopAt).toBe('2027-01-25T04:00');
    expect(late.bonusStopAt).toBe('2027-02-08T04:00');
    expect(early.prizeWeeks).toEqual([{ first_day: '2027-01-11', last_day: '2027-01-17' }, { first_day: '2027-01-18', last_day: '2027-01-24' }]);
    expect(late.januaryActives).toEqual({ first_day: '2027-01-25', last_day: '2027-01-31' });
    expect(early.earlyOfferDay).toBe('2027-01-18');
    expect(late.earlyOfferDay).toBe('2027-02-01');
    expect(early.restPeriod).toEqual({ first_day: '2027-01-25', last_day: '2027-04-18' });
    expect(late.early2OfferDay).toBe('2027-04-05');
    expect(late.restRepeatNoticeDay).toBe('2027-04-12');
    expect(late.afterAWindow).toEqual({ first_day: '2027-04-26', last_day: '2027-05-02' });
    expect(late.lateOfferDay).toBe('2027-04-26');
    expect(early.n).toEqual({ first_day: '2027-01-25', last_day: '2027-02-07' });
  });

  it('§4.13 season, rest period and cohort follow the own calendar', () => {
    // 1 February: after T of k1, inside the season of k2.
    expect(isSeasonDay(early, PARAMS_V1, '2027-02-01')).toBe(false);
    expect(isSeasonDay(late, PARAMS_V1, '2027-02-01')).toBe(true);
    expect(isRestDay(early, '2027-02-01')).toBe(true);
    expect(isRestDay(late, '2027-02-01')).toBe(false);
    expect(cohortForRegistration(early, '2027-01-30')).toBe('expansion');
    expect(cohortForRegistration(late, '2027-01-30')).toBe('experiment');
    // The vacation pause is the same for everyone.
    expect(isSeasonDay(late, PARAMS_V1, '2026-12-24')).toBe(false);
  });

  it('§4.13 the default calendar is the only reader of the fixed dates in params', () => {
    const d = calendarDates(defaultCalendar(PARAMS_V1), PARAMS_V1);
    expect(d.isDefault).toBe(true);
    expect(d.tDay).toBe(PARAMS_V1.goal_bonus.season.last_day);
    expect(d.restPeriod.last_day).toBe(PARAMS_V1.rest_period.last_day);
    expect(d.registrationLastDay).toBe(d.tDay);
  });

  it('§4.13 validation: T is a Sunday and windows come after T', () => {
    expect(validateCalendar(cal('x', '2027-01-24'))).toEqual([]);
    expect(validateCalendar(cal('x', '2027-01-25'))).toContain('t_day_not_sunday');
    expect(validateCalendar({ ...cal('x', '2027-01-24', ['2027-04-05', '2027-04-18']), aResitDays: ['2027-05-01'] })).toContain('resit_outside_a');
  });
});

describe('spec §3.16 stap 3 persoonlijk doorlopende punten in een rustsquad', () => {
  const base = { ageBand: '18_plus' as const, optedOut: false, restArm: 'rest' as const, restPeriodEnabled: true, restExitFromDay: null };
  const rp = { first_day: '2027-02-08', last_day: '2027-04-25' };

  it('§3.16 an experiment member in a rest squad earns nothing on T + 1 of the own calendar', () => {
    expect(earnArmFor(PARAMS_V1, '2027-02-08', { ...base, restPeriod: rp })).toBe('rest');
    expect(earnArmFor(PARAMS_V1, '2027-02-07', { ...base, restPeriod: rp })).toBe('earn');
    expect(earnArmFor(PARAMS_V1, '2027-04-26', { ...base, restPeriod: rp })).toBe('earn');
  });

  it('§3.16 the expansion cohort in a rest squad earns personally, like 16- and 17-year-olds', () => {
    expect(earnArmFor(PARAMS_V1, '2027-02-10', { ...base, restPeriod: rp, cohort: 'expansion' })).toBe('earn');
    expect(earnArmFor(PARAMS_V1, '2027-02-10', { ...base, restPeriod: rp, ageBand: '16_17' })).toBe('earn');
  });

  it('§3.16 after a rest exit (also via a squad switch) points return from the next day', () => {
    expect(earnArmFor(PARAMS_V1, '2027-02-10', { ...base, restPeriod: rp, restExitFromDay: '2027-02-11' })).toBe('rest');
    expect(earnArmFor(PARAMS_V1, '2027-02-11', { ...base, restPeriod: rp, restExitFromDay: '2027-02-11' })).toBe('earn');
  });
});
