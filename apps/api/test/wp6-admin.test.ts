// WP-6 admin: earned prizes with winner verification (spec §4.7), support labels (spec §7.3, §4.10),
// KPI queries (spec §7.2), feature flags with four eyes and draws never on (architecture §8.2), the
// arm B stop, vacation pause, user views with a reason, and harm signals with the guard rule (§6.6).
import { describe, expect, it } from 'vitest';
import { setFeatureFlag } from '../src/db/flags.ts';
import { evaluateHarmWeek } from '../src/modules/fraud/lib/harmweek.ts';
import { runDayBatch } from '../src/modules/fraud/lib/batch.ts';
import { markDelivered, type SqlPrizeService } from '../src/modules/fraud/lib/prizes.ts';
import { KPI_NAMES, runKpi } from '../src/modules/kpi/index.ts';
import { actor, api, createAdmin, createUser, local, rawClub, rawLink, rawSession, realSession, wp6Harness, type Wp6Harness } from './wp6/harness.ts';

const spec = { kind: 'earned_individual' as 'earned_individual' | 'earned_collective', rewardKind: 'in_kind' as const, valueCents: 1000, partnerId: 'p', allocationId: 'a', declarationRef: 'decl-1', minAgeBand: '18_plus' as const };

function prize(h: Wp6Harness, over: Partial<typeof spec> & { tier?: 'main' | 'threshold'; kind?: 'earned_individual' | 'earned_collective' } = {}) {
  return h.db.transaction(() => (h.services.prizes as SqlPrizeService).createForChallenge(h.db, null as unknown as string, [{ ...spec, ...over }])[0] as string);
}

