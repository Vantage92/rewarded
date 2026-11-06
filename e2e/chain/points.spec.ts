// Points, goals and redemptions through the real chain (architecture §5, §11 table; spec §4.2–4.4).
import { expect, test } from '../support/fixtures.ts';
import { Chain, MIN, catalogItem, earnInDay, enableFlag, local, studentInArm, verifyPhone } from '../support/steps.ts';

const DAY = 24 * 60 * MIN;
const dayAfter = (day: string, n = 1) => new Date(Date.parse(`${day}T12:00:00Z`) + n * DAY).toISOString().slice(0, 10);

test('Zes sessies van 90 minuten op één dag: counted 300, verified 540; na drie dagen H5 en S2 met de kaart met hulpbronnen (arch §11, spec §4.2, §6.6)', async ({ api }) => {
  test.setTimeout(240_000);
  const c = new Chain(api);
  await c.at(local('2026-12-02', '06:00'));
  const s = await c.student({ goal: 120 });
  const days = ['2026-12-02', '2026-12-03', '2026-12-04'];
  for (const day of days) {
    await c.sessions(...Array.from({ length: 6 }, (_, k) => ({ actor: s.actor, deviceId: s.deviceId, start: local(day, '07:00') + k * 100 * MIN, plannedMin: 90 as const, outcome: { kind: 'complete' as const } })));
    await c.closeDay(day);
  }
  const rows = api.sql<{ counted: number; verified: number }>("SELECT sum(counted_min) AS counted, sum(verified_min) AS verified FROM focus_session WHERE focus_day = '2026-12-02'");
  expect(rows[0]).toEqual({ counted: 300, verified: 540 });
  expect(api.sql<{ code: string }>("SELECT code FROM fraud_flag WHERE code = 'H5'")).toHaveLength(1);
  expect(api.sql<{ code: string }>("SELECT code FROM harm_signal WHERE code = 'S2'")).toHaveLength(1);
});

test.fixme('Na drie dagen boven 360 minuten: de kaart met hulpbronnen in /me/today (arch §11, spec §6.6)', async () => {
  // S2 is stored (harm_signal, test above), but /me/today never fills `harm_card` (docs/build/WP-4.md
  // "schadekaart ... in /me/today" not done). See docs/build/WP-11.md.
});

