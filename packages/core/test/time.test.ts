import { describe, expect, it } from 'vitest';
import { PARAMS_V1 } from '../src/params/index.ts';
import {
  FixedClock,
  MS_PER_HOUR,
  MS_PER_MINUTE,
  addDays,
  addWorkdays,
  amsterdamOffsetMin,
  closeAt,
  dayRange,
  daysBetween,
  daysLeftInWeekInclusive,
  focusDayEnd,
  focusDayHours,
  focusDayOf,
  focusDayStart,
  fromLocal,
  goalBonusSeasonEndsAt,
  isDay,
  isGoalBonusDay,
  isInLocalWindow,
  isLateStart,
  isRestPeriodDay,
  isVacationDay,
  isoWeekday,
  monthKeyOf,
  nowInstant,
  toLocalParts,
  weekKey,
  weekKeyOf,
  weekStartAt,
} from '../src/time/index.ts';

const P = PARAMS_V1;
const utc = (iso: string): number => Date.parse(iso);
/** Local Amsterdam wall time `YYYY-MM-DDTHH:MM` to an instant. */
const local = (s: string): number => {
  const [d, t] = s.split('T') as [string, string];
  const [y, mo, da] = d.split('-').map(Number) as [number, number, number];
  const [h, mi] = t.split(':').map(Number) as [number, number];
  return fromLocal(y, mo, da, h, mi);
};

describe('Europe/Amsterdam offset (spec §4.2 Dagrand)', () => {
  it('spec §4.2: matches Intl for every hour of 2026–2028', () => {
    const fmt = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Amsterdam', hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
    const mismatches: string[] = [];
    for (let t = utc('2026-01-01T00:00Z'); t < utc('2029-01-01T00:00Z'); t += MS_PER_HOUR) {
      const parts = Object.fromEntries(fmt.formatToParts(t).map((x) => [x.type, x.value]));
      const p = toLocalParts(t);
      const ours = `${p.year}-${p.month}-${p.day} ${p.hour}:${p.minute}`;
      const theirs = `${Number(parts.year)}-${Number(parts.month)}-${Number(parts.day)} ${Number(parts.hour)}:${Number(parts.minute)}`;
      if (ours !== theirs) mismatches.push(`${new Date(t).toISOString()}: ${ours} vs ${theirs}`);
    }
    expect(mismatches).toEqual([]);
  });

  it('spec §4.2: summer time 2027 starts 28 March 01:00 UTC and ends 31 October 01:00 UTC', () => {
    expect(amsterdamOffsetMin(utc('2027-03-28T00:59Z'))).toBe(60);
    expect(amsterdamOffsetMin(utc('2027-03-28T01:00Z'))).toBe(120);
    expect(amsterdamOffsetMin(utc('2027-10-31T00:59Z'))).toBe(120);
    expect(amsterdamOffsetMin(utc('2027-10-31T01:00Z'))).toBe(60);
  });

  it('spec §4.2: local times in the spring gap move forward; in the autumn overlap the first wins', () => {
    expect(local('2027-03-28T02:30')).toBe(utc('2027-03-28T01:30Z'));
    expect(local('2026-10-25T02:30')).toBe(utc('2026-10-25T00:30Z'));
    expect(local('2026-10-25T04:00')).toBe(utc('2026-10-25T03:00Z'));
  });
});

