// WP-4: reconcileDay (architecture §5.1) with scenario tests and fast-check properties (§11).
import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { PARAMS_V1 } from '../src/params/index.ts';
import { fromLocal } from '../src/time/index.ts';
import {
  balancesOf,
  bookedDayFrom,
  emptyBookedDay,
  isValidPosting,
  reconcileDay,
  redeemSplit,
  type BonusArm,
  type Cause,
  type DaySession,
  type EarnArm,
  type JournalEntryDraft,
  type LedgerParams,
  type ReconcileDayInput,
} from '../src/ledger/index.ts';

const LP: LedgerParams = { dailyCapMin: 300, pointsPerVerifiedMin: 1, goalBonusPoints: 20, paramVersion: 1 };
const DAY = '2026-12-03';
const at = (h: number, m = 0) => fromLocal(2026, 12, 3, h, m);

function sess(id: string, startH: number, verifiedMin: number, over: Partial<DaySession> = {}): DaySession {
  return { sessionId: id, serverStartAt: at(startH), status: 'completed', reviewStatus: 'none', verifiedMin, lateStart: false, isPractice: false, openFlagIds: [], ...over };
}

interface Ledger {
  entries: JournalEntryDraft[];
}
function run(ledger: Ledger, sessions: DaySession[], o: { arm?: BonusArm | null; cause?: Cause; rev?: number; goalMin?: number; examDay?: boolean; earnArm?: EarnArm; inSeason?: boolean; dayClosed?: boolean } = {}) {
  const input: ReconcileDayInput = {
    userId: 'u1', day: DAY, week: '2026-11-30', arm: o.arm === undefined ? 'A' : o.arm, inSeason: o.inSeason ?? true,
    goalMin: o.goalMin ?? 50, sessions, booked: bookedDayFrom(ledger.entries), cause: o.cause ?? { type: 'session_end', sessionId: 'x' },
    rev: o.rev ?? 1, params: LP, examDay: o.examDay ?? false, earnArm: o.earnArm ?? 'earn', ...(o.dayClosed !== undefined ? { dayClosed: o.dayClosed } : {}),
  };
  const res = reconcileDay(input);
  for (const e of res.entries) expect(isValidPosting(e.type, e.postings), e.idempotencyKey).toBe(true);
  ledger.entries.push(...res.entries);
  // Idempotent: the same input against the new journal yields nothing.
  expect(reconcileDay({ ...input, booked: bookedDayFrom(ledger.entries) }).entries).toEqual([]);
  return res;
}
const own = (l: Ledger) => balancesOf(l.entries).byKind.available_own;
const pend = (l: Ledger) => balancesOf(l.entries).byKind.pending_session;
const grant = (amount: number): JournalEntryDraft => ({
  type: 'goal_budget_grant', idempotencyKey: 'goal_grant:u1:2026-11-30', refType: 'week', refId: '2026-11-30', actor: 'system', paramVersion: 1,
  postings: [{ account: 'system:issuance', amount: -amount }, { account: 'user:pending_goal_budget', amount }],
});

