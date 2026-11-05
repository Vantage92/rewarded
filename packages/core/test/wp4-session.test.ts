// WP-4: verifier (spec §4.1, architecture §4.3), state machine (§4.1) and retry rules (§4.7).
import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { PARAMS_V1 } from '../src/params/index.ts';
import { focusDayOf, isLateStart, fromLocal } from '../src/time/index.ts';
import {
  INITIAL_CONTEXT,
  classifyClose,
  classifyHeartbeat,
  evaluateSession,
  reduce,
  retryDelayMs,
  shouldGoOffline,
  type EvaluateSessionInput,
  type Heartbeat,
  type MachineContext,
  type MachineEvent,
  type SessionHeader,
  type VisibilityEvent,
} from '../src/session/index.ts';

const P = PARAMS_V1.session;
const T0 = fromLocal(2026, 12, 3, 11, 0);
const MONO0 = 5_000;
const MIN = 60_000;

function header(plannedMin: 25 | 50 | 90 | 1 = 25, over: Partial<SessionHeader> = {}): SessionHeader {
  return {
    sessionId: 's1', userId: 'u1', deviceId: 'd1', plannedMin, isPractice: plannedMin === 1,
    serverStartAt: T0, plannedEndAt: T0 + plannedMin * MIN, monoStartMs: MONO0,
    focusDay: '2026-12-03', lateStart: false, verificationLevel: 1, webdriver: false, uaClass: 'android_chrome', ...over,
  };
}

/** Online heartbeat at offset `t` ms after start (server and mono in step). */
function hb(t: number, seq: number, over: Partial<Heartbeat> = {}): Heartbeat {
  return { seq, kind: 'online', serverRecvAt: T0 + t, clientTs: T0 + t, monoMs: MONO0 + t, visibility: 'visible', wakelock: 'acquired', nonceOk: true, buffered: false, ...over };
}
function buf(t: number, seq: number, recvAt: number): Heartbeat {
  return hb(t, seq, { kind: 'buffered', buffered: true, nonceOk: false, serverRecvAt: T0 + recvAt });
}
function ev(t: number, kind: VisibilityEvent['kind'], recvAt = t, evSeq = 1): VisibilityEvent {
  return { evSeq, kind, monoMs: MONO0 + t, clientTs: T0 + t, serverRecvAt: T0 + recvAt, buffered: recvAt !== t };
}
/** Heartbeats every 30 s from 30 s up to (not including) `until` ms, skipping [skipFrom, skipTo). */
function steady(until: number, skip: [number, number] | null = null): Heartbeat[] {
  const out: Heartbeat[] = [];
  let seq = 1;
  for (let t = 30_000; t < until; t += 30_000) {
    if (skip && t >= skip[0] && t < skip[1]) continue;
    out.push(hb(t, seq++));
  }
  return out;
}
function input(over: Omit<Partial<EvaluateSessionInput>, "endReport"> & { plannedMin?: 25 | 50 | 90 | 1; endReport?: EvaluateSessionInput["endReport"] | undefined } = {}): EvaluateSessionInput {
  const plannedMin = over.plannedMin ?? 25;
  const session = over.session ?? header(plannedMin);
  return {
    session, heartbeats: over.heartbeats ?? steady(plannedMin * MIN), events: over.events ?? [],
    outages: over.outages ?? [], now: over.now ?? T0 + plannedMin * MIN + 1_000, params: P,
    ...('endReport' in over ? (over.endReport ? { endReport: over.endReport } : {}) : { endReport: { monoMs: MONO0 + plannedMin * MIN, clientTs: T0 + plannedMin * MIN, serverRecvAt: T0 + plannedMin * MIN + 500 } }),
  };
}
const END25 = 25 * MIN;