describe('focus day 04:00 Europe/Amsterdam (spec §4.2 Dagrand, §4.1 Sessie over 04:00)', () => {
  it('spec §4.2: 03:59 belongs to the previous day, 04:00 to the new day', () => {
    expect(focusDayOf(local('2026-12-14T03:59'), P)).toBe('2026-12-13');
    expect(focusDayOf(local('2026-12-14T04:00'), P)).toBe('2026-12-14');
    expect(focusDayOf(local('2026-12-14T00:00'), P)).toBe('2026-12-13');
    expect(focusDayOf(local('2026-12-14T23:59'), P)).toBe('2026-12-14');
  });

  it('spec §4.1 Sessie over 04:00: a 90-minute session starting 03:55 counts for the start day', () => {
    const start = local('2026-12-15T03:55');
    const end = start + 90 * MS_PER_MINUTE;
    expect(focusDayOf(start, P)).toBe('2026-12-14');
    expect(focusDayOf(end, P)).toBe('2026-12-15');
    // The day close of 14 December waits until the sweep could have closed this session.
    expect(closeAt('2026-12-14', P)).toBeGreaterThanOrEqual(end + P.session.end_grace_min * MS_PER_MINUTE);
  });

  it('spec §4.2: day start and end are 04:00 local, also on DST days', () => {
    expect(focusDayStart('2026-12-14', P)).toBe(utc('2026-12-14T03:00Z'));
    expect(focusDayStart('2026-07-01', P)).toBe(utc('2026-07-01T02:00Z'));
    expect(focusDayEnd('2027-03-27', P)).toBe(utc('2027-03-28T02:00Z'));
    expect(focusDayHours('2027-03-27', P)).toBe(23);
    expect(focusDayHours('2026-10-24', P)).toBe(25);
    expect(focusDayHours('2026-10-25', P)).toBe(24);
    expect(focusDayHours('2026-12-14', P)).toBe(24);
  });

  it('spec §4.2: the DST night itself (02:00–03:00) stays in the previous focus day', () => {
    expect(focusDayOf(utc('2027-03-28T00:59Z'), P)).toBe('2027-03-27'); // 01:59 CET
    expect(focusDayOf(utc('2027-03-28T01:00Z'), P)).toBe('2027-03-27'); // 03:00 CEST
    expect(focusDayOf(utc('2027-03-28T02:00Z'), P)).toBe('2027-03-28'); // 04:00 CEST
    expect(focusDayOf(utc('2026-10-25T00:30Z'), P)).toBe('2026-10-24'); // 02:30 CEST
    expect(focusDayOf(utc('2026-10-25T01:30Z'), P)).toBe('2026-10-24'); // 02:30 CET
    expect(focusDayOf(utc('2026-10-25T03:00Z'), P)).toBe('2026-10-25'); // 04:00 CET
  });
});

describe('closeAt (arch §6.1 dagafsluiting)', () => {
  it('arch §6.1: day close for D runs at 05:45 local on D + 1', () => {
    expect(closeAt('2026-12-14', P)).toBe(utc('2026-12-15T04:45Z'));
    expect(closeAt('2026-07-01', P)).toBe(utc('2026-07-02T03:45Z'));
  });

  it('arch §6.1 zomertijd: spring-forward night 2027 (23-hour day)', () => {
    expect(closeAt('2027-03-27', P)).toBe(utc('2027-03-28T03:45Z'));
    expect(closeAt('2027-03-28', P)).toBe(utc('2027-03-29T03:45Z'));
    expect(closeAt('2026-03-28', P)).toBe(utc('2026-03-29T03:45Z'));
  });

  it('arch §6.1 zomertijd: fall-back night 2026 (25-hour day)', () => {
    expect(closeAt('2026-10-24', P)).toBe(utc('2026-10-25T04:45Z'));
    expect(closeAt('2026-10-25', P)).toBe(utc('2026-10-26T04:45Z'));
    expect(closeAt('2027-10-30', P)).toBe(utc('2027-10-31T04:45Z'));
  });

  it('arch §6.1: every day of 2026–2027 closes at 05:45 local and after the latest possible sweep', () => {
    for (const day of dayRange('2026-01-01', '2027-12-31')) {
      const at = closeAt(day, P);
      const p = toLocalParts(at);
      expect(`${day} ${p.hour}:${p.minute}`).toBe(`${day} 5:45`);
      const latestStart = focusDayEnd(day, P) - MS_PER_MINUTE;
      const latestSweep = latestStart + (90 + P.session.end_grace_min) * MS_PER_MINUTE;
      expect(at - latestSweep).toBeGreaterThanOrEqual(P.time.sweep_margin_min * MS_PER_MINUTE);
    }
  });

  it('arch §6.1: a longer session length shifts closeAt by itself', () => {
    const longer = { ...P, session: { ...P.session, lengths_min: [25, 50, 120] } };
    expect(closeAt('2026-12-14', longer) - closeAt('2026-12-14', P)).toBe(30 * MS_PER_MINUTE);
  });
});

