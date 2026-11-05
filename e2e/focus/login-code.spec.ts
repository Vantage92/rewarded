// Architecture §11 "Registratie via squadlink: code uit de inbox in het codeveld" (UX §4.1 step 3):
// login with the 6-digit code, then the onboarding up to the first session.
import { expect, test } from './fixtures.ts';

test.use({ fakeOptions: { auth: 'none', squad: false } });

test('UX §4.1 / arch §10.1: log in with the code from the mail, then age, consent, daily goal and the first session', async ({ page, rw }) => {
  await page.goto('/login');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Inloggen');
  await page.getByLabel('E-mailadres').fill('mila@example.org');
  await page.getByRole('button', { name: 'Stuur link' }).click();
  await expect(page.getByRole('heading', { name: 'Check je mail' })).toBeVisible();
  const mail = rw.fake.inbox.at(-1)!;
  expect(mail.to).toBe('mila@example.org');
  // A wrong code first: plain message, no attempt counter.
  await page.getByLabel('Code van 6 cijfers').fill('000000');
  await page.getByRole('button', { name: 'Ga verder' }).click();
  await expect(page.getByText('Deze code klopt niet. Controleer de mail of vraag een nieuwe.')).toBeVisible();
  await page.getByLabel('Code van 6 cijfers').fill(mail.code);
  await page.getByRole('button', { name: 'Ga verder' }).click();
  // Logged in as `pre`: the age check (O5) follows.
  await expect(page.getByRole('heading', { name: 'Je geboortedatum' })).toBeVisible();
  await page.getByLabel('Voornaam').fill('Mila');
  await page.getByLabel('Dag').fill('14');
  await page.getByLabel('Maand').fill('3');
  await page.getByLabel('Jaar').fill('2006');
  await page.getByRole('button', { name: 'Verder' }).click();
  // O6: two separate, unticked boxes; Akkoord only with both.
  await expect(page.getByRole('heading', { name: 'Onderzoek, voorwaarden en privacy' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Akkoord' })).toBeDisabled();
  await page.getByLabel('Ik ga akkoord met de gebruiksvoorwaarden').check();
  await page.getByLabel('Ik heb de privacyverklaring gelezen').check();
  await page.getByRole('button', { name: 'Akkoord' }).click();
  // O7 with the overreach brake.
  await page.getByRole('radio', { name: '90 min' }).click();
  await page.getByRole('button', { name: 'Verder' }).click();
  await expect(page.getByRole('dialog', { name: 'Begin liever klein?' })).toBeVisible();
  await page.getByRole('button', { name: 'Kies 25 minuten' }).click();
  await expect(page.getByRole('heading', { name: 'Niet storen' })).toBeVisible();
  const onboarding = rw.fake.callsOf('me.onboarding').at(-1)!.body as Record<string, unknown>;
  expect(onboarding).toMatchObject({ first_name: 'Mila', birth_date: '2006-03-14', daily_goal_min: 25, terms_version: '0.3' });
  expect(onboarding.confirm_overreach).toBeUndefined();
  await page.getByRole('link', { name: 'Ik zet het aan' }).click();
  await expect(page.getByRole('heading', { name: 'Oefensessie' })).toBeVisible();
  await page.getByRole('button', { name: 'Overslaan' }).click();
  await expect(page.getByText('Start je eerste sessie van 25 minuten.')).toBeVisible();
});

test('spec §3.1 step 11: the practice session; leaving on purpose shows the abort labelled "Oefening"', async ({ page, rw }) => {
  rw.fake.auth = 'student';
  await page.goto('/onboarding/oefenen');
  await page.getByRole('button', { name: 'Start oefening' }).click();
  await expect(page.getByRole('timer')).toBeVisible();
  await rw.advance(20_000, 1000);
  await rw.setVisibility(page, 'hidden');
  await rw.advance(3000, 1000);
  await rw.setVisibility(page, 'visible');
  await rw.advance(3000, 1000);
  await expect(page.getByText('Oefening', { exact: true })).toBeVisible();
  await expect(page.getByText('Zo ziet een afgebroken sessie eruit. Oefenen telt nergens mee.')).toBeVisible();
  const start = rw.fake.callsOf('sessions.start')[0]!.body as { planned_min: number; practice: boolean };
  expect(start).toMatchObject({ planned_min: 1, practice: true });
  await page.getByRole('button', { name: 'Verder' }).click();
  await expect(page.getByText('Start je eerste sessie van 25 minuten.')).toBeVisible();
});
