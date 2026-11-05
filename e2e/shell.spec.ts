import { expect, test } from '@playwright/test';

test('the app shell loads and reaches the API through the dev proxy', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('banner')).toHaveText('Rewarded');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Vandaag');
  await expect(page.getByRole('navigation', { name: 'Hoofdmenu' })).toBeVisible();

  const health = await page.request.get('/api/v1/health');
  expect(health.ok()).toBe(true);
  expect(await health.json()).toMatchObject({ status: 'ok', db: 'better-sqlite3' });
});