describe('evaluateSession — spec §4.1 Heartbeatgaten', () => {
  it('§4.1 interval ≤ 90 s counts: completed with verified = planned', () => {
    const v = evaluateSession(input());
    expect(v).toMatchObject({ outcome: 'completed', verifiedMin: 25, flags: [] });
  });

  it('§4.1 gap > 90 s and ≤ 5 min with a covering buffered log counts', () => {
    const hbs = steady(END25, [300_000, 480_000]);
    const log = [buf(300_000, 90, 480_500), buf(360_000, 91, 480_500), buf(420_000, 92, 480_500)];
    const v = evaluateSession(input({ heartbeats: [...hbs, ...log] }));
    expect(v.outcome).toBe('completed');
    expect(v.metrics.coveredGapS).toBe(210);
  });

  it('§4.1 covered gaps above 10% of the planned duration count, but flagged H3', () => {
    const hbs = steady(END25, [300_000, 480_000]);
    const log = [buf(300_000, 90, 480_500), buf(360_000, 91, 480_500), buf(420_000, 92, 480_500)];
    const v = evaluateSession(input({ heartbeats: [...hbs, ...log] }));
    expect(v.flags).toContain('H3'); // 210 s > 150 s (10% of 1500 s)
  });

  it('§4.1 gap > 5 min aborts with heartbeat_gap at the last valid heartbeat, even with a log', () => {
    const hbs = steady(END25, [300_000, 660_000]);
    const log = [300_000, 360_000, 420_000, 480_000, 540_000, 600_000].map((t, i) => buf(t, 90 + i, 660_500));
    const v = evaluateSession(input({ heartbeats: [...hbs, ...log] }));
    expect(v).toMatchObject({ outcome: 'aborted', reason: 'heartbeat_gap', at: T0 + 270_000 });
  });

  it('§4.1 gap > 90 s without a covering log aborts with heartbeat_gap', () => {
    const v = evaluateSession(input({ heartbeats: steady(END25, [300_000, 420_000]) }));
    expect(v).toMatchObject({ outcome: 'aborted', reason: 'heartbeat_gap', at: T0 + 270_000 });
  });

  it('§4.1 a log with hidden in the gap aborts at the time of hidden', () => {
    const hbs = steady(END25, [300_000, 420_000]);
    const log = [buf(300_000, 90, 420_500), buf(360_000, 91, 420_500)];
    const v = evaluateSession(input({ heartbeats: [...hbs, ...log], events: [ev(330_000, 'hidden', 420_500)] }));
    expect(v).toMatchObject({ outcome: 'aborted', reason: 'hidden', at: T0 + 330_000 });
  });

  it('§4.1 a log whose monotonic clock is off by more than 5 s does not cover the gap', () => {
    const hbs = steady(END25, [300_000, 420_000]).map((h) => (h.serverRecvAt >= T0 + 420_000 ? { ...h, monoMs: h.monoMs - 20_000 } : h));
    const log = [buf(300_000, 90, 420_500), buf(360_000, 91, 420_500)];
    const v = evaluateSession(input({ heartbeats: [...hbs, ...log], endReport: { monoMs: MONO0 + END25, clientTs: 0, serverRecvAt: T0 + END25 + 20_500 } }));
    expect(v).toMatchObject({ outcome: 'aborted', reason: 'heartbeat_gap' });
  });
});

