// Architecture §11: "Netwerk 3 minuten offline" and "Netwerk 6 minuten offline" (spec §4.1 Heartbeatgaten).
import { expect, MIN, startSession, test } from './fixtures.ts';

test('spec §4.1: 3 minutes offline with a visible page; the buffered log covers the gap; completed, marked H3', async ({ page, rw }) => {
  await page.addInitScript(() => Object.defineProperty(Navigator.prototype, 'webdriver', { configurable: true, get: () => false }));
  await startSession(page, 25);
  await rw.advance(5 * MIN, 30_000);
  await rw.setOffline(true);
  await rw.advance(60_000, 1000);
  await expect(page.getByText('Geen verbinding', { exact: true })).toBeVisible();
  await rw.advance(60_000, 1000);
  // After 90 s without contact the calm line appears (UX §3.1).
  await expect(page.getByText(/Blijf op dit scherm\. Is de verbinding langer dan 5 minuten weg/)).toBeVisible();
  await rw.advance(60_000, 1000);
  await rw.setOffline(false);
  await rw.advance(17 * MIN + 5000, 10_000);
  await page.mouse.click(200, 300);
  await expect(page.getByText('25 minuten. Je dagdoel is gehaald.')).toBeVisible();
  // 3 of 25 minutes covered by the log is more than 10%: H3, points under review (spec §6.3).
  await expect(page.getByText(/Deze sessie wordt nagekeken\./)).toBeVisible();
  const s = rw.fake.session()!;
  expect(s.status).toBe('completed');
  expect(s.flags).toEqual(['H3']);
  expect(s.heartbeats.filter((h) => h.kind === 'buffered').length).toBeGreaterThanOrEqual(4);
});

test('spec §4.1: 6 minutes offline; the client shows the abort at once, the server says heartbeat_gap', async ({ page, rw }) => {
  await startSession(page, 25);
  await rw.advance(5 * MIN, 30_000);
  await rw.setOffline(true);
  await rw.advance(5 * MIN + 20_000, 2000);
  // Still offline: the local explanation, marked as not yet confirmed.
  await expect(page.getByText(/omdat we langer dan toegestaan geen signaal van je toestel kregen/)).toBeVisible();
  await expect(page.getByText(/We wachten nog op de bevestiging van de server/)).toBeVisible();
  // heartbeat_gap: "Klopt dit niet?" is a secondary button (UX F6).
  await expect(page.getByRole('button', { name: 'Klopt dit niet?' })).toHaveClass(/btn-secondary/);
  await rw.advance(40_000, 2000);
  await rw.setOffline(false);
  await rw.advance(15_000, 1000);
  await expect(page.getByText(/We wachten nog op de bevestiging/)).toHaveCount(0);
  const s = rw.fake.session()!;
  expect(s.status).toBe('aborted');
  expect(s.abortReason).toBe('heartbeat_gap');
});
