// The core session scenarios of WP-8 (e2e/focus, against a protocol fake) once more in the browser
// against the real API of the worker, with POST /dev/clock moving with the page clock (integration
// wave; architecture §11 "Sessie van 25 minuten met klok vooruit", §4.1, §4.7).
import { expect, test } from '../support/fixtures.ts';
import { advance, pausedClock, studentInBrowser, visit } from '../support/browser.ts';
import { Chain, MIN, local } from '../support/steps.ts';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    (globalThis as unknown as { __RW_TEST__: boolean }).__RW_TEST__ = true;
  });
});

test('Echte API: sessie van 50 minuten, stoppen met bevestiging na 7 minuten geeft user_stop en de F6-tekst (arch §11, spec §4.1)', async ({ page, api }) => {
  const c = new Chain(api);
  await c.at(local('2026-12-08', '10:00'));
  const s = await c.student({ firstName: 'Daan' });
  await pausedClock(page, api);
  await studentInBrowser(page, s.actor);
  await visit(page, '/focus?duur=50');
  await page.getByRole('button', { name: 'Begin' }).click();
  await expect(page.getByRole('timer')).toBeVisible();
  await advance(page, api, 7 * MIN);
  await page.getByRole('button', { name: 'Stoppen' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Stoppen' }).click();
  await advance(page, api, 1_000, 500);
  await expect(page.getByText('Je stopte na 7 minuten. Een sessie van 25 minuten telt ook mee voor je dagdoel.')).toBeVisible();
  const row = api.sql<{ status: string; abort_reason: string }>("SELECT status, abort_reason FROM focus_session WHERE user_id = (SELECT id FROM user WHERE email = ?) AND is_practice = 0", [s.email])[0];
  expect(row).toEqual({ status: 'aborted', abort_reason: 'user_stop' });
});

test('Echte API: herladen tijdens een sessie hervat op hetzelfde toestel; heartbeats na de hervatting tellen als contact (arch §4.7, fix seq_offset)', async ({ page, api }) => {
  const c = new Chain(api);
  await c.at(local('2026-12-08', '14:00'));
  const s = await c.student({ firstName: 'Fleur' });
  await pausedClock(page, api);
  await studentInBrowser(page, s.actor);
  await visit(page, '/focus?duur=25');
  await page.getByRole('button', { name: 'Begin' }).click();
  await expect(page.getByRole('timer')).toBeVisible();
  await advance(page, api, 3 * MIN);
  const sid = api.sql<{ id: string }>("SELECT id FROM focus_session WHERE status = 'active'")[0]!.id;
  const before = api.sql<{ n: number }>("SELECT count(*) AS n FROM session_heartbeat WHERE session_id = ? AND kind = 'online'", [sid])[0]!.n;
  expect(before).toBeGreaterThanOrEqual(5);
  // Resume through the API on the same device, the way the store does after a reload (POST /sessions).
  const dev = api.sql<{ device_id: string }>('SELECT device_id FROM focus_session WHERE id = ?', [sid])[0]!.device_id;
  const resumed = await s.actor.api.call('sessions.start', { body: { planned_min: 25, device_id: dev, practice: false, client_ts: await api.now(), mono_ms: 200_000, webdriver: false, standalone: false }, idempotencyKey: 'e2e-resume-key-0001' });
  expect(resumed.resumed).toBe(true);
  let nonce = resumed.nonce;
  for (let seq = 1; seq <= 4; seq++) {
    await api.setClock((await api.now()) + 30_000);
    nonce = (await s.actor.api.call('sessions.heartbeat', { params: { id: sid }, body: { nonce, seq, mono_ms: 200_000 + seq * 30_000, client_ts: await api.now(), visibility: 'visible', wakelock: 'acquired', events: [] } })).nonce;
  }
  const after = api.sql<{ n: number }>("SELECT count(*) AS n FROM session_heartbeat WHERE session_id = ? AND kind = 'online'", [sid])[0]!.n;
  expect(after).toBe(before + 4);
});

test('Echte API: na 12 minuten verborgen breekt de sessie af met code hidden, 0 punten (arch §11, spec §3.3)', async ({ page, api }) => {
  const c = new Chain(api);
  await c.at(local('2026-12-08', '16:00'));
  const s = await c.student({ firstName: 'Iris' });
  await pausedClock(page, api);
  await studentInBrowser(page, s.actor);
  await visit(page, '/focus?duur=25');
  await page.getByRole('button', { name: 'Begin' }).click();
  await expect(page.getByRole('timer')).toBeVisible();
  await advance(page, api, 12 * MIN);
  await page.waitForFunction(() => Boolean((globalThis as unknown as { __rwTest?: unknown }).__rwTest));
  await page.evaluate(() => (globalThis as unknown as { __rwTest: { setVisibility(x: string): void } }).__rwTest.setVisibility('hidden'));
  await advance(page, api, 20_000, 1_000);
  await page.evaluate(() => (globalThis as unknown as { __rwTest: { setVisibility(x: string): void } }).__rwTest.setVisibility('visible'));
  await advance(page, api, 5_000, 1_000);
  await expect(page.getByText(/Je hield 12 minuten vol\./)).toBeVisible();
  const row = api.sql<{ status: string; abort_reason: string; verified_min: number }>("SELECT status, abort_reason, verified_min FROM focus_session WHERE user_id = (SELECT id FROM user WHERE email = ?) AND is_practice = 0", [s.email])[0];
  expect(row).toEqual({ status: 'aborted', abort_reason: 'hidden', verified_min: 0 });
});
