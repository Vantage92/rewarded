// WP-6 review queue (spec §6.4, §6.5; architecture §10.8): decisions with a reason code, the block
// with four eyes, the appeal decided by another admin, and the third person when nobody is left.
import { describe, expect, it } from 'vitest';
import { submitAppeal } from '../src/modules/fraud/lib/appeals.ts';
import type { SqlFlagService } from '../src/modules/fraud/lib/flags.ts';
import { actor, api, createAdmin, createUser, realSession, wp6Harness, type Wp6Harness } from './wp6/harness.ts';

function raise(h: Wp6Harness, code: 'H5' | 'H1' | 'H7', sessionIds: string[], subject: { type: 'session' | 'account'; id?: string } = { type: 'session', id: sessionIds[0] as string }) {
  return h.db.transaction(() => {
    const id = (h.services.flags as SqlFlagService).raise(h.db, { code, subject, sessionIds, evidence: { threshold: 480 } });
    if (sessionIds.length > 0) h.services.sessions.setReviewStatus(h.db, sessionIds, 'pending');
    return id;
  });
}

const balance = (h: Wp6Harness, userId: string) => h.services.ledger.balances(userId);

describe('spec §6.4 decisions in the queue', () => {
  it('a reject books the reversal through reconcileDay, with audit and event; a release frees the points', async () => {
    const h = wp6Harness();
    const admin = createAdmin(h);
    const s = createUser(h);
    const sid = await realSession(h, s, 25);
    expect(balance(h, s.id).available).toBe(25);
    const f1 = raise(h, 'H5', [sid]);
    const list = await api(h, admin, 'GET', '/admin/flags?status=open');
    expect(list.status).toBe(200);
    expect(list.body.items[0]).toMatchObject({ id: f1, code: 'H5', status: 'open', sessions: [{ session_id: sid, review_status: 'pending' }] });
    expect(h.db.get("SELECT count(*) AS n FROM audit_log WHERE action = 'flags_viewed'")).toEqual({ n: 1 });

    const bad = await api(h, admin, 'POST', `/admin/flags/${f1}/decision`, { decision: 'reject', reason_code: 'no_evidence', note: '' });
    expect(bad.body.error.code).toBe('REASON_REQUIRED');
    const rej = await api(h, admin, 'POST', `/admin/flags/${f1}/decision`, { decision: 'reject', reason_code: 'implausible_pattern', note: 'pattern' });
    expect(rej.status).toBe(200);
    expect(rej.body).toMatchObject({ flag: { status: 'rejected', reason_code: 'implausible_pattern' }, block_pending_confirmation: false });
    expect(rej.body.postings.some((p: { type: string }) => p.type === 'reverse')).toBe(true);
    expect(balance(h, s.id).available).toBe(0);
    expect(h.services.sessions.get(sid)?.reviewStatus).toBe('rejected');
    expect(h.db.get("SELECT count(*) AS n FROM event WHERE name = 'flag_reviewed'")).toEqual({ n: 1 });
    expect(h.db.get("SELECT actor_ref FROM audit_log WHERE action = 'flag_decided'")).toEqual({ actor_ref: actor(h, admin.id) });
    const again = await api(h, admin, 'POST', `/admin/flags/${f1}/decision`, { decision: 'release', reason_code: 'no_evidence', note: '' });
    expect(again.status).toBe(404);

    const s2 = createUser(h);
    const sid2 = await realSession(h, s2, 25);
    const f2 = raise(h, 'H5', [sid2]);
    const rel = await api(h, admin, 'POST', `/admin/flags/${f2}/decision`, { decision: 'release', reason_code: 'pattern_explained', note: '' });
    expect(rel.body.flag.status).toBe('released');
    expect(h.services.sessions.get(sid2)?.reviewStatus).toBe('released');
    expect(balance(h, s2.id).available).toBe(25);
  });

  it('only an admin decides: the service refuses a system actor (architecture §10.8)', () => {
    const h = wp6Harness();
    const s = createUser(h);
    const id = raise(h, 'H1', [], { type: 'account', id: s.id });
    expect(() => h.db.transaction(() => h.services.flags.decide(h.db, id, 'reject', 'system' as never, 'automation'))).toThrow(/Only an admin/);
  });
});

describe('spec §6.4 block with four eyes and H8 after the block', () => {
  it('the deciding admin cannot confirm; a second admin blocks the account and keeps the phone hash', async () => {
    const h = wp6Harness();
    const a1 = createAdmin(h);
    const a2 = createAdmin(h);
    const s = createUser(h);
    h.db.run("UPDATE user SET phone_hash = 'ph_1', phone_line_type = 'mobile', phone_verified_at = ? WHERE id = ?", [h.clock.now().toISOString(), s.id]);
    const f = raise(h, 'H1', [], { type: 'account', id: s.id });
    const d = await api(h, a1, 'POST', `/admin/flags/${f}/decision`, { decision: 'block', reason_code: 'fraud_confirmed', note: '' });
    expect(d.body).toMatchObject({ block_pending_confirmation: true, flag: { status: 'open' } });
    expect((await api(h, a1, 'POST', `/admin/blocks/${f}/confirm`, { note: 'x' })).body.error.code).toBe('SAME_REVIEWER');
    expect(h.db.get('SELECT status FROM user WHERE id = ?', [s.id])).toEqual({ status: 'active' });
    const c = await api(h, a2, 'POST', `/admin/blocks/${f}/confirm`, { note: 'confirmed' });
    expect(c.status).toBe(200);
    expect(c.body).toMatchObject({ phone_hash_blocked: true, flag: { status: 'blocked' } });
    expect(h.db.get('SELECT status FROM user WHERE id = ?', [s.id])).toEqual({ status: 'blocked' });
    expect(h.db.get("SELECT count(*) AS n FROM blocked_phone_hash WHERE phone_hash = 'ph_1'")).toEqual({ n: 1 });
    expect(h.db.get('SELECT count(*) AS n FROM auth_session WHERE user_id = ?', [s.id])).toEqual({ n: 0 });
  });
});

