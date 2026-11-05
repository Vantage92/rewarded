// WP-5 core rules: squads (spec §4.4), challenges (spec §4.6, §4.7, architecture §6.2), privacy
// (architecture §6.4), Belofte (spec §4.12) and referral (spec §4.9). Test names carry the paragraph.
import { describe, expect, it } from 'vitest';
import { PARAMS_V1, addDays, dayRange } from '../src/index.ts';
import {
  EMPTY_STREAK,
  countingWindowStart,
  evaluateSquadDay,
  inviteMomentAllowed,
  isLowActivity,
  jokerDayOfWeek,
  memberCountsOn,
  mergeAllowed,
  neededForSuccess,
  pauseDue,
  regroupOpen,
  type MemberDayFacts,
  type StreakState,
} from '../src/squads/index.ts';
import {
  codeCap,
  meetsThreshold,
  mergePools,
  nextSeat,
  participationWeek,
  performanceProgress,
  poolFor,
  prizePeriodScore,
  prizeWeeksFor,
  rankPools,
  type ChallengeMemberDay,
  type ClubLink,
} from '../src/challenges/index.ts';
import { roundTo, shareFromRounded, suppressCount, weeklyCountSeries } from '../src/privacy/index.ts';
import { belofteDays, belofteEndDay, belofteSummary, floorToOption, offerDueDay, ratioToHistory, reflectionDue, suggestBelofte } from '../src/belofte/index.ts';
import { evaluateVesting, partyVestDay, qualifyingSessions, referralLive, type VestingInput } from '../src/referral/index.ts';
import { focusDayEnd } from '../src/time/index.ts';

const SP = PARAMS_V1.squads;
const CP = PARAMS_V1.challenges;
const BP = PARAMS_V1.belofte;
const RP = PARAMS_V1.referral;
const BOARD = PARAMS_V1.board;

const met: MemberDayFacts = { goalMet: true, examDay: false, jokerUsed: false };
const miss: MemberDayFacts = { goalMet: false, examDay: false, jokerUsed: false };
const joker: MemberDayFacts = { goalMet: false, examDay: false, jokerUsed: true };
const exam: MemberDayFacts = { goalMet: false, examDay: true, jokerUsed: false };

function run(days: MemberDayFacts[][], start: StreakState = EMPTY_STREAK, vacation: boolean[] = []) {
  let state = start;
  const out = [];
  for (const [i, members] of days.entries()) {
    const r = evaluateSquadDay({ vacation: vacation[i] ?? false, members, state }, SP);
    out.push(r);
    state = r.state;
  }
  return { out, state };
}

describe('spec §4.4 Squadstreak: half of the active members, rounded up, at least 2', () => {
  it('§4.4 needed members for 3, 4, 5 and 6 active members are 2, 2, 3, 3', () => {
    expect([3, 4, 5, 6].map((n) => neededForSuccess(n, SP))).toEqual([2, 2, 3, 3]);
  });

  it('§4.4 a squad day succeeds when enough members met their goal, used a joker or had an exam day', () => {
    expect(evaluateSquadDay({ vacation: false, members: [met, met, miss], state: EMPTY_STREAK }, SP).result).toBe('success');
    expect(evaluateSquadDay({ vacation: false, members: [met, joker, miss], state: EMPTY_STREAK }, SP).result).toBe('success');
    expect(evaluateSquadDay({ vacation: false, members: [met, exam, miss], state: EMPTY_STREAK }, SP).result).toBe('success');
    expect(evaluateSquadDay({ vacation: false, members: [met, miss, miss], state: EMPTY_STREAK }, SP).result).toBe('fail');
    const five = evaluateSquadDay({ vacation: false, members: [met, met, joker, miss, miss], state: { streak: 4, beforeBreak: null, recoveryProgress: 0 } }, SP);
    expect(five).toMatchObject({ result: 'success', needed: 3, met: 2, jokers: 1, examDays: 0, activeMembers: 5 });
    expect(five.state.streak).toBe(5);
  });

  it('§4.4 an exam day counts as not missed without using a joker (spec §3.13)', () => {
    const r = evaluateSquadDay({ vacation: false, members: [exam, exam, miss], state: EMPTY_STREAK }, SP);
    expect(r).toMatchObject({ result: 'success', jokers: 0, examDays: 2 });
  });

  it('§4.4 Onder 3 actieve leden door pauzes: the streak freezes instead of breaking', () => {
    const r = evaluateSquadDay({ vacation: false, members: [miss, miss], state: { streak: 9, beforeBreak: null, recoveryProgress: 0 } }, SP);
    expect(r.result).toBe('frozen');
    expect(r.state.streak).toBe(9);
  });

  it('§4.4 Vakantiepauze: days do not count and break nothing', () => {
    const r = evaluateSquadDay({ vacation: true, members: [miss, miss, miss, miss], state: { streak: 6, beforeBreak: 3, recoveryProgress: 1 } }, SP);
    expect(r.result).toBe('vacation');
    expect(r.state).toEqual({ streak: 6, beforeBreak: 3, recoveryProgress: 1 });
  });
});

