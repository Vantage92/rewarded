// WP-10 board dashboard (spec §4.6 Bestuursdashboard, UX §3.8, §4.5, architecture §6.4): aggregates
// only, suppression under 5, the verification level next to every figure, no names, lists or times.
import { cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react';
import axe from 'axe-core';
import { afterEach, describe, expect, it } from 'vitest';
import { mockError } from '@rewarded/contracts/mock';
import { boardDashboard } from '../src/features/board/mock.ts';
import { mockId } from '../src/features/admin/mock.ts';
import { renderAdmin } from './wp10/helpers.tsx';

afterEach(cleanup);

const CLUB = mockId(100);
const LEVEL = 'Niveau 1: Rewarded zichtbaar op het scherm van één browser';

const violations = async () => {
  const result = await axe.run(document.body, { rules: { 'color-contrast': { enabled: false } }, resultTypes: ['violations'] });
  return result.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical').map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`);
};

describe('WP-10 board dashboard', () => {
  it('spec §4.6, UX §3.8: five tabs, the permanent privacy line and the standing headline', async () => {
    renderAdmin(`/bestuur/${CLUB}`);
    expect((await screen.findByRole('heading', { level: 1 })).textContent).toBe('Bestuur');
    expect(screen.getByText('Je ziet groepscijfers. Wie wat doet, zie je niet, en wij ook niet zonder reden.')).toBeTruthy();
    expect(await screen.findByText('Plaats 2 in de poule 150–500 leden · deelnamegraad 21%')).toBeTruthy();
    const tabs = within(screen.getByRole('navigation', { name: 'Tabbladen van het dashboard' }));
    expect(tabs.getAllByRole('link').map((l) => l.textContent)).toEqual(['Stand', 'Werving', 'Promotiekit', 'Prijs', 'Kwaliteit']);
    expect(tabs.getByRole('link', { name: 'Stand' }).getAttribute('aria-current')).toBe('page');
    expect(screen.getByText('Focustijd die telde (Rewarded zichtbaar op het scherm)')).toBeTruthy();
    expect(screen.getByText('Voorlopig')).toBeTruthy();
  });

  it('spec §4.6 (founder J3): every figure carries the verification level', async () => {
    renderAdmin(`/bestuur/${CLUB}/stand`);
    await screen.findByText('Positie in de poule');
    const figures = document.querySelectorAll('.brd-figure');
    expect(figures.length).toBeGreaterThan(2);
    for (const f of figures) expect(f.textContent).toContain(LEVEL);
  });

  it('spec §4.6 Minimum, UX §3.8 D1: the standing appears only from 15 linked members', async () => {
    renderAdmin(`/bestuur/${CLUB}`, {
      handlers: { 'board.dashboard': () => ({ ...boardDashboard('stand'), rank: { value: null, suppressed: true } }) as never },
    });
    expect((await screen.findAllByText('Jullie stand verschijnt vanaf 15 gekoppelde leden.')).length).toBeGreaterThan(0);
  });

  it('arch §6.4, UX §3.8 D2: recruitment is weekly, rounded to fives, and small groups are suppressed', async () => {
    renderAdmin(`/bestuur/${CLUB}/werving`);
    expect(await screen.findByText(/afgerond op vijftallen en per week/)).toBeTruthy();
    expect(screen.getByText('Koppelingen per QR-bron')).toBeTruthy();
    // pending_admin and one QR source are suppressed in the mock.
    expect(screen.getAllByText('Te klein om te tonen, of minder dan 5 veranderd').length).toBeGreaterThanOrEqual(2);
    for (const w of ['2026-W45', '2026-W46', '2026-W47']) expect(screen.getAllByText(w).length).toBeGreaterThan(0);
  });

  it('spec §4.6: the dashboard shows no names, member refs, clock times or export', async () => {
    renderAdmin(`/bestuur/${CLUB}/werving`);
    await screen.findByText('Koppelingen per QR-bron');
    const text = document.body.textContent ?? '';
    expect(text).not.toMatch(/user_|Mila|Daan|\b\d{1,2}:\d{2}\b/);
    expect(screen.queryByRole('button', { name: /export/i })).toBeNull();
  });

  it('spec §4.6 Promotiekit, UX §3.8 D3: downloads per QR source send promo_kit_downloaded; no amounts', async () => {
    const { api } = renderAdmin(`/bestuur/${CLUB}/promotiekit`);
    const poster = await screen.findByRole('link', { name: 'Download Poster voor poster_bieb' });
    expect(poster.getAttribute('href')).toBe('/promo/poster-bieb.pdf');
    fireEvent.click(poster);
    await waitFor(() => expect(api.mock!.calls.some((c) => c.id === 'events.track')).toBe(true));
    const track = api.mock!.calls.find((c) => c.id === 'events.track')!;
    expect(track.input.body).toEqual({ name: 'promo_kit_downloaded', props: { vereniging_id: CLUB, asset: 'poster' } });
    expect(screen.getByText('Wat je wel en niet belooft')).toBeTruthy();
    expect(document.body.textContent).not.toMatch(/€|\bEUR\b/);
  });

  it('UX §3.8 D4: without a prize budget the challenge runs for the honour', async () => {
    renderAdmin(`/bestuur/${CLUB}/prijs`, {
      handlers: { 'board.dashboard': (i) => (i.query.tab === 'prijs' ? { tab: 'prijs', prize_eligible: false, threshold_rate: null, anchored_members: { value: null, suppressed: true }, is_final: false } : boardDashboard('stand')) },
    });
    expect(await screen.findByText('Er is (nog) geen prijs; de challenge loopt om de eer.')).toBeTruthy();
  });

  it('spec §4.6 Kwaliteit: flagged sessions with the explanation that they count only after release', async () => {
    renderAdmin(`/bestuur/${CLUB}/kwaliteit`);
    expect(await screen.findByText('Gemarkeerde sessies tellen pas mee nadat een mens ze heeft vrijgegeven.')).toBeTruthy();
    expect(screen.getByText('Getrokken, nog niet beoordeeld')).toBeTruthy();
  });

  it('arch §8.2: a non-board account sees no figures (FORBIDDEN)', async () => {
    renderAdmin(`/bestuur/${CLUB}`, { handlers: { 'board.dashboard': () => { throw mockError('FORBIDDEN'); } } });
    expect(await screen.findByText('Dit dashboard is alleen voor het bestuur van deze vereniging.')).toBeTruthy();
    expect(screen.queryByRole('navigation', { name: 'Tabbladen van het dashboard' })).toBeNull();
  });

  it('UX §5.8: board and admin screens have no serious or critical axe violations', async () => {
    renderAdmin(`/bestuur/${CLUB}`);
    await screen.findByText('Positie in de poule');
    expect(await violations()).toEqual([]);
    cleanup();
    renderAdmin('/beheer/wachtrij');
    await screen.findByRole('heading', { level: 3, name: /^H1 · / });
    expect(await violations()).toEqual([]);
    cleanup();
    renderAdmin('/beheer/catalogus');
    await screen.findByRole('form', { name: 'Item aanmaken' });
    expect(await violations()).toEqual([]);
  });

  it('language: the board dashboard works in English', async () => {
    renderAdmin(`/bestuur/${CLUB}`, { locale: 'en' });
    expect((await screen.findByRole('heading', { level: 1 })).textContent).toBe('Board');
    expect(await screen.findByText('Focus time that counted (Rewarded visible on screen)')).toBeTruthy();
  });
});
