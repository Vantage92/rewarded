// WP-4 integration: spec §4.1 tables (gaps, abort codes, edge cases) and the retry table of
// architecture §4.7, through the real routes, database and ledger.
import { describe, expect, it } from 'vitest';
import { call, createUser, device, wp4Harness, type Harness } from './wp4/harness.ts';
import { FocusClient } from './wp4/client.ts';

const MIN = 60_000;

async function setup(start?: string) {
  const h = wp4Harness(start ? { start } : {});
  const user = createUser(h);
  const dev = await device(h, user);
  return { h, user, dev, c: new FocusClient(h, user, dev) };
}
function balance(h: Harness, userId: string) {
  return h.services.ledger.balances(userId);
}

describe('spec §4.1 Heartbeatgaten (integration)', () => {
  it('§4.1 interval ≤ 90 s: completed, 25 points available directly', async () => {
    const { h, user, c } = await setup();
    const r = await c.complete(25);
    expect(r.status).toBe(200);
    expect(r.body).toMatchObject({ status: 'completed', verified_min: 25, counted_min: 25, points: 25, points_status: 'available', flagged: false, goal_met: true });
    expect(balance(h, user.id).available).toBe(25);
    expect(h.events.named('session_completed')).toHaveLength(1);
  });

  it('§4.1 gap > 90 s and ≤ 5 min covered by a buffered log: completed', async () => {
    const { c } = await setup();
    await c.start(25);
    await c.run(5 * MIN);
    for (let i = 0; i < 4; i++) {
      c.advance(30_000);
      c.buffer();
    }
    c.advance(30_000);
    const hb = await c.beat();
    expect(hb.body.status).toBe('active');
    await c.run(25 * MIN - 7.5 * MIN);
    const r = await c.end();
    expect(r.body).toMatchObject({ status: 'completed', flagged: false });
  });

  it('§4.1 covered gaps above 10% of the planned duration: counts, but flagged H3 (points pending)', async () => {
    const { h, user, c } = await setup();
    await c.start(25);
    await c.run(5 * MIN);
    for (let i = 0; i < 6; i++) {
      c.advance(30_000);
      c.buffer();
    }
    c.advance(30_000);
    await c.beat();
    await c.run(25 * MIN - 8.5 * MIN);
    const r = await c.end();
    expect(r.body).toMatchObject({ status: 'completed', flagged: true, points_status: 'pending', points: 25 });
    expect(balance(h, user.id).pending).toBe(25);
    expect([...h.flags.openForSessions([c.sessionId]).values()][0]?.[0]?.code).toBe('H3');
  });

  it('§4.1 gap > 5 min, also with a log: aborted heartbeat_gap at the last valid heartbeat', async () => {
    const { h, user, c } = await setup();
    await c.start(25);
    await c.run(5 * MIN);
    const lastValid = h.clock.now().getTime();
    for (let i = 0; i < 11; i++) {
      c.advance(30_000);
      c.buffer();
    }
    c.advance(30_000);
    const hb = await c.beat();
    expect(hb.body).toMatchObject({ status: 'aborted', abort_reason: 'heartbeat_gap' });
    const s = await call(h, user, 'GET', `/sessions/${c.sessionId}`);
    expect(s.body.abort_reason).toBe('heartbeat_gap');
    expect(h.db.get<{ abort_at: number }>('SELECT abort_at FROM focus_session WHERE id = ?', [c.sessionId])?.abort_at).toBe(lastValid);
    expect(balance(h, user.id).available).toBe(0);
  });

  it('§4.1 gap > 90 s without a covering log: aborted heartbeat_gap, with the report route available', async () => {
    const { h, user, c } = await setup();
    await c.start(25);
    await c.run(3 * MIN);
    c.advance(2 * MIN);
    const hb = await c.beat();
    expect(hb.body).toMatchObject({ status: 'aborted', abort_reason: 'heartbeat_gap' });
    const rep = await call(h, user, 'POST', `/sessions/${c.sessionId}/report`, { text: 'Wifi viel weg' });
    expect(rep.status).toBe(201);
    expect(h.events.named('abort_report_submitted')[0]?.props).toMatchObject({ reden_gebruiker: 'met_tekst' });
    expect((await call(h, user, 'POST', `/sessions/${c.sessionId}/report`, {})).body.error.code).toBe('ALREADY_REPORTED');
  });

  it('§4.1 log shows hidden in the gap: aborted at the time of hidden', async () => {
    const { h, c } = await setup();
    await c.start(25);
    await c.run(3 * MIN);
    c.advance(30_000);
    c.buffer();
    c.advance(30_000);
    const hiddenAt = h.clock.now().getTime();
    const ev = c.hidden();
    c.advance(60_000);
    const hb = await c.beat({ events: [ev] });
    expect(hb.body).toMatchObject({ status: 'aborted', abort_reason: 'hidden' });
    expect(h.db.get<{ abort_at: number }>('SELECT abort_at FROM focus_session WHERE id = ?', [c.sessionId])?.abort_at).toBe(hiddenAt);
  });
});

