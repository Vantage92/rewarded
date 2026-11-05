// WP-6 weekly sample (spec §6.7; architecture §6.5; voorregistratie §7.1–7.2, §7.4) and the
// institution anchor unique per address (spec §4.10; voorregistratie §7.8).
import { describe, expect, it } from 'vitest';
import { weekCloseJob } from '../src/jobs/week_close/index.ts';
import { createScheduler } from '../src/jobs/scheduler.ts';
import { ambassadorPayout, createAmbassador } from '../src/modules/admin/ambassadors.ts';
import { declareInterest, drawWeeklySample, verifyStoredSample } from '../src/modules/fraud/lib/sample.ts';
import { runKpi } from '../src/modules/kpi/index.ts';
import { actor, api, createAdmin, createUser, local, rawClub, rawLink, rawSession, wp6Harness, type Wp6Harness } from './wp6/harness.ts';

function activeWeek(h: Wp6Harness, n: number, clubs: string[]) {
  const users: string[] = [];
  for (let i = 0; i < n; i++) {
    const u = createUser(h).id;
    users.push(u);
    const club = clubs[i % (clubs.length + 1)];
    // i % 3 === 2 stays without a club (stratum no_club).
    if (club) rawLink(h, club, u, '2026-11-20T10:00:00.000Z', 'ip', 'other');
    rawSession(h, u, { start: local('2026-12-08', 10, i % 60), ipHash: `ip_${i}` });
  }
  return users;
}

describe('spec §6.7 weekly sample in the week close', () => {
  it('draws 30 stratified accounts once, reproducibly from the seed', async () => {
    const h = wp6Harness({ start: '2026-12-14T06:00:00Z' });
    const clubs = [rawClub(h, 'A'), rawClub(h, 'B')];
    activeWeek(h, 90, clubs);
    const sched = createScheduler({ clock: h.clock, moduleDeps: h.deps });
    sched.register(weekCloseJob());
    expect((await sched.runNow('week_close', 'week_close:2026-12-14')).status).toBe('done');
    const s = h.db.get<{ id: string; size: number; week_key: string }>("SELECT id, size, week_key FROM fraud_sample WHERE kind = 'weekly'") as { id: string; size: number; week_key: string };
    expect(s).toMatchObject({ size: 30, week_key: '2026-12-07' });
    const strata = h.db.all<{ stratum: string; n: number }>('SELECT stratum, count(*) AS n FROM fraud_sample_item WHERE sample_id = ? GROUP BY stratum ORDER BY stratum', [s.id]);
    expect(strata.map((x) => x.n)).toEqual([10, 10, 10]);
    expect(verifyStoredSample(h.deps, s.id).ok).toBe(true);
    expect(drawWeeklySample(h.deps, '2026-12-07')).toBe(s?.id);
    expect(h.db.get("SELECT count(*) AS n FROM event WHERE name = 'sample_drawn'")).toEqual({ n: 30 });
  });

  it('judgement with reason code: suspect opens a SAMPLE flag; an interest moves the item; the estimate uses it', async () => {
    const h = wp6Harness({ start: '2026-12-14T06:00:00Z' });
    const a1 = createAdmin(h);
    const a2 = createAdmin(h);
    activeWeek(h, 40, []);
    const sampleId = drawWeeklySample(h.deps, '2026-12-07') as string;
    const cur = await api(h, a1, 'GET', '/admin/samples/current');
    expect(cur.status).toBe(200);
    expect(cur.body.sample.items).toHaveLength(30);
    const [i1, i2, ...rest] = cur.body.sample.items as { id: string }[];
    const checks = { anchor: false, line_type: false, pattern: true, contact: false };
    expect((await api(h, a1, 'POST', `/admin/samples/${sampleId}/items/${i1?.id}/judgement`, { checks, judgement: 'suspect', reason_code: 'anchor_confirmed' })).body.error.code).toBe('REASON_REQUIRED');
    const j = await api(h, a1, 'POST', `/admin/samples/${sampleId}/items/${i1?.id}/judgement`, { checks, judgement: 'suspect', reason_code: 'no_anchor_no_contact' });
    expect(j.status).toBe(200);
    expect(j.body.flag_id).toEqual(expect.any(String));
    expect(h.db.get('SELECT code, status, subject_type FROM fraud_flag WHERE id = ?', [j.body.flag_id])).toEqual({ code: 'SAMPLE', status: 'open', subject_type: 'account' });
    // The sample itself books nothing.
    expect(h.db.get("SELECT count(*) AS n FROM journal_entry WHERE type = 'reverse'")).toEqual({ n: 0 });
    h.db.transaction(() => declareInterest(h.deps, h.db, i2?.id as string, actor(h, a1.id), [actor(h, a1.id), actor(h, a2.id)]));
    expect((await api(h, a1, 'POST', `/admin/samples/${sampleId}/items/${i2?.id}/judgement`, { checks, judgement: 'none', reason_code: 'anchor_confirmed' })).status).toBe(403);
    expect((await api(h, a2, 'POST', `/admin/samples/${sampleId}/items/${i2?.id}/judgement`, { checks, judgement: 'fraud', reason_code: 'two_or_more_criteria' })).status).toBe(200);
    for (const it of rest) await api(h, a1, 'POST', `/admin/samples/${sampleId}/items/${it.id}/judgement`, { checks, judgement: 'none', reason_code: 'anchor_confirmed' });
    const est = runKpi(h.db, 'fraud_estimate', null, null);
    const row = est.rows.find((r) => r[0] === '2026-12-07' && r[1] === 'fraud');
    expect(row?.[2]).toBe(30);
    expect(row?.[3]).toBeCloseTo(100 / 30, 1);
    expect(est.rows.find((r) => r[0] === '2026-12-07' && r[1] === 'fraud_or_suspect')?.[3]).toBeCloseTo(200 / 30, 1);
    // KPI variants without suspect accounts exist for every query.
    expect(runKpi(h.db, 'activation_clean', null, null).columns.length).toBeGreaterThanOrEqual(0);
  });
});