describe('spec §4.4 Streakherstel: two successful squad days right after the break restore the old length', () => {
  it('§4.4 break after 10, then two successes: back to 10, streak_recovered', () => {
    const start = { streak: 10, beforeBreak: null, recoveryProgress: 0 };
    const { out, state } = run([[miss, miss, met], [met, met, met], [met, met, miss]], start);
    expect(out.map((o) => o.result)).toEqual(['fail', 'success', 'success']);
    expect(out[0]!.state).toEqual({ streak: 0, beforeBreak: 10, recoveryProgress: 0 });
    expect(out[1]!.recovered).toBe(false);
    expect(out[2]!.recovered).toBe(true);
    expect(state).toEqual({ streak: 10, beforeBreak: null, recoveryProgress: 0 });
    // and it continues from the old length
    expect(evaluateSquadDay({ vacation: false, members: [met, met, met], state }, SP).state.streak).toBe(11);
  });

  it('§4.4 one recovery per break: a failure in the recovery window loses the old length', () => {
    const { state } = run([[miss, miss, miss], [met, met, met], [miss, miss, miss], [met, met, met], [met, met, met]], { streak: 8, beforeBreak: null, recoveryProgress: 0 });
    // The second break kept only the streak of 1; recovering restores 1, not 8.
    expect(state.streak).toBe(2);
    expect(state.beforeBreak).toBeNull();
  });

  it('§4.4 frozen and vacation days in between do not use up the recovery', () => {
    const start = { streak: 5, beforeBreak: null, recoveryProgress: 0 };
    const { state } = run([[miss, miss, miss], [met, met, met], [met, met], [met, met, met]], start, [false, false, true, false]);
    expect(state.streak).toBe(5);
  });

  it('§4.4 a break from 0 leaves nothing to recover', () => {
    expect(evaluateSquadDay({ vacation: false, members: [miss, miss, miss], state: EMPTY_STREAK }, SP).state).toEqual(EMPTY_STREAK);
  });
});

describe('spec §4.4 Rustdag-joker: one per member per week, on the first missed goal, not saved up', () => {
  const week = dayRange('2026-12-07', '2026-12-13');
  const day = (d: string, over: Partial<{ active: boolean; goalMet: boolean; examDay: boolean; vacation: boolean }> = {}) => ({
    day: d,
    active: true,
    goalMet: true,
    examDay: false,
    vacation: false,
    ...over,
  });

  it('§4.4 the joker goes to the first missed goal of the week', () => {
    const days = week.map((d) => day(d, d === '2026-12-09' || d === '2026-12-11' ? { goalMet: false } : {}));
    expect(jokerDayOfWeek(days, SP)).toBe('2026-12-09');
  });

  it('§4.4 an exam day or a vacation day uses no joker; inactive days neither', () => {
    const days = week.map((d) =>
      day(d, d === '2026-12-07' ? { goalMet: false, examDay: true } : d === '2026-12-08' ? { goalMet: false, active: false } : d === '2026-12-10' ? { goalMet: false } : {}),
    );
    expect(jokerDayOfWeek(days, SP)).toBe('2026-12-10');
    expect(jokerDayOfWeek(week.map((d) => day(d, { goalMet: false, vacation: true })), SP)).toBeNull();
  });

  it('§4.4 a week without a missed goal uses no joker, and the next week starts fresh', () => {
    expect(jokerDayOfWeek(week.map((d) => day(d)), SP)).toBeNull();
    expect(jokerDayOfWeek(dayRange('2026-12-14', '2026-12-20').map((d) => day(d, d === '2026-12-14' ? { goalMet: false } : {})), SP)).toBe('2026-12-14');
  });
});

