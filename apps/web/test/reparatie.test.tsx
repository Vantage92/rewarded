// Repair wave (web, docs/build/REPARATIE.md): Bonusregel on F1 (UX §6.2), the F1 squad denominator
// (spec §4.4), Meldingen with an appeal (spec §6.4, §6.5), the blocked screen, the /c/:code link of
// the promo kit, one-click unsubscribe, the consent links and the bonus stop date (UX §6.2 O6).
import { cleanup, configure, fireEvent, screen, waitFor } from '@testing-library/react';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { responseExamples, type TodayResponse } from '@rewarded/contracts';
import { setBirthDate, updateDraft } from '../src/features/onboarding/draft.ts';
import { tokenFromHash } from '../src/features/unsubscribe/UnsubscribePage.tsx';
import { bodyText, calledIds, renderAt } from './wp9/helpers.tsx';

// F1 hides the Bonusregel during the night rule (01:00–04:00): the tests run at noon.
beforeAll(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-12-02T11:00:00.000Z'));
});
afterAll(() => vi.useRealTimers());

// The whole app renders on the mock client; the first screen can take over a second in jsdom.
configure({ asyncUtilTimeout: 5000 });

afterEach(() => {
  cleanup();
  window.location.hash = '';
});

const today = (o: Partial<TodayResponse>): TodayResponse => ({ ...(responseExamples['me.today'] as TodayResponse), ...o });
const squad = { id: '01JSQAD0000000000000000001', name: 'Bieb Brigade', status: 'active' as const };

describe('UX §6.2 Bonusregel op F1 (reparatie)', () => {
  it('§6.2 arm A: the gain line with "Waarom zie ik dit?" under the start button', async () => {
    renderAt('/', { handlers: { 'me.today': () => today({ bonus_rule: 'A' }) } });
    expect(await screen.findByText(/Dagdoel halen vandaag: \+20 bonus\./)).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Waarom zie ik dit?' }).getAttribute('href')).toBe('/punten/bonusregel');
  });

  it('§6.2 arm B: the weekly budget with what is left; nothing in the mode without points or outside the season', async () => {
    renderAt('/', { handlers: { 'me.today': () => today({ bonus_rule: 'B', week_budget: { remaining: 100, per_day: 20, first_day_of_week: false } }) } });
    expect(await screen.findByText(/Weekbudget: nog 100\. Je dagdoel halen zet er vandaag 20 veilig\./)).toBeTruthy();
    cleanup();
    renderAt('/', { handlers: { 'me.today': () => today({ bonus_rule: 'none' }) } });
    await screen.findByText(/Deze week: 2 van de 7 dagen/);
    expect(bodyText()).not.toContain('Waarom zie ik dit?');
    cleanup();
    renderAt('/', { me: { settings: { no_points_mode: true } }, handlers: { 'me.today': () => today({ bonus_rule: 'A' }) } });
    await screen.findByText(/Deze week: 2 van de 7 dagen/);
    await waitFor(() => expect(bodyText()).not.toContain('+20 bonus'));
  }, 30_000);

  it('§4.4 the F1 denominator is the active_count of the squad, not the length of the presence list', async () => {
    renderAt('/', {
      me: { squad },
      handlers: {
        'squads.presence': () => ({ members: [{ member_ref: 'ref_aaaaaaaa', focusing: true }], polled_at: '2026-12-02T09:00:00.000Z', active_count: 4 }),
      },
    });
    expect(await screen.findByText('1 van 4 focussen nu')).toBeTruthy();
  });
});