describe('spec §4.7 earned prizes: winner verification and delivery after 14 days', () => {
  it('ceilings, 18+ age check by another admin, deliver_after = +14 days, monthly key', async () => {
    const h = wp6Harness();
    const a1 = createAdmin(h);
    const a2 = createAdmin(h);
    const w = createUser(h);
    h.db.run('UPDATE user SET phone_verified_at = ? WHERE id = ?', [h.clock.now().toISOString(), w.id]);
    expect(() => prize(h, { valueCents: 1001 })).toThrow(/CEILING_EXCEEDED/);
    expect(() => prize(h, { kind: 'earned_collective', tier: 'threshold', valueCents: 7501 })).toThrow(/CEILING_EXCEEDED/);
    const id = prize(h);
    h.db.transaction(() => h.services.prizes.proposeWinner(h.db, { prizeId: id, userId: w.id }));
    expect((await api(h, a1, 'POST', `/admin/prizes/${id}/verify`, { checks: { sample_done: true, anchor: true, minutes: true } })).body.error.code).toBe('AGE_CHECK_REQUIRED');
    expect((await api(h, a1, 'POST', `/admin/prizes/${id}/age-check`, { outcome: 'ok', document_kind: 'id_card' })).body.prize.age_check_outcome).toBe('ok');
    expect(JSON.stringify(h.db.get('SELECT * FROM prize WHERE id = ?', [id]))).not.toContain('id_card');
    expect((await api(h, a1, 'POST', `/admin/prizes/${id}/verify`, { checks: { sample_done: true, anchor: true, minutes: true } })).body.error.code).toBe('FOUR_EYES_REQUIRED');
    const v = await api(h, a2, 'POST', `/admin/prizes/${id}/verify`, { checks: { sample_done: true, anchor: true, minutes: true } });
    expect(v.body.prize).toMatchObject({ status: 'verified', deliver_after: new Date(h.clock.now().getTime() + 14 * 86_400_000).toISOString() });
    expect(h.db.get("SELECT user_id, month_key FROM prize WHERE id = ?", [id])).toEqual({ user_id: w.id, month_key: '2026-12' });
    expect(h.db.get("SELECT count(*) AS n FROM event WHERE name = 'prize_awarded'")).toEqual({ n: 1 });
    expect((await api(h, a1, 'POST', `/admin/prizes/${id}/delivery-contact`, { full_name: 'Mila Test', address: 'Straat 1, Utrecht' })).status).toBe(200);
    expect(() => h.db.transaction(() => markDelivered(h.deps, h.db, id))).toThrow(/PERIOD_LOCKED/);
    h.clock.advance(14 * 86_400_000);
    expect(h.db.transaction(() => markDelivered(h.deps, h.db, id)).status).toBe('delivered');
  });

  it('a collective prize needs its sample of 20 counted members judged first', async () => {
    const h = wp6Harness();
    const a1 = createAdmin(h);
    const club = rawClub(h);
    for (let i = 0; i < 25; i++) {
      const u = createUser(h).id;
      h.db.run('UPDATE user SET phone_verified_at = ? WHERE id = ?', [h.clock.now().toISOString(), u]);
      rawLink(h, club, u, '2026-11-20T10:00:00.000Z', 'ip', 'other');
    }
    h.db.run("INSERT INTO challenge (id, type, title_nl, title_en, period_start_day, period_end_day, rules, status, created_by, created_at) VALUES ('01JCHA22ENGE00000000000000', 'club_prize', 'B', 'B', '2027-01-04', '2027-01-17', '{}', 'review', 'seed', ?)", [h.clock.now().toISOString()]);
    const id = h.db.transaction(() => (h.services.prizes as SqlPrizeService).createForChallenge(h.db, '01JCHA22ENGE00000000000000', [{ ...spec, kind: 'earned_collective', tier: 'main', valueCents: 15000, minAgeBand: '16_17' }])[0] as string);
    h.db.transaction(() => h.services.prizes.proposeWinner(h.db, { prizeId: id, clubId: club }));
    const sample = h.db.get<{ id: string; size: number }>("SELECT s.id, s.size FROM fraud_sample s JOIN prize p ON p.sample_id = s.id WHERE p.id = ?", [id]);
    expect(sample?.size).toBe(20);
    expect((await api(h, a1, 'POST', `/admin/prizes/${id}/verify`, { checks: { sample_done: false, anchor: true, minutes: true } })).body.error.code).toBe('SAMPLE_REQUIRED');
    h.db.run("UPDATE fraud_sample_item SET judgement = 'none', reason_code = 'anchor_confirmed', judged_by = ?, judged_at = ? WHERE sample_id = ?", [actor(h, a1.id), h.clock.now().toISOString(), sample?.id ?? '']);
    expect((await api(h, a1, 'POST', `/admin/prizes/${id}/verify`, { checks: { sample_done: true, anchor: true, minutes: true } })).body).toMatchObject({ prize: { status: 'verified' } });
  });
});

describe('spec §7.3 support labels and S4 (founder J8)', () => {
  it('"welzijn" is only visible to the assigned admin, raises S4 and is counted per arm', async () => {
    const h = wp6Harness();
    const a1 = createAdmin(h);
    const a2 = createAdmin(h);
    const s = createUser(h);
    h.db.run("INSERT INTO support_ticket (id, user_id, kind, text, status, created_at) VALUES ('01JT1CKET0000000000000000A', ?, 'other', 'Het gaat niet goed', 'open', ?)", [s.id, h.clock.now().toISOString()]);
    const p = await api(h, a1, 'PATCH', '/admin/support/01JT1CKET0000000000000000A', { label: 'welzijn' });
    expect(p.body.ticket).toMatchObject({ label: 'welzijn', text: 'Het gaat niet goed' });
    const other = await api(h, a2, 'GET', '/admin/support');
    expect(other.body.items[0]).toMatchObject({ label: null, text: null });
    expect((await api(h, a2, 'PATCH', '/admin/support/01JT1CKET0000000000000000A', { status: 'resolved' })).status).toBe(403);
    expect(h.db.get("SELECT code FROM harm_signal WHERE user_id = ?", [s.id])).toEqual({ code: 'S4' });
    expect(h.db.get("SELECT count(*) AS n FROM event WHERE name IN ('support_labeled', 'harm_signal_raised')")).toEqual({ n: 2 });
    const ext = await api(h, a1, 'POST', '/admin/support', { label: 'uitbetalen', received_on: '2026-12-03' });
    expect(ext.body.ticket).toMatchObject({ kind: 'external', label: 'uitbetalen', user_ref: null, text: null });
  });
});