describe('spec §4.1 Wat telt als afgebroken (integration)', () => {
  it('§4.1 hidden: a beacon with visibilitychange → hidden aborts immediately, 0 points, explanation key', async () => {
    const { h, user, c } = await setup();
    await c.start(50);
    await c.run(12 * MIN);
    const r = await c.beacon([c.hidden()]);
    expect(r.status).toBe(202);
    expect(r.body.status).toBe('aborted');
    const s = await call(h, user, 'GET', `/sessions/${c.sessionId}`);
    expect(s.body).toMatchObject({ abort_reason: 'hidden', explanation_key: 'sessions.abort.hidden' });
    expect(h.events.named('session_aborted')[0]?.props).toMatchObject({ reden: 'hidden', verstreken_s: 720 });
    expect(balance(h, user.id).available).toBe(0);
  });

  it.each([
    ['Inkomend gesprek (the call app hides the page)', 'hidden'],
    ['Laptop dichtgeklapt of venster geminimaliseerd', 'hidden'],
    ['Herladen (pagehide, reported after the reload)', 'pagehide'],
  ] as const)('§4.1 Randgeval %s: aborted with hidden, the streak is not touched', async (_name, kind) => {
    const { h, user, c } = await setup();
    await c.start(25);
    await c.run(6 * MIN);
    const ev = c.hidden(kind);
    c.advance(20_000);
    const r = await c.beat({ events: [ev] });
    expect(r.body).toMatchObject({ status: 'aborted', abort_reason: 'hidden' });
    expect(h.services.userDays.get(user.id, '2026-12-03')?.goalMet ?? false).toBe(false);
    expect(balance(h, user.id).available).toBe(0);
  });

  it('§4.1 the beacon needs the CSRF token in the body (architecture §8.1)', async () => {
    const { c } = await setup();
    await c.start(25);
    const r = await c.beacon([c.hidden()], 'wrong-token-000000000000');
    expect(r.body.error.code).toBe('CSRF_INVALID');
  });

  it('§4.1 user_stop: stopping after confirmation', async () => {
    const { h, c } = await setup();
    await c.start(25);
    await c.run(4 * MIN);
    const r = await c.stop();
    expect(r.body).toEqual({ status: 'aborted', abort_reason: 'user_stop', elapsed_s: 240 });
    expect(h.events.named('session_aborted')[0]?.props).toMatchObject({ reden: 'user_stop' });
  });

  it('§4.1 second_session: a start on another device ends the first', async () => {
    const { h, user, c } = await setup();
    await c.start(25);
    await c.run(2 * MIN);
    const dev2 = await device(h, user, '22222222-2222-4222-8222-222222222222');
    const c2 = new FocusClient(h, user, dev2);
    const r2 = await c2.start(25);
    expect(r2.status).toBe(201);
    expect(r2.body.session_id).not.toBe(c.sessionId);
    const first = await call(h, user, 'GET', `/sessions/${c.sessionId}`);
    expect(first.body.abort_reason).toBe('second_session');
    const hb = await c.beat();
    expect(hb.body.error).toMatchObject({ code: 'SESSION_CLOSED' });
    expect(hb.body.error.details.verdict).toMatchObject({ status: 'aborted', abort_reason: 'second_session' });
  });

  it('§4.1 late_end: the end arrives > 10 min after the planned end without heartbeats in between', async () => {
    const { h, c } = await setup();
    await c.start(25);
    await c.run(25 * MIN - 30_000);
    c.advance(11 * MIN);
    // The sweep would close it first; here the end arrives just before the sweep runs.
    const r = await c.end();
    expect(r.body).toMatchObject({ status: 'aborted' });
    expect(h.db.get<{ abort_reason: string }>('SELECT abort_reason FROM focus_session WHERE id = ?', [c.sessionId])?.abort_reason).toBe('late_end');
  });

  it('§4.1 late_end via the sweep: last heartbeat 30 s before the end, no end report: late_end, not heartbeat_gap (repair)', async () => {
    const { h, user, c } = await setup();
    await c.start(25);
    await c.run(25 * MIN - 30_000);
    c.advance(11 * MIN);
    const active = await call(h, user, 'GET', '/sessions/active');
    expect(active.body.session).toBeUndefined();
    expect(h.db.get<{ abort_reason: string; closed_by: string }>('SELECT abort_reason, closed_by FROM focus_session WHERE id = ?', [c.sessionId])).toEqual({ abort_reason: 'late_end', closed_by: 'sweep' });
  });

  it('§4.1 battery dead: the sweep aborts on the last heartbeat after end + 10 min', async () => {
    const { h, user, c } = await setup();
    await c.start(25);
    await c.run(10 * MIN);
    c.advance(26 * MIN);
    const active = await call(h, user, 'GET', '/sessions/active');
    expect(active.body.session).toBeUndefined();
    expect(h.db.get<{ abort_reason: string; closed_by: string }>('SELECT abort_reason, closed_by FROM focus_session WHERE id = ?', [c.sessionId])).toEqual({ abort_reason: 'heartbeat_gap', closed_by: 'sweep' });
  });

  it('§4.1 a notification without opening (blur only) does not stop the session', async () => {
    const { c } = await setup();
    await c.start(25);
    await c.run(5 * MIN);
    await c.beat({ events: [c.visibility('blur'), c.visibility('focus')] });
    await c.run(20 * MIN - 30_000);
    expect((await c.end()).body.status).toBe('completed');
  });

  it('§4.1 clock moved forward: no effect on the duration; skew > 5 min flags H4', async () => {
    const { c } = await setup();
    await c.start(25);
    await c.run(25 * MIN, { clientSkewMs: 6 * MIN });
    const r = await c.end();
    expect(r.body).toMatchObject({ status: 'completed', verified_min: 25, flagged: true });
  });

  it('§4.1 Twee tabbladen / same device: a second start resumes the running session with a new nonce', async () => {
    const { h, user, dev, c } = await setup();
    await c.start(25);
    await c.run(MIN);
    const tab2 = new FocusClient(h, user, dev);
    tab2.mono = c.mono;
    const r = await tab2.start(25);
    expect(r.status).toBe(200);
    expect(r.body).toMatchObject({ session_id: c.sessionId, resumed: true });
    // The old nonce of the first tab is now invalid: there is always one owner.
    expect((await c.beat()).body.error.code).toBe('NONCE_INVALID');
    expect(h.db.get<{ n: number }>("SELECT COUNT(*) AS n FROM focus_session WHERE user_id = ?", [user.id])?.n).toBe(1);
  });

  it('§4.1 Sessie gestart tussen 01:00 en 04:00 counts for the previous day, without a goal bonus', async () => {
    const { h, user, c } = await setup('2026-12-04T01:30:00Z'); // 02:30 Amsterdam
    h.setArm(user.id, 'A');
    const r = await c.complete(50);
    expect(r.body).toMatchObject({ status: 'completed', points: 50, goal_met: true });
    const s = h.db.get<{ focus_day: string; late_start: number }>('SELECT focus_day, late_start FROM focus_session WHERE id = ?', [c.sessionId]);
    expect(s).toEqual({ focus_day: '2026-12-03', late_start: 1 });
    expect(balance(h, user.id).available).toBe(50);
  });

  it('§4.1 Sessie over 04:00 counts for the start day', async () => {
    const { h, c } = await setup('2026-12-04T02:55:00Z'); // 03:55 Amsterdam
    await c.complete(90);
    expect(h.db.get<{ focus_day: string }>('SELECT focus_day FROM focus_session WHERE id = ?', [c.sessionId])?.focus_day).toBe('2026-12-03');
  });

  it('§4.1 Storing aan onze kant: a gap inside a registered outage goes to review, not abort', async () => {
    const { h, user, c } = await setup();
    const admin = createUser(h, { admin: true });
    await c.start(25);
    await c.run(5 * MIN);
    const from = new Date(h.clock.now().getTime() - 10_000).toISOString();
    const to = new Date(h.clock.now().getTime() + 5 * MIN).toISOString();
    expect((await call(h, admin, 'POST', '/admin/outages', { from, to, note: 'Server down' })).status).toBe(201);
    c.advance(4 * MIN);
    await c.beat();
    await c.run(25 * MIN - 9 * MIN);
    const r = await c.end();
    expect(r.body).toMatchObject({ status: 'completed', flagged: true, points_status: 'pending' });
    expect(balance(h, user.id).pending).toBe(25);
  });

  it('§4.1 Oefensessie: one minute, same protocol, no points, counts nowhere', async () => {
    const { h, user, c } = await setup();
    const r = await c.complete(1);
    expect(r.body).toMatchObject({ status: 'completed', verified_min: 0, points: 0, points_status: 'none' });
    expect(balance(h, user.id).available).toBe(0);
    const bad = await call(h, user, 'POST', '/sessions', { planned_min: 25, device_id: c.deviceId, practice: true, client_ts: 1, mono_ms: 1, webdriver: false, standalone: false }, { 'Idempotency-Key': 'bad-duration-key-1' });
    expect(bad.body.error.code).toBe('INVALID_DURATION');
  });

  it('§4.1 webdriver: completed but flagged H1, points pending until a reviewer releases them', async () => {
    const { h, user, c } = await setup();
    const r = await c.complete(25, { webdriver: true });
    expect(r.body).toMatchObject({ status: 'completed', flagged: true, points_status: 'pending' });
    expect(balance(h, user.id).pending).toBe(25);
  });
});