describe('spec §4.4 Automatische pauze and membership days', () => {
  it('§4.4 pause after 7 days without a completed session', () => {
    expect(pauseDue(['2026-12-01'], '2026-12-08', '2026-11-20', SP)).toBe(true);
    expect(pauseDue(['2026-12-02'], '2026-12-08', '2026-11-20', SP)).toBe(false);
    // a member who joined less than 7 days ago is not paused
    expect(pauseDue([], '2026-12-08', '2026-12-03', SP)).toBe(false);
    expect(pauseDue([], '2026-12-08', '2026-12-02', SP)).toBe(true);
  });

  it('§4.4 Vakantiepauze: vacation days do not count for the pause counter', () => {
    const vac = (d: string) => d >= '2026-12-21' && d <= '2027-01-03';
    expect(countingWindowStart('2027-01-05', 7, vac)).toBe('2026-12-16');
    expect(pauseDue(['2026-12-18'], '2027-01-05', '2026-11-01', SP, vac)).toBe(false);
    expect(pauseDue(['2026-12-15'], '2027-01-05', '2026-11-01', SP, vac)).toBe(true);
    expect(pauseDue([], '2026-12-25', '2026-11-01', SP, vac)).toBe(false);
  });

  it('§4.4 a member counts from the day after joining or returning, a leaver until the day of leaving', () => {
    const m = { activeFromDay: '2026-12-05', leftDay: null, pausedSinceDay: null };
    expect(memberCountsOn(m, '2026-12-04')).toBe(false);
    expect(memberCountsOn(m, '2026-12-05')).toBe(true);
    expect(memberCountsOn({ ...m, leftDay: '2026-12-10' }, '2026-12-10')).toBe(true);
    expect(memberCountsOn({ ...m, leftDay: '2026-12-10' }, '2026-12-11')).toBe(false);
    expect(memberCountsOn({ ...m, pausedSinceDay: '2026-12-12' }, '2026-12-11')).toBe(true);
    expect(memberCountsOn({ ...m, pausedSinceDay: '2026-12-12' }, '2026-12-12')).toBe(false);
  });
});

describe('spec §4.4 Squad uit elkaar, invite moments and merging', () => {
  it('§4.4 low activity below 2 members with a session; the route only runs in an exam period', () => {
    expect(isLowActivity(1, SP)).toBe(true);
    expect(isLowActivity(2, SP)).toBe(false);
    const periods = [{ first_day: '2026-12-02', last_day: '2027-01-17' }];
    expect(regroupOpen('2027-01-10', periods)).toBe(true);
    expect(regroupOpen('2027-02-10', periods)).toBe(false);
  });

  it('§4.4 merging only within the same club and the same rest-period arm, both below 2 active', () => {
    const a = { clubId: 'c1', armRest: 'rest', lowActivity: true, cohort: 'experiment' };
    expect(mergeAllowed(a, { ...a })).toBe('ok');
    expect(mergeAllowed(a, { ...a, armRest: 'continue' })).toBe('arm_mismatch');
    expect(mergeAllowed(a, { ...a, clubId: 'c2' })).toBe('not_eligible');
    expect(mergeAllowed(a, { ...a, lowActivity: false })).toBe('not_eligible');
  });

  it('§4.4 Uitnodigingsmomenten: a free spot and at most once per week', () => {
    const now = Date.parse('2026-12-10T12:00:00Z');
    expect(inviteMomentAllowed({ openSpots: 2, lastInviteAt: null, now }, SP)).toBe(true);
    expect(inviteMomentAllowed({ openSpots: 2, lastInviteAt: now - 3 * 86_400_000, now }, SP)).toBe(false);
    expect(inviteMomentAllowed({ openSpots: 2, lastInviteAt: now - 7 * 86_400_000, now }, SP)).toBe(true);
    expect(inviteMomentAllowed({ openSpots: 0, lastInviteAt: null, now }, SP)).toBe(false);
  });
});

