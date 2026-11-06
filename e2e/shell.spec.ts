import { expect, test } from './support/fixtures.ts';

test('the app shell loads and reaches the worker API (architecture §11, §9.4)', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('banner')).toHaveText('Rewarded');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Vandaag');
  await expect(page.getByRole('navigation', { name: 'Hoofdmenu' })).toBeVisible();

  const health = await page.evaluate(async () => (await fetch('/api/v1/health')).json());
  expect(health).toMatchObject({ status: 'ok', db: 'better-sqlite3' });
});
