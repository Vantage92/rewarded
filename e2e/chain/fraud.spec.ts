// Fraud signals, the review queue and the sample through the real chain (architecture §4.5, §6.5,
// §11 table; spec §6.3).
import { execFileSync } from 'node:child_process';
import { UA } from '../../tooling/seed/driver.ts';
import { REPO } from '../support/api.ts';
import { expect, test } from '../support/fixtures.ts';
import { clubCalendar, Chain, MIN, local, type ChainStudent } from '../support/steps.ts';

const EDUROAM = '192.0.2.44';

test('Zes accounts in zes browserprofielen op één laptop (eduroam), tegelijk en gespreid, op twee dagen: H12; twintig eigen toestellen op dezelfde campus-IP niet (arch §11, spec §6.3 H12)', async ({ api }) => {
  test.setTimeout(300_000);
  const c = new Chain(api);
  await c.at(local('2026-12-02', '08:00'));
  const laptopTogether: ChainStudent[] = [];
  const laptopSpread: ChainStudent[] = [];
  const phones: ChainStudent[] = [];
  for (let i = 0; i < 6; i++) laptopTogether.push(await c.student({ ip: EDUROAM, ua: 'desktop', uaClass: 'desktop' }));
  for (let i = 0; i < 6; i++) laptopSpread.push(await c.student({ ip: '192.0.2.45', ua: 'desktop', uaClass: 'desktop' }));
  for (let i = 0; i < 20; i++) phones.push(await c.student({ ip: EDUROAM, ua: i % 2 ? 'iphone' : 'android', uaClass: i % 2 ? 'ios_safari' : 'android_chrome' }));
  for (const day of ['2026-12-03', '2026-12-04']) {
    const t = local(day, '13:00');
    await c.sessions(
      ...laptopTogether.map((s) => ({ actor: s.actor, deviceId: s.deviceId, start: t, plannedMin: 50 as const, outcome: { kind: 'complete' as const }, ip: EDUROAM })),
      ...laptopSpread.map((s, k) => ({ actor: s.actor, deviceId: s.deviceId, start: t + k * 3 * MIN, plannedMin: 90 as const, outcome: { kind: 'complete' as const }, ip: '192.0.2.45' })),
      ...phones.map((s, k) => ({ actor: s.actor, deviceId: s.deviceId, start: t + (k % 5) * MIN, plannedMin: 50 as const, outcome: { kind: 'complete' as const }, ip: EDUROAM })),
    );
    await c.closeDay(day);
  }
  const flagged = api.sql<{ email: string }>(
    `SELECT DISTINCT u.email FROM fraud_flag f JOIN fraud_flag_session fs ON fs.flag_id = f.id LEFT JOIN focus_session s ON s.id = fs.session_id
       JOIN user u ON u.id = coalesce(fs.user_id, s.user_id) WHERE f.code = 'H12'`,
  ).map((r) => r.email);
  for (const s of [...laptopTogether, ...laptopSpread]) expect(flagged).toContain(s.email);
  for (const s of phones) expect(flagged).not.toContain(s.email);
  void UA;
});

test('Steekproef van de week opnieuw trekken met dezelfde seed: dezelfde 30 accounts (arch §11, §6.5)', async ({ api }) => {
  test.setTimeout(180_000);
  await api.reset('demo');
  const samples = api.sql<{ id: string; week_key: string }>("SELECT id, week_key FROM fraud_sample WHERE kind = 'weekly'");
  expect(samples.length).toBeGreaterThan(0);
  const out = execFileSync(process.execPath, ['apps/api/src/modules/fraud/cli/sample-verify.ts'], {
    cwd: REPO,
    env: { ...process.env, DATABASE_PATH: api.dbPath, REWARDED_SECRETS_DIR: `${api.dbPath}.nosecrets` },
    encoding: 'utf8',
  });
  for (const s of samples) expect(out).toContain(`${s.week_key} reproduced`);
  const items = api.sql<{ n: number }>('SELECT count(*) AS n FROM fraud_sample_item WHERE sample_id = ?', [samples[0]!.id])[0]!.n;
  expect(items).toBeLessThanOrEqual(30);
});

test('Uitslag voorstellen zonder oordeel op elk steekproefitem: SAMPLE_REQUIRED (arch §11, §6.2)', async ({ api }) => {
  const c = new Chain(api);
  const admin = await c.admin('anna');
  const club = await admin.api.call('admin.clubs.create', {
    body: { name: 'Studievereniging Testlab (fictief)', city: 'Demostad', declared_members: 60, members_source_kind: 'institution', members_source_ref: 'Fictief', agreement_ref: 'OVK-E2E', exam_calendar_id: await clubCalendar(c) },
  });
  // Without prizes: creating a challenge with prizes fails on a foreign key (docs/build/WP-11.md).
  const ch = await admin.api.call('admin.challenges.create', {
    body: { type: 'club_prize', title_nl: 'Prijsperiode', title_en: 'Prize period', period_start_day: '2026-12-02', period_end_day: '2026-12-20', rules: { threshold_rate: 0.3 }, prizes: [] },
  });
  await admin.api.call('admin.challenges.publish', { params: { id: ch.challenge.id } });
  const code = await admin.codeOf(admin.api.call('admin.challenges.propose', { params: { id: ch.challenge.id }, body: { winners: [{ prize_id: club.club.id, club_id: club.club.id }] } }));
  expect(code).toBe('SAMPLE_REQUIRED');
});