describe('spec §6.4/§6.5 Meldingen en beroep in Ik (reparatie)', () => {
  it('§6.5 a rejected session shows its reason in plain language and an appeal can be sent', async () => {
    const r = renderAt('/profiel', {
      handlers: {
        'appeals.mine': () => ({ items: [{ flag_id: '01JFXAG0000000000000000001', kind: 'review', status: 'rejected', reason_code: 'automation', decided_at: '2026-12-01T10:00:00.000Z', appeal_until: '2026-12-15T10:00:00.000Z', appeal: null }] }),
        'appeals.create': () => ({ appeal_id: '01JAPPEA00000000000000001X' }),
      },
    });
    expect(await screen.findByText(/Deze sessie liep in een browser die door software werd bestuurd/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Beroep instellen' }));
    fireEvent.change(await screen.findByLabelText('Jouw uitleg'), { target: { value: 'Ik gebruikte gewoon Chrome.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Verstuur beroep' }));
    await waitFor(() => expect(calledIds(r.api)).toContain('appeals.create'));
    const call = r.api.mock!.calls.find((c) => c.id === 'appeals.create')!;
    expect(call.input.body).toEqual({ object_type: 'flag', object_id: '01JFXAG0000000000000000001', text: 'Ik gebruikte gewoon Chrome.' });
    expect(screen.getByRole('button', { name: 'Uitloggen' })).toBeTruthy();
  });

  it('§6.5 a blocked account lands on the blocked screen with the block decision and [Beroep instellen]', async () => {
    renderAt('/', {
      me: { user: { blocked: true } },
      handlers: {
        'appeals.mine': () => ({ items: [{ flag_id: '01JFXAG0000000000000000002', kind: 'block', status: 'blocked', reason_code: 'fraud_confirmed', decided_at: '2026-12-01T10:00:00.000Z', appeal_until: '2026-12-15T10:00:00.000Z', appeal: null }] }),
      },
    });
    expect(await screen.findByRole('heading', { level: 1, name: 'Je account is geblokkeerd' })).toBeTruthy();
    expect(await screen.findByRole('button', { name: 'Beroep instellen' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Naar privacy en gegevens' })).toBeTruthy();
  });
});

describe('spec §3.7 de link uit de promokit /c/:code (reparatie)', () => {
  it('§3.7 with an account /c/:code opens V2 with the code and the source', async () => {
    const r = renderAt('/c/KOMPAS?bron=poster');
    await waitFor(() => expect(r.router.state.location.pathname).toBe('/vereniging/koppelen'));
    expect(r.router.state.location.search).toBe('?code=KOMPAS&bron=poster');
    expect(bodyText()).not.toMatch(/werkpakket|WP-\d/);
  });
});

describe('UX §4.9 uitschrijven met één klik (reparatie)', () => {
  it('§4.9 /herinneringen/uit posts the token from the hash and confirms', async () => {
    window.location.hash = '#t=abcdefghijklmnopqrstuvwx';
    const r = renderAt('/herinneringen/uit', { handlers: { 'reminders.unsubscribe': () => undefined } });
    expect(await screen.findByText(/Je krijgt geen herinneringsmails meer/)).toBeTruthy();
    expect(r.api.mock!.calls.find((c) => c.id === 'reminders.unsubscribe')?.input.body).toEqual({ token: 'abcdefghijklmnopqrstuvwx' });
    expect(tokenFromHash('#x=1')).toBeNull();
  });

  it('§4.9 /afmelden does the same for the waiting list, in English too', async () => {
    window.location.hash = '#t=abcdefghijklmnopqrstuvwx';
    renderAt('/afmelden', { locale: 'en', handlers: { 'waitlist.unsubscribe': () => undefined } });
    expect(await screen.findByText(/You are no longer on the waiting list/)).toBeTruthy();
  });
});

describe('UX §6.2 O6 akkoord met links en de datum van de bonusstop (reparatie)', () => {
  it('§6.2 both checkboxes have a link to the documents and the pilot text names the date', async () => {
    updateDraft({ inviteToken: null });
    setBirthDate('2004-05-05');
    renderAt('/onboarding/akkoord');
    expect((await screen.findByRole('link', { name: /voorwaarden/i })).getAttribute('href')).toBe('/profiel/voorwaarden');
    expect(screen.getByRole('link', { name: /privacyverklaring/i }).getAttribute('href')).toBe('/profiel/privacy');
    expect(bodyText()).toMatch(/De doelbonus stopt aan het einde van de laatste tentamenweek van je instelling, op \d+ januari 2027\./);
  });
});
