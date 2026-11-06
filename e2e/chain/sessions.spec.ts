// The session protocol through the real API (architecture §4, §11 table). The WP-8 specs in
// e2e/focus test the browser side against a protocol fake; these run the same rows server-side.
import { registerDevice } from '../../tooling/seed/flows.ts';
import { expect, test } from '../support/fixtures.ts';
import { Chain, MIN, SEASON_START, enableFlag, entriesFor, homeIp, local, studentInArm, type ChainStudent } from '../support/steps.ts';

const hb = (nonce: string, seq: number, monoMs: number, t: number) => ({ nonce, seq, mono_ms: monoMs, client_ts: t, visibility: 'visible' as const, wakelock: 'acquired' as const, events: [] });

test('Sessie van 25 minuten met de klok vooruit in stappen van 30 s: completed, 25 punten, doel en doelbonus, squad ziet het (arch §11, spec §4.1)', async ({ api }) => {
  const c = new Chain(api);
  await c.at(local('2026-12-03', '10:00'));
  const s = await studentInArm(c, 'A', { goal: 25 });
  const squad = await s.actor.api.call('squads.create', { body: { name: 'Klokploeg' } });
  const mate = await c.student({ invite: squad.invite.token });
  await mate.actor.api.call('invites.accept', { params: { token: squad.invite.token } });
  const [r] = await c.sessions({ actor: s.actor, deviceId: s.deviceId, start: (await api.now()) + MIN, plannedMin: 25, outcome: { kind: 'complete' }, intervalS: 30 });
  expect(r!.status).toBe('completed');
  const balance = await s.actor.api.call('points.balance');
  expect(balance.available).toBe(25 + 20);
  const today = await s.actor.api.call('me.today');
  expect(today.goal_met).toBe(true);
  expect(entriesFor(api, r!.sessionId).map((e) => e.type)).toContain('earn_session');
  expect(api.sql<{ type: string }>("SELECT type FROM journal_entry WHERE type = 'goal_bonus'").length).toBe(1);
  const mine = await mate.actor.api.call('squads.mine');
  expect(mine.members.find((m) => m.first_name === 'Test' && m.goal_met_today)).toBeTruthy();
});

test('Antwoord op twee heartbeats weggegooid na verwerking: geen NONCE_INVALID, geen heartbeat_gap, completed (arch §11, §4.7)', async ({ api }) => {
  const c = new Chain(api);
  await c.at(local('2026-12-03', '10:00'));
  const s = await c.student();
  const t0 = await api.now();
  const start = await s.actor.api.call('sessions.start', { body: { planned_min: 25, device_id: s.deviceId, practice: false, client_ts: t0, mono_ms: 1000, webdriver: false, standalone: false } });
  let nonce = start.nonce;
  let seq = 0;
  for (let i = 1; i <= 18; i++) {
    await c.at(t0 + i * 80_000);
    const t = await api.now();
    seq += 1;
    const body = hb(nonce, seq, 1000 + (t - t0), t);
    const first = await s.actor.api.call('sessions.heartbeat', { params: { id: start.session_id }, body });
    if (i === 4 || i === 5) {
      // The answer is lost on the way back; the client repeats the same request unchanged.
      const again = await s.actor.api.call('sessions.heartbeat', { params: { id: start.session_id }, body });
      expect(again.nonce).toBe(first.nonce);
    }
    nonce = first.nonce;
  }
  await c.at(t0 + 25 * MIN + 2000);
  const end = await s.actor.api.call('sessions.end', { params: { id: start.session_id }, body: { nonce, mono_ms: 1000 + 25 * MIN + 2000, client_ts: await api.now(), events: [] } });
  expect(end.status).toBe('completed');
  expect(api.sql('SELECT 1 FROM event WHERE name = ?', ['heartbeat_gap'])).toHaveLength(0);
});

test('Antwoord op POST /sessions weggegooid; dezelfde sleutel geeft dezelfde sessie; sleutel kwijt geeft resumed (arch §11, §4.7)', async ({ api }) => {
  const c = new Chain(api);
  await c.at(local('2026-12-03', '10:00'));
  const s = await c.student();
  const body = { planned_min: 25 as const, device_id: s.deviceId, practice: false, client_ts: await api.now(), mono_ms: 500, webdriver: false, standalone: false };
  const a = await s.actor.api.call('sessions.start', { body, idempotencyKey: 'start-key-0001' });
  const b = await s.actor.api.call('sessions.start', { body, idempotencyKey: 'start-key-0001' });
  expect(b.session_id).toBe(a.session_id);
  // Reload during `starting`: the key is gone; a new start on the same device resumes.
  await c.advance(20_000);
  const r = await s.actor.api.call('sessions.start', { body: { ...body, client_ts: await api.now(), mono_ms: 600 }, idempotencyKey: 'start-key-0002' });
  expect(r.session_id).toBe(a.session_id);
  expect(r.resumed).toBe(true);
  expect(r.nonce).not.toBe(a.nonce);
  expect(api.sql('SELECT id FROM focus_session')).toHaveLength(1);
});

