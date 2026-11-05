// Architecture §11: "Dezelfde sessie, na 12 minuten setVisibility('hidden')" (spec §3.3, §4.1).
import { expect, MIN, startSession, test } from './fixtures.ts';

test('spec §3.3: hidden after 12 minutes aborts with code hidden, "Je hield 12 minuten vol", 0 points', async ({ page, rw }) => {
  await startSession(page, 25);
  await rw.advance(12 * MIN, 30_000);
  await rw.setVisibility(page, 'hidden');
  await rw.advance(20_000, 1000);
  await rw.setVisibility(page, 'visible');
  await rw.advance(5000, 1000);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Je sessie stopte om 10:12.');
  await expect(page.getByText(/omdat Rewarded niet meer op je scherm stond\. Je hield 12 minuten vol\./)).toBeVisible();
  await expect(page.getByText(/Je squadstreak loopt nog\./)).toBeVisible();
  const s = rw.fake.session()!;
  expect(s.status).toBe('aborted');
  expect(s.abortReason).toBe('hidden');
  expect(s.verifiedMin).toBe(0);
  expect(rw.fake.clientEvents.find((e) => e.name === 'return_after_abort')?.props).toMatchObject({ hidden_duur_s: 20 });
  // "Klopt dit niet?" for hidden is a text link and explains it cannot be undone (UX §4.3).
  await page.getByRole('button', { name: 'Klopt dit niet?' }).click();
  await expect(page.getByRole('dialog')).toContainText('kunnen we niet terugdraaien');
});

test('spec §4.1: the fake Wake Lock released while visible shows the warning and is asked again', async ({ page, rw }) => {
  await startSession(page, 25);
  await page.evaluate(() => (globalThis as unknown as { __rwTest: { wakeLock: { release(): void } } }).__rwTest.wakeLock.release());
  await expect(page.getByRole('button', { name: 'Je scherm kan uitgaan. Tik om aan te houden.' })).toBeVisible();
  await rw.advance(10_000, 1000);
  await expect(page.getByText('Scherm blijft aan')).toBeVisible();
  const states = rw.fake.clientEvents.filter((e) => e.name === 'wakelock_state').map((e) => (e.props as { status: string }).status);
  expect(states).toEqual(['acquired', 'released', 'acquired']);
});
