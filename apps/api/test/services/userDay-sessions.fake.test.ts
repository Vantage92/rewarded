// Fakes for UserDayRepository and SessionRepository (architecture §12.2) enforce the §3.2/§3.4 invariants.
import { describe, expect, it } from 'vitest';
import { PARAMS_V1 } from '@rewarded/core/params';
import { focusDayOf, fromLocal, isLateStart } from '@rewarded/core/time';
import { fakeTx } from '../../src/services/ledger.ts';
import { FakeSessionRepository, SessionInvariantError } from '../../src/services/sessions.ts';
import type { FocusSession } from '../../src/services/sessions.ts';
import { FakeUserDayRepository, UserDayInvariantError } from '../../src/services/userDay.ts';
import type { UserDay } from '../../src/services/userDay.ts';

const tx = fakeTx();

const day = (over: Partial<UserDay> = {}): UserDay => ({
  userId: 'u1',
  focusDay: '2026-12-14',
  rev: 1,
  verifiedMin: 50,
  countedMin: 50,
  countedMinFinal: 50,
  goalMin: 25,
  goalMet: true,
  goalMetFinal: true,
  goalBonusEligible: true,
  examDay: false,
  goalState: 'available',
  jokerUsed: false,
  vacation: false,
  closedAt: null,
  ...over,
});

let n = 0;
const session = (over: Partial<FocusSession> = {}): FocusSession => {
  const start = over.serverStartAt ?? fromLocal(2026, 12, 14, 10, 0);
  const planned = over.plannedMin ?? 25;
  const status = over.status ?? 'completed';
  return {
    id: over.id ?? `s${++n}`,
    userId: 'u1',
    deviceId: 'd1',
    plannedMin: planned,
    isPractice: planned === 1,
    status,
    serverStartAt: start,
    plannedEndAt: start + planned * 60_000,
    serverEndAt: status === 'active' ? null : start + planned * 60_000,
    abortReason: status === 'aborted' ? 'hidden' : null,
    abortAt: status === 'aborted' ? start + 60_000 : null,
    verifiedMin: status === 'completed' && planned !== 1 ? planned : 0,
    countedMin: status === 'completed' && planned !== 1 ? planned : 0,
    focusDay: focusDayOf(start, PARAMS_V1),
    lateStart: isLateStart(start, PARAMS_V1),
    reviewStatus: 'none',
    flagCodes: [],
    verificationLevel: 1,
    closedBy: status === 'active' ? null : 'end',
    coveredGapS: 0,
    clockSkewMs: null,
    claimDelayS: null,
    webdriver: false,
    standalone: true,
    uaClass: 'mobile_safari',
    ipHash: null,
    netClass: null,
    verdict: null,
    restoredBy: null,
    restoredReason: null,
    ...over,
  };
};

describe('FakeUserDayRepository (arch §3.4 user_day, §12.2)', () => {
  it('arch §3.4: unique (user, day); a new row starts at rev 1 and replacements keep the stored rev', () => {
    const r = new FakeUserDayRepository();
    expect(() => r.put(tx, day({ rev: 2 }))).toThrow(UserDayInvariantError);
    r.put(tx, day());
    expect(() => r.put(tx, day({ rev: 2 }))).toThrow(/does not match/);
    r.put(tx, day({ verifiedMin: 75, countedMin: 75, countedMinFinal: 75 }));
    expect(r.get('u1', '2026-12-14')?.verifiedMin).toBe(75);
    expect(r.range(['u1'], '2026-12-01', '2026-12-31')).toHaveLength(1);
  });

  it('arch §5.1: bumpRev raises the revision once per decision; rev never goes back', () => {
    const r = new FakeUserDayRepository();
    r.put(tx, day());
    expect(r.bumpRev(tx, 'u1', '2026-12-14')).toBe(2);
    expect(r.bumpRev(tx, 'u1', '2026-12-14')).toBe(3);
    expect(() => r.put(tx, day({ rev: 2 }))).toThrow(UserDayInvariantError);
    r.put(tx, day({ rev: 3, countedMinFinal: 25 }));
    expect(() => r.bumpRev(tx, 'u1', '2026-12-15')).toThrow(/no user_day row/);
  });

  it('spec §4.2 Puntenplafond: counted_min ≤ 300 and ≤ verified_min; final ≤ counted', () => {
    const r = new FakeUserDayRepository();
    expect(() => r.put(tx, day({ verifiedMin: 540, countedMin: 301, countedMinFinal: 0 }))).toThrow(/daily cap/);
    r.put(tx, day({ verifiedMin: 540, countedMin: 300, countedMinFinal: 300 }));
    expect(() => r.put(tx, day({ focusDay: '2026-12-15', verifiedMin: 25, countedMin: 50 }))).toThrow(/above verified/);
    expect(() => r.put(tx, day({ focusDay: '2026-12-15', countedMinFinal: 75 }))).toThrow(/final above/);
    expect(() => r.put(tx, day({ focusDay: '2026-12-15', goalMet: false }))).toThrow(UserDayInvariantError);
    expect(() => r.put(tx, day({ focusDay: '2026-02-30' }))).toThrow(/YYYY-MM-DD/);
  });

  it('arch §6.1: finalMinutes and range are ordered per user and day', () => {
    const r = new FakeUserDayRepository();
    r.put(tx, day({ focusDay: '2026-12-16' }));
    r.put(tx, day({ focusDay: '2026-12-14' }));
    r.put(tx, day({ userId: 'u0', focusDay: '2026-12-15' }));
    expect(r.finalMinutes('u1', '2026-12-14', '2026-12-16').map((d) => d.focusDay)).toEqual(['2026-12-14', '2026-12-16']);
    expect(r.range(['u1', 'u0'], '2026-12-14', '2026-12-15').map((d) => `${d.userId}:${d.focusDay}`)).toEqual(['u0:2026-12-15', 'u1:2026-12-14']);
  });
});

