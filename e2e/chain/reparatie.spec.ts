// Repair wave, in the browser against the real worker API (docs/build/REPARATIE.md): a blocked
// account appeals and is active again (spec §6.5), the reminder mail unsubscribes in one click via
// the dev inbox (UX §4.9, P5), and the promo kit URL /c/:code links to the club (spec §3.7).
import { login } from '../../tooling/seed/flows.ts';
import { handOver, pausedClock, visit } from '../support/browser.ts';
import { expect, test } from '../support/fixtures.ts';
import { Chain, clubCalendar, enableFlag, local } from '../support/steps.ts';

test('Blokkeren, beroep in de browser, gegrond, account weer actief (spec §6.5, art. 22 AVG)', async ({ page, api }) => {
  test.setTimeout(180_000);
  const c = new Chain(api);
  await c.at(local('2026-12-07', '10:00'));
  const s = await c.student({ firstName: 'Bo' });
  const [run] = await c.sessions({ actor: s.actor, deviceId: s.deviceId, start: (await api.now()) + 1_000, plannedMin: 25, outcome: { kind: 'complete' }, webdriver: true, intervalS: 30 });
  const flag = api.sql<{ id: string }>("SELECT f.id FROM fraud_flag f JOIN fraud_flag_session l ON l.flag_id = f.id WHERE l.session_id = ? AND f.code = 'H1'", [run!.sessionId])[0]!;
  const anna = await c.admin('anna');
  const bram = await c.admin('bram');
  await anna.api.call('admin.flags.decide', { params: { id: flag.id }, body: { decision: 'block', reason_code: 'fraud_confirmed', note: 'test' } });
  await bram.api.call('admin.blocks.confirm', { params: { id: flag.id }, body: { note: 'bevestigd' } });
  expect(api.sql<{ status: string }>('SELECT status FROM user WHERE email = ?', [s.email])[0]!.status).toBe('blocked');
  // Logging in works: a restricted session.
  await login(api.world, s.actor, s.email);
  await pausedClock(page, api);
  await handOver(page, s.actor);
  await visit(page, '/');
  await expect(page.getByRole('heading', { level: 1, name: 'Je account is geblokkeerd' })).toBeVisible();
  await page.getByRole('button', { name: 'Beroep instellen' }).click();
  await page.getByLabel('Jouw uitleg').fill('Ik heb maar één account en gebruik een gewone browser.');
  await page.getByRole('button', { name: 'Verstuur beroep' }).click();
  await expect.poll(() => api.sql('SELECT 1 FROM appeal WHERE object_id = ?', [flag.id]).length).toBe(1);
  const appealId = api.sql<{ id: string }>('SELECT id FROM appeal WHERE object_id = ?', [flag.id])[0]!.id;
  // Anna and Bram worked on the block: the third admin decides.
  const chris = await c.admin('chris');
  await chris.api.call('admin.appeals.decide', { params: { id: appealId }, body: { outcome: 'upheld', motivation: 'Geen tweede account gevonden.' } });
  expect(api.sql<{ status: string }>('SELECT status FROM user WHERE email = ?', [s.email])[0]!.status).toBe('active');
  await visit(page, '/');
  await expect(page.getByRole('heading', { level: 1, name: 'Vandaag' })).toBeVisible();
});

test('Herinneringsmail: opt-in, mail om de gekozen tijd, uitschrijven met één klik via de dev-inbox (UX §4.9, P5)', async ({ page, api }) => {
  test.setTimeout(120_000);
  const c = new Chain(api);
  await c.at(local('2026-12-08', '10:00'));
  await enableFlag(c, 'reminders');
  const s = await c.student({ firstName: 'Lot' });
  expect((await s.actor.api.call('me.get')).settings?.email_reminders).toBe(false);
  await s.actor.api.call('me.settings', { body: { email_reminders: true, reminder_time: '20:00' } });
  await c.at(local('2026-12-08', '20:01'));
  await api.runJob('reminders');
  const mails = await api.inbox(s.email);
  const mail = mails.find((m) => m.channel === 'email' && /Je dagdoel staat nog open/.test(m.subject ?? ''));
  expect(mail).toBeDefined();
  const link = /(\/herinneringen\/uit#t=[A-Za-z0-9_-]+)/.exec(mail!.text ?? '')![1]!;
  await pausedClock(page, api);
  await visit(page, link);
  await expect(page.getByText(/Je krijgt geen herinneringsmails meer/)).toBeVisible();
  await expect.poll(() => api.sql<{ v: number }>('SELECT email_reminders AS v FROM user WHERE email = ?', [s.email])[0]!.v).toBe(0);
});

test('Koppelen aan een vereniging via de URL uit de promokit /c/:code (spec §3.7)', async ({ page, api }) => {
  test.setTimeout(120_000);
  const c = new Chain(api);
  await c.at(local('2026-12-07', '10:00'));
  const anna = await c.admin('anna');
  const board = await c.student({ firstName: 'Bestuur' });
  const cal = await clubCalendar(c);
  const club = (await anna.api.call('admin.clubs.create', {
    body: { name: 'Studievereniging Prisma', city: 'Demostad', declared_members: 60, members_source_kind: 'institution', members_source_ref: 'Fictief', agreement_ref: 'OVK-PRISMA', exam_calendar_id: cal, board_member_emails: [board.email] },
  })).club;
  const kit = await board.actor.api.call('board.promoKit', { params: { id: club.id } });
  const poster = kit.assets.find((a) => a.kind === 'poster')!;
  const path = new URL(poster.url).pathname + new URL(poster.url).search;
  expect(path).toBe(`/c/${club.join_code}?bron=poster`);
  const s = await c.student({ firstName: 'Ravi' });
  await pausedClock(page, api);
  await handOver(page, s.actor);
  await visit(page, path);
  await expect(page).toHaveURL(new RegExp(`/vereniging/koppelen\\?code=${club.join_code}&bron=poster`));
  await page.getByRole('button', { name: 'Koppel' }).click();
  await expect(page.getByText('Je bent gekoppeld aan Studievereniging Prisma.', { exact: false })).toBeVisible();
  expect(api.sql<{ qr_source: string | null }>('SELECT m.qr_source FROM club_membership m JOIN user u ON u.id = m.user_id WHERE u.email = ?', [s.email])[0]?.qr_source).toBe('poster');
});