test('Antwoord op /end en op /stop weggegooid; herhaling geeft de opgeslagen uitspraak, geen dubbele boeking (arch §11, §4.7)', async ({ api }) => {
  const c = new Chain(api);
  await c.at(local('2026-12-03', '10:00'));
  const s = await c.student();
  const run = async (stopAtMin: number | null) => {
    const t0 = await api.now();
    const start = await s.actor.api.call('sessions.start', { body: { planned_min: 25, device_id: s.deviceId, practice: false, client_ts: t0, mono_ms: 0, webdriver: false, standalone: false } });
    let nonce = start.nonce;
    const until = stopAtMin ?? 25;
    for (let i = 1; i * 80_000 < until * MIN; i++) {
      await c.at(t0 + i * 80_000);
      nonce = (await s.actor.api.call('sessions.heartbeat', { params: { id: start.session_id }, body: hb(nonce, i, i * 80_000, t0 + i * 80_000) })).nonce;
    }
    await c.at(t0 + until * MIN + 1000);
    if (stopAtMin !== null) {
      const x = await s.actor.api.call('sessions.stop', { params: { id: start.session_id }, body: { nonce } });
      const y = await s.actor.api.call('sessions.stop', { params: { id: start.session_id }, body: { nonce } });
      expect(y).toEqual(x);
      return start.session_id;
    }
    const body = { nonce, mono_ms: 25 * MIN + 1000, client_ts: await api.now(), events: [] };
    const x = await s.actor.api.call('sessions.end', { params: { id: start.session_id }, body });
    const y = await s.actor.api.call('sessions.end', { params: { id: start.session_id }, body });
    expect(y).toEqual(x);
    expect(x.status).toBe('completed');
    return start.session_id;
  };
  const done = await run(null);
  expect(entriesFor(api, done).filter((e) => e.type === 'earn_session')).toHaveLength(1);
  await c.advance(5 * MIN);
  const stopped = await run(10);
  expect(api.sql<{ status: string; abort_reason: string }>('SELECT status, abort_reason FROM focus_session WHERE id = ?', [stopped])[0]).toEqual({ status: 'aborted', abort_reason: 'user_stop' });
  expect(entriesFor(api, stopped)).toHaveLength(0);
});

test('Sessie van 90 minuten die om 03:55 start; dagafsluiting om 05:45: vorige focusdag, doel gehaald, geen goal_lapse (arch §11, §6.1)', async ({ api }) => {
  const c = new Chain(api);
  await c.at(local('2026-12-03', '20:00'));
  const s = await studentInArm(c, 'A', { goal: 90 });
  const [r] = await c.sessions({ actor: s.actor, deviceId: s.deviceId, start: local('2026-12-04', '03:55'), plannedMin: 90, outcome: { kind: 'complete' } });
  expect(r!.status).toBe('completed');
  const row = api.sql<{ focus_day: string; late_start: number }>('SELECT focus_day, late_start FROM focus_session WHERE id = ?', [r!.sessionId])[0]!;
  expect(row.focus_day).toBe('2026-12-03');
  await c.closeDay('2026-12-03');
  const day = api.sql<{ goal_met: number }>('SELECT goal_met FROM user_day WHERE focus_day = ?', ['2026-12-03'])[0]!;
  expect(day.goal_met).toBe(1);
  expect(api.sql("SELECT 1 FROM journal_entry WHERE type = 'goal_lapse'")).toHaveLength(0);
  // Spec §4.2 night rule (01:00–04:00): no goal bonus in arm A; see docs/build/WP-11.md (contradiction with arch §11).
  expect(row.late_start).toBe(1);
});

test('Dezelfde sessie, na 12 minuten verborgen: afgebroken met hidden, 12 minuten, 0 punten, streak intact (arch §11, spec §4.1)', async ({ api }) => {
  const c = new Chain(api);
  await c.at(local('2026-12-03', '10:00'));
  const s = await c.student();
  const [r] = await c.sessions({ actor: s.actor, deviceId: s.deviceId, start: (await api.now()) + MIN, plannedMin: 25, outcome: { kind: 'hidden', atMin: 12 } });
  expect(r!.status).toBe('aborted');
  const detail = await s.actor.api.call('sessions.get', { params: { id: r!.sessionId } });
  expect(detail.abort_reason).toBe('hidden');
  expect(detail.explanation_key).toMatch(/hidden/);
  const ev = api.sql<{ props: string }>("SELECT props FROM event WHERE name = 'session_aborted'")[0]!;
  expect(JSON.parse(ev.props).verstreken_s).toBe(720);
  expect((await s.actor.api.call('points.balance')).available).toBe(0);
});

