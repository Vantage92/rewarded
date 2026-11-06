// Core flow of the MVP in the browser against the real API of the worker (integration wave;
// architecture §11, productplan §4): invite, login with the code from /dev/inbox, onboarding, a
// 25-minute session on the dev clock, points under review (H1: Playwright has webdriver = true), the
// squad, the club leaderboard, the catalogue, and an admin who releases the flag in /beheer.
// Browser time is Playwright's page.clock (paused); every step moves POST /dev/clock first, then the
// page clock by the same amount, so server and browser time move together (architecture §11).
import { DEMO_ADMINS, adminTotp } from '../../tooling/seed/admins.ts';
import { login } from '../../tooling/seed/flows.ts';
import { advance, onboardInBrowser, visit } from '../support/browser.ts';
import { expect, test } from '../support/fixtures.ts';
import { Chain, MIN, catalogItem, homeIp, local } from '../support/steps.ts';

test('Kernflow in de browser tegen de echte API: uitnodiging, code uit /dev/inbox, onboarding, 25 minuten op de dev-klok, punten, squad, ranglijst, catalogus, vrijgave door de beheerder (arch §11, productplan §4)', async ({ page, api, browser, wire }) => {
  test.setTimeout(240_000);
  const c = new Chain(api);
  await c.at(local('2026-12-07', '08:30'));
  const anna = await c.admin('anna');
  // Club with its own exam calendar (spec §4.13), catalogue and a warm-up leaderboard.
  const cal = await anna.api.call('admin.examCalendars.create', { body: { institution: 'Hogeschool Demostad (fictief)', t_day: '2027-01-24', source_ref: 'Jaarrooster (fictief)', checked_at: '2026-11-05' } });
  const club = (await anna.api.call('admin.clubs.create', {
    body: { name: 'Studievereniging Kompas', city: 'Demostad', declared_members: 60, members_source_kind: 'institution', members_source_ref: 'Fictief', agreement_ref: 'OVK-KERN', exam_calendar_id: cal.calendar.id, pool: 'lt150' },
  })).club;
  await catalogItem(c, { weeks: ['2026-W50', '2026-W51'] });
  const warm = await anna.api.call('admin.challenges.create', { body: { type: 'club_warmup', title_nl: 'Aanloopklassement', title_en: 'Warm-up', period_start_day: '2026-12-07', period_end_day: '2026-12-20', pool: 'lt150', rules: {}, prizes: [] } });
  await anna.api.call('admin.challenges.publish', { params: { id: warm.challenge.id } });
  // A founder makes a squad of the club and shares the link.
  const founder = await c.student({ firstName: 'Sanne' });
  await founder.actor.api.call('clubs.join', { body: { code: club.join_code! } });
  const squad = await founder.actor.api.call('squads.create', { body: { name: 'De Uilen', club_id: club.id } });

  // ---- Student in the browser, on a paused page clock at server time ----
  const t0 = await api.now();
  await page.clock.install({ time: t0 });
  await page.clock.pauseAt(t0 + 1);
  const email = 'noor.kern@student.demostad.test';
  await onboardInBrowser(page, api, squad.invite.token, email, 'Noor');
  await expect.poll(() => api.sql('SELECT 1 FROM squad_membership m JOIN user u ON u.id = m.user_id WHERE u.email = ? AND m.squad_id = ?', [email, squad.squad.id]).length).toBe(1);
  // GET /me knows squad, club and calendar.
  await page.goto(`/vereniging/koppelen?code=${club.join_code}`);
  await page.getByRole('button', { name: 'Koppel' }).click();
  await expect(page.getByText('Je bent gekoppeld aan Studievereniging Kompas.', { exact: false })).toBeVisible();

  // 25 minutes with the dev clock in steps of 30 s (spec §3.2).
  await page.goto('/focus?duur=25');
  await page.getByRole('button', { name: 'Begin' }).click();
  await expect(page.getByRole('timer')).toBeVisible();
  await advance(page, api, 25 * MIN + 2_000);
  await expect(page.getByRole('heading', { name: 'Sessie klaar.' })).toBeVisible();
  await page.mouse.click(200, 300);
  await expect(page.getByText('25 minuten. Je dagdoel is gehaald.')).toBeVisible();
  // Standard Playwright: webdriver = true gives H1, the points wait for a review.
  await expect(page.getByText(/Deze sessie wordt nagekeken\./)).toBeVisible();
  const userId = api.sql<{ id: string }>('SELECT id FROM user WHERE email = ?', [email])[0]!.id;
  const session = api.sql<{ id: string; status: string; flag_codes: string }>("SELECT id, status, flag_codes FROM focus_session WHERE user_id = ? AND is_practice = 0", [userId])[0]!;
  expect(session.status).toBe('completed');
  expect(JSON.parse(session.flag_codes)).toContain('H1');
  // Heartbeats reached the server as contacts, every seq once (architecture §4.3).
  expect(api.sql<{ n: number }>("SELECT count(*) AS n FROM session_heartbeat WHERE session_id = ? AND kind = 'online'", [session.id])[0]!.n).toBeGreaterThanOrEqual(45);

  // ---- Admin in a second browser context releases the flag (architecture §10.8) ----
  const adminCtx = await browser.newContext();
  await wire(adminCtx);
  const adminActor = api.newActor(homeIp());
  await login(api.world, adminActor, DEMO_ADMINS[1]!.email);
  await adminActor.api.call('admin.mfa.verify', { body: { code: adminTotp(DEMO_ADMINS[1]!.key, new Date(await api.now())) } });
  await adminCtx.addCookies([...adminActor.cookies].map(([name, value]) => ({ name, value, domain: 'localhost', path: '/' })));
  const adminPage = await adminCtx.newPage();
  await adminPage.goto('/beheer/wachtrij');
  await expect(adminPage.getByRole('heading', { level: 1, name: 'Beheer' })).toBeVisible();
  const card = adminPage.getByRole('form', { name: /Besluit over markering H1/ }).first();
  await expect(card).toBeVisible();
  // "Vrijgeven" is the default decision of the segmented control.
  await expect(card.getByRole('radio', { name: 'Vrijgeven' })).toBeChecked();
  await card.getByLabel(/^Redencode/).selectOption('no_evidence');
  await expect(card.getByLabel(/^Redencode/)).toHaveValue('no_evidence', { timeout: 5_000 });
  await card.getByLabel('Interne toelichting').fill('Gewone browser na controle.');
  await expect(card.getByRole('button', { name: 'Besluit vastleggen' })).toBeEnabled();
  await card.getByRole('button', { name: 'Besluit vastleggen' }).click({ force: true });
  await expect.poll(() => api.sql<{ status: string }>("SELECT f.status FROM fraud_flag f JOIN fraud_flag_session s ON s.flag_id = f.id WHERE s.session_id = ?", [session.id])[0]?.status).toBe('released');
  await adminCtx.close();

  // ---- Back to the student: points available, squad, leaderboard, catalogue ----
  await visit(page, '/punten');
  // 25 for the session plus the goal bonus of 20 (arm A; 2026-12-07 is in the season of the calendar).
  await expect(page.getByText('45 punten').first()).toBeVisible();
  await visit(page, '/squad');
  await expect(page.getByRole('heading', { name: /De Uilen/ }).or(page.getByText('De Uilen')).first()).toBeVisible();
  await c.closeDay('2026-12-07');
  await visit(page, '/vereniging/ranglijst');
  await expect(page.getByText('Studievereniging Kompas').first()).toBeVisible();
  await visit(page, '/punten/catalogus');
  await expect(page.getByText('Koffie met koek')).toBeVisible();
  void founder;
});