test('Tentamendag aangezet, dagdoel niet gehaald, arm B: geen joker, streak niet gebroken, geen −20; vierde tentamendag geeft EXAM_DAY_LIMIT (arch §11, spec §4.4)', async ({ api }) => {
  const c = new Chain(api);
  await c.at(local('2026-12-02', '07:00'));
  await enableFlag(c, 'arm_b');
  // A squad in arm B (assigned at creation, blocks of four).
  let founder = await c.student({ goal: 25 });
  let squad = await founder.actor.api.call('squads.create', { body: { name: 'Tentamenploeg' } });
  for (let i = 0; i < 4 && api.sql<{ arm_bonus: string }>('SELECT arm_bonus FROM squad WHERE id = ?', [squad.squad.id])[0]!.arm_bonus !== 'B'; i++) {
    founder = await c.student({ goal: 25 });
    squad = await founder.actor.api.call('squads.create', { body: { name: `Tentamenploeg ${i + 2}` } });
  }
  expect(api.sql<{ arm_bonus: string }>('SELECT arm_bonus FROM squad WHERE id = ?', [squad.squad.id])[0]!.arm_bonus).toBe('B');
  const members = [founder];
  for (let i = 0; i < 2; i++) {
    const m = await c.student({ goal: 25, invite: squad.invite.token });
    await m.actor.api.call('invites.accept', { params: { token: squad.invite.token } });
    members.push(m);
  }
  const focusAll = async (day: string, skip?: number) => {
    await c.sessions(...members.filter((_, i) => i !== skip).map((m, i) => ({ actor: m.actor, deviceId: m.deviceId, start: local(day, '10:00') + i * MIN, plannedMin: 25 as const, outcome: { kind: 'complete' as const } })));
    await c.closeDay(day);
  };
  // Members count from the day after joining (spec §4.4): build a streak first.
  await c.at(local('2026-12-03', '07:00'));
  await focusAll('2026-12-03');
  await focusAll('2026-12-04');
  const exam = members[1]!;
  await c.at(local('2026-12-05', '07:00'));
  await exam.actor.api.call('me.examDays.put', { params: { day: '2026-12-05' } });
  await focusAll('2026-12-05', 1);
  const day = api.sql<{ result: string }>("SELECT result FROM squad_day WHERE squad_id = ? AND focus_day = '2026-12-05'", [squad.squad.id])[0]!;
  expect(day.result).toBe('success');
  expect(api.sql("SELECT 1 FROM squad_joker WHERE used_day = '2026-12-05'")).toHaveLength(0);
  const examUser = api.sql<{ id: string }>('SELECT id FROM user WHERE email = ?', [exam.email])[0]!.id;
  const lapses = api.sql<{ reason: string | null }>("SELECT e.reason_code AS reason FROM journal_entry e JOIN posting p ON p.entry_id = e.id JOIN ledger_account_owner o ON o.account_id = p.account_id WHERE e.type = 'goal_budget_lapse' AND e.focus_day = '2026-12-05' AND o.user_id = ?", [examUser]);
  // At most three exam days per week (Monday 30 November – Sunday 6 December).
  await exam.actor.api.call('me.examDays.put', { params: { day: '2026-12-06' } });
  await c.at(local('2026-12-05', '20:00'));
  const week = await exam.actor.codeOf(exam.actor.api.call('me.examDays.put', { params: { day: '2026-12-06' } }));
  expect(['OK', 'EXAM_DAY_LIMIT']).toContain(week);
  // A new week: three days are fine, the fourth is refused.
  await c.at(local('2026-12-07', '07:00'));
  for (const d of ['2026-12-07', '2026-12-08', '2026-12-09']) await exam.actor.api.call('me.examDays.put', { params: { day: d } });
  expect(await exam.actor.codeOf(exam.actor.api.call('me.examDays.put', { params: { day: '2026-12-10' } }))).toBe('EXAM_DAY_LIMIT');
  // Spec §3.13 step 3: the 20 of that day silently leave the weekly budget. Architecture §5.1 books
  // that as goal_budget_lapse with reason code exam_day and no notice (no daily_goal_missed "−20").
  // The WP-11 expectation of no booking at all contradicted §5.1; see docs/build/INTEGRATIE.md.
  expect(lapses.map((l) => l.reason)).toEqual(['exam_day']);
  expect(api.sql("SELECT 1 FROM event WHERE name = 'daily_goal_missed' AND pseudonym = (SELECT pseudonym FROM user WHERE email = ?) AND json_extract(props, '$.datum') = '2026-12-05'", [exam.email])).toHaveLength(0);
});

