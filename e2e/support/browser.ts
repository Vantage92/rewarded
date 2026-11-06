// Browser helpers for the chain specs against the real worker API (integration wave): cookies from
// an API login, the paused page clock moved together with POST /dev/clock, and the onboarding UI.
import { lastCode, type Actor } from '../../tooling/seed/driver.ts';
import type { WorkerApi } from './api.ts';
import { expect, type Page } from './fixtures.ts';

export async function handOver(page: Page, actor: Actor): Promise<void> {
  await page.context().addCookies([...actor.cookies].map(([name, value]) => ({ name, value, domain: 'localhost', path: '/' })));
}

/** Server clock first, then the paused page clock, in steps; a short real pause lets requests land. */
export async function advance(page: Page, api: WorkerApi, ms: number, step = 30_000): Promise<void> {
  for (let left = ms; left > 0; left -= step) {
    const d = Math.min(step, left);
    await api.setClock((await api.now()) + d);
    await page.clock.runFor(d);
    await page.waitForTimeout(60);
  }
}

/** Navigation on a paused page clock: React Query batches with setTimeout(0), so the clock must tick. */
export async function visit(page: Page, path: string): Promise<void> {
  await page.goto(path);
  for (let i = 0; i < 6; i++) {
    await page.clock.runFor(250);
    await page.waitForTimeout(50);
  }
}

/** Onboarding of an adult through an invite link, with the login code from the dev inbox. */
export async function onboardInBrowser(page: Page, api: WorkerApi, inviteToken: string, email: string, firstName: string): Promise<void> {
  await page.goto(`/i/${inviteToken}`);
  await page.getByRole('link', { name: 'Doe mee' }).or(page.getByRole('button', { name: 'Doe mee' })).first().click();
  const begrepen = page.getByRole('button', { name: 'Begrepen' }).or(page.getByRole('link', { name: 'Begrepen' }));
  if (await begrepen.first().isVisible().catch(() => false)) await begrepen.first().click();
  await page.getByLabel('E-mailadres').fill(email);
  const first = page.getByLabel('Voornaam');
  if (await first.isVisible().catch(() => false)) await first.fill(firstName);
  await page.getByRole('button', { name: 'Stuur link' }).click();
  await expect(page.getByRole('heading', { name: 'Check je mail' })).toBeVisible();
  await page.getByLabel('Code van 6 cijfers').fill(await lastCode(api.inbox, email));
  await page.getByRole('button', { name: 'Ga verder' }).click();
  await expect(page.getByRole('heading', { name: 'Je geboortedatum' })).toBeVisible();
  if (await page.getByLabel('Voornaam').isVisible().catch(() => false)) await page.getByLabel('Voornaam').fill(firstName);
  await page.getByLabel('Dag').fill('17');
  await page.getByLabel('Maand').fill('5');
  await page.getByLabel('Jaar').fill('2003');
  await page.getByRole('button', { name: 'Verder' }).click();
  const terms = page.getByLabel('Ik ga akkoord met de gebruiksvoorwaarden');
  for (let i = 0; i < 4 && !(await terms.isVisible().catch(() => false)); i++) {
    await page.waitForTimeout(300);
    if (await terms.isVisible().catch(() => false)) break;
    const next = page.getByRole('button', { name: /^(Verder|Begrepen|Ga verder)$/ });
    if (await next.first().isEnabled().catch(() => false)) await next.first().click();
  }
  await terms.check();
  await page.getByLabel('Ik heb de privacyverklaring gelezen').check();
  await page.getByRole('button', { name: 'Akkoord' }).click();
  await page.getByRole('radio', { name: '25 min' }).click();
  await page.getByRole('button', { name: 'Verder' }).click();
  await expect.poll(() => api.sql('SELECT 1 FROM user WHERE email = ?', [email]).length).toBe(1);
}


/** Installs the paused page clock at server time (before the first navigation). */
export async function pausedClock(page: Page, api: WorkerApi): Promise<void> {
  const t0 = await api.now();
  await page.clock.install({ time: t0 });
  await page.clock.pauseAt(t0 + 1);
}

/** A registered student (API) whose cookies go to the browser; the web app registers the device. */
export async function studentInBrowser(page: Page, actor: Actor): Promise<void> {
  await handOver(page, actor);
}