test('Netwerk 3 minuten offline met zichtbare pagina: completed en H3; 6 minuten offline: heartbeat_gap (arch §11, spec §4.1)', async ({ api }) => {
  const c = new Chain(api);
  await c.at(local('2026-12-03', '10:00'));
  const s = await c.student();
  const t = (await api.now()) + MIN;
  const [three] = await c.sessions({ actor: s.actor, deviceId: s.deviceId, start: t, plannedMin: 25, outcome: { kind: 'complete' }, offline: { fromMin: 8.5, toMin: 11 } });
  expect(three!.status).toBe('completed');
  expect(api.sql<{ flag_codes: string }>('SELECT flag_codes FROM focus_session WHERE id = ?', [three!.sessionId])[0]!.flag_codes).toContain('H3');
  const [six] = await c.sessions({ actor: s.actor, deviceId: s.deviceId, start: t + 40 * MIN, plannedMin: 25, outcome: { kind: 'complete' }, offline: { fromMin: 8, toMin: 14 } });
  expect(six!.status).toBe('aborted');
  expect(api.sql<{ abort_reason: string }>('SELECT abort_reason FROM focus_session WHERE id = ?', [six!.sessionId])[0]!.abort_reason).toBe('heartbeat_gap');
});

test('Afgebroken door een gat, daarna storing geregistreerd en restore: completed, earn en doelbonus, auditregel (arch §11, §4.8)', async ({ api }) => {
  const c = new Chain(api);
  await c.at(local('2026-12-03', '09:00'));
  const admin = await c.admin('anna');
  const s = await studentInArm(c, 'A', { goal: 25 });
  const t = (await api.now()) + MIN;
  const [r] = await c.sessions({ actor: s.actor, deviceId: s.deviceId, start: t, plannedMin: 25, outcome: { kind: 'gap', atMin: 10 } });
  expect(r!.status).toBe('aborted');
  const outage = await admin.api.call('admin.outages.create', { body: { from: new Date(t + 9 * MIN).toISOString(), to: new Date(t + 26 * MIN).toISOString(), note: 'Storing hosting (e2e)' } });
  expect(outage.restorable_sessions.map((x) => x.session_id)).toContain(r!.sessionId);
  const restored = await admin.api.call('admin.sessions.restore', { params: { id: r!.sessionId }, body: { reason_code: 'outage', note: 'Storing hosting (e2e)' } });
  expect(restored.session.status).toBe('completed');
  expect(entriesFor(api, r!.sessionId).map((e) => e.idempotency_key)).toContain(`earn:${r!.sessionId}`);
  expect(api.sql("SELECT 1 FROM journal_entry WHERE type = 'goal_bonus'")).toHaveLength(1);
  expect(api.sql("SELECT 1 FROM audit_log WHERE object_ref = ? OR reason LIKE '%outage%'", [r!.sessionId]).length).toBeGreaterThan(0);
});

test('Tweede browsercontext (ander toestel) start een sessie: de eerste wordt second_session (arch §11, spec §4.1)', async ({ api }) => {
  const c = new Chain(api);
  await c.at(local('2026-12-03', '10:00'));
  const s = await c.student();
  const laptop = api.newActor(homeIp());
  laptop.cookies.clear();
  for (const [k, v] of s.actor.cookies) laptop.cookies.set(k, v);
  const laptopDevice = await registerDevice(laptop, c.rng, 'desktop');
  const t = (await api.now()) + MIN;
  const res = await c.sessions(
    { actor: s.actor, deviceId: s.deviceId, start: t, plannedMin: 50, outcome: { kind: 'complete' } },
    { actor: laptop, deviceId: laptopDevice, start: t + 10 * MIN, plannedMin: 25, outcome: { kind: 'complete' } },
  );
  const rows = api.sql<{ device_id: string; status: string; abort_reason: string | null }>('SELECT device_id, status, abort_reason FROM focus_session ORDER BY server_start_at');
  expect(rows[0]).toMatchObject({ device_id: s.deviceId, status: 'aborted', abort_reason: 'second_session' });
  expect(rows[1]).toMatchObject({ device_id: laptopDevice, status: 'completed' });
  expect(res).toHaveLength(2);
});

