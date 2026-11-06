// Browser flows against the real API of the worker (architecture §11): registration through a
// squad link with the code from /dev/inbox, the admin queue behind TOTP and the board dashboard.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { DEMO_ADMINS, adminTotp } from '../../tooling/seed/admins.ts';
import { lastCode } from '../../tooling/seed/driver.ts';
import { login } from '../../tooling/seed/flows.ts';
import { REPO } from '../support/api.ts';
import { expect, test, type Page } from '../support/fixtures.ts';
import { Chain, homeIp, local } from '../support/steps.ts';
import type { Actor } from '../../tooling/seed/driver.ts';

/** Moves an API login into the browser (same cookies on localhost). */
async function handOver(page: Page, actor: Actor): Promise<void> {
  await page.context().addCookies([...actor.cookies].map(([name, value]) => ({ name, value, domain: 'localhost', path: '/' })));
}

async function axe(page: Page): Promise<{ id: string; impact: string | null }[]> {
  await page.addScriptTag({ content: readFileSync(join(REPO, 'apps/web/node_modules/axe-core/axe.min.js'), 'utf8') });
  return page.evaluate(async () => {
    const w = globalThis as unknown as { axe: { run(ctx: unknown, opts: unknown): Promise<{ violations: { id: string; impact: string | null }[] }> } };
    const r = await w.axe.run((globalThis as unknown as { document: unknown }).document, { runOnly: ['wcag2a', 'wcag2aa'] });
    return r.violations.map((v) => ({ id: v.id, impact: v.impact }));
  });
}

test('Registratie via squadlink in de browser: code uit /dev/inbox in het codeveld, 17 jaar, in de squad met stille modus (arch §11, UX §4.1)', async ({ page, api }) => {
  const c = new Chain(api);
  await c.at(local('2026-12-02', '09:00'));
  const founder = await c.student({ firstName: 'Sanne' });
  const squad = await founder.actor.api.call('squads.create', { body: { name: 'De Uilen' } });
  await page.goto(`/i/${squad.invite.token}`);
  await expect(page.getByText('Sanne nodigt je uit voor squad De Uilen')).toBeVisible();
  await page.getByRole('link', { name: 'Doe mee' }).or(page.getByRole('button', { name: 'Doe mee' })).first().click();
  const begrepen = page.getByRole('button', { name: 'Begrepen' }).or(page.getByRole('link', { name: 'Begrepen' }));
  if (await begrepen.first().isVisible().catch(() => false)) await begrepen.first().click();
  const email = 'mila.e2e@student.demostad.test';
  await page.getByLabel('E-mailadres').fill(email);
  const first = page.getByLabel('Voornaam');
  if (await first.isVisible().catch(() => false)) await first.fill('Mila');
  await page.getByRole('button', { name: 'Stuur link' }).click();
  await expect(page.getByRole('heading', { name: 'Check je mail' })).toBeVisible();
  await page.getByLabel('Code van 6 cijfers').fill(await lastCode(api.inbox, email));
  await page.getByRole('button', { name: 'Ga verder' }).click();
  await expect(page.getByRole('heading', { name: 'Je geboortedatum' })).toBeVisible();
  if (await page.getByLabel('Voornaam').isVisible().catch(() => false)) await page.getByLabel('Voornaam').fill('Mila');
  await page.getByLabel('Dag').fill('14');
  await page.getByLabel('Maand').fill('3');
  await page.getByLabel('Jaar').fill('2009');
  await page.getByRole('button', { name: 'Verder' }).click();
  // Minors: the silent mode step (UX O5b) may come before the consent; keep its default (on).
  const terms = page.getByLabel('Ik ga akkoord met de gebruiksvoorwaarden');
  for (let i = 0; i < 4 && !(await terms.isVisible().catch(() => false)); i++) {
    await page.waitForTimeout(300);
    if (await terms.isVisible().catch(() => false)) break;
    const next = page.getByRole('button', { name: /^(Verder|Begrepen|Ga verder)$/ });
    if (await next.first().isEnabled().catch(() => false)) await next.first().click();
  }
  await page.getByLabel('Ik ga akkoord met de gebruiksvoorwaarden').check();
  await page.getByLabel('Ik heb de privacyverklaring gelezen').check();
  await page.getByRole('button', { name: 'Akkoord' }).click();
  await page.getByRole('radio', { name: '25 min' }).click();
  await page.getByRole('button', { name: 'Verder' }).click();
  await expect.poll(() => api.sql<{ age_band: string; silent_mode: number }>('SELECT age_band, silent_mode FROM user WHERE email = ?', [email])[0] ?? null).toEqual({ age_band: '16_17', silent_mode: 1 });
  const userId = api.sql<{ id: string }>('SELECT id FROM user WHERE email = ?', [email])[0]!.id;
  await expect.poll(() => api.sql('SELECT 1 FROM squad_membership WHERE user_id = ? AND squad_id = ?', [userId, squad.squad.id]).length).toBe(1);
});

test.describe('met de demo-seed', () => {
  test.describe.configure({ timeout: 180_000 });

  test('Beheerder met TOTP opent de fraudewachtrij met de gemarkeerde demo-sessies; axe zonder ernstige fouten (arch §11, §10.8)', async ({ page, api }) => {
    await api.reset('demo');
    const anna = DEMO_ADMINS[0]!;
    const actor = api.newActor(homeIp());
    await login(api.world, actor, anna.email);
    await actor.api.call('admin.mfa.verify', { body: { code: adminTotp(anna.key, new Date(await api.now())) } });
    await handOver(page, actor);
    await page.goto('/beheer/wachtrij');
    await expect(page.getByRole('heading', { level: 1, name: 'Beheer' })).toBeVisible();
    await expect(page.getByText(/H3|H4|H9|H12/).first()).toBeVisible();
    const serious = (await axe(page)).filter((v) => v.impact === 'serious' || v.impact === 'critical');
    expect(serious).toEqual([]);
  });

  test('Bestuurslid opent het dashboard: groepscijfers, geen namen (arch §11, §6.4)', async ({ page, api }) => {
    await api.reset('demo');
    const row = api.sql<{ email: string; club_id: string }>('SELECT u.email, b.club_id FROM club_board_member b JOIN user u ON u.id = b.user_id ORDER BY u.email LIMIT 1')[0]!;
    const actor = api.newActor(homeIp());
    await login(api.world, actor, row.email);
    await handOver(page, actor);
    await page.goto(`/bestuur/${row.club_id}`);
    await expect(page.getByText(/Je ziet groepscijfers/)).toBeVisible();
    const names = api.sql<{ first_name: string }>("SELECT first_name FROM user WHERE email LIKE '%@student.demostad.test'").map((r) => r.first_name);
    const text = await page.locator('main').innerText();
    for (const n of names) expect(text).not.toContain(n);
    const serious = (await axe(page)).filter((v) => v.impact === 'serious' || v.impact === 'critical');
    expect(serious).toEqual([]);
  });
});