describe('architecture §6.4 privacy rules (core/privacy)', () => {
  it('§6.4 rule 2: counts rounded to fives, hidden below 5 members', () => {
    expect([0, 2, 3, 17, 18, 22, 23].map((n) => roundTo(n, 5))).toEqual([0, 0, 5, 15, 20, 20, 25]);
    expect(suppressCount(4, 4, BOARD)).toMatchObject({ value: null, suppressed: true });
    expect(suppressCount(3, 20, BOARD)).toMatchObject({ value: 5, suppressed: false });
  });

  it('§6.4 rule 2: shares from the rounded counts', () => {
    expect(shareFromRounded(7, 22, BOARD).value).toBe(0.25);
    expect(shareFromRounded(1, 4, BOARD).suppressed).toBe(true);
  });

  it('§6.4 rule 3 (verschiltest): a change below 5 since the last shown week is hidden', () => {
    const s = weeklyCountSeries(
      [20, 21, 19, 24, 25, 25, 31].map((count) => ({ count, groupSize: count })),
      BOARD,
    );
    expect(s.map((m) => m.value)).toEqual([20, null, null, null, 25, 25, 30]);
    expect(s[1]).toMatchObject({ suppressed: true, reason: 'small_change' });
  });

  it('§6.4 rule 3 compares with the last shown week, so hidden small steps cannot be summed', () => {
    const s = weeklyCountSeries([20, 22, 24, 26].map((count) => ({ count, groupSize: count })), BOARD);
    expect(s.map((m) => m.value)).toEqual([20, null, null, 25]);
  });

  it('§6.4 deleting one member of twenty changes no shown number (difference test)', () => {
    const before = weeklyCountSeries([{ count: 20, groupSize: 20 }], BOARD);
    const after = weeklyCountSeries([{ count: 20, groupSize: 20 }, { count: 19, groupSize: 19 }], BOARD);
    expect(before[0]!.value).toBe(20);
    expect(after[1]!.value).toBeNull();
  });
});