test('Tweede gebruiker logt in in hetzelfde browserprofiel: eigen device-rij, sessies blijven bij de eerste (arch §11, §4.2)', async ({ api }) => {
  const c = new Chain(api);
  await c.at(local('2026-12-03', '10:00'));
  const first: ChainStudent = await c.student();
  const [r] = await c.sessions({ actor: first.actor, deviceId: first.deviceId, start: (await api.now()) + MIN, plannedMin: 25, outcome: { kind: 'complete' } });
  // Same browser profile: the same client_device_id (stored in IndexedDB) for the next account.
  const clientId = api.sql<{ client_device_id: string }>('SELECT client_device_id FROM device WHERE id = ?', [first.deviceId])[0]!.client_device_id;
  await first.actor.api.call('auth.logout');
  const second = await c.student();
  const d = await second.actor.api.call('devices.register', { body: { client_device_id: clientId, ua_class: 'android_chrome', standalone: false, wakelock_supported: true } });
  expect(d.device_id).not.toBe(first.deviceId);
  expect(api.sql<{ n: number }>('SELECT count(*) AS n FROM device WHERE client_device_id = ?', [clientId])[0]!.n).toBe(2);
  expect(api.sql<{ user_id: string }>('SELECT user_id FROM focus_session WHERE id = ?', [r!.sessionId])[0]!.user_id).toBe(api.sql<{ user_id: string }>('SELECT user_id FROM device WHERE id = ?', [first.deviceId])[0]!.user_id);
  expect(await second.actor.codeOf(second.actor.api.call('sessions.get', { params: { id: r!.sessionId } }))).toBe('NOT_FOUND');
});

test('Standaard Playwright (webdriver = true): completed maar H1, punten en doelbonus in afwachting, vrijgave geeft ze vrij (arch §11, §4.6)', async ({ api }) => {
  const c = new Chain(api);
  await c.at(local('2026-12-03', '09:00'));
  const admin = await c.admin('anna');
  const s = await studentInArm(c, 'A', { goal: 25 });
  const [r] = await c.sessions({ actor: s.actor, deviceId: s.deviceId, start: (await api.now()) + MIN, plannedMin: 25, outcome: { kind: 'complete' }, webdriver: true });
  expect(r!.status).toBe('completed');
  const pending = await s.actor.api.call('points.balance');
  expect(pending.available).toBe(0);
  expect(pending.pending).toBe(45);
  const flags = await admin.api.call('admin.flags.list', { query: { status: 'open' } });
  const flag = flags.items.find((f) => f.code === 'H1')!;
  expect(flag).toBeTruthy();
  await admin.api.call('admin.flags.decide', { params: { id: flag.id }, body: { decision: 'release', reason_code: 'false_positive', note: 'Testbrowser, e2e' } });
  const after = await s.actor.api.call('points.balance');
  expect(after.available).toBe(45);
  expect(after.pending).toBe(0);
});

test('navigator.webdriver overschreven op false: ongemarkeerd voltooid (arch §11, §4.6)', async ({ api }) => {
  const c = new Chain(api);
  await c.at(local('2026-12-03', '10:00'));
  const s = await c.student();
  const [r] = await c.sessions({ actor: s.actor, deviceId: s.deviceId, start: (await api.now()) + MIN, plannedMin: 25, outcome: { kind: 'complete' }, webdriver: false });
  expect(api.sql<{ flag_codes: string; review_status: string }>('SELECT flag_codes, review_status FROM focus_session WHERE id = ?', [r!.sessionId])[0]).toEqual({ flag_codes: '[]', review_status: 'none' });
});

test('Sessie van 50 minuten die om 01:30 start, dagdoel 50: punten en dagdoel, geen doelbonus (A) en wel goal_budget_lapse (B) (arch §11, spec §4.2)', async ({ api }) => {
  const c = new Chain(api);
  await c.at(SEASON_START);
  await enableFlag(c, 'arm_b');
  const a = await studentInArm(c, 'A', { goal: 50 });
  const b = await studentInArm(c, 'B', { goal: 50 });
  const night = local('2026-12-04', '01:30');
  const res = await c.sessions(
    { actor: a.actor, deviceId: a.deviceId, start: night, plannedMin: 50, outcome: { kind: 'complete' } },
    { actor: b.actor, deviceId: b.deviceId, start: night, plannedMin: 50, outcome: { kind: 'complete' } },
  );
  expect(res.map((r) => r.status)).toEqual(['completed', 'completed']);
  await c.closeDay('2026-12-03');
  const days = api.sql<{ goal_met: number; counted_min: number }>("SELECT goal_met, counted_min FROM user_day WHERE focus_day = '2026-12-03' AND counted_min > 0");
  expect(days).toEqual([{ goal_met: 1, counted_min: 50 }, { goal_met: 1, counted_min: 50 }]);
  const types = api.sql<{ type: string }>("SELECT type FROM journal_entry WHERE focus_day = '2026-12-03'").map((e) => e.type);
  expect(types).not.toContain('goal_bonus');
  expect(types).toContain('goal_budget_lapse');
});