describe('architecture §4.7 Herhaalde verzoeken en verloren antwoorden', () => {
  it('§4.7 POST /sessions repeated with the same key and body: same session_id, no second session', async () => {
    const { h, user, c } = await setup();
    const first = await c.start(25, { key: 'start-key-0001' });
    const again = await c.start(25, { key: 'start-key-0001' });
    expect(again.status).toBe(201);
    expect(again.body.session_id).toBe(first.body.session_id);
    expect(h.db.get<{ n: number }>('SELECT COUNT(*) AS n FROM focus_session WHERE user_id = ?', [user.id])?.n).toBe(1);
  });

  it('§4.7 POST /sessions with the same key and another body: IDEMPOTENCY_CONFLICT', async () => {
    const { c } = await setup();
    await c.start(25, { key: 'start-key-0002' });
    const r = await c.start(50, { key: 'start-key-0002' });
    expect(r.body.error.code).toBe('IDEMPOTENCY_CONFLICT');
  });

  it('§4.7 POST /sessions without a known key while a session runs on this device: resumed with a new nonce', async () => {
    const { h, user, c } = await setup();
    const first = await c.start(25);
    const old = c.nonce;
    const r = await c.start(25);
    expect(r.status).toBe(200);
    expect(r.body).toMatchObject({ session_id: first.body.session_id, resumed: true });
    expect(r.body.nonce).not.toBe(old);
    expect(h.db.get<{ n: number }>("SELECT COUNT(*) AS n FROM session_heartbeat WHERE kind = 'resume' AND session_id = ?", [c.sessionId])?.n).toBe(1);
    expect(user.id).toBeTruthy();
  });

  it('§4.7 heartbeat repeated with the previous nonce and the same seq: cached answer, no new row', async () => {
    const { h, c } = await setup();
    await c.start(25);
    c.advance(30_000);
    const prevNonce = c.nonce;
    const first = await c.beat();
    // The answer was lost: the client repeats the open request unchanged, twice.
    const again = await c.beat({ nonce: prevNonce, seq: 1, keepNonce: true });
    const third = await c.beat({ nonce: prevNonce, seq: 1, keepNonce: true });
    expect(again.body).toEqual(first.body);
    expect(third.body).toEqual(first.body);
    expect(h.db.get<{ n: number }>("SELECT COUNT(*) AS n FROM session_heartbeat WHERE kind = 'online' AND session_id = ?", [c.sessionId])?.n).toBe(1);
    // Then the chain continues without NONCE_INVALID and without a gap.
    await c.run(25 * MIN - 30_000);
    expect((await c.end()).body.status).toBe('completed');
  });

  it('§4.7 heartbeat with the previous nonce and another seq: NONCE_INVALID', async () => {
    const { c } = await setup();
    await c.start(25);
    c.advance(30_000);
    const prevNonce = c.nonce;
    await c.beat();
    c.advance(30_000);
    expect((await c.beat({ nonce: prevNonce, seq: 2, keepNonce: true })).body.error.code).toBe('NONCE_INVALID');
    expect((await c.beat({ nonce: 'unknown-nonce-00000000', seq: 2, keepNonce: true })).body.error.code).toBe('NONCE_INVALID');
  });

  it('§4.7 POST /end repeated (previous or current nonce) after closing: the stored verdict, no double booking', async () => {
    const { h, user, c } = await setup();
    const first = await c.complete(25);
    const again = await c.end();
    expect(again.status).toBe(200);
    expect(again.body).toEqual(first.body);
    expect(balance(h, user.id).available).toBe(25);
    expect(h.db.get<{ n: number }>("SELECT COUNT(*) AS n FROM journal_entry WHERE ref_id = ? AND type = 'earn_session'", [c.sessionId])?.n).toBe(1);
  });

  it('§4.7 POST /stop repeated: the stored answer', async () => {
    const { c } = await setup();
    await c.start(25);
    await c.run(MIN);
    const first = await c.stop();
    const again = await c.stop();
    expect(again.status).toBe(200);
    expect(again.body).toEqual(first.body);
  });

  it('§4.7 end or stop on a session closed by something else: 409 SESSION_CLOSED with details.verdict', async () => {
    const { c } = await setup();
    await c.start(25);
    await c.run(MIN);
    await c.beacon([c.hidden()]);
    const end = await c.end();
    expect(end.status).toBe(409);
    expect(end.body.error).toMatchObject({ code: 'SESSION_CLOSED', details: { verdict: { status: 'aborted', abort_reason: 'hidden' } } });
    const stop = await c.stop();
    expect(stop.body.error.code).toBe('SESSION_CLOSED');
  });

  it('§4.7 POST /events: every repeat is a 202; events are deduplicated on ev_seq', async () => {
    const { h, c } = await setup();
    await c.start(25);
    const ev = c.visibility('blur');
    expect((await c.beacon([ev])).status).toBe(202);
    expect((await c.beacon([ev])).status).toBe(202);
    expect(h.db.get<{ n: number }>('SELECT COUNT(*) AS n FROM visibility_event WHERE session_id = ?', [c.sessionId])?.n).toBe(1);
  });

  it('§4.7 sessions of another user are not visible (owner check)', async () => {
    const { h, c } = await setup();
    await c.start(25);
    const other = createUser(h);
    expect((await call(h, other, 'GET', `/sessions/${c.sessionId}`)).status).toBe(404);
  });
});