describe('reconcileDay — spec §4.2 and architecture §5.1 rules', () => {
  it('§4.2 earn_session: 1 point per verified minute, available directly, key earn:{session}', () => {
    const l: Ledger = { entries: [] };
    const r = run(l, [sess('s1', 10, 25)], { goalMin: 50 });
    expect(r.entries.map((e) => e.idempotencyKey)).toEqual(['earn:s1']);
    expect(own(l)).toBe(25);
    expect(r.userDay).toMatchObject({ verifiedMin: 25, countedMin: 25, goalMet: false, goalState: 'none' });
  });

  it('§4.2 Puntenplafond: six sessions of 90 → counted 300, verified 540', () => {
    const l: Ledger = { entries: [] };
    const sessions = [9, 11, 13, 15, 17, 19].map((h, i) => sess(`s${i}`, h, 90));
    const r = run(l, sessions, { arm: null });
    expect(r.userDay.countedMin).toBe(300);
    expect(r.userDay.verifiedMin).toBe(540);
    expect(own(l)).toBe(300);
  });

  it('§4.2 doelbonus arm A: +20 available when the goal is met; key goal_bonus:{user}:{day}', () => {
    const l: Ledger = { entries: [] };
    const r = run(l, [sess('s1', 10, 50)], { arm: 'A' });
    expect(r.entries.map((e) => e.type)).toEqual(['earn_session', 'goal_bonus']);
    expect(own(l)).toBe(70);
    expect(r.userDay).toMatchObject({ goalMet: true, goalBonusEligible: true, goalState: 'available' });
  });

  it('§4.2 Nachtregel: a session started 01:00–04:00 counts for points and goal, not for the bonus', () => {
    const l: Ledger = { entries: [] };
    const r = run(l, [sess('s1', 2, 50, { lateStart: true })], { arm: 'A' });
    expect(own(l)).toBe(50);
    expect(r.userDay).toMatchObject({ goalMet: true, goalBonusEligible: false });
    const lb: Ledger = { entries: [grant(140)] };
    run(lb, [sess('s1', 2, 50, { lateStart: true })], { arm: 'B', cause: { type: 'day_close' } });
    expect(lb.entries.some((e) => e.type === 'goal_budget_lapse')).toBe(true);
  });

  it('§5 arm B: secure 20 on a met goal; lapse 20 at day close on a missed goal', () => {
    const met: Ledger = { entries: [grant(140)] };
    run(met, [sess('s1', 10, 50)], { arm: 'B' });
    expect(own(met)).toBe(70);
    expect(balancesOf(met.entries).byKind.pending_goal_budget).toBe(120);
    const missed: Ledger = { entries: [grant(140)] };
    run(missed, [sess('s1', 10, 25)], { arm: 'B' });
    expect(missed.entries.some((e) => e.type === 'goal_budget_lapse')).toBe(false);
    run(missed, [sess('s1', 10, 25)], { arm: 'B', cause: { type: 'day_close' } });
    expect(balancesOf(missed.entries).byKind.pending_goal_budget).toBe(120);
  });

  it('§3.13 tentamendag arm B: the 20 lapse silently with reason exam_day', () => {
    const l: Ledger = { entries: [grant(140)] };
    const r = run(l, [], { arm: 'B', examDay: true, cause: { type: 'day_close' } });
    const lapse = r.entries.find((e) => e.type === 'goal_budget_lapse');
    expect(lapse?.reasonCode).toBe('exam_day');
    expect(r.userDay.goalState).toBe('exam');
  });

  it('§4.2 Seizoen: outside the season (or in the vacation pause) no bonus and no budget', () => {
    const l: Ledger = { entries: [] };
    run(l, [sess('s1', 10, 50)], { arm: 'A', inSeason: false });
    expect(l.entries.map((e) => e.type)).toEqual(['earn_session']);
  });

  it('§4.2 Rustperiode: earnArm rest books no earn_session, goal still counts', () => {
    const l: Ledger = { entries: [] };
    const r = run(l, [sess('s1', 10, 50)], { arm: null, earnArm: 'rest' });
    expect(l.entries).toEqual([]);
    expect(r.userDay).toMatchObject({ countedMin: 0, verifiedMin: 50, goalMet: true });
  });

  it('§5.1 flagged session: points pending; release moves them; the bonus follows', () => {
    const l: Ledger = { entries: [] };
    run(l, [sess('s1', 10, 50, { reviewStatus: 'pending', openFlagIds: ['f1'] })], { arm: 'A' });
    expect(pend(l)).toBe(70);
    run(l, [sess('s1', 10, 50, { reviewStatus: 'released' })], { arm: 'A', cause: { type: 'flag_decision', flagId: 'f1' }, rev: 2 });
    expect(own(l)).toBe(70);
    expect(pend(l)).toBe(0);
    expect(l.entries.map((e) => e.idempotencyKey)).toContain('release:f1:s1');
  });

  it('§5.1 reject an earlier session on a capped day: reverse for it, earn_topup for the later one, bonus per §5.1', () => {
    const l: Ledger = { entries: [] };
    const s = [sess('a', 9, 90), sess('b', 11, 90), sess('c', 13, 90), sess('d', 15, 90, { reviewStatus: 'none' })];
    run(l, s, { arm: 'A', goalMin: 120 });
    expect(own(l)).toBe(320);
    const after = run(l, [{ ...s[0]!, reviewStatus: 'rejected' }, s[1]!, s[2]!, s[3]!], { arm: 'A', goalMin: 120, cause: { type: 'flag_decision', flagId: 'f9' }, rev: 2 });
    expect(after.entries.map((e) => e.type)).toEqual(['reverse', 'earn_topup']);
    expect(after.entries.map((e) => e.idempotencyKey)).toEqual(['reverse:f9:a', 'earn_topup:d:r2']);
    expect(own(l)).toBe(290); // 90 + 90 + 90 + bonus 20
  });

  it('§4.8 a restored earlier session only gets what is left under the cap', () => {
    const l: Ledger = { entries: [] };
    const later = [sess('b', 11, 90), sess('c', 13, 90), sess('d', 15, 90)];
    run(l, later, { arm: null });
    run(l, [sess('a', 9, 90), ...later], { arm: null, cause: { type: 'restore', sessionId: 'a' }, rev: 2 });
    const booked = bookedDayFrom(l.entries).sessions;
    expect(booked.a).toEqual({ available: 30, pending: 0 });
    expect(booked.d).toEqual({ available: 90, pending: 0 });
  });

  it('§5.1 a flag after points were available leaves them available until the decision', () => {
    const l: Ledger = { entries: [] };
    run(l, [sess('s1', 10, 25)], { arm: null });
    const r = run(l, [sess('s1', 10, 25, { reviewStatus: 'pending', openFlagIds: ['f1'] })], { arm: null, cause: { type: 'day_close' } });
    expect(r.entries).toEqual([]);
    expect(own(l)).toBe(25);
  });

  it('§3.4 redeem split: at most half of a price from referral points', () => {
    expect(redeemSplit(500, 400, 300, 50)).toEqual({ own: 250, referral: 250 });
    expect(redeemSplit(500, 100, 450, 50)).toBe('REFERRAL_SHARE_EXCEEDED');
    expect(redeemSplit(500, 100, 100, 50)).toBe('INSUFFICIENT_POINTS');
  });
});