describe('week key (spec §4.2 Weekplafond, arch §5.2 week_key)', () => {
  it('spec §4.2: the week runs Monday 04:00 to Monday 04:00', () => {
    expect(weekKeyOf(local('2026-12-14T04:00'), P)).toBe('2026-12-14');
    expect(weekKeyOf(local('2026-12-14T03:59'), P)).toBe('2026-12-07');
    expect(weekKeyOf(local('2026-12-20T23:00'), P)).toBe('2026-12-14');
    expect(weekKey('2026-12-20')).toBe('2026-12-14');
    expect(weekKey('2026-12-14')).toBe('2026-12-14');
  });

  it('spec §4.2 zomertijd: weeks across DST are 167 and 169 hours long', () => {
    expect(weekStartAt('2027-03-22', P)).toBe(utc('2027-03-22T03:00Z'));
    expect(weekStartAt('2027-03-29', P)).toBe(utc('2027-03-29T02:00Z'));
    expect((weekStartAt('2027-03-29', P) - weekStartAt('2027-03-22', P)) / MS_PER_HOUR).toBe(167);
    expect((weekStartAt('2026-10-26', P) - weekStartAt('2026-10-19', P)) / MS_PER_HOUR).toBe(169);
    // Monday 26 October 2026 03:59 CET is still the week of 19 October.
    expect(weekKeyOf(utc('2026-10-26T02:59Z'), P)).toBe('2026-10-19');
    expect(weekKeyOf(utc('2026-10-26T03:00Z'), P)).toBe('2026-10-26');
    // Sunday 28 March 2027 in the gap hour belongs to the week of 22 March.
    expect(weekKeyOf(utc('2027-03-28T01:30Z'), P)).toBe('2027-03-22');
  });

  it('spec §5 Doelbonus arm B: days left in the week, counting the day itself', () => {
    expect(daysLeftInWeekInclusive('2026-12-14')).toBe(7);
    expect(daysLeftInWeekInclusive('2026-12-17')).toBe(4);
    expect(daysLeftInWeekInclusive('2026-12-20')).toBe(1);
  });

  it('arch §5.2 month_key: calendar month in Europe/Amsterdam, not the focus day', () => {
    const t = utc('2027-01-31T23:30Z'); // 1 February 00:30 local
    expect(monthKeyOf(t)).toBe('2027-02');
    expect(focusDayOf(t, P)).toBe('2027-01-31');
  });
});

describe('night rule (spec §4.2 Nachtregel, §4.1 Sessie gestart tussen 01:00 en 04:00)', () => {
  it('spec §4.2: starts in [01:00, 04:00) are late starts', () => {
    expect(isLateStart(local('2026-12-14T00:59'), P)).toBe(false);
    expect(isLateStart(local('2026-12-14T01:00'), P)).toBe(true);
    expect(isLateStart(local('2026-12-14T03:59'), P)).toBe(true);
    expect(isLateStart(local('2026-12-14T04:00'), P)).toBe(false);
    expect(isLateStart(utc('2027-03-28T01:30Z'), P)).toBe(true); // 03:30 CEST on the DST night
  });

  it('spec §6.3 H6: windows work in local time and may wrap midnight', () => {
    expect(isInLocalWindow(local('2026-12-14T05:59'), P.fraud.h6_window)).toBe(true);
    expect(isInLocalWindow(local('2026-12-14T06:00'), P.fraud.h6_window)).toBe(false);
    expect(isInLocalWindow(local('2026-12-14T23:30'), { from: '23:00', to: '01:00' })).toBe(true);
    expect(isInLocalWindow(local('2026-12-14T00:30'), { from: '23:00', to: '01:00' })).toBe(true);
    expect(isInLocalWindow(local('2026-12-14T01:30'), { from: '23:00', to: '01:00' })).toBe(false);
  });
});

