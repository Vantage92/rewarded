// Architecture §11: "Herladen tijdens sessie" (§4.4 Herladen): beforeunload dialog; after the reload
// the abort explanation with code hidden.
import { expect, MIN, startSession, test } from './fixtures.ts';

test('arch §4.4: reloading during a session asks first, then shows the abort with code hidden', async ({ page, rw }) => {
  await startSession(page, 25);
  await rw.advance(4 * MIN, 30_000);
  let dialogType = '';
  page.once('dialog', (d) => {
    dialogType = d.type();
    void d.accept();
  });
  // A real user gesture first: Chromium only shows beforeunload after interaction.
  await page.mouse.click(10, 10);
  await page.reload();
  expect(dialogType).toBe('beforeunload');
  await rw.advance(5000, 1000);
  await expect(page.getByText(/omdat Rewarded niet meer op je scherm stond\. Je hield 4 minuten vol\./)).toBeVisible();
  const s = rw.fake.session()!;
  expect(s.status).toBe('aborted');
  expect(s.abortReason).toBe('hidden');
  expect(s.events.some((e) => e.kind === 'pagehide' || e.kind === 'hidden')).toBe(true);
});