describe('FakeSessionRepository (arch §3.2 focus_session, §4.8, §12.2)', () => {
  it('arch §3.2: practice ⇔ planned_min = 1, and verified_min only for completed real sessions', () => {
    const r = new FakeSessionRepository();
    expect(() => r.save(session({ plannedMin: 1, isPractice: false }))).toThrow(SessionInvariantError);
    expect(() => r.save(session({ plannedMin: 25, isPractice: true }))).toThrow(SessionInvariantError);
    r.save(session({ plannedMin: 1 }));
    expect(() => r.save(session({ status: 'aborted', verifiedMin: 25 }))).toThrow(/verified_min/);
  });

  it('spec §4.1 Eén sessie tegelijk: at most one active session per user', () => {
    const r = new FakeSessionRepository();
    r.save(session({ status: 'active' }));
    expect(() => r.save(session({ status: 'active', serverStartAt: fromLocal(2026, 12, 14, 11, 0) }))).toThrow(/already has an active/);
    r.save(session({ userId: 'u2', status: 'active' }));
  });

  it('spec §4.2 Puntenplafond: counted_min per user per focus day stays ≤ 300', () => {
    const r = new FakeSessionRepository();
    for (let h = 8; h < 11; h++) r.save(session({ plannedMin: 90, serverStartAt: fromLocal(2026, 12, 14, h + 2 * (h - 8), 0) }));
    expect(() => r.save(session({ plannedMin: 90, serverStartAt: fromLocal(2026, 12, 14, 20, 0) }))).toThrow(/exceed 300/);
    r.save(session({ plannedMin: 90, countedMin: 30, serverStartAt: fromLocal(2026, 12, 14, 20, 0) }));
    expect(r.byDay('u1', '2026-12-14').reduce((s, x) => s + x.countedMin, 0)).toBe(300);
  });

  it('spec §4.1 Sessie over 04:00 / nachtregel: focus_day and late_start must match server_start_at', () => {
    const r = new FakeSessionRepository();
    const start = fromLocal(2026, 12, 15, 3, 55);
    expect(() => r.save(session({ serverStartAt: start, focusDay: '2026-12-15', lateStart: true }))).toThrow(/focus_day/);
    expect(() => r.save(session({ serverStartAt: start, focusDay: '2026-12-14', lateStart: false }))).toThrow(/late_start/);
    r.save(session({ serverStartAt: start }));
    expect(r.byDay('u1', '2026-12-14')[0]?.lateStart).toBe(true);
  });

  it('arch §4.8: aborted → completed only via restore, which needs a valid reason', () => {
    const r = new FakeSessionRepository();
    const s = session({ id: 'sa', status: 'aborted', abortReason: 'heartbeat_gap' });
    r.save(s);
    expect(() => r.save({ ...s, status: 'completed', abortReason: null, abortAt: null, verifiedMin: 25 })).toThrow(/only via restore/);
    const res = r.restore(tx, 'sa', 'outage', 'admin:a1');
    expect(res.restored).toBe(true);
    expect(res.session).toMatchObject({ status: 'completed', verifiedMin: 25, countedMin: 0, closedBy: 'restore', restoredReason: 'outage', restoredBy: 'admin:a1' });
    expect(() => r.restore(tx, 'sa', 'outage', 'admin:a1')).toThrow(/only aborted/);
  });

  it('arch §4.8: when the re-evaluation is not completed, the abort stands', () => {
    const r = new FakeSessionRepository({ reevaluate: () => false });
    r.save(session({ id: 'sb', status: 'aborted' }));
    expect(r.restore(tx, 'sb', 'late_log', 'admin:a1')).toMatchObject({ restored: false, session: { status: 'aborted' } });
  });

  it('spec §6.4: review status only on completed sessions and never back to none', () => {
    const r = new FakeSessionRepository();
    r.save(session({ id: 'c1' }));
    r.save(session({ id: 'a1', status: 'aborted', serverStartAt: fromLocal(2026, 12, 14, 12, 0) }));
    r.setReviewStatus(tx, ['c1'], 'pending');
    expect(r.get('c1')?.reviewStatus).toBe('pending');
    expect(() => r.setReviewStatus(tx, ['c1', 'a1'], 'released')).toThrow(/completed/);
    expect(r.get('c1')?.reviewStatus).toBe('pending'); // all or nothing
    expect(() => r.setReviewStatus(tx, ['c1'], 'none')).toThrow(/none/);
  });

  it('arch §4.5: forHeuristics returns sessions started in [from, to), optionally by status', () => {
    const r = new FakeSessionRepository();
    r.save(session({ id: 'h1', serverStartAt: fromLocal(2026, 12, 14, 9, 0) }));
    r.save(session({ id: 'h2', status: 'aborted', serverStartAt: fromLocal(2026, 12, 14, 10, 0) }));
    r.save(session({ id: 'h3', serverStartAt: fromLocal(2026, 12, 15, 9, 0) }));
    const from = fromLocal(2026, 12, 14, 4, 0);
    const to = fromLocal(2026, 12, 15, 4, 0);
    expect(r.forHeuristics({ from, to }).map((s) => s.id)).toEqual(['h1', 'h2']);
    expect(r.forHeuristics({ from, to, statuses: ['completed'] }).map((s) => s.id)).toEqual(['h1']);
  });
});