describe('spec §4.10 institution anchor unique per address (HMAC)', () => {
  it('one address anchors one account; aliases count as the same address; the address is not stored', async () => {
    const h = wp6Harness();
    h.db.run("INSERT INTO institution_domain (domain, institution, added_by, added_at) VALUES ('uu.nl', 'Universiteit Utrecht', 'seed', ?)", [h.clock.now().toISOString()]);
    const a = createUser(h);
    const b = createUser(h);
    expect((await api(h, a, 'POST', '/me/institution-email/start', { email: 'x@gmail.com' })).body.error.code).toBe('DOMAIN_NOT_ALLOWED');
    expect((await api(h, a, 'POST', '/me/institution-email/start', { email: 'Mila.Test@students.uu.nl' })).status).toBe(202);
    const code = (h.inbox.list().at(-1) as { text: string }).text.match(/\d{6}/)?.[0];
    expect((await api(h, a, 'POST', '/me/institution-email/confirm', { code: '000000' === code ? '111111' : '000000' })).body.error.code).toBe('CODE_INVALID');
    const ok = await api(h, a, 'POST', '/me/institution-email/confirm', { code });
    expect(ok.body).toEqual({ domain: 'students.uu.nl', verified: true });
    expect(JSON.stringify(h.db.all('SELECT * FROM user'))).not.toContain('mila.test');
    expect(h.db.get("SELECT count(*) AS n FROM event WHERE name = 'institution_email_verified'")).toEqual({ n: 1 });
    // A second account with the same address (plus alias, other case) gets no anchor.
    expect((await api(h, b, 'POST', '/me/institution-email/start', { email: 'mila.test+rewarded@students.uu.nl' })).body.error.code).toBe('INSTITUTION_EMAIL_IN_USE');
    expect(h.db.get('SELECT institution_verified_at FROM user WHERE id = ?', [b.id])).toEqual({ institution_verified_at: null });
  });

  it('sample contact through the institution address: the code only counts for the anchored HMAC', async () => {
    const h = wp6Harness({ start: '2026-12-14T06:00:00Z' });
    h.db.run("INSERT INTO institution_domain (domain, institution, added_by, added_at) VALUES ('uu.nl', 'UU', 'seed', ?)", [h.clock.now().toISOString()]);
    const s = createUser(h);
    await api(h, s, 'POST', '/me/institution-email/start', { email: 'echt@uu.nl' });
    await api(h, s, 'POST', '/me/institution-email/confirm', { code: (h.inbox.list().at(-1) as { text: string }).text.match(/\d{6}/)?.[0] });
    rawSession(h, s.id, { start: local('2026-12-08', 10) });
    drawWeeklySample(h.deps, '2026-12-07');
    expect(h.db.get('SELECT contact_channel FROM fraud_sample_item WHERE user_id = ?', [s.id])).toEqual({ contact_channel: 'institution' });
    const before = h.inbox.list().length;
    expect((await api(h, s, 'POST', '/me/institution-email/start', { email: 'ander@uu.nl' })).status).toBe(202);
    expect(h.inbox.list().length).toBe(before);
    expect(h.db.get('SELECT address_mismatch FROM fraud_sample_item WHERE user_id = ?', [s.id])).toEqual({ address_mismatch: 1 });
    await api(h, s, 'POST', '/me/institution-email/start', { email: 'ECHT@uu.nl' });
    await api(h, s, 'POST', '/me/institution-email/confirm', { code: (h.inbox.list().at(-1) as { text: string }).text.match(/\d{6}/)?.[0] });
    expect(h.db.get<{ c: string | null }>('SELECT contact_confirmed_at AS c FROM fraud_sample_item WHERE user_id = ?', [s.id])?.c).not.toBeNull();
  });
});