describe('architecture §4.8 restore', () => {
  it('§4.8 aborted by a gap, then an outage is registered and restore books earn and goal bonus', async () => {
    const { h, user, c } = await setup();
    h.setArm(user.id, 'A');
    const admin = createUser(h, { admin: true });
    await c.start(25);
    await c.run(5 * MIN);
    const gapFrom = h.clock.now().getTime();
    c.advance(3 * MIN);
    expect((await c.beat()).body.status).toBe('aborted');
    await call(h, admin, 'POST', '/admin/outages', { from: new Date(gapFrom - 1000).toISOString(), to: new Date(gapFrom + 4 * MIN).toISOString(), note: 'Storing' });
    // The client kept running offline and delivers its log later.
    const r = await call(h, admin, 'POST', `/admin/sessions/${c.sessionId}/restore`, { reason_code: 'outage', note: 'Storing bevestigd' });
    expect(r.status).toBe(200);
    expect(r.body.session).toMatchObject({ status: 'completed', verified_min: 25, counted_min: 25 });
    expect(balance(h, user.id).available).toBe(45);
    const keys = h.db.all<{ idempotency_key: string }>('SELECT idempotency_key FROM journal_entry').map((x) => x.idempotency_key);
    expect(keys).toContain(`earn:${c.sessionId}`);
    expect(keys.some((k) => k.startsWith('goal_bonus:'))).toBe(true);
    expect((await call(h, admin, 'POST', `/admin/sessions/${c.sessionId}/restore`, { reason_code: 'outage', note: 'nog eens' })).body.error.code).toBe('SESSION_NOT_RESTORABLE');
  });

  it('§4.8 a hidden abort is not restorable', async () => {
    const { h, c } = await setup();
    const admin = createUser(h, { admin: true });
    await c.start(25);
    await c.beacon([c.hidden()]);
    const r = await call(h, admin, 'POST', `/admin/sessions/${c.sessionId}/restore`, { reason_code: 'late_log', note: 'x' });
    expect(r.body.error.code).toBe('SESSION_NOT_RESTORABLE');
  });
});
