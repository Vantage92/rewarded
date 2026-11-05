// WP-8 session store against the protocol fake (architecture §4.1–§4.8, §9.2, §11). The scenarios
// follow the E2E table of architecture §11; the same flows run in Chromium in e2e/focus.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { flush, makeHarness, useFakeTime, type Harness } from './wp8-helpers.ts';

const MIN = 60_000;

let h: Harness;

beforeEach(() => {
  useFakeTime();
  sessionStorage.clear();
});
afterEach(() => {
  h?.store.dispose();
  vi.useRealTimers();
});

async function started(min: 25 | 50 | 90 | 1 = 25): Promise<void> {
  await h.store.init();
  await h.store.start(min);
  await flush();
  expect(h.store.getSnapshot().phase).toBe('running');
}

describe('session store (architecture §4.1, §4.2)', () => {
  it('§11 "Sessie van 25 minuten met klok vooruit in stappen van 30 s": completed, end signal, server verdict', async () => {
    h = makeHarness();
    await started(25);
    const s = h.fake.session()!;
    expect(s.idempotencyKey).toMatch(/^[0-9a-f-]{36}$/);
    await h.advance(25 * MIN + 1000, 30_000);
    await flush();
    const snap = h.store.getSnapshot();
    expect(snap.phase).toBe('completed');
    expect(snap.endSignal).toBe(true);
    expect(snap.result).toMatchObject({ status: 'completed', confirmed: true, end: { verified_min: 25, points: 25, flagged: false } });
    // Heartbeats every 30 s with an increasing seq; never a seq twice.
    const seqs = h.fake.callsOf('sessions.heartbeat').map((c) => (c.body as { seq: number }).seq);
    expect(seqs.length).toBeGreaterThanOrEqual(45);
    expect(new Set(seqs).size).toBe(seqs.length);
    expect(seqs.slice(0, 3)).toEqual([1, 2, 3]);
    expect(h.fake.callsOf('sessions.end')).toHaveLength(1);
    expect(h.fake.clientEvents.some((e) => e.name === 'signal_played')).toBe(true);
    // First touch after the end: claim delay event, F5 shows.
    document.dispatchEvent(new Event('pointerdown'));
    await flush();
    expect(h.store.getSnapshot().endSignal).toBe(false);
    const ev = h.fake.callsOf('sessions.events').at(-1)?.body as { events: { kind: string }[] };
    expect(ev.events[0]?.kind).toBe('first_interaction_after_end');
  });

  it('spec §4.1 "hidden": after 12 minutes the page hides; aborted with hidden and 12 minutes held', async () => {
    h = makeHarness();
    await started(25);
    await h.advance(12 * MIN, 30_000);
    h.visibility.emit('hidden');
    await flush();
    expect(h.store.getSnapshot().phase).toBe('aborted_local');
    expect(h.store.getSnapshot().result).toMatchObject({ abortReason: 'hidden', confirmed: false });
    expect(h.beacons).toHaveLength(1);
    expect((h.beacons[0]!.body as { events: { kind: string }[] }).events.some((e) => e.kind === 'hidden')).toBe(true);
    await h.advance(2000);
    h.visibility.emit('visible');
    await h.advance(3000);
    const snap = h.store.getSnapshot();
    expect(snap.phase).toBe('aborted');
    expect(snap.result).toMatchObject({ status: 'aborted', abortReason: 'hidden', confirmed: true });
    expect(Math.floor(snap.result!.elapsedS / 60)).toBe(12);
    expect(h.fake.session()!.status).toBe('aborted');
    expect(h.fake.clientEvents.some((e) => e.name === 'return_after_abort')).toBe(true);
  });

  it('§11 "Netwerk 3 minuten offline": buffered heartbeats cover the gap; completed and marked H3 (> 10%)', async () => {
    h = makeHarness();
    await started(25);
    await h.advance(5 * MIN, 30_000);
    h.network.set(false);
    await h.advance(3 * MIN, 1000);
    expect(h.store.getSnapshot().phase).toBe('offline');
    h.network.set(true);
    await h.advance(17 * MIN + 5000, 30_000);
    await flush();
    const snap = h.store.getSnapshot();
    expect(snap.phase).toBe('completed');
    expect(snap.result?.end).toMatchObject({ verified_min: 25, flagged: true, points_status: 'pending' });
    expect(h.fake.session()!.flags).toContain('H3');
    const buffered = h.fake.session()!.heartbeats.filter((b) => b.kind === 'buffered');
    expect(buffered.length).toBeGreaterThanOrEqual(4);
  });

  it('§11 "Netwerk 6 minuten offline": the client shows the abort at once; the server says heartbeat_gap', async () => {
    h = makeHarness();
    await started(25);
    await h.advance(5 * MIN, 30_000);
    h.network.set(false);
    await h.advance(5 * MIN + 30_000, 1000);
    const local = h.store.getSnapshot();
    expect(local.phase).toBe('aborted_local');
    expect(local.result).toMatchObject({ abortReason: 'heartbeat_gap', confirmed: false });
    await h.advance(30_000, 1000);
    h.network.set(true);
    await h.advance(20_000, 1000);
    const snap = h.store.getSnapshot();
    expect(snap.phase).toBe('aborted');
    expect(snap.result).toMatchObject({ abortReason: 'heartbeat_gap', confirmed: true });
    expect(h.fake.session()!.abortReason).toBe('heartbeat_gap');
  });

  it('arch §4.7: answers to two heartbeats in a row dropped after processing; no NONCE_INVALID, completed', async () => {
    h = makeHarness();
    await started(25);
    await h.advance(2 * MIN, 30_000);
    h.dropNext('sessions.heartbeat', 2);
    await h.advance(23 * MIN + 1000, 30_000);
    await flush();
    expect(h.store.getSnapshot().phase).toBe('completed');
    const calls = h.fake.callsOf('sessions.heartbeat').map((c) => (c.body as { seq: number; nonce: string }));
    // The dropped one is repeated with the same seq and nonce.
    const repeats = calls.filter((c, i) => i > 0 && c.seq === calls[i - 1]!.seq);
    expect(repeats.length).toBeGreaterThanOrEqual(1);
    for (const r of repeats) expect(calls.find((c) => c.seq === r.seq)!.nonce).toBe(r.nonce);
    expect(h.fake.session()!.status).toBe('completed');
    expect(h.fake.session()!.abortReason).toBeUndefined();
  });

  it('arch §4.7: the answer to POST /sessions dropped; the repeat with the same key gives the same session', async () => {
    h = makeHarness();
    await h.store.init();
    h.dropNext('sessions.start', 1);
    await h.store.start(25);
    await h.advance(3000);
    expect(h.store.getSnapshot().phase).toBe('running');
    const starts = h.fake.callsOf('sessions.start');
    expect(starts).toHaveLength(2);
    expect(starts[0]!.idempotencyKey).toBe(starts[1]!.idempotencyKey);
    expect(h.fake.sessions).toHaveLength(1);
    expect(h.store.getSnapshot().ctx.sessionId).toBe(h.fake.sessions[0]!.id);
  });

  it('arch §4.7: answers to /end and /stop dropped; the stored verdict comes back, nothing twice', async () => {
    h = makeHarness();
    await started(25);
    h.dropNext('sessions.end', 1);
    await h.advance(25 * MIN + 5000, 30_000);
    expect(h.store.getSnapshot().phase).toBe('completed');
    expect(h.fake.callsOf('sessions.end')).toHaveLength(2);
    expect(h.fake.sessions).toHaveLength(1);
    h.store.reset();
    await h.store.start(25);
    await flush();
    await h.advance(60_000, 30_000);
    h.dropNext('sessions.stop', 1);
    h.store.confirmStop();
    await h.advance(3000);
    const snap = h.store.getSnapshot();
    expect(snap.phase).toBe('aborted');
    expect(snap.result).toMatchObject({ abortReason: 'user_stop', confirmed: true });
    expect(h.fake.callsOf('sessions.stop')).toHaveLength(2);
  });

  it('arch §4.4 "Herladen": after a reload the stored session sends pagehide and shows hidden', async () => {
    h = makeHarness();
    await started(25);
    await h.advance(4 * MIN, 30_000);
    // The page goes away; the old page's store is gone without finishing.
    h.visibility.emit('pagehide', false);
    await flush();
    h.store.dispose();
    const second = h.newStore();
    h.store = second;
    await second.init();
    expect(second.getSnapshot().phase).toBe('aborted_local');
    expect(second.getSnapshot().result?.abortReason).toBe('hidden');
    await h.advance(3000);
    expect(second.getSnapshot().phase).toBe('aborted');
    expect(second.getSnapshot().result).toMatchObject({ abortReason: 'hidden', confirmed: true });
    const kinds = h.fake.session()!.events.map((e) => e.kind);
    expect(kinds).toContain('pagehide');
  });

  it('arch §4.4 "Herladen" without a finished write: the pagehide mark in sessionStorage is replayed', async () => {
    h = makeHarness();
    await started(25);
    await h.advance(4 * MIN, 30_000);
    h.visibility.emit('pagehide', false);
    // Simulate a lost IndexedDB write: the outbox and the head say "running".
    const head = await h.kv.get<Record<string, unknown>>('active_session', 'current');
    await h.kv.put('active_session', 'current', { ...head, state: 'running', abortCause: null });
    for (const { key } of await h.kv.list('outbox')) await h.kv.delete('outbox', key);
    h.store.dispose();
    h.store = h.newStore();
    await h.store.init();
    await h.advance(3000);
    expect(h.store.getSnapshot().result).toMatchObject({ abortReason: 'hidden', confirmed: true });
    const pagehide = h.fake.session()!.events.find((e) => e.kind === 'pagehide');
    expect(pagehide).toBeTruthy();
  });

  it('arch §4.4 "Tweede tabblad": another tab owns the session; no start, no heartbeats', async () => {
    h = makeHarness();
    h.tabLock.heldByOther = true;
    await h.store.init();
    expect(h.store.getSnapshot().phase).toBe('other_tab');
    await h.store.start(25);
    await flush();
    expect(h.fake.callsOf('sessions.start')).toHaveLength(0);
    h.tabLock.heldByOther = false;
    h.tabLock.broadcast({ type: 'released' });
    await flush();
    expect(h.store.getSnapshot().phase).toBe('idle');
  });

  it('spec §4.1 Wake Lock: requested at start, again after release while visible (every 10 s)', async () => {
    h = makeHarness();
    await started(25);
    expect(h.wakeApi.requests).toBe(1);
    expect(h.store.getSnapshot().wakeLock).toBe('acquired');
    h.wakeApi.sentinel!.fire();
    await flush();
    expect(h.store.getSnapshot().wakeLock).toBe('released');
    await h.advance(10_000);
    expect(h.wakeApi.requests).toBe(2);
    expect(h.store.getSnapshot().wakeLock).toBe('acquired');
    expect(h.fake.clientEvents.filter((e) => e.name === 'wakelock_state').map((e) => (e.props as { status: string }).status)).toEqual(['acquired', 'released', 'acquired']);
  });

  it('spec §3.1 step 11: the practice session of one minute uses the same protocol and books nothing', async () => {
    h = makeHarness();
    await h.store.init();
    await h.store.start(1, { practice: true });
    await flush();
    expect((h.fake.callsOf('sessions.start')[0]!.body as { practice: boolean; planned_min: number })).toMatchObject({ practice: true, planned_min: 1 });
    await h.advance(MIN + 2000, 1000);
    expect(h.store.getSnapshot().result).toMatchObject({ status: 'completed', practice: true, end: { points: 0 } });
  });
});
