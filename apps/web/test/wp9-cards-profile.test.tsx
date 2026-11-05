// WP-9 share card (K1, K2, rasterizer), profile (P1–P3, R1, B8) and draws not built
// (spec §3.9, §3.10, §4.8–4.10; UX §3.7, §4.7, §4.8, §6.2; architecture §9.5, §10.7).
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { mockError, type MockHandlers } from '@rewarded/contracts';
import { createMemoryRouter } from 'react-router';
import { afterEach, describe, expect, it } from 'vitest';
import { App } from '../src/app/App.tsx';
import { CardMakerScreen, statementKey } from '../src/features/cards/CardScreens.tsx';
import { absoluteUrl, canShare } from '../src/features/cards/share.ts';
import { svgDataUrl } from '../src/features/cards/rasterize.ts';
import { createWebApi } from '../src/lib/api/web.ts';
import { bodyText, makeMe, renderAt, trackedEvents, waitForCall } from './wp9/helpers.tsx';

afterEach(cleanup);

const id = (n: number) => `01JC${String(n).padStart(22, '0')}`;
const SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><text>Mila 50 min</text></svg>';

function renderMaker(path: string, opts: { squadNameOnCards?: boolean; handlers?: MockHandlers } = {}) {
  const me = makeMe({ settings: { squad_name_on_cards: opts.squadNameOnCards ?? false } });
  const api = createWebApi({ mode: 'mock', loadFeatureMocks: false, handlers: { 'me.get': () => me, 'cards.image': () => SVG, ...opts.handlers } });
  const router = createMemoryRouter([{ path: '/kaart/:id', element: <CardMakerScreen rasterize={async () => new Blob(['png'], { type: 'image/png' })} /> }], { initialEntries: [path] });
  render(<App router={router} locale="nl" api={api} />);
  return api;
}