describe('season, vacation pause and rest period (spec §5)', () => {
  it('spec §5 Seizoen doelbonus: 2 December through 17 January, not in the vacation pause', () => {
    const cases: [string, boolean][] = [
      ['2026-12-01', false],
      ['2026-12-02', true],
      ['2026-12-20', true],
      ['2026-12-21', false],
      ['2027-01-03', false],
      ['2027-01-04', true],
      ['2027-01-17', true],
      ['2027-01-18', false],
    ];
    expect(cases.map(([d]) => [d, isGoalBonusDay(d, P)])).toEqual(cases);
  });

  it('spec §4.2 Seizoen doelbonus: the season ends Monday 18 January 2027 04:00, the end of focus day 17 January', () => {
    expect(goalBonusSeasonEndsAt(P)).toBe(utc('2027-01-18T03:00Z'));
    expect(goalBonusSeasonEndsAt(P)).toBe(focusDayEnd(P.goal_bonus.season.last_day, P));
    // A session that starts Sunday 23:00 and ends after 04:00 Monday still belongs to a bonus day.
    expect(isGoalBonusDay(focusDayOf(local('2027-01-17T23:00'), P), P)).toBe(true);
  });

  it('spec §5 Vakantiepauze: 21 December 2026 through 3 January 2027', () => {
    expect(isVacationDay('2026-12-20', P)).toBe(false);
    expect(isVacationDay('2026-12-21', P)).toBe(true);
    expect(isVacationDay('2027-01-03', P)).toBe(true);
    expect(isVacationDay('2027-01-04', P)).toBe(false);
  });

  it('spec §5 Rustperiode / §3.16: focus days 19 January through 31 March 2027', () => {
    expect(isRestPeriodDay('2027-01-18', P)).toBe(false);
    expect(isRestPeriodDay('2027-01-19', P)).toBe(true);
    expect(isRestPeriodDay('2027-03-31', P)).toBe(true);
    expect(isRestPeriodDay('2027-04-01', P)).toBe(false);
    // 1 April 03:30 local is still focus day 31 March.
    expect(isRestPeriodDay(focusDayOf(local('2027-04-01T03:30'), P), P)).toBe(true);
  });
});

describe('day arithmetic and clock (arch §3 focus_day, §2 Clock)', () => {
  it('arch §3: dates are validated and DST never shifts a date', () => {
    expect(isDay('2026-02-28')).toBe(true);
    expect(isDay('2026-02-29')).toBe(false);
    expect(isDay('2028-02-29')).toBe(true);
    expect(isDay('2026-13-01')).toBe(false);
    expect(addDays('2027-03-27', 1)).toBe('2027-03-28');
    expect(addDays('2026-10-25', 1)).toBe('2026-10-26');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(daysBetween('2026-12-02', '2027-01-17')).toBe(46);
    expect(isoWeekday('2026-11-05')).toBe(4);
    expect(dayRange('2026-12-30', '2027-01-02')).toEqual(['2026-12-30', '2026-12-31', '2027-01-01', '2027-01-02']);
  });

  it('spec §6.4: three working days after a Friday is Wednesday', () => {
    expect(addWorkdays('2026-11-06', 3)).toBe('2026-11-11');
    expect(addWorkdays('2026-11-05', 0)).toBe('2026-11-05');
  });

  it('arch §2: FixedClock is deterministic and only moves when told', () => {
    const c = new FixedClock(utc('2026-11-05T12:00Z'));
    expect(nowInstant(c)).toBe(utc('2026-11-05T12:00Z'));
    c.advance(25 * MS_PER_MINUTE);
    expect(c.now().toISOString()).toBe('2026-11-05T12:25:00.000Z');
    c.set(new Date('2027-01-18T03:00Z'));
    expect(focusDayOf(nowInstant(c), P)).toBe('2027-01-18');
  });
});