// Property tests (architecture §11 "Eigenschappen").
type Final = 'none' | 'released' | 'rejected';
const sessionArb = fc.record({
  min: fc.constantFrom(25, 50, 90),
  late: fc.boolean(),
  completed: fc.boolean(),
  final: fc.constantFrom<Final>('none', 'released', 'rejected', 'released'),
  flagged: fc.boolean(),
});
const scenarioArb = fc.record({
  sessions: fc.array(sessionArb, { minLength: 0, maxLength: 7 }),
  arm: fc.constantFrom<BonusArm | null>('A', 'B', null),
  goalMin: fc.constantFrom(25, 50, 90, 120),
  examDay: fc.boolean(),
  earnArm: fc.constantFrom<EarnArm>('earn', 'earn', 'rest'),
  seed: fc.integer({ min: 0, max: 1_000_000 }),
});

function shuffle<T>(xs: T[], seed: number): T[] {
  const out = [...xs];
  let s = seed || 1;
  for (let i = out.length - 1; i > 0; i--) {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    const j = s % (i + 1);
    [out[i], out[j]] = [out[j] as T, out[i] as T];
  }
  return out;
}

describe('reconcileDay — properties (fast-check)', () => {
  it('§11 every sequence closes on zero, respects the daily cap of 300, is idempotent and converges', () => {
    fc.assert(
      fc.property(scenarioArb, (sc) => {
        const finals: DaySession[] = sc.sessions.map((s, i) => ({
          ...sess(`s${i}`, 6 + i * 2, s.min, { lateStart: s.late }),
          status: s.completed ? 'completed' : 'aborted',
          verifiedMin: s.completed ? s.min : 0,
          reviewStatus: s.completed && s.flagged ? s.final : 'none',
        }));
        const flagged = (d: DaySession): DaySession => (d.reviewStatus === 'none' ? d : { ...d, reviewStatus: 'pending', openFlagIds: [`f_${d.sessionId}`] });
        const l: Ledger = { entries: sc.arm === 'B' ? [grant(140)] : [] };
        const opts = { arm: sc.arm, goalMin: sc.goalMin, examDay: sc.examDay, earnArm: sc.earnArm };
        const state = new Map<string, DaySession>();
        let rev = 1;
        const step = (cause: Cause, dayClosed = false) => {
          const res = run(l, [...state.values()], { ...opts, cause, rev, dayClosed });
          const totals = Object.values(bookedDayFrom(l.entries).sessions).reduce((t, b) => t + b.available + b.pending, 0);
          expect(totals).toBeLessThanOrEqual(300);
          for (const e of l.entries) expect(e.postings.reduce((t, p) => t + p.amount, 0)).toBe(0);
          return res;
        };
        // Sessions end in random order (flagged ones start pending), then decisions in random order.
        for (const f of shuffle(finals, sc.seed)) {
          state.set(f.sessionId, flagged(f));
          step({ type: 'session_end', sessionId: f.sessionId });
        }
        step({ type: 'day_close' }, true);
        for (const f of shuffle(finals.filter((d) => d.reviewStatus !== 'none'), sc.seed + 7)) {
          rev += 1;
          state.set(f.sessionId, f);
          step({ type: 'flag_decision', flagId: `f_${f.sessionId}` }, true);
        }
        // Convergence: the same final state booked from zero gives the same available balance.
        const scratch: Ledger = { entries: sc.arm === 'B' ? [grant(140)] : [] };
        run(scratch, finals, { ...opts, cause: { type: 'day_close' }, rev: 1, dayClosed: true });
        expect(own(l)).toBe(own(scratch));
        expect(pend(l)).toBe(0);
        // Session points per session equal the counted minutes.
        const booked = bookedDayFrom(l.entries).sessions;
        const counted = Object.values(booked).reduce((t, b) => t + b.available, 0);
        const r = reconcileDay({ userId: 'u1', day: DAY, week: '2026-11-30', arm: sc.arm, inSeason: true, goalMin: sc.goalMin, sessions: finals, booked: bookedDayFrom(l.entries), cause: { type: 'day_close' }, rev: rev + 1, params: LP, examDay: sc.examDay, earnArm: sc.earnArm, dayClosed: true });
        expect(r.userDay.countedMin).toBe(counted);
      }),
      { numRuns: 400 },
    );
  });

  it('§11 arm A and arm B give the same maximum bonus for the same week of outcomes', () => {
    const outcome = fc.constantFrom('met', 'missed', 'exam', 'night', 'exam_met');
    fc.assert(
      fc.property(fc.array(outcome, { minLength: 7, maxLength: 7 }), (week) => {
        const bonusFor = (arm: BonusArm) => {
          let total = 0;
          week.forEach((o, i) => {
            const day = `2026-12-${String(7 + i).padStart(2, '0')}`;
            const sessions = o === 'met' || o === 'exam_met' ? [sess('s', 10, 50)] : o === 'night' ? [sess('s', 2, 50, { lateStart: true })] : [];
            const l: Ledger = { entries: arm === 'B' ? [grant(20)] : [] };
            const r = reconcileDay({ userId: 'u', day, week: '2026-12-07', arm, inSeason: true, goalMin: 50, sessions, booked: bookedDayFrom(l.entries), cause: { type: 'day_close' }, rev: 1, params: LP, examDay: o.startsWith('exam'), earnArm: 'earn' });
            const goal = r.entries.filter((e) => e.refType === 'user_day');
            total += balancesOf(goal).byKind.available_own;
          });
          return total;
        };
        expect(bonusFor('A')).toBe(bonusFor('B'));
        expect(bonusFor('A')).toBeLessThanOrEqual(140);
      }),
      { numRuns: 300 },
    );
  });

  it('§11 the daily cap is never exceeded and a later recount never removes minutes', () => {
    fc.assert(
      fc.property(fc.array(fc.constantFrom(25, 50, 90), { maxLength: 9 }), fc.integer({ min: 0, max: 1000 }), (mins, seed) => {
        const all = mins.map((m, i) => sess(`s${i}`, 5 + i * 2, m));
        const l: Ledger = { entries: [] };
        const seen: DaySession[] = [];
        let prev: Record<string, number> = {};
        for (const s of shuffle(all, seed)) {
          seen.push(s);
          run(l, [...seen], { arm: null });
          const now = bookedDayFrom(l.entries).sessions;
          for (const [id, v] of Object.entries(prev)) expect(now[id]!.available).toBeGreaterThanOrEqual(v);
          prev = Object.fromEntries(Object.entries(now).map(([k, v]) => [k, v.available]));
          expect(Object.values(now).reduce((t, b) => t + b.available, 0)).toBe(Math.min(300, seen.reduce((t, x) => t + x.verifiedMin, 0)));
        }
      }),
      { numRuns: 300 },
    );
  });
});

it('emptyBookedDay has no keys', () => {
  expect(emptyBookedDay().keys).toEqual([]);
  expect(PARAMS_V1.points.daily_cap_min).toBe(LP.dailyCapMin);
});