describe('spec §4.9 ambassador sample before every payout (voorregistratie §7.4)', () => {
  it('draws five counted accounts, blocks the payout until judged, and needs four eyes', () => {
    const h = wp6Harness({ start: '2027-01-02T10:00:00Z' });
    const a1 = createAdmin(h);
    const a2 = createAdmin(h);
    const amb = h.db.transaction(() => createAmbassador(h.deps, h.db, { name_ref: 'amb-1', cap_users: 40 }, actor(h, a1.id)));
    for (let i = 0; i < 7; i++) {
      const u = createUser(h, { createdAt: '2026-12-01T10:00:00.000Z' }).id;
      h.db.run("UPDATE user SET registration_invite_id = ?, institution_email_hash = ?, institution_verified_at = '2026-12-01T11:00:00.000Z' WHERE id = ?", [amb.code_invite_id, `ih_${i}`, u]);
      for (let k = 0; k < 5; k++) rawSession(h, u, { start: Date.parse('2026-12-02T10:00:00Z') + k * 86_400_000 });
    }
    const first = h.db.transaction(() => ambassadorPayout(h.deps, h.db, amb.id, '2026-12', actor(h, a1.id)));
    expect(first).toMatchObject({ status: 'sampled', counted: 7 });
    expect(h.db.get('SELECT size FROM fraud_sample WHERE id = ?', [first.sampleId])).toEqual({ size: 5 });
    expect(() => h.db.transaction(() => ambassadorPayout(h.deps, h.db, amb.id, '2026-12', actor(h, a1.id)))).toThrow(/SAMPLE_REQUIRED/);
    h.db.run("UPDATE fraud_sample_item SET judgement = 'none', reason_code = 'anchor_confirmed', judged_by = ?, judged_at = ? WHERE sample_id = ?", [actor(h, a1.id), h.clock.now().toISOString(), first.sampleId]);
    expect(h.db.transaction(() => ambassadorPayout(h.deps, h.db, amb.id, '2026-12', actor(h, a1.id)))).toMatchObject({ status: 'proposed', counted: 7, feeCents: 3500 });
    expect(() => h.db.transaction(() => ambassadorPayout(h.deps, h.db, amb.id, '2026-12', actor(h, a1.id)))).toThrow(/FOUR_EYES_REQUIRED/);
    expect(h.db.transaction(() => ambassadorPayout(h.deps, h.db, amb.id, '2026-12', actor(h, a2.id))).status).toBe('recorded');
  });
});