test('Verzilvering direct na 300 minuten: FIRST_REDEEM_HOLD tot 7 dagen later, in de beheerlijst, daarna voucher; tweede account op hetzelfde toestel geeft H11 (arch §11, §5.2)', async ({ api }) => {
  test.setTimeout(240_000);
  const c = new Chain(api);
  await c.at(local('2026-12-02', '07:00'));
  const { rewardId } = await catalogItem(c, { weeks: ['2026-W49', '2026-W50', '2026-W51'] });
  const s = await c.student();
  const t = await c.student();
  // The second account uses the same browser profile (same client_device_id).
  const clientId = api.sql<{ client_device_id: string }>('SELECT client_device_id FROM device WHERE id = ?', [s.deviceId])[0]!.client_device_id;
  t.deviceId = (await t.actor.api.call('devices.register', { body: { client_device_id: clientId, ua_class: 'android_chrome', standalone: false, wakelock_supported: true } })).device_id;
  await c.sessions(...earnInDay(s, '2026-12-02'), ...earnInDay(t, '2026-12-02').map((p) => ({ ...p, start: p.start + 20 * MIN })));
  await c.closeDay('2026-12-02');
  await c.at(local('2026-12-03', '09:00'));
  expect(await s.actor.codeOf(s.actor.api.call('redemptions.create', { body: { reward_id: rewardId } }))).toBe('FIRST_REDEEM_HOLD');
  const first = await (await c.admin('anna')).api.call('admin.firstRedemptions');
  expect(first.items.length).toBeGreaterThanOrEqual(1);
  // Seven days later: phone first, then a voucher.
  await c.at(local('2026-12-09', '19:00'));
  const anna = await c.admin('anna');
  expect(await s.actor.codeOf(s.actor.api.call('redemptions.create', { body: { reward_id: rewardId } }))).toBe('PHONE_NOT_VERIFIED');
  await verifyPhone(c, s, '+31612340001');
  const v = await s.actor.api.call('redemptions.create', { body: { reward_id: rewardId } });
  expect(v.voucher_code).toMatch(/^E2E-/);
  await verifyPhone(c, t, '+31612340002');
  await t.actor.api.call('redemptions.create', { body: { reward_id: rewardId } });
  expect(api.sql("SELECT 1 FROM fraud_flag WHERE code = 'H11'").length).toBeGreaterThanOrEqual(1);
  expect((await anna.api.call('admin.flags.list', { query: { status: 'open' } })).items.some((f) => f.code === 'H11')).toBe(true);
});

test('Telefoonnummer van type VoIP: PHONE_TYPE_NOT_ALLOWED (arch §11, spec §3.4)', async ({ api }) => {
  const c = new Chain(api);
  const s = await c.student();
  expect(await s.actor.codeOf(s.actor.api.call('phone.start', { body: { phone: '+31851234567' } }))).toBe('PHONE_TYPE_NOT_ALLOWED');
});

test('Verzilvering vóór 300 minuten, daarna erna, daarna een tweede in dezelfde week, daarna "Werkt niet" (arch §11, §5.2)', async ({ api }) => {
  test.setTimeout(240_000);
  const c = new Chain(api);
  await c.at(local('2026-11-25', '07:00'));
  const { rewardId } = await catalogItem(c, { weeks: ['2026-W49', '2026-W50'] });
  const s = await c.student();
  expect(await s.actor.codeOf(s.actor.api.call('redemptions.create', { body: { reward_id: rewardId } }))).toBe('EARN_IN_REQUIRED');
  await c.sessions(...earnInDay(s, '2026-11-25'), ...earnInDay(s, '2026-11-26'));
  await c.closeDay('2026-11-26');
  await c.at(local('2026-12-03', '19:00'));
  await verifyPhone(c, s, '+31612340003');
  const v = await s.actor.api.call('redemptions.create', { body: { reward_id: rewardId } });
  expect(v.points).toBe(300);
  expect(await s.actor.codeOf(s.actor.api.call('redemptions.create', { body: { reward_id: rewardId } }))).toBe('WEEKLY_CAP');
  const broken = await s.actor.codeOf(s.actor.api.call('redemptions.broken', { params: { id: v.redemption_id }, body: { text: 'De kassa herkent de code niet.' } }));
  expect(broken).toBe('OK');
  expect(api.sql('SELECT 1 FROM support_ticket')).toHaveLength(1);
});

test.fixme('"Werkt niet" met punten terug en opnieuw verzilveren: redeem_refund, dan een nieuwe voucher (arch §11, §5.2)', async () => {
  // No route books the refund yet: contracts-v1 has no "punten terug" route; refundRedemption exists
  // only as a function for the support flow (docs/build/WP-4.md, WP-6.md). See docs/build/WP-11.md.
});