describe('architecture §6.2 participation rate, recalculated by hand', () => {
  const week = '2027-01-04';
  const days = dayRange(week, addDays(week, 6));
  const weekEndAt = focusDayEnd(addDays(week, 6), PARAMS_V1);
  const link = (userId: string | null, over: Partial<ClubLink> = {}): ClubLink => ({ userId, linkedFromDay: '2026-12-01', linkedUntilDay: null, anchorAt: Date.parse('2026-12-01T10:00:00Z'), ...over });
  const md = (userId: string, n: number, over: Partial<ChallengeMemberDay> = {}, minutes = 60): ChallengeMemberDay[] =>
    days.slice(0, n).map((day) => ({ userId, day, goalMetFinal: true, examDay: false, countedMinFinal: minutes, completedSession: true, ...over }));

  it('§6.2 numerator: ≥ 3 goal days; joker and exam days do not count; denominator max(declared, linked at week start)', () => {
    const links = [link('a'), link('b'), link('c'), link('d'), link('e'), link(null)];
    const facts = [
      ...md('a', 3), // 3 goal days: counts
      ...md('b', 2), // 2 goal days: not
      ...md('c', 4, { examDay: true }), // exam days do not count as met
      ...md('d', 3, { goalMetFinal: false }, 30), // active, no goal days
    ];
    const s = participationWeek({ weekStart: week, links, days: facts, declaredMembers: 40, prizeWeek: false, weekEndAt }, CP);
    expect(s.numerator).toBe(1);
    expect(s.denominator).toBe(40);
    expect(s.participationRate).toBeCloseTo(1 / 40);
    // active members: a, b, c, d (≥ 1 completed session); e and the deleted link are not
    expect(s.activeMembers).toBe(4);
    // intensity: (3×60 + 2×60 + 4×60 + 3×30) / (4 × 7)
    expect(s.intensityMin).toBeCloseTo((180 + 120 + 240 + 90) / 28);
    // more links than declared: the denominator cannot shrink (spec §4.6)
    const many = participationWeek({ weekStart: week, links: [...links, ...Array.from({ length: 40 }, (_, i) => link(`x${i}`))], days: facts, declaredMembers: 40, prizeWeek: false, weekEndAt }, CP);
    expect(many.denominator).toBe(46);
  });

  it('§6.2 only days on which the member was linked count; a leaver stays in the denominator', () => {
    const links = [link('a', { linkedFromDay: addDays(week, 4) }), link('b', { linkedUntilDay: addDays(week, 1) })];
    const facts = [...md('a', 7), ...md('b', 7)];
    const s = participationWeek({ weekStart: week, links, days: facts, declaredMembers: 2, prizeWeek: false, weekEndAt }, CP);
    // a: linked Fri–Sun = 3 goal days → counts; b: Mon–Tue only = 2 → not
    expect(s.numerator).toBe(1);
    expect(s.linkedAtWeekStart).toBe(1);
    expect(s.denominator).toBe(2);
  });

  it('§6.2 in prize weeks only members with an identity anchor set before the week end (also in the week of confirming)', () => {
    const links = [
      link('a', { anchorAt: null }),
      link('b', { anchorAt: Date.parse('2027-01-08T12:00:00Z') }),
      link('c', { anchorAt: weekEndAt + 1 }),
      link('d'),
    ];
    const facts = ['a', 'b', 'c', 'd'].flatMap((u) => md(u, 3));
    const prize = participationWeek({ weekStart: week, links, days: facts, declaredMembers: 10, prizeWeek: true, weekEndAt }, CP);
    const warm = participationWeek({ weekStart: week, links, days: facts, declaredMembers: 10, prizeWeek: false, weekEndAt }, CP);
    expect(prize.numerator).toBe(2);
    expect(warm.numerator).toBe(4);
    // members without an anchor stay in the denominator
    expect(prize.denominator).toBe(10);
  });

  it('§6.2 intensity caps minutes at 300 and leaves vacation days out of the denominator', () => {
    const facts = md('a', 2, {}, 480);
    const s = participationWeek({ weekStart: '2026-12-21', links: [link('a')], days: facts.map((f, i) => ({ ...f, day: addDays('2026-12-21', i) })), declaredMembers: 1, prizeWeek: false, weekEndAt, vacationDays: ['2026-12-23', '2026-12-24', '2026-12-25', '2026-12-26', '2026-12-27'] }, CP);
    expect(s.intensityMin).toBeCloseTo((300 + 300) / 2);
  });

  it('§6.2 prize-period score is the mean of the two prize weeks ending on T; threshold 25%', () => {
    expect(prizeWeeksFor('2027-01-17')).toEqual(['2027-01-04', '2027-01-11']);
    expect(prizePeriodScore([0.2, 0.3])).toBeCloseTo(0.25);
    expect(meetsThreshold(0.25, CP)).toBe(true);
    expect(meetsThreshold(0.249, CP)).toBe(false);
  });
});

