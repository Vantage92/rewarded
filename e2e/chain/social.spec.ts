// Squads, duels, cards and the board through the real chain (architecture §6, §11 table; spec §3.5–3.7, §4.4–4.8).
import { DEMO_ADMINS } from '../../tooling/seed/admins.ts';
import { login } from '../../tooling/seed/flows.ts';
import { expect, test } from '../support/fixtures.ts';
import { clubCalendar, Chain, MIN, enableFlag, homeIp, local } from '../support/steps.ts';

test('Registratie via squadlink, geboortedatum 17 jaar, oefensessie: 16_17 in de squad, stille modus, persoonlijk A en doorlopend; duellink van buiten geeft AGE_RESTRICTED (arch §11, spec §4.10)', async ({ api }) => {
  const c = new Chain(api);
  await c.at(local('2026-12-02', '09:00'));
  await enableFlag(c, 'arm_b');
  await enableFlag(c, 'duels');
  // A squad in arm B and the rest arm if the blocks give one; the minor's own arms are A and continue anyway.
  const founder = await c.student();
  const squad = await founder.actor.api.call('squads.create', { body: { name: 'Jonge Honden' } });
  const minor = await c.student({ invite: squad.invite.token, birthDate: '2009-06-01' });
  await minor.actor.api.call('invites.accept', { params: { token: squad.invite.token } });
  expect(minor.onboarding.assignment.arm_bonus).toBe('A');
  expect(minor.onboarding.assignment.arm_rest).toBe('continue');
  const me = await minor.actor.api.call('me.get');
  expect(me.age_band).toBe('16_17');
  expect(me.settings?.silent_mode).toBe(true);
  expect((await minor.actor.api.call('squads.mine')).squad.id).toBe(squad.squad.id);
  const [practice] = await c.sessions({ actor: minor.actor, deviceId: minor.deviceId, start: (await api.now()) + MIN, plannedMin: 1, outcome: { kind: 'complete' }, intervalS: 30 });
  expect(practice!.status).toBe('completed');
  // An adult outside the squad sends a duel link; the minor may not accept it (spec §3.6).
  const outsider = await c.student();
  const duel = await outsider.actor.api.call('duels.create', { body: {} });
  expect(await minor.actor.codeOf(minor.actor.api.call('invites.accept', { params: { token: duel.invite.token } }))).toBe('AGE_RESTRICTED');
  expect(await minor.actor.codeOf(minor.actor.api.call('duels.create', { body: {} }))).toBe('AGE_RESTRICTED');
});

test('Samenvoegen van squads met verschillende arm_rest, of buiten de tentamenperiode: MERGE_ARM_MISMATCH respectievelijk geen aanbod (arch §11, spec §3.5, §4.4)', async ({ api }) => {
  test.setTimeout(240_000);
  const c = new Chain(api);
  await c.at(local('2026-11-02', '09:00'));
  // Merging only happens within one club (spec §3.5 step 7).
  const admin = await c.admin('anna');
  const club = await admin.api.call('admin.clubs.create', {
    body: { name: 'Studievereniging Samen (fictief)', city: 'Demostad', declared_members: 80, members_source_kind: 'institution', members_source_ref: 'Fictief', agreement_ref: 'OVK-E2E-SAMEN', exam_calendar_id: await clubCalendar(c) },
  });
  // Squads until two differ in arm_rest (blocks of four per stratum); nobody focuses, so they become low-activity.
  const squads: { founder: Awaited<ReturnType<Chain['student']>>; id: string; rest: string }[] = [];
  for (let i = 0; i < 6 && new Set(squads.map((s) => s.rest)).size < 2; i++) {
    const f = await c.student();
    await f.actor.api.call('clubs.join', { body: { code: club.club.join_code! } });
    const sq = await f.actor.api.call('squads.create', { body: { name: `Ploeg ${i + 1}`, club_id: club.club.id } });
    squads.push({ founder: f, id: sq.squad.id, rest: api.sql<{ arm_rest: string }>('SELECT arm_rest FROM squad WHERE id = ?', [sq.squad.id])[0]!.arm_rest });
  }
  const a = squads[0]!;
  const b = squads.find((s) => s.rest !== a.rest)!;
  const same = squads.find((s) => s !== a && s.rest === a.rest);
  const merge = (target: string) =>
    a.founder.actor.api.call('squads.mergeRequest', { body: { target_squad_ref: target } }).then(
      () => null,
      (e: unknown) => e as { code: string; details?: { reason?: string } },
    );
  for (let d = Date.parse('2026-11-02T12:00:00Z'); d <= Date.parse('2026-11-12T12:00:00Z'); d += 24 * 60 * MIN) await c.closeDay(new Date(d).toISOString().slice(0, 10));
  // Low activity in November, outside the exam period of the (default) calendar: no offer.
  const row = api.sql<{ low: string | null; offered: string | null }>('SELECT low_activity_since_day AS low, regroup_offered_at AS offered FROM squad WHERE id = ?', [a.id])[0]!;
  expect(row.low).not.toBeNull();
  expect(row.offered).toBeNull();
  expect((await merge(same?.id ?? b.id))?.code).toBe('NOT_ELIGIBLE');
  expect((await merge(same?.id ?? b.id))?.details?.reason).toBeUndefined();
  // Inside the exam period (season from 2 December) the regroup route opens, but not across arm_rest.
  await c.at(local('2026-12-03', '12:00'));
  const err = await merge(b.id);
  // MERGE_ARM_MISMATCH is in contracts since the integration wave (arch §8.3).
  expect(err?.code).toBe('MERGE_ARM_MISMATCH');
  expect(err?.details?.reason).toBe('merge_arm_mismatch');
});

