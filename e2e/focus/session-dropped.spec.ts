// Architecture §4.7 E2E: the server processes a request and the answer is thrown away
// (route.abort('connectionreset') after processing), on start, on two heartbeats, on end and on stop.
import { expect, MIN, startSession, test } from './fixtures.ts';

test('arch §4.7: answer to POST /sessions dropped; the repeat with the same key gives the same session', async ({ page, rw }) => {
  rw.dropNext('sessions.start', 1);
  await page.goto('/focus?duur=25');
  await page.getByRole('button', { name: 'Begin' }).click();
  await rw.advance(3000, 500);
  await expect(page.getByRole('timer')).toBeVisible();
  const starts = rw.fake.callsOf('sessions.start');
  expect(starts).toHaveLength(2);
  expect(starts[0]!.idempotencyKey).toBe(starts[1]!.idempotencyKey);
  expect(rw.fake.sessions).toHaveLength(1);
});

test('arch §4.7: answers to two heartbeats in a row dropped; no NONCE_INVALID, no heartbeat_gap, completed', async ({ page, rw }) => {
  await startSession(page, 25);
  await rw.advance(2 * MIN, 30_000);
  rw.dropNext('sessions.heartbeat', 2);
  await rw.advance(23 * MIN + 3000, 5000);
  await page.mouse.click(200, 300);
  await expect(page.getByText('25 minuten. Je dagdoel is gehaald.')).toBeVisible();
  const s = rw.fake.session()!;
  expect(s.status).toBe('completed');
  const bodies = rw.fake.callsOf('sessions.heartbeat').map((c) => c.body as { seq: number; nonce: string });
  const repeated = bodies.filter((b, i) => i > 0 && b.seq === bodies[i - 1]!.seq);
  expect(repeated.length).toBeGreaterThanOrEqual(1);
});

test('arch §4.7: answer to /end dropped; the repeat gets the stored verdict, one session', async ({ page, rw }) => {
  await startSession(page, 25);
  rw.dropNext('sessions.end', 1);
  await rw.advance(25 * MIN, 30_000);
  // The repeat follows the backoff (1 s) after the lost answer.
  await rw.advance(10_000, 1000);
  await page.mouse.click(200, 300);
  await expect(page.getByText('25 minuten. Je dagdoel is gehaald.')).toBeVisible();
  expect(rw.fake.callsOf('sessions.end')).toHaveLength(2);
  expect(rw.fake.sessions).toHaveLength(1);
});

test('arch §4.7: answer to /stop dropped; the repeat gets the stored verdict', async ({ page, rw }) => {
  await startSession(page, 25);
  await rw.advance(3 * MIN, 30_000);
  rw.dropNext('sessions.stop', 1);
  await page.getByRole('button', { name: 'Stoppen' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Stoppen' }).click();
  await rw.advance(3000, 500);
  await expect(page.getByText(/Je stopte na 3 minuten\./)).toBeVisible();
  expect(rw.fake.callsOf('sessions.stop')).toHaveLength(2);
  expect(rw.fake.session()!.abortReason).toBe('user_stop');
});
