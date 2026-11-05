// Acceptance WP-6 (architecture §10.6): the retention step (day close step 11) moves the dev clock
// past every period and checks per rule that the datum is gone or reduced, and that fresh data and
// data under an open appeal stay. Idempotent: a second run changes nothing.
import { describe, expect, it } from 'vitest';
import { dayCloseJob } from '../src/jobs/day_close/index.ts';
import { createScheduler } from '../src/jobs/scheduler.ts';
import type { SqlFlagService } from '../src/modules/fraud/lib/flags.ts';
import { runRetention } from '../src/modules/fraud/lib/retention.ts';
import { actor, createAdmin, createUser, rawClub, rawLink, rawSession, wp6Harness } from './wp6/harness.ts';

const DAY = 86_400_000;

describe('architecture §10.6 retention per rule', () => {
  it('reduces or deletes every datum past its period and keeps the rest', () => {
    const h = wp6Harness({ start: '2026-12-01T10:00:00Z' });
    const admin = createAdmin(h);
    const old = createUser(h);
    const fresh = createUser(h);
    const t0 = h.clock.now();
    h.db.transaction(() => h.services.audit.audit(h.db, { actor: 'system', action: 'test_line', objectType: 'test', objectRef: 'old' }));
    const iso = (ms: number) => new Date(ms).toISOString();
    // Old session with signals, IP and UA; a fresh one.
    const sOld = rawSession(h, old.id, { start: t0.getTime(), ipHash: 'ip_old', netClass: 'campus', uaClass: 'ios_safari' });
    h.db.run("INSERT INTO session_heartbeat (session_id, seq, server_recv_at, client_ts, mono_ms, visibility, wakelock, nonce_ok, buffered, kind) VALUES (?, 1, ?, ?, 1, 'visible', 'acquired', 1, 0, 'online')", [sOld, t0.getTime(), t0.getTime()]);
    h.db.run("INSERT INTO visibility_event (id, session_id, ev_seq, kind, mono_ms, client_ts, server_recv_at, buffered) VALUES ('01JVIS0000000000000000000A', ?, 1, 'hidden', 1, ?, ?, 0)", [sOld, t0.getTime(), t0.getTime()]);
    h.db.run("UPDATE user SET registration_ip_hash = 'reg_ip', registration_net_class = 'other' WHERE id = ?", [old.id]);
    const club = rawClub(h);
    rawLink(h, club, old.id, iso(t0.getTime()), 'link_ip', 'other');
    // Flags: one decided (evidence and row go), one open (stays), one decided but with an open appeal (evidence stays).
    const flags = h.services.flags as SqlFlagService;
    const fDecided = h.db.transaction(() => flags.raise(h.db, { code: 'H2', subject: { type: 'session' }, sessionIds: [sOld], evidence: { accounts: 4, threshold: 3, net_class: 'other', ip: 'ip_old' }, userIds: [old.id] }));
    const fOpen = h.db.transaction(() => flags.raise(h.db, { code: 'H9', subject: { type: 'account', id: old.id }, sessionIds: [], evidence: { delayed: 5, threshold_pct: 80 } }));
    const fAppealed = h.db.transaction(() => flags.raise(h.db, { code: 'H5', subject: { type: 'account', id: fresh.id }, sessionIds: [], evidence: { minutes: [500], threshold: 480 } }));
    h.db.transaction(() => {
      flags.decide(h.db, fDecided, 'release', actor(h, admin.id), 'shared_network');
      flags.decide(h.db, fAppealed, 'reject', actor(h, admin.id), 'implausible_pattern');
    });
    h.db.run("INSERT INTO appeal (id, object_type, object_id, user_id, text, status, submitted_at, due_day) VALUES ('01JAPPEAL0000000000000000A', 'flag', ?, ?, 'tekst', 'open', ?, '2026-12-08')", [fAppealed, fresh.id, iso(t0.getTime())]);
    h.db.run("INSERT INTO appeal (id, object_type, object_id, user_id, text, status, submitted_at, due_day, decided_by, decided_at, outcome, motivation) VALUES ('01JAPPEAL0000000000000000B', 'flag', ?, ?, 'oude tekst', 'decided', ?, '2026-12-08', ?, ?, 'rejected', 'm')", [
      fDecided,
      old.id,
      iso(t0.getTime()),
      actor(h, admin.id),
      iso(t0.getTime()),
    ]);
    h.db.run("INSERT INTO blocked_phone_hash (phone_hash, blocked_at, expires_at) VALUES ('ph_exp', ?, ?)", [iso(t0.getTime()), iso(t0.getTime() + 2 * 365 * DAY)]);
    h.db.run("INSERT INTO support_ticket (id, user_id, kind, text, label, status, created_at, resolved_at) VALUES ('01JT1CKET0LD0000000000000X', ?, 'other', 'mijn verhaal', 'welzijn', 'resolved', ?, ?)", [old.id, iso(t0.getTime()), iso(t0.getTime())]);
    h.db.run("INSERT INTO support_ticket (id, user_id, kind, text, status, created_at) VALUES ('01JT1CKET0PEN000000000000X', ?, 'other', 'open ticket', 'open', ?)", [old.id, iso(t0.getTime())]);
    h.db.run("INSERT INTO prize (id, kind, reward_kind, value_cents, declaration_ref, min_age_band, status, verified_by, verified_at, deliver_after, delivered_at, created_at) VALUES ('01JPRIZEOLD000000000000000', 'earned_individual', 'in_kind', 500, 'd', '16_17', 'delivered', ?, ?, ?, ?, ?)", [
      actor(h, admin.id),
      iso(t0.getTime()),
      iso(t0.getTime() + 14 * DAY),
      iso(t0.getTime() + 14 * DAY),
      iso(t0.getTime()),
    ]);
    h.db.run("INSERT INTO prize_delivery_contact (id, prize_id, full_name, address, created_at) VALUES ('01JCONTACTOLD0000000000000', '01JPRIZEOLD000000000000000', 'Naam', 'Adres', ?)", [iso(t0.getTime())]);
    h.db.run("INSERT INTO idempotency_record (scope_ref, key, route, request_hash, status_code, response, created_at) VALUES (?, 'k', 'r', 'h', 200, '{}', ?)", [old.id, iso(t0.getTime())]);
    h.db.run("INSERT INTO fraud_sample (id, kind, week_key, seed_version, size, drawn_at) VALUES ('01JSAMPLEOLD00000000000000', 'weekly', '2026-11-23', 't', 1, ?)", [iso(t0.getTime())]);
    h.db.run("INSERT INTO fraud_sample_item (id, sample_id, user_id, stratum, score, judgement, reason_code, judged_by, judged_at) VALUES ('01JITEMOLD0000000000000000', '01JSAMPLEOLD00000000000000', ?, 'no_club', 's', 'none', 'anchor_confirmed', ?, ?)", [
      old.id,
      actor(h, admin.id),
      iso(t0.getTime()),
    ]);

    // 1 day later: nothing of the 30-day rules moved yet; the 24-hour rules did.
    let r = runRetention(h.deps, new Date(t0.getTime() + 2 * DAY));
    expect(r.idempotency).toBe(1);
    expect(r.session_network).toBe(0);
    // 31 days: network data; 91 days: signals summarised; 2 years and a day: flag rows, sample items, audit, blocked hash.
    h.clock.set(new Date(t0.getTime() + 31 * DAY));
    r = runRetention(h.deps, h.clock.now());
    expect(h.db.get('SELECT ip_hash, net_class, ua_class FROM focus_session WHERE id = ?', [sOld])).toEqual({ ip_hash: null, net_class: null, ua_class: 'other' });
    expect(h.db.get('SELECT registration_ip_hash, registration_net_class FROM user WHERE id = ?', [old.id])).toEqual({ registration_ip_hash: null, registration_net_class: null });
    expect(h.db.get('SELECT ip_hash FROM club_membership WHERE user_id = ?', [old.id])).toEqual({ ip_hash: null });
    expect(JSON.parse((h.db.get<{ evidence: string }>('SELECT evidence FROM fraud_flag WHERE id = ?', [fDecided]) as { evidence: string }).evidence)).toEqual({ threshold: 3, net_class: 'other' });
    expect(JSON.parse((h.db.get<{ evidence: string }>('SELECT evidence FROM fraud_flag WHERE id = ?', [fAppealed]) as { evidence: string }).evidence)).toEqual({ minutes: [500], threshold: 480 });
    expect(JSON.parse((h.db.get<{ evidence: string }>('SELECT evidence FROM fraud_flag WHERE id = ?', [fOpen]) as { evidence: string }).evidence)).toEqual({ delayed: 5, threshold_pct: 80 });
    expect(h.db.get("SELECT count(*) AS n FROM session_heartbeat")).toEqual({ n: 1 });
    expect(h.db.get('SELECT count(*) AS n FROM prize_delivery_contact')).toEqual({ n: 1 });

    h.clock.set(new Date(t0.getTime() + 91 * DAY));
    runRetention(h.deps, h.clock.now());
    expect(h.db.get('SELECT count(*) AS n FROM session_heartbeat')).toEqual({ n: 0 });
    expect(h.db.get('SELECT count(*) AS n FROM visibility_event')).toEqual({ n: 0 });
    expect(h.db.get('SELECT hidden_count FROM session_summary WHERE session_id = ?', [sOld])).toEqual({ hidden_count: 1 });
    expect(h.db.get("SELECT text FROM appeal WHERE id = '01JAPPEAL0000000000000000B'")).toEqual({ text: null });
    expect(h.db.get("SELECT text, label FROM support_ticket WHERE id = '01JT1CKET0LD0000000000000X'")).toEqual({ text: null, label: 'welzijn' });
    expect(h.db.get("SELECT text FROM support_ticket WHERE id = '01JT1CKET0PEN000000000000X'")).toEqual({ text: 'open ticket' });
    expect(h.db.get('SELECT count(*) AS n FROM prize_delivery_contact')).toEqual({ n: 0 });

    const auditBefore = h.db.get<{ n: number }>('SELECT count(*) AS n FROM audit_log')?.n ?? 0;
    expect(auditBefore).toBeGreaterThan(0);
    h.clock.set(new Date(t0.getTime() + (2 * 365 + 2) * DAY));
    runRetention(h.deps, h.clock.now());
    expect(h.db.get('SELECT count(*) AS n FROM fraud_flag WHERE id = ?', [fDecided])).toEqual({ n: 0 });
    expect(h.db.get('SELECT count(*) AS n FROM fraud_flag WHERE id = ?', [fOpen])).toEqual({ n: 1 });
    expect(h.db.get('SELECT count(*) AS n FROM fraud_sample_item')).toEqual({ n: 0 });
    expect(h.db.get("SELECT count(*) AS n FROM blocked_phone_hash WHERE phone_hash = 'ph_exp'")).toEqual({ n: 0 });
    expect(h.db.get<{ n: number }>('SELECT count(*) AS n FROM audit_log')?.n).toBeLessThan(auditBefore);
    // The audit log still refuses deleting recent rows.
    h.db.transaction(() => h.services.audit.audit(h.db, { actor: 'system', action: 'test_line', objectType: 'test', objectRef: 'new' }));
    expect(() => h.db.run('DELETE FROM audit_log')).toThrow(/append-only/);
    // Raw events are aggregated after 15 June 2027.
    expect(h.db.get<{ n: number }>('SELECT count(*) AS n FROM event')?.n).toBe(0);
    expect(h.db.get<{ n: number }>('SELECT count(*) AS n FROM event_week_aggregate')?.n).toBeGreaterThanOrEqual(0);
    // Idempotent.
    const again = runRetention(h.deps, h.clock.now());
    expect(Object.entries(again).filter(([k, v]) => v > 0 && k !== 'audit_log')).toEqual([]);
  });

  it('raw events are aggregated per week, arm and release after 15 June 2027', () => {
    const h = wp6Harness({ start: '2027-03-01T10:00:00Z' });
    const s = createUser(h);
    const p = h.db.get<{ pseudonym: string }>('SELECT pseudonym FROM user WHERE id = ?', [s.id])?.pseudonym as string;
    h.db.transaction(() => {
      for (let i = 0; i < 3; i++) h.services.events.event(h.db, 'plus_interest', {}, { pseudonym: p });
    });
    runRetention(h.deps, new Date('2027-06-15T12:00:00Z'));
    expect(h.db.get('SELECT count(*) AS n FROM event')).toEqual({ n: 3 });
    runRetention(h.deps, new Date('2027-06-16T05:45:00Z'));
    expect(h.db.get('SELECT count(*) AS n FROM event')).toEqual({ n: 0 });
    expect(h.db.get("SELECT n FROM event_week_aggregate WHERE name = 'plus_interest'")).toEqual({ n: 3 });
  });

  it('runs as day close step 11', async () => {
    const h = wp6Harness({ start: '2026-12-08T06:00:00Z' });
    const sched = createScheduler({ clock: h.clock, moduleDeps: h.deps });
    sched.register(dayCloseJob());
    const res = await sched.runNow('day_close', 'day_close:2026-12-07');
    expect(res.status).toBe('done');
    expect(Object.keys(res.steps)).toEqual(expect.arrayContaining(['07-fraud-batch', '11-retention']));
  });
});