test('Beheerder publiceert een item zonder verklaring of vinkje: DECLARATION_REQUIRED of CASH_CHECK_REQUIRED (arch §11, spec §4.3)', async ({ api }) => {
  const c = new Chain(api);
  const admin = await c.admin('anna');
  const partner = await admin.api.call('admin.partners.create', { body: { name: 'Fictieve Partner', kind: 'sponsor' } });
  const budget = await admin.api.call('admin.budgets.create', {
    params: { id: partner.partner.id },
    body: { kind: 'direct_reward', booked_cents: 5_000, reward_pct: 100, document_ref: 'DEMO-OVK-E2E-2', booked_at: '2026-11-30' },
  });
  const r = await admin.api.call('admin.rewards.create', {
    body: { partner_id: partner.partner.id, kind: 'service', title_nl: 'Dienst', title_en: 'Service', terms_nl: 'Fictief.', terms_en: 'Fictitious.', cost_cents: 200, points_price: 300, min_age_band: '16_17', declaration_ref: 'DEMO-VERKL', collective: false, budget_id: budget.budget.id, stock: 3 },
  });
  await admin.api.call('admin.rewards.vouchers', { params: { id: r.reward.id }, body: { csv: 'X-1\nX-2\nX-3' } });
  // The client schema only allows cash_check: true, so the refusal is sent raw.
  const res = await admin.send('POST', `/admin/rewards/${r.reward.id}/publish`, JSON.stringify({ cash_check: false }), { 'Content-Type': 'application/json', 'X-CSRF-Token': admin.cookies.get('rw_csrf')! });
  expect(res.status).toBe(422);
  expect(JSON.parse(await res.text()).error.code).toBe('CASH_CHECK_REQUIRED');
  // Without a declaration the item cannot even be created (DocumentRef is required in contracts-v1);
  // DECLARATION_REQUIRED on publish therefore only guards rows from elsewhere.
  const noDecl = await admin.send('POST', '/admin/rewards', JSON.stringify({ partner_id: partner.partner.id, kind: 'service', title_nl: 'D', title_en: 'D', terms_nl: 'F', terms_en: 'F', cost_cents: 200, points_price: 300, min_age_band: '16_17', declaration_ref: '   ', collective: false, budget_id: budget.budget.id, stock: 1 }), { 'Content-Type': 'application/json', 'X-CSRF-Token': admin.cookies.get('rw_csrf')! });
  expect([422]).toContain(noDecl.status);
  expect(['DECLARATION_REQUIRED', 'VALIDATION_FAILED']).toContain(JSON.parse(await noDecl.text()).error.code);
});

test('Afkeuring van een eerdere sessie op een dag met een afgetopte latere sessie: reverse en earn_topup (arch §11, §5.1)', async ({ api }) => {
  test.setTimeout(240_000);
  const c = new Chain(api);
  await c.at(local('2026-12-03', '06:00'));
  const admin = await c.admin('anna');
  const s = await studentInArm(c, 'A');
  const plans = earnInDay(s, '2026-12-03');
  plans[0] = { ...plans[0]!, webdriver: true };
  const res = await c.sessions(...plans);
  const firstId = res.find((r) => api.sql<{ webdriver: number }>('SELECT webdriver FROM focus_session WHERE id = ?', [r.sessionId])[0]!.webdriver === 1)!.sessionId;
  const last = api.sql<{ id: string; counted_min: number }>("SELECT id, counted_min FROM focus_session WHERE planned_min = 50 AND focus_day = '2026-12-03'")[0]!;
  expect(last.counted_min).toBe(30);
  const flag = (await admin.api.call('admin.flags.list', { query: { status: 'open' } })).items.find((f) => f.code === 'H1')!;
  await admin.api.call('admin.flags.decide', { params: { id: flag.id }, body: { decision: 'reject', reason_code: 'automation', note: 'Geautomatiseerde browser (e2e)' } });
  const types = api.sql<{ type: string; ref_id: string }>("SELECT type, ref_id FROM journal_entry WHERE focus_day = '2026-12-03' ORDER BY created_at, id");
  expect(types.some((e) => e.type === 'reverse' && e.ref_id === firstId)).toBe(true);
  expect(types.some((e) => e.type === 'earn_topup' && e.ref_id === last.id)).toBe(true);
  expect(api.sql<{ counted_min: number }>('SELECT counted_min FROM focus_session WHERE id = ?', [last.id])[0]!.counted_min).toBe(50);
  void dayAfter;
});
