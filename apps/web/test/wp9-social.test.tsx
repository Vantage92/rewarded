// WP-9 duels, club, performance challenge and the Belofte (spec §3.6–3.8, §3.12, §4.5–4.7, §4.12;
// UX §3.4 Q4–Q6, §3.5, §4.5, §4.10, §6.2).
import { cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react';
import { mockError, type ChallengeListItem, type CurrentBelofteResponse } from '@rewarded/contracts';
import { afterEach, describe, expect, it } from 'vitest';
import { pickClubChallenge } from '../src/features/club/ClubScreen.tsx';
import { bodyText, renderAt, trackedEvents } from './wp9/helpers.tsx';

afterEach(cleanup);

const id = (n: number) => `01JC${String(n).padStart(22, '0')}`;

describe('Q4 Duel (spec §3.6, §4.5)', () => {
  it('UX principle P10: for 16_17 no duel link exists in the DOM, only the squad route', async () => {
    renderAt('/duel', { me: { age_band: '16_17' }, handlers: { 'duels.current': () => { throw mockError('NOT_FOUND'); } } });
    expect(await screen.findByText(/Een duel doe je met iemand uit je squad/)).toBeTruthy();
    expect(screen.queryByRole('button', { name: /duellink/i })).toBeNull();
    expect(bodyText()).not.toMatch(/\/i\//);
  });

  it('spec §4.5: an 18_plus student creates a duel link; the text puts no points at stake', async () => {
    renderAt('/duel', {
      handlers: {
        'duels.current': () => { throw mockError('NOT_FOUND'); },
        'duels.create': () => ({
          duel: { id: id(90), status: 'open', in_squad: false, start_day: null, end_day: null, opponent_first_name: null },
          invite: { id: id(21), token: 'tok_DDDDDDDDDDDDDDDDDDDDDD', url: '/i/tok_DDDDDDDDDDDDDDDDDDDDDD', source: 'duel', max_uses: 1, uses: 0, expires_at: '2026-12-04T09:00:00.000Z' },
        }),
      },
    });
    fireEvent.click(await screen.findByRole('button', { name: 'Maak een duellink' }));
    const sheet = await screen.findByRole('dialog');
    expect(within(sheet).getByText(/Er staan geen punten op het spel\./)).toBeTruthy();
    expect(within(sheet).getByText('Deze link is 48 uur geldig, voor één persoon.')).toBeTruthy();
  });

  it('spec §4.5: a running duel shows met days and totals, never minutes', async () => {
    renderAt('/duel', {
      handlers: {
        'duels.current': () => ({
          duel: { id: id(90), status: 'running', in_squad: true, start_day: '2026-12-07', end_day: '2026-12-13', opponent_first_name: 'Sem' },
          days: [{ day: '2026-12-07', me_met: true, opponent_met: false }, { day: '2026-12-08', me_met: true, opponent_met: true }],
          me_total: 2,
          opponent_total: 1,
        }),
      },
    });
    expect((await screen.findByTestId('duel-totals')).textContent).toBe('Jij 2, Sem 1');
    expect(screen.getByRole('list', { name: 'Dagen van Sem' }).children).toHaveLength(2);
    expect(bodyText()).not.toMatch(/\d+\s?min/);
  });

  it('UX §3.4 Q4: pending review says the result follows; a won duel keeps the badge private', async () => {
    const duel = { id: id(90), status: 'finished' as const, in_squad: true, start_day: '2026-12-07', end_day: '2026-12-13', opponent_first_name: 'Daan' };
    renderAt('/duel', { handlers: { 'duels.current': () => ({ duel, days: [], me_total: 4, opponent_total: 3, result: 'won' }) } });
    expect(await screen.findByText('Duel gewonnen van Daan. De badge is van jou.')).toBeTruthy();
    expect(screen.getByText('Alleen jij ziet je badges.')).toBeTruthy();
  });
});

describe('V1/V2 Vereniging (spec §3.7, §4.6)', () => {
  it('UX §3.5 V1: without a club, an empty card with "Code invoeren"', async () => {
    renderAt('/vereniging', { me: { club: null } });
    expect((await screen.findByRole('link', { name: 'Code invoeren' })).getAttribute('href')).toBe('/vereniging/koppelen');
  });

  it('spec §4.6: the ranking shows only clubs, with member count and source, rate and intensity; own club marked', async () => {
    renderAt('/vereniging', {
      me: { club: { id: id(100), name: 'SV Delta', status: 'linked' } },
      handlers: {
        'leaderboards.get': () => ({
          pools: [
            {
              pool: '150_500',
              rows: [
                { club_name: 'SV Delta', declared_members: 312, members_source_kind: 'institution', prize_eligible: true, participation_rate: 0.31, intensity_min: 42.4, rank: 1 },
                { club_name: 'SV Epsilon', declared_members: 180, members_source_kind: 'self', prize_eligible: false, participation_rate: 0.18, intensity_min: 38, rank: 2 },
              ],
            },
          ],
          is_final: false,
          computed_at: '2026-12-02T03:00:00.000Z',
        }),
      },
    });
    expect(await screen.findByText(/312 leden · opgave aan de instelling/)).toBeTruthy();
    expect(screen.getByText('Deelnamegraad 31%')).toBeTruthy();
    expect(screen.getByText('Doet mee om de eer, niet om de hoofdprijs.')).toBeTruthy();
    expect(screen.getAllByText('Voorlopig').length).toBeGreaterThan(0);
    const own = screen.getByText('SV Delta', { selector: 'strong' }).closest('li')!;
    expect(own.getAttribute('aria-current')).toBe('true');
    expect(screen.getByText('Aanloopklassement: zonder prijs, om de eer.')).toBeTruthy();
  });

  it('UX principle P6: no person and no totals on the ranking', async () => {
    renderAt('/vereniging', { me: { club: { id: id(100), name: 'SV Delta', status: 'linked' } } });
    await screen.findByText(/leden ·/);
    expect(bodyText()).not.toMatch(/Mila|totaal|total/i);
  });

  it('spec §4.6 Identiteitsanker: without an anchor the student is asked to confirm the institution email', async () => {
    renderAt('/vereniging', { me: { club: { id: id(100), name: 'SV Delta', status: 'linked' }, user: { phone_verified: false, institution_domain: null } } });
    expect((await screen.findByRole('link', { name: 'Bevestig je instellingsmail' })).getAttribute('href')).toBe('/profiel#instellingsmail');
  });

  it('spec §3.7 step 3, UX V2: linking with a code, and a pending link above the code cap', async () => {
    const { api } = renderAt('/vereniging/koppelen?code=delta2026&bron=poster', {
      me: { club: null },
      handlers: { 'clubs.join': () => ({ club: { id: id(100), name: 'SV Delta', city: 'Utrecht', declared_members: 420, members_source_kind: 'institution', prize_eligible: true, pool: '150_500' }, status: 'pending_admin' }) },
    });
    expect(await screen.findByText('Je vereniging ziet alleen groepscijfers, nooit jouw uren.')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Koppel' }));
    expect(await screen.findByText('Je koppeling wordt even nagekeken.')).toBeTruthy();
    expect(api.mock!.calls.find((c) => c.id === 'clubs.join')?.input.body).toEqual({ code: 'DELTA2026', qr_source: 'poster' });
  });

  it('spec §4.6: an unknown code gets a calm message', async () => {
    renderAt('/vereniging/koppelen', { me: { club: null }, handlers: { 'clubs.join': () => { throw mockError('CODE_INVALID'); } } });
    fireEvent.change(await screen.findByLabelText(/Verenigingscode/), { target: { value: 'ABCD' } });
    fireEvent.click(screen.getByRole('button', { name: 'Koppel' }));
    expect(await screen.findByText('Deze code kennen we niet. Kijk hem even na.')).toBeTruthy();
  });

  it('spec §4.6: the prize period wins over the warm-up ranking', () => {
    const c = (n: number, type: ChallengeListItem['type'], start: string, end: string): ChallengeListItem => ({ id: id(n), type, title: 't', period: { start_day: start, end_day: end }, prize: null });
    const items = [c(1, 'club_warmup', '2026-12-02', '2026-12-20'), c(2, 'club_prize', '2027-01-04', '2027-01-17'), c(3, 'performance', '2027-01-11', '2027-01-17')];
    expect(pickClubChallenge(items, '2026-12-10')?.id).toBe(id(1));
    expect(pickClubChallenge(items, '2027-01-10')?.id).toBe(id(2));
  });
});

describe('V3 Prestatiechallenge (spec §3.8, §4.7)', () => {
  const challenge: ChallengeListItem = {
    id: id(111),
    type: 'performance',
    title: 'Elke dag 120 minuten',
    period: { start_day: '2027-01-11', end_day: '2027-01-17' },
    seats_left: 12,
    prize: { kind: 'earned_individual', description: 'Een boekenbon', value_cents: 1000 },
  };

  it('spec §4.7 Taal: "Verdiend", fixed places, no euro value and no chance language', async () => {
    renderAt(`/challenges/${challenge.id}`, { handlers: { 'challenges.list': () => ({ items: [challenge] }), 'challenges.progress': () => { throw mockError('NOT_ENROLLED'); } } });
    expect(await screen.findByRole('heading', { level: 1, name: 'Elke dag 120 minuten' })).toBeTruthy();
    expect(screen.getByText('Verdiend. Winnaars controleren we vóór uitreiking.')).toBeTruthy();
    expect(screen.getByText('Nog 12 plaatsen')).toBeTruthy();
    expect(bodyText()).not.toMatch(/€|10,00|kans|verloot|\bwin\b/i);
  });

  it('spec §3.8 step 2: enrolling before the start, with an idempotency key', async () => {
    const { api } = renderAt(`/challenges/${challenge.id}`, {
      handlers: {
        'challenges.list': () => ({ items: [challenge] }),
        'challenges.progress': () => { throw mockError('NOT_ENROLLED'); },
        'challenges.enroll': () => ({ enrollment: { id: id(150), challenge_id: challenge.id, status: 'enrolled', enrolled_at: '2026-12-02T09:00:00.000Z' }, seat_no: 9 }),
      },
    });
    fireEvent.click(await screen.findByRole('button', { name: 'Schrijf je in' }));
    expect(await screen.findByText('Je doet mee. Je hebt plaats 9.')).toBeTruthy();
    expect(api.mock!.calls.find((c) => c.id === 'challenges.enroll')?.input.idempotencyKey).toBeTruthy();
  });

  it('UX §3.5 V3: all places taken disables enrolling with the reason', async () => {
    renderAt(`/challenges/${challenge.id}`, { handlers: { 'challenges.list': () => ({ items: [{ ...challenge, seats_left: 0 }] }), 'challenges.progress': () => { throw mockError('NOT_ENROLLED'); } } });
    const b = (await screen.findByRole('button', { name: 'Schrijf je in' })) as HTMLButtonElement;
    expect(b.disabled).toBe(true);
    expect(screen.getAllByText('Alle plaatsen zijn vergeven.').length).toBeGreaterThan(0);
  });

  it('spec §3.8 step 3: progress per day and the status', async () => {
    renderAt(`/challenges/${challenge.id}`, {
      handlers: { 'challenges.list': () => ({ items: [challenge] }), 'challenges.progress': () => ({ days: [{ day: '2027-01-11', minutes: 130, met: true }], status: 'achieved' }) },
    });
    expect(await screen.findByText('Behaald. We controleren nu, daarna volgt de levering.')).toBeTruthy();
    expect(screen.getByText('gehaald')).toBeTruthy();
  });
});

describe('De Belofte (spec §3.12, §4.12)', () => {
  const belofte = { id: id(140), days_per_week: 6, min_per_day: 50 as const, witnesses: 'squad' as const, start_day: '2026-12-03', end_day: '2026-12-16' };
  const current = (status: 'active' | 'completed', met = 9): CurrentBelofteResponse => ({
    belofte: { ...belofte, status },
    days: Array.from({ length: 12 }, (_, i) => ({ day: `2026-12-${String(3 + i).padStart(2, '0')}`, minutes: 50, met: i < met })),
  });

  it('spec §4.12: the offer is prefilled with the suggestion, says what witnesses see and that no points are attached', async () => {
    const { api } = renderAt('/belofte', {
      handlers: { 'beloftes.current': () => { throw mockError('NOT_FOUND'); }, 'belofte.offer': () => ({ offer: { suggested_days: 4, suggested_min: 50, trigger: 'early' } }) },
    });
    expect(await screen.findByText(/Wil je jezelf iets beloven voor de komende twee weken\?/)).toBeTruthy();
    expect(screen.getByRole('radio', { name: '4' }).getAttribute('aria-checked')).toBe('true');
    expect(screen.getByRole('radio', { name: '50' }).getAttribute('aria-checked')).toBe('true');
    expect(screen.getByText('Je squad ziet je Belofte en per dag of je hem haalde. Je minuten en punten zien ze niet.')).toBeTruthy();
    expect(screen.getByText('Er hangen geen punten aan.')).toBeTruthy();
    await waitFor(() => expect(trackedEvents(api).find((e) => e.name === 'belofte_offered')?.props).toEqual({ trigger: 'vroeg', squadstatus: 'active' }));
    fireEvent.click(screen.getByRole('radio', { name: '5' }));
    fireEvent.click(screen.getByRole('button', { name: 'Beloof het' }));
    await waitFor(() => expect(api.mock!.calls.find((c) => c.id === 'beloftes.create')?.input.body).toEqual({ days_per_week: 5, min_per_day: 50, witnesses: 'squad' }));
  });

  it('spec §4.12 Keuzes: without a squad there are no witnesses', async () => {
    const { api } = renderAt('/belofte', {
      me: { squad: null },
      handlers: { 'beloftes.current': () => { throw mockError('NOT_FOUND'); }, 'belofte.offer': () => ({ offer: { suggested_days: 3, suggested_min: 25, trigger: 'late' } }) },
    });
    expect(await screen.findByText('Zonder squad heeft je Belofte geen getuigen.')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Beloof het' }));
    await waitFor(() => expect(api.mock!.calls.find((c) => c.id === 'beloftes.create')?.input.body).toMatchObject({ witnesses: 'none' }));
  });

  it('spec §4.12: before the own offer no Belofte can be started', async () => {
    renderAt('/belofte', { handlers: { 'beloftes.current': () => { throw mockError('NOT_FOUND'); } } });
    expect(await screen.findByText(/Er staat nu geen Belofte voor je klaar/)).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Beloof het' })).toBeNull();
  });

  it('spec §4.12 Stoppen: one tap, no confirmation, no guilt', async () => {
    const { api } = renderAt('/belofte', { handlers: { 'beloftes.current': () => current('active', 2), 'beloftes.stop': () => ({ status: 'stopped' }) } });
    fireEvent.click(await screen.findByRole('button', { name: 'Stop je Belofte' }));
    expect(await screen.findByText('Belofte gestopt. Je squad ziet alleen dat hij gestopt is.')).toBeTruthy();
    expect(api.mock!.calls.filter((c) => c.id === 'beloftes.stop')).toHaveLength(1);
  });

  it('spec §3.12 steps 4–5: reflection "9 van 12 dagen" with the stake question for 18_plus only', async () => {
    const { api } = renderAt('/belofte', { handlers: { 'beloftes.current': () => current('completed'), 'beloftes.reflection': () => ({}) } });
    expect(await screen.findByText('Je haalde je Belofte op 9 van 12 dagen.')).toBeTruthy();
    expect(await screen.findByTestId('stake-question')).toBeTruthy();
    fireEvent.click(screen.getByRole('radio', { name: 'Weet ik niet' }));
    fireEvent.click(screen.getByRole('button', { name: 'Nog twee weken?' }));
    expect(await screen.findByText('Je Belofte loopt nog twee weken.')).toBeTruthy();
    expect(api.mock!.calls.find((c) => c.id === 'beloftes.reflection')?.input.body).toEqual({ action: 'extend', stake_interest: 'unsure' });
  });

  it('spec §3.12 step 5: 16_17 gets no stake question', async () => {
    renderAt('/belofte', { me: { age_band: '16_17' }, handlers: { 'beloftes.current': () => current('completed') } });
    await screen.findByText('Je haalde je Belofte op 9 van 12 dagen.');
    expect(screen.queryByTestId('stake-question')).toBeNull();
    expect(bodyText()).not.toMatch(/goed doel|bedrag/);
  });
});