describe('spec §4.6 pools, ranking and code cap', () => {
  const row = (clubId: string, pool: 'lt150' | '150_500' | 'gt500', rate: number, intensity = 50, linked = 20) => ({ clubId, pool, linkedMembers: linked, participationRate: rate, intensityMin: intensity });

  it('§4.6 pools by declared members (< 150, 150–500, > 500) and code cap floor(1.1 ×)', () => {
    expect([149, 150, 500, 501].map((n) => poolFor(n, CP))).toEqual(['lt150', '150_500', '150_500', 'gt500']);
    expect(codeCap(100, CP)).toBe(110);
    expect(codeCap(45, CP)).toBe(49);
  });

  it('§4.6 rank by participation rate, then intensity, then a shared place', () => {
    const [pool] = rankPools([row('a', 'lt150', 0.3, 40), row('b', 'lt150', 0.3, 60), row('c', 'lt150', 0.2), row('d', 'lt150', 0.2)], CP);
    expect(pool!.rows.map((r) => [r.clubId, r.rank])).toEqual([['b', 1], ['a', 2], ['c', 3], ['d', 3]]);
  });

  it('§4.6 only clubs with ≥ 15 linked members are ranked; a pool below 3 clubs merges with its neighbour', () => {
    const pools = rankPools([row('a', 'lt150', 0.3), row('b', 'lt150', 0.2), row('c', '150_500', 0.4), row('d', '150_500', 0.1), row('e', '150_500', 0.2), row('f', 'gt500', 0.5, 50, 10)], CP);
    expect(pools).toHaveLength(1);
    expect(pools[0]!.members).toEqual(['lt150', '150_500']);
    expect(pools[0]!.rows.map((r) => r.clubId)).toEqual(['c', 'a', 'b', 'e', 'd']);
    const groups = mergePools([row('a', 'lt150', 0), row('b', 'lt150', 0), row('c', 'lt150', 0), row('d', 'gt500', 0)], CP);
    expect(groups.map((g) => g.members)).toEqual([['lt150', 'gt500']]);
  });
});

describe('spec §4.7 performance challenge with fixed seats', () => {
  it('§4.7 a predicate over the days of the period; no race', () => {
    const period = { first_day: '2027-01-11', last_day: '2027-01-17' };
    const days = dayRange('2027-01-11', '2027-01-17').map((d) => ({ day: d, countedMinFinal: 130 }));
    expect(performanceProgress(period, days, { dayMinutes: 120 }, '2027-01-17').status).toBe('achieved');
    const missed = days.map((d, i) => (i === 2 ? { ...d, countedMinFinal: 100 } : d));
    expect(performanceProgress(period, missed, { dayMinutes: 120 }, '2027-01-17').status).toBe('failed');
    expect(performanceProgress(period, missed.slice(0, 2), { dayMinutes: 120 }, '2027-01-12').status).toBe('enrolled');
    expect(nextSeat([1, 2, 4], 4)).toBe(3);
    expect(nextSeat([1, 2], 2)).toBeNull();
  });
});

describe('spec §4.12 Belofte', () => {
  const cal = { tDay: '2027-01-17', aEndDay: '2027-04-16' };
  it('§4.12 Aanbod: early arm on T − 6, late arm the day after A, expansion on day 14, opted out early', () => {
    expect(offerDueDay({ cohort: 'experiment', arm: 'early', optedOut: false, registeredDay: '2026-12-03', calendar: cal }, BP)).toEqual({ trigger: 'early', dueDay: '2027-01-11' });
    expect(offerDueDay({ cohort: 'experiment', arm: 'late', optedOut: false, registeredDay: '2026-12-03', calendar: cal }, BP)).toEqual({ trigger: 'late', dueDay: '2027-04-17' });
    expect(offerDueDay({ cohort: 'expansion', arm: null, optedOut: false, registeredDay: '2027-02-10', calendar: cal }, BP)).toEqual({ trigger: 'outside', dueDay: '2027-02-24' });
    expect(offerDueDay({ cohort: 'experiment', arm: 'late', optedOut: true, registeredDay: '2026-12-03', calendar: cal }, BP)?.trigger).toBe('early');
  });

  it('§4.12 Voorstel: what the user actually did in 14 days, rounded down to the fixed values', () => {
    const days = [100, 95, 60, 0, 0, 55, 30, 0, 52, 0, 0, 0, 0, 0].map((verifiedMin) => ({ verifiedMin }));
    // 6 active days in two weeks → 3 per week (min 3); median of 30, 52, 55, 60, 95, 100 = 57.5 → 50
    expect(suggestBelofte(days, BP)).toEqual({ daysPerWeek: 3, minPerDay: 50 });
    expect(suggestBelofte([], BP)).toEqual({ daysPerWeek: 3, minPerDay: 25 });
    expect(floorToOption(119, BP.minutes_options)).toBe(90);
  });

  it('§4.12 Looptijd: 14 days, vacation days do not count; day result and reflection', () => {
    const vac = (d: string) => d >= '2026-12-21' && d <= '2027-01-03';
    expect(belofteEndDay('2027-01-11', vac, BP)).toBe('2027-01-24');
    expect(belofteEndDay('2026-12-15', vac, BP)).toBe('2027-01-11');
    expect(belofteDays('2026-12-15', '2027-01-11', vac)).toHaveLength(14);
    expect(belofteSummary([{ met: true }, { met: false }, { met: true }], 6, BP)).toEqual({ met: 2, target: 12 });
    expect(reflectionDue({ endDay: '2027-01-24', status: 'active' }, '2027-01-25')).toBe(true);
    expect(reflectionDue({ endDay: '2027-01-24', status: 'stopped' }, '2027-01-25')).toBe(false);
    expect(ratioToHistory(50, 4, { daysPerWeek: 4, minPerDay: 25 })).toBe(2);
  });
});

