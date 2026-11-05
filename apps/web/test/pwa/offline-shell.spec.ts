// Architecture §9.4: the service worker is registered and active, and the app shell reloads with
// context.setOffline(true). UX §5.8: axe (with colour contrast) on the shell in light and dark.
import { expect, test, type Page } from '@playwright/test';
import { createRequire } from 'node:module';

const axePath = createRequire(import.meta.url).resolve('axe-core/axe.min.js');

async function swReady(page: Page) {
  await page.goto('/');
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller) await new Promise((r) => navigator.serviceWorker.addEventListener('controllerchange', r, { once: true }));
  });
}

test('architecture §9.4: manifest is linked and served with the required fields', async ({ page, request }) => {
  await page.goto('/');
  const href = await page.locator('link[rel="manifest"]').getAttribute('href');
  const res = await request.get(href!);
  expect(res.ok()).toBe(true);
  expect(await res.json()).toMatchObject({ name: 'Rewarded', start_url: '/?bron=pwa', display: 'standalone' });
});

test('architecture §9.4: the service worker is registered, active and controls the page', async ({ page }) => {
  await swReady(page);
  const state = await page.evaluate(async () => {
    const reg = await navigator.serviceWorker.getRegistration();
    return { active: reg?.active?.state, scope: reg?.scope, controlled: Boolean(navigator.serviceWorker.controller) };
  });
  expect(state).toMatchObject({ active: 'activated', controlled: true });
  expect(new URL(state.scope!).pathname).toBe('/');
});

test('architecture §9.4: the app shell reloads offline, deep links included, with the offline strip', async ({ page, context }) => {
  await swReady(page);
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('banner')).toHaveText('Rewarded');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Vandaag');
  await expect(page.getByRole('navigation', { name: 'Hoofdmenu' })).toBeVisible();
  await expect(page.getByText('Geen verbinding. Wat de server nodig heeft, staat even uit.')).toBeVisible();

  await page.goto('/vereniging/ranglijst');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Vereniging');
  await page.getByRole('link', { name: 'Squad' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Squad');
  await context.setOffline(false);
});

test('architecture §9.4: /api/* is never answered from a cache', async ({ page, context }) => {
  await swReady(page);
  await context.setOffline(true);
  const result = await page.evaluate(async () => {
    try {
      const res = await fetch('/api/v1/health');
      return `status ${res.status}`;
    } catch {
      return 'network error';
    }
  });
  expect(result).toBe('network error');
  const cached = await page.evaluate(async () => {
    const urls: string[] = [];
    for (const name of await caches.keys()) for (const req of await (await caches.open(name)).keys()) urls.push(new URL(req.url).pathname);
    return urls;
  });
  expect(cached.some((u) => u.startsWith('/api/'))).toBe(false);
  expect(cached).toContain('/index.html');
  await context.setOffline(false);
});

async function seriousViolations(page: Page) {
  await page.addScriptTag({ path: axePath });
  return page.evaluate(async () => {
    const axe = (window as unknown as { axe: { run(ctx: Document, opts: object): Promise<{ violations: { id: string; impact: string | null; nodes: { target: string[] }[] }[] }> } }).axe;
    const r = await axe.run(document, { resultTypes: ['violations'] });
    return r.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical').map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`);
  });
}

for (const colorScheme of ['light', 'dark'] as const) {
  for (const [label, viewport] of [
    ['phone', { width: 412, height: 915 }],
    ['laptop', { width: 1280, height: 800 }],
  ] as const) {
    test(`UX §5.8: axe has no serious violations on the shell (${colorScheme}, ${label})`, async ({ page }) => {
      await page.emulateMedia({ colorScheme });
      await page.setViewportSize(viewport);
      for (const path of ['/', '/squad', '/punten', '/login', '/bestaat-niet']) {
        await page.goto(path);
        await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
        expect(await seriousViolations(page), path).toEqual([]);
      }
    });
  }
}

test('UX §2.2: bottom tab bar on the phone, 232 px sidebar from 960 px; tabs are at least 48 px', async ({ page }) => {
  await page.setViewportSize({ width: 412, height: 915 });
  await page.goto('/');
  const nav = page.getByRole('navigation', { name: 'Hoofdmenu' });
  const phone = (await nav.boundingBox())!;
  expect(phone.y + phone.height).toBeGreaterThanOrEqual(915 - 1);
  expect(phone.height).toBeGreaterThanOrEqual(64);
  for (const link of await nav.getByRole('link').all()) {
    const box = (await link.boundingBox())!;
    expect(box.height).toBeGreaterThanOrEqual(48);
    expect(box.width).toBeGreaterThanOrEqual(48);
  }
  await page.setViewportSize({ width: 1280, height: 800 });
  const laptop = (await nav.boundingBox())!;
  expect(laptop.x).toBe(0);
  expect(laptop.width).toBe(232);
  const main = (await page.locator('main').boundingBox())!;
  expect(main.width).toBeLessThanOrEqual(720);
  expect(main.x).toBeGreaterThanOrEqual(232);
});

test('UX §5.2: a manual dark choice is applied before the first paint and survives a reload', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('/');
  await page.evaluate(() => localStorage.setItem('rw_theme', 'dark'));
  await page.reload();
  expect(await page.evaluate(() => document.documentElement.dataset.theme)).toBe('dark');
  const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  expect(bg).toBe('rgb(14, 17, 20)');
});