describe('K1 Kaart maken (spec §4.8)', () => {
  it('spec §4.8: defaults are first name, duration and streak; never points; sharing earns nothing', async () => {
    const api = renderMaker(`/kaart/${id(30)}`);
    expect(await screen.findByText(/Delen levert niets op; het is gewoon leuk\./)).toBeTruthy();
    expect(screen.getByRole('switch', { name: 'Voornaam' }).getAttribute('aria-checked')).toBe('true');
    expect(screen.getByRole('switch', { name: 'Squadstreak' }).getAttribute('aria-checked')).toBe('true');
    fireEvent.click(screen.getByRole('button', { name: 'Maak kaart' }));
    expect(await screen.findByRole('img', { name: 'Voorbeeld van je kaart' })).toBeTruthy();
    expect(api.mock!.calls.find((c) => c.id === 'cards.create')?.input.body).toEqual({ kind: 'session', ref_id: id(30), fields: { first_name: true, streak: true, duration: true } });
    expect(bodyText()).not.toMatch(/\d+\s*punten|€/);
  });

  it('spec §4.8: the squad name switch is off with a reason unless the setting allows it', async () => {
    renderMaker(`/kaart/${id(30)}`);
    const sw = (await screen.findByRole('switch', { name: /Squadnaam/ })) as HTMLButtonElement;
    expect(sw.disabled).toBe(true);
    expect(screen.getByText(/alle leden moeten het toestaan/)).toBeTruthy();
  });

  it('spec §3.10 step 1: no card for a session under review', async () => {
    renderMaker(`/kaart/${id(30)}`, { handlers: { 'cards.create': () => { throw mockError('SESSION_UNDER_REVIEW'); } } });
    fireEvent.click(await screen.findByRole('button', { name: 'Maak kaart' }));
    expect(await screen.findByText('Deze sessie wordt nog nagekeken. Daarna kun je er een kaart van maken.')).toBeTruthy();
  });

  it('architecture §9.5: sharing rasterizes to PNG and opens the share sheet with a file; card_share_opened is tracked', async () => {
    const shared: ShareData[] = [];
    Object.defineProperty(navigator, 'share', { configurable: true, value: async (d: ShareData) => void shared.push(d) });
    Object.defineProperty(navigator, 'canShare', { configurable: true, value: () => true });
    try {
      const api = renderMaker(`/kaart/${id(30)}?soort=streak`);
      fireEvent.click(await screen.findByRole('button', { name: 'Maak kaart' }));
      fireEvent.click(await screen.findByRole('button', { name: 'Delen' }));
      await waitFor(() => expect(shared).toHaveLength(1));
      expect(shared[0]!.files?.[0]?.type).toBe('image/png');
      const ev = trackedEvents(api).find((e) => e.name === 'card_share_opened');
      expect(ev?.props).toMatchObject({ aanleiding: 'streak', velden_aan: ['first_name', 'streak', 'duration'] });
    } finally {
      delete (navigator as { share?: unknown }).share;
      delete (navigator as { canShare?: unknown }).canShare;
    }
  });

  it('spec §4.8 Intrekken: the student can withdraw the card', async () => {
    const api = renderMaker(`/kaart/${id(30)}`);
    fireEvent.click(await screen.findByRole('button', { name: 'Maak kaart' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Kaart intrekken' }));
    expect(await screen.findByText(/De kaart is ingetrokken/)).toBeTruthy();
    expect(api.mock!.calls.some((c) => c.id === 'cards.delete')).toBe(true);
  });

  it('share helpers: data URL for the SVG, absolute links, no share API in jsdom', () => {
    expect(svgDataUrl('<svg/>')).toBe('data:image/svg+xml;charset=utf-8,%3Csvg%2F%3E');
    expect(absoluteUrl('/i/abc')).toBe(`${location.origin}/i/abc`);
    expect(absoluteUrl('https://x.nl/i/abc')).toBe('https://x.nl/i/abc');
    expect(canShare({ text: 'x' })).toBe(false);
  });
});

describe('K2 Verificatiepagina (spec §4.8, UX §6.2)', () => {
  it('spec §4.8: says what it does not show, with date and duration and no clock times; no navigation', async () => {
    const { container } = renderAt('/v/tok_AAAAAAAAAAAAAAAAAAAAAA', {
      handlers: { 'verify.get': () => ({ first_name: 'Mila', duration_min: 50, from: '2027-01-12', to: '2027-01-12', streak: 4, statement_key: 'cards.verify.statement_session', focus_ook_url: '/wachtlijst?source=card' }) },
    });
    const statement = await screen.findByTestId('verify-statement');
    expect(statement.textContent).toBe('Deze sessie van 50 minuten op dinsdag 12 januari stond zichtbaar op het scherm van één browser. Dat bewijst niet dat er geen ander apparaat gebruikt is en ook niet wat er geleerd is.');
    expect(statement.textContent).not.toMatch(/\d{2}:\d{2}/);
    expect(screen.getByRole('link', { name: 'Focus ook' }).getAttribute('href')).toBe('/wachtlijst?source=card');
    expect(screen.queryByRole('navigation')).toBeNull();
    expect(document.head.querySelector('meta[name="robots"]')?.getAttribute('content')).toBe('noindex');
    expect(container.textContent).not.toMatch(/punt|€/i);
  });

  it('spec §4.8: a withdrawn or rejected card is "niet meer beschikbaar"', async () => {
    renderAt('/v/tok_AAAAAAAAAAAAAAAAAAAAAA', { handlers: { 'verify.get': () => { throw mockError('CARD_UNAVAILABLE'); } } });
    expect(await screen.findByText('Deze kaart is niet meer beschikbaar.')).toBeTruthy();
  });

  it('maps API statement keys to the cards namespace with a generic fallback', () => {
    expect(statementKey('cards.verify.statement_week')).toBe('cards:verify.statement_week');
    expect(statementKey('cards.verify.unknown_kind')).toBe('cards:verify.statement');
  });
});

describe('P1 Ik (spec §4.10)', () => {
  it('spec §4.10: opt-in switches start as stored and patch one setting at a time', async () => {
    const { api } = renderAt('/profiel', { me: { flags: { no_points_mode: true } } });
    const compare = await screen.findByRole('switch', { name: /^Minuten vergelijken/ });
    expect(compare.getAttribute('aria-checked')).toBe('false');
    fireEvent.click(compare);
    await waitFor(() => expect(api.mock!.calls.find((c) => c.id === 'me.settings')?.input.body).toEqual({ compare_opt_in: true }));
    expect(screen.getByRole('switch', { name: /^Modus zonder punten/ })).toBeTruthy();
  });

  it('spec §4.10: the mode without points is only offered with its flag', async () => {
    renderAt('/profiel', { me: { flags: { no_points_mode: false } } });
    await screen.findByRole('switch', { name: /^Stille modus/ });
    expect(screen.queryByRole('switch', { name: /^Modus zonder punten/ })).toBeNull();
  });

  it('spec §4.10 Afmelden voor het onderzoek: separate, with a confirmation, without loss of points', async () => {
    const { api } = renderAt('/profiel', { handlers: { 'me.researchOptOut': () => ({ opted_out_at: '2026-12-02T09:00:00.000Z', effective_from_day: '2026-12-03' }) } });
    fireEvent.click(await screen.findByRole('switch', { name: /^Meedoen aan het onderzoek/ }));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText(/Je punten blijven staan\. Opnieuw aanmelden kan tijdens de pilot niet\./)).toBeTruthy();
    expect(api.mock!.calls.some((c) => c.id === 'me.researchOptOut')).toBe(false);
    fireEvent.click(within(dialog).getByRole('button', { name: 'Afmelden' }));
    expect(await screen.findByText('Je doet niet meer mee aan het onderzoek. Je punten blijven staan.')).toBeTruthy();
  });

  it('spec §4.10 Instellingsmail: the fingerprint copy, and INSTITUTION_EMAIL_IN_USE sends to Help', async () => {
    renderAt('/profiel', { handlers: { 'institution.start': () => { throw mockError('INSTITUTION_EMAIL_IN_USE'); } } });
    expect((await screen.findByTestId('fingerprint')).textContent).toContain('versleutelde vingerafdruk van het adres');
    fireEvent.change(screen.getByLabelText(/Mailadres van je instelling/), { target: { value: 'm.devries@students.uu.nl' } });
    fireEvent.click(screen.getByRole('button', { name: 'Stuur code' }));
    expect(await screen.findByText(/Dit adres is al door een ander account bevestigd/)).toBeTruthy();
  });

  it('spec §4.4 Overmoedrem: 90 or 120 in the first week asks "Begin liever klein" first', async () => {
    const { api } = renderAt('/profiel', { me: { user: { created_at: new Date().toISOString() } } });
    fireEvent.click(await screen.findByRole('radio', { name: '120' }));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText(/Begin liever klein/)).toBeTruthy();
    fireEvent.click(within(dialog).getByRole('button', { name: 'Ja, 120 minuten' }));
    await waitFor(() => expect(api.mock!.calls.find((c) => c.id === 'me.dailyGoal')?.input.body).toEqual({ minutes: 120, confirm_overreach: true }));
    expect(await screen.findByText(/Je dagdoel wordt 50 minuten vanaf/)).toBeTruthy();
  });

  it('UX §3.7 P1: referral and Plus links only with their flags', async () => {
    renderAt('/profiel', { me: { flags: { referral: false, plus_door: false } } });
    await screen.findByRole('link', { name: 'Privacy en gegevens' });
    expect(screen.queryByRole('link', { name: 'Je persoonlijke link' })).toBeNull();
    expect(screen.queryByRole('link', { name: 'Plus komt eraan' })).toBeNull();
  });
});

describe('P2 Privacy, P3 voorwaarden, R1, B8 (architecture §10.7, spec §4.9)', () => {
  it('architecture §10.7: delete needs VERWIJDER and warns that points lapse', async () => {
    const { api } = renderAt('/profiel/privacy');
    fireEvent.click(await screen.findByRole('button', { name: 'Verwijder account' }));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText(/Je punten vervallen/)).toBeTruthy();
    fireEvent.click(within(dialog).getByRole('button', { name: 'Verwijder mijn account' }));
    expect(api.mock!.calls.some((c) => c.id === 'privacy.deleteMe')).toBe(false);
    fireEvent.change(within(dialog).getByLabelText('Typ VERWIJDER'), { target: { value: 'VERWIJDER' } });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Verwijder mijn account' }));
    expect(await screen.findByText('Je account is verwijderd.')).toBeTruthy();
    expect(api.mock!.calls.find((c) => c.id === 'privacy.deleteMe')?.input.body).toEqual({ confirm: 'VERWIJDER' });
  });

  it('architecture §10.7: export downloads one JSON file', async () => {
    const urls: string[] = [];
    const original = URL.createObjectURL;
    URL.createObjectURL = () => (urls.push('blob:x'), 'blob:x');
    URL.revokeObjectURL = () => undefined;
    try {
      renderAt('/profiel/privacy', { handlers: { 'privacy.export': () => ({ format: 'rewarded-export-v1', generated_at: '2026-12-02T09:00:00.000Z', modules: {} }) } });
      fireEvent.click(await screen.findByRole('button', { name: 'Download je gegevens' }));
      expect(await screen.findByText('Je gegevens staan in een bestand.')).toBeTruthy();
      expect(urls).toHaveLength(1);
    } finally {
      URL.createObjectURL = original;
    }
  });

  it('spec §4.9: the personal link explains vesting without "nodig uit en verdien" and shows progress', async () => {
    renderAt('/profiel/link', {
      me: { flags: { referral: true } },
      handlers: { 'referral.mine': () => ({ link: '/i/tok_RRRRRRRRRRRRRRRRRRRRRR', pending: [{ first_name: 'Joris', sessions_done: 2, deadline: new Date(Date.now() + 3 * 86_400_000 - 60_000).toISOString() }] }) },
    });
    expect(await screen.findByText('Joris: 2 van 3 sessies, nog 3 dagen')).toBeTruthy();
    expect(bodyText()).toMatch(/Delen zelf levert niets op\./);
    expect(bodyText()).not.toMatch(/nodig uit en verdien/i);
  });

  it('UX §3.6 B8: Plus is the only place with a euro amount, and only with its flag', async () => {
    const { api } = renderAt('/profiel/plus', { me: { flags: { plus_door: true } } });
    expect(await screen.findByText('Plus komt eraan, €2,99 per maand. Wil je bericht als het zover is?')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Laat het me weten' }));
    await waitFor(() => expect(api.mock!.calls.some((c) => c.id === 'me.plusInterest')).toBe(true));
  });

  it('P3: all terms on one page', async () => {
    renderAt('/profiel/voorwaarden');
    expect(await screen.findByText(/1 punt per minuut van een voltooide sessie die telde/)).toBeTruthy();
    expect(bodyText()).not.toMatch(/verloot|kans/i);
  });
});

describe('Draws are not built (product plan §0c.3, spec §3.9, UX §4.7)', () => {
  it.each(['16_17', '18_plus'] as const)('UX principle P10: for %s nothing about draws is in the DOM, also not on /kans', async (age_band) => {
    renderAt('/kans', { me: { age_band, flags: { draws: false } } });
    expect(await screen.findByRole('heading', { level: 1 })).toBeTruthy();
    expect(bodyText()).not.toMatch(/trekking|verloot|\bkans\b|draw|lottery/i);
  });

  it.each(['/punten', '/squad', '/vereniging', '/profiel', '/belofte'])('UX principle P10: 16_17 sees no draws or chance copy on %s', async (path) => {
    const { api } = renderAt(path, { me: { age_band: '16_17' } });
    await waitForCall(api, 'me.get');
    await waitFor(() => expect(document.querySelector('.wp9-skeleton')).toBeNull());
    expect(bodyText()).not.toMatch(/trekking|verloot|\bkans\b|draw|lottery/i);
  });
});