test('Kaart met kwaadaardige voornaam: geëscapete SVG en strenge headers (arch §11, §10.3)', async ({ api }) => {
  const c = new Chain(api);
  await c.at(local('2026-12-02', '09:00'));
  await enableFlag(c, 'cards');
  const s = await c.student({ firstName: '<script>alert(1)</script>&"' });
  const [r] = await c.sessions({ actor: s.actor, deviceId: s.deviceId, start: (await api.now()) + MIN, plannedMin: 25, outcome: { kind: 'complete' } });
  const card = await s.actor.api.call('cards.create', { body: { kind: 'session', ref_id: r!.sessionId, fields: { first_name: true, duration: true } } });
  const img = await s.actor.send('GET', `/cards/${card.card_id}/image`);
  const svg = await img.text();
  expect(img.status).toBe(200);
  expect(svg).not.toContain('<script>');
  expect(svg).toContain('&lt;script&gt;');
  expect(img.headers.get('content-type')).toContain('image/svg+xml');
  expect(img.headers.get('content-security-policy')).toContain("default-src 'none'");
  expect(img.headers.get('x-content-type-options')).toBe('nosniff');
});

test.describe('met de demo-seed', () => {
  test.describe.configure({ timeout: 180_000 });

  test('Dagafsluiting via POST /dev/jobs/day_close/run: user_day, squad_day, ranglijstsnapshot, controles leeg (arch §11, §6.1)', async ({ api }) => {
    await api.reset('demo');
    // The demo leaves the clock on 16 December; close that day on the 17th at 05:46.
    await api.setClock(local('2026-12-17', '05:46'));
    expect(await api.runJob('day_close', 'day_close:2026-12-16')).toBe('done');
    const steps = JSON.parse(api.sql<{ step_results: string }>("SELECT step_results FROM job_run WHERE run_key = 'day_close:2026-12-16'")[0]!.step_results) as Record<string, { status: string }>;
    expect(Object.values(steps).every((s) => s.status === 'done')).toBe(true);
    expect(api.sql<{ n: number }>("SELECT count(*) AS n FROM user_day WHERE focus_day = '2026-12-15'")[0]!.n).toBeGreaterThan(40);
    expect(api.sql<{ n: number }>("SELECT count(*) AS n FROM squad_day WHERE focus_day = '2026-12-16'")[0]!.n).toBeGreaterThan(0);
    expect(api.sql<{ n: number }>('SELECT count(*) AS n FROM challenge_score')[0]!.n).toBeGreaterThan(0);
    expect(api.sql<{ n: number }>("SELECT count(*) AS n FROM journal_entry WHERE type = 'goal_budget_lapse'")[0]!.n).toBeGreaterThan(0);
    expect(api.sql<{ n: number }>('SELECT count(*) AS n FROM ledger_alert')[0]!.n).toBe(0);
  });

  test('Bestuur opent dashboard: alleen weekaggregaten, afgerond op 5, kleine aantallen onderdrukt (arch §11, §6.4)', async ({ api }) => {
    await api.reset('demo');
    const board = api.newActor(homeIp());
    const email = api.sql<{ email: string }>('SELECT u.email FROM club_board_member b JOIN user u ON u.id = b.user_id ORDER BY u.email LIMIT 1')[0]!.email;
    await login(api.world, board, email);
    const club = api.sql<{ club_id: string }>('SELECT b.club_id FROM club_board_member b JOIN user u ON u.id = b.user_id WHERE u.email = ?', [email])[0]!.club_id;
    const other = api.sql<{ id: string }>('SELECT id FROM club WHERE id <> ? LIMIT 1', [club])[0]!.id;
    for (const tab of ['stand', 'werving', 'prijs', 'kwaliteit'] as const) {
      const d = await board.api.call('board.dashboard', { params: { id: club }, query: { tab } });
      const text = JSON.stringify(d);
      expect(text).not.toMatch(/@|user_id|pseudonym|"[0-9A-Z]{26}"/);
      const metrics: { value: number | null; suppressed: boolean }[] = [];
      const walk = (x: unknown) => {
        if (x && typeof x === 'object') {
          if ('suppressed' in x && 'value' in x) metrics.push(x as { value: number | null; suppressed: boolean });
          else for (const v of Object.values(x)) walk(v);
        }
      };
      walk(d);
      for (const m of metrics) {
        if (m.suppressed) expect(m.value).toBeNull();
      }
      if (tab === 'werving' && d.tab === 'werving') {
        if (!d.linked_members.suppressed) expect(d.linked_members.value! % 5).toBe(0);
      }
    }
    expect(await board.codeOf(board.api.call('board.dashboard', { params: { id: other }, query: { tab: 'stand' } }))).toBe('FORBIDDEN');
    void DEMO_ADMINS;
  });
});