describe('spec §7.2 KPI queries', () => {
  it('every stored query and its _clean variant runs on a seeded database', async () => {
    const h = wp6Harness();
    const admin = createAdmin(h);
    const s = createUser(h);
    await realSession(h, s, 25);
    h.db.transaction(() => h.services.events.event(h.db, 'account_created', { bron: 'personal', invite_id: null, vereniging_id: null, qr_bron: null, age_band: '18_plus' }, { pseudonym: h.db.get<{ p: string }>('SELECT pseudonym AS p FROM user WHERE id = ?', [s.id])?.p as string }));
    for (const name of KPI_NAMES) {
      for (const n of [name, `${name}_clean`]) {
        const r = await api(h, admin, 'GET', `/admin/kpi/${n}`);
        expect({ n, status: r.status }).toEqual({ n, status: 200 });
      }
    }
    expect((await api(h, admin, 'GET', '/admin/kpi/does_not_exist')).status).toBe(404);
    const act = runKpi(h.db, 'activation', null, null);
    expect(act.rows.find((r) => r[0] === 'total')).toEqual(['total', 1, 1, 100]);
    // Team accounts never count.
    h.db.run('UPDATE user SET is_team = 1 WHERE id = ?', [s.id]);
    expect(runKpi(h.db, 'activation', null, null).rows.find((r) => r[0] === 'total')).toEqual(['total', 0, 0, 0]);
  });
});

describe('architecture §8.2 feature flags, arm B stop, vacation pause, users', () => {
  it('draws can never be enabled; arm_b and the rest arm need a second admin; turning the rest arm off does not', async () => {
    const h = wp6Harness();
    const a1 = createAdmin(h);
    const a2 = createAdmin(h);
    expect((await api(h, a1, 'PUT', '/admin/feature-flags/draws', { enabled: true })).body.error.code).toBe('FEATURE_DISABLED');
    expect((await api(h, a1, 'PUT', '/admin/feature-flags/rest_period', { enabled: true })).body).toEqual({ key: 'rest_period', enabled: false, pending_confirmation: true });
    expect((await api(h, a1, 'PUT', '/admin/feature-flags/rest_period', { enabled: true })).body.error.code).toBe('FOUR_EYES_REQUIRED');
    expect((await api(h, a2, 'PUT', '/admin/feature-flags/rest_period', { enabled: true })).body).toEqual({ key: 'rest_period', enabled: true, pending_confirmation: false });
    expect((await api(h, a1, 'PUT', '/admin/feature-flags/rest_period', { enabled: false })).body.enabled).toBe(false);
    expect((await api(h, a1, 'PUT', '/admin/feature-flags/cards', { enabled: true })).body.enabled).toBe(true);
    const stop1 = await api(h, a1, 'POST', '/admin/experiments/arm-b/stop', { reason: 'stopregel' });
    expect(stop1.body.pending_confirmation).toBe(true);
    const stop2 = await api(h, a2, 'POST', '/admin/experiments/arm-b/stop', { reason: 'bevestigd' });
    expect(stop2.body).toMatchObject({ pending_confirmation: false, effective_from_day: '2026-12-07' });
  });

  it('a user lookup needs a reason and writes an audit line; vacation pause only for open days', async () => {
    const h = wp6Harness();
    const a1 = createAdmin(h);
    const s = createUser(h);
    expect((await api(h, a1, 'GET', `/admin/users?q=test`)).status).toBe(422);
    const r = await api(h, a1, 'GET', `/admin/users?q=${s.id.slice(0, 8).toLowerCase()}&reason=beroep`);
    expect(r.status).toBe(200);
    expect(h.db.get("SELECT reason FROM audit_log WHERE action = 'users_searched'")).toEqual({ reason: 'beroep' });
    h.db.run("INSERT INTO job_run (job, run_key, status, started_at, attempts, step_results) VALUES ('day_close', 'day_close:2026-12-20', 'done', ?, 1, '{}')", [h.clock.now().toISOString()]);
    expect((await api(h, a1, 'PUT', '/admin/vacation-pause', { start_day: '2026-12-20', end_day: '2027-01-03' })).body.error.code).toBe('PERIOD_LOCKED');
    expect((await api(h, a1, 'PUT', '/admin/vacation-pause', { start_day: '2026-12-21', end_day: '2027-01-03' })).status).toBe(200);
    expect(h.db.get('SELECT first_day, last_day FROM vacation_pause')).toEqual({ first_day: '2026-12-21', last_day: '2027-01-03' });
    expect((await api(h, a1, 'GET', '/admin/audit?object=vacation_pause')).body.items).toHaveLength(1);
  });
});