describe('spec §6.5 appeals: another admin decides, else a third person', () => {
  it('window, one appeal per object, SAME_REVIEWER, upheld returns the points', async () => {
    const h = wp6Harness();
    const a1 = createAdmin(h);
    const a2 = createAdmin(h);
    const s = createUser(h);
    const sid = await realSession(h, s, 25);
    const f = raise(h, 'H5', [sid]);
    await api(h, a1, 'POST', `/admin/flags/${f}/decision`, { decision: 'reject', reason_code: 'implausible_pattern', note: '' });
    expect(balance(h, s.id).available).toBe(0);
    const ap = await api(h, s, 'POST', '/appeals', { object_type: 'flag', object_id: f, text: 'Ik zat echt te studeren.' });
    expect(ap.status).toBe(201);
    expect((await api(h, s, 'POST', '/appeals', { object_type: 'flag', object_id: f, text: 'nog eens' })).body.error.code).toBe('ALREADY_APPEALED');
    const id = ap.body.appeal_id;
    expect((await api(h, a1, 'POST', `/admin/appeals/${id}/decision`, { outcome: 'upheld', motivation: 'x' })).body.error.code).toBe('SAME_REVIEWER');
    const list = await api(h, a2, 'GET', '/admin/appeals');
    expect(list.body.items[0]).toMatchObject({ id, status: 'open', waiting_for_third: false });
    const ok = await api(h, a2, 'POST', `/admin/appeals/${id}/decision`, { outcome: 'upheld', motivation: 'Patroon verklaard door tentamenweek.' });
    expect(ok.body.appeal).toMatchObject({ status: 'decided', outcome: 'upheld' });
    expect(h.services.sessions.get(sid)?.reviewStatus).toBe('released');
    expect(balance(h, s.id).available).toBe(25);
    expect(h.db.get("SELECT count(*) AS n FROM event WHERE name IN ('appeal_submitted', 'appeal_decided')")).toEqual({ n: 2 });
  });

  it('after 14 days the window is closed', async () => {
    const h = wp6Harness();
    const a1 = createAdmin(h);
    const s = createUser(h);
    const sid = await realSession(h, s, 25);
    const f = raise(h, 'H5', [sid]);
    await api(h, a1, 'POST', `/admin/flags/${f}/decision`, { decision: 'reject', reason_code: 'implausible_pattern', note: '' });
    h.clock.advance(14 * 86_400_000 + 60_000);
    expect((await api(h, s, 'POST', '/appeals', { object_type: 'flag', object_id: f, text: 'te laat' })).body.error.code).toBe('APPEAL_WINDOW_CLOSED');
  });

  it('a confirmed block with two admins waits for a third person (NO_ELIGIBLE_REVIEWER)', async () => {
    const h = wp6Harness();
    const a1 = createAdmin(h);
    const a2 = createAdmin(h);
    const s = createUser(h);
    const sid = await realSession(h, s, 25);
    const f = raise(h, 'H5', [sid]);
    await api(h, a1, 'POST', `/admin/flags/${f}/decision`, { decision: 'block', reason_code: 'fraud_confirmed', note: '' });
    expect((await api(h, a2, 'POST', `/admin/blocks/${f}/confirm`, { note: 'ok' })).body).toMatchObject({ flag: { status: 'blocked' } });
    // A blocked student cannot sign in, so support files the appeal for them (same domain function).
    const ap = { body: { appeal_id: h.db.transaction(() => submitAppeal(h.deps, h.db, s.id, 'block', f, 'Onterecht')) } };
    expect(h.db.get('SELECT waiting_for_third FROM appeal WHERE id = ?', [ap.body.appeal_id])).toEqual({ waiting_for_third: 1 });
    for (const a of [a1, a2]) expect((await api(h, a, 'POST', `/admin/appeals/${ap.body.appeal_id}/decision`, { outcome: 'upheld', motivation: 'x' })).body.error.code).toBe('NO_ELIGIBLE_REVIEWER');
    const a3 = createAdmin(h);
    const ok = await api(h, a3, 'POST', `/admin/appeals/${ap.body.appeal_id}/decision`, { outcome: 'upheld', motivation: 'Gegrond na gesprek.' });
    expect(ok.status).toBe(200);
    expect(h.db.get('SELECT status FROM user WHERE id = ?', [s.id])).toEqual({ status: 'active' });
    expect(h.services.sessions.get(sid)?.reviewStatus).toBe('released');
  });
});