describe('spec §4.9 referral vesting', () => {
  const created = Date.parse('2027-01-06T10:00:00Z');
  const base: VestingInput = {
    createdAt: created,
    now: created + 3 * 86_400_000,
    sessions: [1, 2, 3].map((d) => ({ startAt: created + d * 3_600_000, verifiedMin: 25, completed: true, rejected: false })),
    inviteeFirstRedeemAfter: created + 86_400_000,
    sameDevice: false,
    sameIpWithin24h: false,
    samePhone: false,
    inviterVestedThisMonth: 0,
  };

  it('§4.9 3 completed sessions of ≥ 25 min within 7 × 24 h and the hold over: vested', () => {
    expect(evaluateVesting(base, RP)).toEqual({ status: 'vested', qualifyingSessions: 3 });
    const short = { ...base, sessions: base.sessions.map((s, i) => (i === 0 ? { ...s, verifiedMin: 1 } : s)) };
    expect(qualifyingSessions(short, RP)).toBe(2);
    expect(evaluateVesting(short, RP).status).toBe('pending');
    expect(evaluateVesting({ ...short, now: created + 7 * 86_400_000 }, RP)).toMatchObject({ status: 'lapsed', reason: 'deadline' });
  });

  it('§4.9 the first-redeem hold delays vesting without lapsing', () => {
    expect(evaluateVesting({ ...base, inviteeFirstRedeemAfter: null, now: created + 30 * 86_400_000 }, RP).status).toBe('pending');
  });

  it('§4.9 Uitsluiting: same device lapses; same IP hash or phone goes to a human; max 5 per month', () => {
    expect(evaluateVesting({ ...base, sameDevice: true }, RP)).toMatchObject({ status: 'lapsed', reason: 'same_device' });
    expect(evaluateVesting({ ...base, sameIpWithin24h: true }, RP)).toMatchObject({ status: 'review', reason: 'same_ip' });
    expect(evaluateVesting({ ...base, samePhone: true }, RP)).toMatchObject({ status: 'review', reason: 'same_phone' });
    expect(evaluateVesting({ ...base, inviterVestedThisMonth: 5 }, RP)).toMatchObject({ status: 'lapsed', reason: 'monthly_cap' });
  });

  it('§4.9 Rustperiode: the party in the rest period vests after its April window or after its rest exit', () => {
    expect(partyVestDay('2027-02-01', { inRest: false, afterRestDay: '2027-04-17', afterExitDay: null })).toBe('2027-02-01');
    expect(partyVestDay('2027-02-01', { inRest: true, afterRestDay: '2027-04-17', afterExitDay: null })).toBe('2027-04-17');
    expect(partyVestDay('2027-02-01', { inRest: true, afterRestDay: '2027-04-17', afterExitDay: '2027-02-10' })).toBe('2027-02-10');
    expect(referralLive('2027-01-04', true, RP)).toBe(false);
    expect(referralLive('2027-01-05', true, RP)).toBe(true);
    expect(referralLive('2027-01-05', false, RP)).toBe(false);
  });
});