describe('evaluateSession — spec §4.1 afbreekcodes en randgevallen', () => {
  it('§4.1 hidden before the end aborts with hidden (incoming call, laptop closed)', () => {
    const v = evaluateSession(input({ events: [ev(12 * MIN, 'hidden', 12 * MIN + 200)] }));
    expect(v).toMatchObject({ outcome: 'aborted', reason: 'hidden', at: T0 + 12 * MIN });
  });

  it('§4.1 pagehide (reload) aborts with hidden', () => {
    const v = evaluateSession(input({ events: [ev(5 * MIN, 'pagehide')] }));
    expect(v).toMatchObject({ outcome: 'aborted', reason: 'hidden' });
  });

  it('§4.1 a notification without opening (only blur) keeps the session running', () => {
    const v = evaluateSession(input({ events: [ev(5 * MIN, 'blur'), ev(5 * MIN + 2000, 'focus', 5 * MIN + 2000, 2)] }));
    expect(v.outcome).toBe('completed');
  });

  it('§4.1 battery dead: nothing arrives, the sweep aborts at the last heartbeat after end + 10 min', () => {
    const hbs = steady(10 * MIN);
    const base = input({ heartbeats: hbs, endReport: undefined });
    const { endReport: _drop, ...noEnd } = base;
    expect(evaluateSession({ ...noEnd, now: T0 + END25 + 9 * MIN }).outcome).toBe('pending');
    const v = evaluateSession({ ...noEnd, now: T0 + END25 + 10 * MIN });
    expect(v).toMatchObject({ outcome: 'aborted', reason: 'heartbeat_gap', at: T0 + 9.5 * MIN });
  });

  it('§4.1 late_end: end > 10 min after the planned end without heartbeats in between', () => {
    const v = evaluateSession(input({ endReport: { monoMs: MONO0 + END25 + 11 * MIN, clientTs: 0, serverRecvAt: T0 + END25 + 11 * MIN } }));
    expect(v).toMatchObject({ outcome: 'aborted', reason: 'late_end' });
  });

  it('§4.1 Einde: accepted at server elapsed ≥ duration − 30 s', () => {
    const v = evaluateSession(input({ endReport: { monoMs: MONO0 + END25, clientTs: 0, serverRecvAt: T0 + END25 - 29_000 } }));
    expect(v.outcome).toBe('completed');
  });

  it('§4.1 Einde: an end more than 30 s early is not accepted', () => {
    const v = evaluateSession(input({ heartbeats: steady(20 * MIN), endReport: { monoMs: MONO0 + END25, clientTs: 0, serverRecvAt: T0 + 20 * MIN }, now: T0 + 20 * MIN }));
    expect(v.outcome).toBe('pending');
  });

  it('§4.1 clock moved forward: no effect on the duration; skew > 5 min flags H4', () => {
    const hbs = steady(END25).map((h) => ({ ...h, clientTs: h.clientTs + 6 * MIN }));
    const v = evaluateSession(input({ heartbeats: hbs }));
    expect(v.outcome).toBe('completed');
    expect(v.flags).toContain('H4');
    expect(v.metrics.clockSkewMs).toBe(6 * MIN);
  });

  it('§4.1 webdriver flags H1 but still completes (architecture §4.6)', () => {
    const v = evaluateSession(input({ session: header(25, { webdriver: true }) }));
    expect(v.outcome).toBe('completed');
    expect(v.flags).toEqual(['H1']);
  });

  it('§4.1 Storing aan onze kant: a gap inside an outage goes to review instead of aborting', () => {
    const v = evaluateSession(input({ heartbeats: steady(END25, [300_000, 600_000]), outages: [{ from: T0 + 280_000, to: T0 + 620_000 }] }));
    expect(v).toMatchObject({ outcome: 'review', cause: 'outage' });
  });

  it('§4.1 Oefensessie: one minute, same protocol, 0 verified minutes', () => {
    const v = evaluateSession(input({ plannedMin: 1, heartbeats: [hb(30_000, 1)] }));
    expect(v).toMatchObject({ outcome: 'completed', verifiedMin: 0 });
  });

  it('§4.1 Sessie over 04:00 counts for the start day; 01:00–04:00 is a late start', () => {
    const start = fromLocal(2026, 12, 4, 3, 55);
    expect(focusDayOf(start, PARAMS_V1)).toBe('2026-12-03');
    expect(isLateStart(start, PARAMS_V1)).toBe(true);
    expect(isLateStart(fromLocal(2026, 12, 4, 0, 59), PARAMS_V1)).toBe(false);
  });

  it('§4.1 offline at the end: a late end report with a covering log completes', () => {
    const hbs = steady(23 * MIN);
    const log = [23 * MIN, 23.5 * MIN, 24 * MIN, 24.5 * MIN].map((t, i) => buf(t, 90 + i, END25 + 3 * MIN));
    const v = evaluateSession(input({ heartbeats: [...hbs, ...log], endReport: { monoMs: MONO0 + END25 + 3 * MIN, clientTs: 0, serverRecvAt: T0 + END25 + 3 * MIN } }));
    expect(v.outcome).toBe('completed');
  });

  it('claim delay is measured from the end to the first interaction (H9 input)', () => {
    const v = evaluateSession(input({ events: [ev(END25 + 40_000, 'first_interaction_after_end')] }));
    expect(v.metrics.claimDelayS).toBe(40);
  });

  it('architecture §11: evaluateSession is idempotent and monotone in time', () => {
    fc.assert(
      fc.property(fc.array(fc.integer({ min: 1, max: 49 }), { maxLength: 6 }), fc.integer({ min: 0, max: 40 * MIN }), (holes, dt) => {
        const skip = new Set(holes.map((h) => h * 30_000));
        const hbs = steady(END25).filter((h) => !skip.has(h.serverRecvAt - T0));
        const { endReport: _e, ...base } = input({ heartbeats: hbs, endReport: undefined });
        // The server only knows what arrived by `now`.
        const at = (now: number) => ({ ...base, heartbeats: hbs.filter((h) => h.serverRecvAt <= now), now });
        const early = evaluateSession(at(T0 + dt));
        expect(evaluateSession(at(T0 + dt))).toEqual(early);
        const late = evaluateSession({ ...at(T0 + dt), now: T0 + dt + 30 * MIN });
        expect(early.outcome === 'pending' || late.outcome === early.outcome).toBe(true);
      }),
      { numRuns: 150 },
    );
  });
});

