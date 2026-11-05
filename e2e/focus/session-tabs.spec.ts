// Architecture §11: "Tweede tabblad op hetzelfde toestel" (§4.4 Dubbele tabs): Web Locks pick one owner.
import { expect, MIN, startSession, test } from './fixtures.ts';

test('arch §4.4: a second tab shows "Je sessie loopt in een ander tabblad" and starts nothing', async ({ page, rw }) => {
  await startSession(page, 25);
  const second = await rw.openPage();
  await second.goto('/focus?duur=25');
  await expect(second.getByText('Je sessie loopt in een ander tabblad.')).toBeVisible();
  await expect(second.getByRole('button', { name: 'Begin' })).toHaveCount(0);
  await second.goto('/');
  await expect(second.getByRole('button', { name: 'Start focussessie' })).toBeDisabled();
  await rw.advance(2 * MIN, 30_000);
  expect(rw.fake.callsOf('sessions.start')).toHaveLength(1);
  // The first tab keeps running.
  await expect(page.getByRole('timer')).toBeVisible();
  expect(rw.fake.session()!.status).toBe('active');
});
