// WP-4: core/goals (spec §4.4, §3.13, §5) and core/catalog (spec §4.3, architecture §5.3).
import { describe, expect, it } from 'vitest';
import { PARAMS_V1 } from '../src/params/index.ts';
import {
  armBWeeklyGrant,
  earnArmFor,
  examDayAllowed,
  goalEffectiveFrom,
  goalForDay,
  goalSuggestion,
  inGoalSeason,
  needsOverreachConfirm,
  personalBonusArm,
} from '../src/goals/index.ts';
import {
  allocationFits,
  cancelFits,
  coverageShortfall,
  freeCents,
  isKindAllowed,
  isLowStock,
  itemCeilingOk,
  monthCeilingOk,
  pointsPrice,
  scheduleChangeAllowed,
  spreadRelease,
} from '../src/catalog/index.ts';

const P = PARAMS_V1;

describe('core/goals', () => {
  it('§4.4 a goal change applies from the next focus day', () => {
    expect(goalEffectiveFrom('2026-12-03')).toBe('2026-12-04');
    const changes = [{ goalMin: 50, effectiveFrom: '2026-12-04' }, { goalMin: 90, effectiveFrom: '2026-12-10' }];
    expect(goalForDay(changes, '2026-12-03', 25)).toBe(25);
    expect(goalForDay(changes, '2026-12-05', 25)).toBe(50);
    expect(goalForDay(changes, '2026-12-11', 25)).toBe(90);
  });

  it('§4.4 Overmoedrem: 90 or 120 in the first 7 days needs confirmation; suggestion after 7 days', () => {
    expect(needsOverreachConfirm(P, 90, 2)).toBe(true);
    expect(needsOverreachConfirm(P, 50, 2)).toBe(false);
    expect(needsOverreachConfirm(P, 120, 7)).toBe(false);
    expect(goalSuggestion(P, [30, 60, 55, 0])).toBe(50);
    expect(goalSuggestion(P, [10, 12])).toBe(25);
    expect(goalSuggestion(P, [])).toBeNull();
  });

  it('§3.13 at most 3 exam days per calendar week, never in the past', () => {
    expect(examDayAllowed(P, '2026-12-07', '2026-12-08', ['2026-12-07', '2026-12-09'])).toBe('ok');
    expect(examDayAllowed(P, '2026-12-07', '2026-12-10', ['2026-12-07', '2026-12-08', '2026-12-09'])).toBe('EXAM_DAY_LIMIT');
    expect(examDayAllowed(P, '2026-12-07', '2026-12-14', ['2026-12-07', '2026-12-08', '2026-12-09'])).toBe('ok');
    expect(examDayAllowed(P, '2026-12-07', '2026-12-06', [])).toBe('PERIOD_LOCKED');
  });

  it('§5 arm B weekly budget: 140 on a full week, 20 × remaining bonus days mid-week, none in the vacation pause', () => {
    expect(armBWeeklyGrant(P, '2026-12-07', '2026-12-07')).toBe(140);
    expect(armBWeeklyGrant(P, '2026-12-07', '2026-12-10')).toBe(80);
    expect(armBWeeklyGrant(P, '2026-11-30', '2026-11-30')).toBe(100); // season starts Wednesday 2 December
    expect(armBWeeklyGrant(P, '2026-12-21', '2026-12-21')).toBe(0);
    expect(inGoalSeason(P, '2026-12-02')).toBe(true);
    expect(inGoalSeason(P, '2027-01-18')).toBe(false);
  });

  it('§5 Toewijzing: minors and opted-out users personally get arm A and continuous points', () => {
    expect(personalBonusArm('B', '16_17', false)).toBe('A');
    expect(personalBonusArm('B', '18_plus', true)).toBe('A');
    expect(personalBonusArm('B', '18_plus', false)).toBe('B');
    const base = { ageBand: '18_plus' as const, optedOut: false, restArm: 'rest' as const, restPeriodEnabled: true, restExitFromDay: null };
    expect(earnArmFor(P, '2027-02-01', base)).toBe('rest');
    expect(earnArmFor(P, '2027-02-01', { ...base, ageBand: '16_17' })).toBe('earn');
    expect(earnArmFor(P, '2027-02-01', { ...base, restExitFromDay: '2027-01-30' })).toBe('earn');
    expect(earnArmFor(P, '2027-02-01', { ...base, restPeriodEnabled: false })).toBe('earn');
    expect(earnArmFor(P, '2027-04-01', base)).toBe('earn');
  });
});

describe('core/catalog', () => {
  it('§4.3 Puntenprijs: cost ÷ budget value per point, rounded to 50', () => {
    expect(pointsPrice(P, 300, 0.5)).toBe(600);
    expect(pointsPrice(P, 320, 0.5)).toBe(650);
    expect(pointsPrice(P, 10, 1)).toBe(50);
  });

  it('§4.3 Europlafonds: item ≤ €5 and ≤ €15 per person per month on level 1', () => {
    expect(itemCeilingOk(P, 1, 500)).toBe(true);
    expect(itemCeilingOk(P, 1, 501)).toBe(false);
    expect(monthCeilingOk(P, 1, 1000, 500)).toBe(true);
    expect(monthCeilingOk(P, 1, 1100, 500)).toBe(false);
  });

  it('§4.3 / arch §5.3 money and freely spendable credit are never an allowed kind', () => {
    for (const k of ['in_kind', 'service', 'partner_discount']) expect(isKindAllowed(P, 1, k)).toBe(true);
    for (const k of ['store_credit', 'gift_card_open', 'cash_equivalent', 'cash']) expect(isKindAllowed(P, 1, k)).toBe(false);
  });

  it('§4.3 Budgetdekking: allocations never exceed the coverable budget; cancel only within free room', () => {
    const b = { bookedCents: 150_000, cancelledCents: 0, rewardPct: 100 };
    expect(freeCents(b, 100_000)).toBe(50_000);
    expect(allocationFits(b, 100_000, 50_000)).toBe(true);
    expect(allocationFits(b, 100_000, 50_001)).toBe(false);
    expect(cancelFits(b, 100_000, 50_000)).toBe(true);
    expect(cancelFits(b, 100_000, 50_001)).toBe(false);
    expect(freeCents({ bookedCents: 10_000, cancelledCents: 0, rewardPct: 20 }, 0)).toBe(2_000);
  });

  it('§4.3 Weekvrijgave: spread over seven days with half reserved for the institution anchor', () => {
    const { perDay, anchorPerDay } = spreadRelease(P, 40);
    expect(perDay).toEqual([6, 6, 6, 6, 6, 5, 5]);
    expect(perDay.reduce((a, b) => a + b, 0)).toBe(40);
    expect(anchorPerDay.reduce((a, b) => a + b, 0)).toBe(20);
    expect(isLowStock(P, 3, 40)).toBe(true);
    expect(isLowStock(P, 4, 40)).toBe(false);
  });

  it('§4.3 dekkingsalarm and SCHEDULE_LOCKED', () => {
    expect(coverageShortfall(120, 40)).toBe(80);
    expect(coverageShortfall(30, 40)).toBe(0);
    expect(scheduleChangeAllowed(true, 40, 39)).toBe(false);
    expect(scheduleChangeAllowed(true, 40, 41)).toBe(true);
  });
});