describe('state machine — architecture §4.1', () => {
  const run = (events: MachineEvent[], ctx: MachineContext = INITIAL_CONTEXT) => events.reduce<MachineContext>((c, e) => reduce(c, e)[0], ctx);

  it('§4.1 idle → starting → running → ending → completed → idle', () => {
    let c = run([{ type: 'START_REQUESTED', plannedMin: 25, idempotencyKey: 'k', mono: 0 }]);
    expect(c.state).toBe('starting');
    c = run([{ type: 'STARTED', sessionId: 's', nonce: 'n', mono: 10 }], c);
    expect(c.state).toBe('running');
    const [ending, fx] = reduce(c, { type: 'DURATION_REACHED', mono: 25 * MIN });
    expect(ending.state).toBe('ending');
    expect(fx.map((f) => f.type)).toContain('send_end');
    c = run([{ type: 'RESULT', status: 'completed' }], ending);
    expect(c.state).toBe('completed');
    expect(run([{ type: 'RESET' }], c).state).toBe('idle');
  });

  it('§4.1 hidden while running goes to aborted_local and sends a beacon', () => {
    const c = run([{ type: 'START_REQUESTED', plannedMin: 25, idempotencyKey: 'k', mono: 0 }, { type: 'STARTED', sessionId: 's', nonce: 'n', mono: 0 }]);
    const [next, fx] = reduce(c, { type: 'HIDDEN', mono: 1000 });
    expect(next.state).toBe('aborted_local');
    expect(fx.map((f) => f.type)).toContain('send_beacon_hidden');
  });

  it('§4.1 offline: NET_LOST → running_offline; NET_BACK repeats the open heartbeat first; GAP_LIMIT aborts', () => {
    const c = run([{ type: 'START_REQUESTED', plannedMin: 25, idempotencyKey: 'k', mono: 0 }, { type: 'STARTED', sessionId: 's', nonce: 'n', mono: 0 }, { type: 'NET_LOST' }]);
    expect(c.state).toBe('running_offline');
    const [back, fx] = reduce(c, { type: 'NET_BACK' });
    expect(back.state).toBe('running');
    expect(fx.map((f) => f.type)).toEqual(['retry_pending_heartbeat', 'flush_outbox']);
    expect(run([{ type: 'GAP_LIMIT' }], c).state).toBe('aborted_local');
  });

  it('§4.1 user stop → stopping → aborted with user_stop; no pause state exists', () => {
    const c = run([{ type: 'START_REQUESTED', plannedMin: 50, idempotencyKey: 'k', mono: 0 }, { type: 'STARTED', sessionId: 's', nonce: 'n', mono: 0 }, { type: 'USER_STOP' }]);
    expect(c.state).toBe('stopping');
    const done = run([{ type: 'RESULT', status: 'aborted' }], c);
    expect(done.result).toEqual({ status: 'aborted', abortReason: 'user_stop' });
  });

  it('§4.1 START_FAILED returns to idle with the error', () => {
    const c = run([{ type: 'START_REQUESTED', plannedMin: 25, idempotencyKey: 'k', mono: 0 }, { type: 'START_FAILED', error: 'INVALID_DURATION' }]);
    expect(c).toMatchObject({ state: 'idle', error: 'INVALID_DURATION' });
  });
});

describe('retry rules — architecture §4.7', () => {
  it('§4.7 backoff 1, 2, 4, 8 s then 10 s; offline after three failures', () => {
    expect([1, 2, 3, 4, 5, 9].map(retryDelayMs)).toEqual([1000, 2000, 4000, 8000, 10000, 10000]);
    expect(shouldGoOffline(2)).toBe(false);
    expect(shouldGoOffline(3)).toBe(true);
  });

  it('§4.7 heartbeat: current nonce + next seq is new; previous nonce + same seq is a replay; else invalid', () => {
    const st = { nonceHash: 'n2', prevNonceHash: 'n1', lastSeq: 4 };
    expect(classifyHeartbeat(st, 'n2', 5)).toBe('new');
    expect(classifyHeartbeat(st, 'n1', 4)).toBe('replay');
    expect(classifyHeartbeat(st, 'n1', 3)).toBe('invalid');
    expect(classifyHeartbeat(st, 'zz', 5)).toBe('invalid');
  });

  it('§4.7 end/stop: replay on a session closed by the same request, SESSION_CLOSED otherwise', () => {
    const st = { nonceHash: 'n2', prevNonceHash: 'n1', lastSeq: 4 };
    expect(classifyClose({ active: true, closedBy: null }, 'end', st, 'n2')).toBe('first');
    expect(classifyClose({ active: false, closedBy: 'end' }, 'end', st, 'n1')).toBe('replay');
    expect(classifyClose({ active: false, closedBy: 'sweep' }, 'end', st, 'n2')).toBe('closed_by_other');
    expect(classifyClose({ active: true, closedBy: null }, 'stop', st, 'xx')).toBe('invalid');
  });
});
