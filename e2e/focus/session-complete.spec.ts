// Architecture §11: "Sessie van 25 minuten met klok vooruit in stappen van 30 s" (spec §3.2, §4.1).
import { expect, MIN, startSession, test } from './fixtures.ts';

test('spec §3.2 / arch §11: a 25-minute session with the clock moving forward completes', async ({ page, rw }) => {
  await startSession(page, 25);
  // F3: dark screen, remaining time, one Stop button, no points in view (spec §3.2 step 4).
  await expect(page.getByRole('button', { name: 'Stoppen' })).toBeVisible();
  await expect(page.locator('body')).not.toContainText('punten');
  await rw.advance(10 * MIN, 30_000);
  await expect(page.getByRole('timer')).toHaveAccessibleName('Nog 15 minuten');
  await rw.advance(15 * MIN + 2000, 30_000);
  // F3e: white end screen before any result.
  await expect(page.getByRole('heading', { name: 'Sessie klaar.' })).toBeVisible();
  await expect(page.getByText('Draai je telefoon om.')).toBeVisible();
  await page.mouse.click(200, 300);
  // F5: daily goal first, points small at the bottom.
  await expect(page.getByText('25 minuten. Je dagdoel is gehaald.')).toBeVisible();
  // Standard Playwright has navigator.webdriver = true: completed but marked H1, points under review (§11).
  await expect(page.getByText(/Deze sessie wordt nagekeken/)).toBeVisible();
  const s = rw.fake.session()!;
  expect(s.status).toBe('completed');
  expect(s.flags).toEqual(['H1']);
  const seqs = rw.fake.callsOf('sessions.heartbeat').map((c) => (c.body as { seq: number }).seq);
  expect(new Set(seqs).size).toBe(seqs.length);
  expect(seqs.length).toBeGreaterThanOrEqual(45);
  // Claim delay: the first touch after the end reached the server.
  expect(s.events.some((e) => e.kind === 'first_interaction_after_end')).toBe(true);
  expect(rw.fake.clientEvents.map((e) => e.name)).toContain('signal_played');
});

test('spec §4.1: Stop asks first; confirming ends with user_stop and the F6 copy', async ({ page, rw }) => {
  await startSession(page, 50);
  await rw.advance(7 * MIN, 30_000);
  await page.getByRole('button', { name: 'Stoppen' }).click();
  await expect(page.getByRole('dialog', { name: 'Stoppen?' })).toContainText('De minuten tot nu leveren geen punten op.');
  await page.getByRole('dialog').getByRole('button', { name: 'Doorgaan' }).click();
  await expect(page.getByRole('timer')).toBeVisible();
  await page.getByRole('button', { name: 'Stoppen' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Stoppen' }).click();
  await expect(page.getByText('Je stopte na 7 minuten. Een sessie van 25 minuten telt ook mee voor je dagdoel.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Kortere sessie' })).toBeVisible();
  expect(rw.fake.session()!.abortReason).toBe('user_stop');
});

test('arch §4.6 / §11: with navigator.webdriver overridden to false the session completes unmarked', async ({ page, rw }) => {
  await page.addInitScript(() => Object.defineProperty(Navigator.prototype, 'webdriver', { configurable: true, get: () => false }));
  await startSession(page, 25);
  await rw.advance(25 * MIN + 2000, 30_000);
  await page.mouse.click(200, 300);
  await expect(page.getByText('25 minuten. Je dagdoel is gehaald.')).toBeVisible();
  await expect(page.getByText('+25 punten bijgeschreven.')).toBeVisible();
  expect(rw.fake.session()!.flags).toEqual([]);
});