describe('spec §6.6 harm signals in the day close and the guard rule in the week close', () => {
  it('S1 after three late nights within 7 days, once per 14 days', () => {
    const h = wp6Harness({ start: '2026-12-10T10:00:00Z' });
    const s = createUser(h);
    for (const d of ['2026-12-05', '2026-12-07', '2026-12-09']) rawSession(h, s.id, { start: local(d, 2), focusDay: d, lateStart: true });
    runDayBatch(h.deps, '2026-12-09', new Date(local('2026-12-10', 5, 45)));
    runDayBatch(h.deps, '2026-12-09', new Date(local('2026-12-10', 5, 45)));
    expect(h.db.all('SELECT code, focus_day FROM harm_signal WHERE user_id = ?', [s.id])).toEqual([{ code: 'S1', focus_day: '2026-12-09' }]);
    // No fraud consequence: no flag.
    expect(h.db.get('SELECT count(*) AS n FROM fraud_flag')).toEqual({ n: 0 });
  });

  it('the guard rule turns rest_period off when the rest arm has more than twice the share', () => {
    const h = wp6Harness({ start: '2027-01-25T10:00:00Z' });
    setFeatureFlag(h.db, 'rest_period', true, 'admin:x', h.clock.now());
    const week = '2027-01-18';
    const mk = (arm: 'rest' | 'continue', signal: boolean) => {
      const u = createUser(h);
      const p = h.db.get<{ p: string }>('SELECT pseudonym AS p FROM user WHERE id = ?', [u.id])?.p as string;
      h.db.run("INSERT INTO event (id, name, pseudonym, server_at, props, release, arm_rest) VALUES (?, 'plus_interest', ?, '2027-01-18T10:00:00.000Z', '{}', 't', ?)", [`01JEV${u.id.slice(-21)}`, p, arm]);
      rawSession(h, u.id, { start: local('2027-01-19', 10) });
      if (signal) h.db.run("INSERT INTO harm_signal (id, user_id, code, focus_day, week_key, created_at) VALUES (?, ?, 'S2', '2027-01-19', ?, '2027-01-19T10:00:00.000Z')", [`01JHS${u.id.slice(-21)}`, u.id, week]);
    };
    for (let i = 0; i < 10; i++) mk('rest', i < 3);
    for (let i = 0; i < 10; i++) mk('continue', i < 1);
    const r = evaluateHarmWeek(h.deps, week);
    expect(r?.guard).toEqual({ inWindow: true, exceeded: true, flagTurnedOff: true });
    expect(r?.absoluteExceeded).toBe(true);
    expect(h.db.get("SELECT enabled FROM feature_flag WHERE key = 'rest_period'")).toEqual({ enabled: 0 });
    expect(h.db.get("SELECT actor_ref FROM audit_log WHERE action = 'rest_period_flag_off'")).toEqual({ actor_ref: 'system' });
    expect(runKpi(h.db, 'guard_rule_rest', null, null).rows[0]).toEqual([week, 10, 3, 10, 1, 1]);
  });
});
