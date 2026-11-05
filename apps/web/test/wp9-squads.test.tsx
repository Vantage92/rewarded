// WP-9 Squad tab: Q1, Q2, Q3, Q7 and the name report (spec §3.5, §4.4; UX §3.4, §4.4, §6.2).
import { cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react';
import { mockError, type SquadMineResponse } from '@rewarded/contracts';
import { afterEach, describe, expect, it } from 'vitest';
import { belofteWeek, squadDayNeeded, weekStart } from '../src/features/squads/SquadScreen.tsx';
import { bodyText, renderAt, trackedEvents } from './wp9/helpers.tsx';

afterEach(cleanup);

const id = (n: number) => `01JC${String(n).padStart(22, '0')}`;
const squad = { id: id(10), name: 'Bieb Brigade', name_status: 'ok' as const, club_id: null, status: 'active' as const, is_admin: true, created_at: '2026-12-01T09:00:00.000Z' };
const mine = (o: Partial<SquadMineResponse> = {}): SquadMineResponse => ({
  squad,
  members: [
    { first_name: 'Mila', paused: false, goal_met_today: true },
    { first_name: 'Sem', paused: false, goal_met_today: true },
    { first_name: 'Daan', paused: false, goal_met_today: false },
    { first_name: 'Noor', paused: true, goal_met_today: false },
  ],
  streak: 6,
  status: 'active',
  ...o,
});
const today = { focus_day: '2026-12-02', counted_min: 0, goal_min: 50 as const, goal_met: false, goal_days_this_week: 1, exam_day: false, joker_available: true, bonus_rule: 'A' as const, earn_arm: 'earn' as const, streak: 6 };

describe('Q1 Squad-overzicht (spec §4.4, UX §3.4)', () => {
  it('UX §3.1 Leeg: without a squad, one sentence and one action', async () => {
    renderAt('/squad', { handlers: { 'squads.mine': () => { throw mockError('NOT_IN_SQUAD'); } } });
    expect(await screen.findByText('Nog geen squad. Squads houden het beter vol.')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Squad maken' }).getAttribute('href')).toBe('/squad/nieuw');
  });

  it('spec §4.4: streak, squad day on active members (half rounded up, min. 2), paused apart, joker line', async () => {
    renderAt('/squad', { handlers: { 'squads.mine': () => mine(), 'me.today': () => today } });
    expect((await screen.findByTestId('streak')).textContent).toBe('6 dagen');
    expect(await screen.findByText(/Vandaag: 2 van 3 actieve leden haalden hun dagdoel\. De squaddag is geslaagd\./)).toBeTruthy();
    expect(screen.getByRole('list', { name: 'Leden op pauze' }).textContent).toContain('Noor staat op pauze');
    expect(within(screen.getByRole('list', { name: 'Squadleden' })).queryByText('Noor')).toBeNull();
    expect(screen.getByText('Joker deze week: nog over.')).toBeTruthy();
  });

  it('spec §4.4: in opbouw (1–2 members) there is no streak, only "Nog x vrienden nodig"', async () => {
    renderAt('/squad', { handlers: { 'squads.mine': () => mine({ status: 'building', streak: 0, members: [{ first_name: 'Mila', paused: false, goal_met_today: false }] }) } });
    expect(await screen.findByText('Nog 2 vrienden nodig. Je focust intussen gewoon.')).toBeTruthy();
    expect(screen.queryByTestId('streak')).toBeNull();
  });

  it('spec §4.4: under 3 active members because of pauses the streak freezes', async () => {
    const members = [
      { first_name: 'Mila', paused: false, goal_met_today: true },
      { first_name: 'Sem', paused: false, goal_met_today: false },
      { first_name: 'Noor', paused: true, goal_met_today: false },
    ];
    renderAt('/squad', { handlers: { 'squads.mine': () => mine({ members }) } });
    expect(await screen.findByText('Jullie zijn met minder dan 3 actieve leden. De streak staat stil tot er weer 3 zijn.')).toBeTruthy();
  });

  it('spec §4.4 Streakherstel: "Pak je streak terug met twee dagen op rij" with the old length', async () => {
    renderAt('/squad', { handlers: { 'squads.mine': () => mine({ streak: 0 }), 'me.today': () => ({ ...today, streak: 0, recovery: { until_day: '2026-12-04', streak_before_break: 12 } }) } });
    expect(await screen.findByText(/Pak je streak terug met twee dagen op rij\. Lukt dat, dan staat de streak weer op 12 dagen\./)).toBeTruthy();
  });

  it('spec §4.4 Live aanwezigheid: counts who focuses now without names or minutes, polls, tracks presence_viewed', async () => {
    const { api } = renderAt('/squad', {
      handlers: {
        'squads.mine': () => mine(),
        'squads.presence': () => ({ members: [{ member_ref: 'mref-0001', focusing: true, remaining_min: 32 }, { member_ref: 'mref-0002', focusing: false }], polled_at: '2026-12-02T10:00:00.000Z' }),
      },
    });
    expect(await screen.findByText('1 van 3 focussen nu')).toBeTruthy();
    expect(screen.getByText('Iemand focust nu (nog 32 minuten)')).toBeTruthy();
    await waitFor(() => expect(trackedEvents(api).find((e) => e.name === 'presence_viewed')?.props).toEqual({ leden_live: 1 }));
  });

  it('spec §4.4 Minuten vergelijken: off by default, no minutes of others in the DOM', async () => {
    const { api } = renderAt('/squad', { handlers: { 'squads.mine': () => mine() } });
    expect(await screen.findByText(/Minuten vergelijken staat uit/)).toBeTruthy();
    expect(api.mock!.calls.some((c) => c.id === 'squads.compare')).toBe(false);
    expect(bodyText()).not.toMatch(/\d+ min, deze week/);
  });

  it('spec §4.4 Minuten vergelijken: with the opt-in only members who opted in too', async () => {
    renderAt('/squad', { me: { settings: { compare_opt_in: true } }, handlers: { 'squads.mine': () => mine(), 'squads.compare': () => ({ members: [{ first_name: 'Sem', minutes_today: 50, minutes_week: 240 }] }) } });
    expect(await screen.findByText('Sem: vandaag 50 min, deze week 240 min')).toBeTruthy();
  });

  it('spec §3.12 step 3: witnesses see a member\'s Belofte per day, without minutes or points (Q7)', async () => {
    const { api } = renderAt('/squad', {
      handlers: {
        'squads.mine': () => mine(),
        'me.today': () => today,
        'squads.beloftes': () => ({
          items: [{ first_name: 'Sem', days_per_week: 5, min_per_day: 50, start_day: '2026-11-30', end_day: '2026-12-13', status: 'active', days: [{ day: '2026-11-30', met: true }, { day: '2026-12-01', met: false }, { day: '2026-12-02', met: true }] }],
        }),
      },
    });
    const line = await screen.findByRole('button', { name: 'Bekijk de Belofte van Sem' });
    expect(line.textContent).toBe('Sem — Belofte: 2 van 5 dagen deze week.');
    fireEvent.click(line);
    const sheet = await screen.findByRole('dialog');
    expect(within(sheet).getByText('Sem beloofde 5 dagen per week 50 minuten, tot 13 december.')).toBeTruthy();
    expect(within(sheet).queryByText(/punt/i)).toBeNull();
    await waitFor(() => expect(trackedEvents(api).some((e) => e.name === 'belofte_witness_viewed')).toBe(true));
  });

  it('UX §3.4 Q7: a stopped Belofte shows no day of failure and no judgement', async () => {
    renderAt('/squad', {
      handlers: { 'squads.mine': () => mine(), 'me.today': () => today, 'squads.beloftes': () => ({ items: [{ first_name: 'Mila', days_per_week: 4, min_per_day: 25, start_day: '2026-11-30', end_day: '2026-12-13', status: 'stopped', days: [] }] }) },
    });
    expect((await screen.findByRole('button', { name: 'Bekijk de Belofte van Mila' })).textContent).toBe('Mila heeft de Belofte gestopt.');
  });

  it('spec §3.5 step 5: "Naam melden" reports the squad name', async () => {
    const { api } = renderAt('/squad', { handlers: { 'squads.mine': () => mine(), 'squads.nameReport': () => ({ flag_id: id(51) }) } });
    fireEvent.click(await screen.findByRole('button', { name: 'Naam melden' }));
    fireEvent.click(screen.getByLabelText('Bevat persoonsgegevens'));
    fireEvent.click(screen.getByRole('button', { name: 'Meld deze naam' }));
    expect(await screen.findByText('Dank je. We kijken naar de naam.')).toBeTruthy();
    expect(api.mock!.calls.find((c) => c.id === 'squads.nameReport')?.input.body).toEqual({ reason: 'personal_data' });
  });
});

describe('Q3 Uitnodigen (spec §3.5 step 2)', () => {
  it('spec §3.5 step 2: the suggested text mentions no points or prizes; without Web Share only copying', async () => {
    const { api } = renderAt('/squad', { handlers: { 'squads.mine': () => mine({ members: mine().members.slice(0, 3) }) } });
    fireEvent.click(await screen.findByRole('button', { name: 'Nodig uit' }));
    const text = await screen.findByTestId('invite-text');
    expect(text.textContent).not.toMatch(/punt|prijs|beloning|€|verdien|\bpoints?\b|\bprizes?\b|\brewards?\b/i);
    expect(text.textContent).toContain('/i/');
    expect(screen.queryByRole('button', { name: 'Deel via WhatsApp' })).toBeNull();
    expect(screen.getByText(/Kopieer de link en plak hem in WhatsApp/)).toBeTruthy();
    expect(screen.getByText('Deze link is 7 dagen geldig, voor hoogstens 5 vrienden.')).toBeTruthy();
    expect(api.mock!.calls.some((c) => c.id === 'squads.invite')).toBe(true);
  });

  it('UX §4.4: with Web Share the share sheet opens and invite_share_opened is tracked', async () => {
    const shared: ShareData[] = [];
    Object.defineProperty(navigator, 'share', { configurable: true, value: async (d: ShareData) => void shared.push(d) });
    try {
      const { api } = renderAt('/squad', { handlers: { 'squads.mine': () => mine() } });
      fireEvent.click(await screen.findByRole('button', { name: 'Nodig uit' }));
      fireEvent.click(await screen.findByRole('button', { name: 'Deel via WhatsApp' }));
      await waitFor(() => expect(shared).toHaveLength(1));
      expect(shared[0]!.text).not.toMatch(/punt|prijs/i);
      expect(trackedEvents(api).find((e) => e.name === 'invite_share_opened')?.props['kanaal']).toBe('systeem');
    } finally {
      delete (navigator as { share?: unknown }).share;
    }
  });

  it('UX §3.4 Q3: with six members the invite button is not there', async () => {
    const six = Array.from({ length: 6 }, (_, i) => ({ first_name: `Lid${i}`, paused: false, goal_met_today: false }));
    renderAt('/squad', { handlers: { 'squads.mine': () => mine({ members: six }) } });
    await screen.findByTestId('streak');
    expect(screen.queryByRole('button', { name: 'Nodig uit' })).toBeNull();
  });
});

describe('Q2 Squad maken (spec §3.5 step 1)', () => {
  it('UX §4.4: the visibility rule sits above the button; then the invite sheet opens', async () => {
    const { api } = renderAt('/squad/nieuw', { me: { squad: null } });
    const rule = await screen.findByTestId('visibility-rule');
    const button = screen.getByRole('button', { name: 'Maak squad' });
    expect(rule.compareDocumentPosition(button) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    fireEvent.change(screen.getByLabelText(/Naam van je squad/), { target: { value: 'Bieb Brigade' } });
    fireEvent.click(button);
    expect(await screen.findByTestId('invite-text')).toBeTruthy();
    expect(api.mock!.calls.find((c) => c.id === 'squads.create')?.input.idempotencyKey).toBeTruthy();
  });

  it('spec §4.4 Squadnaam: a rejected name asks for another', async () => {
    renderAt('/squad/nieuw', { me: { squad: null }, handlers: { 'squads.create': () => { throw mockError('NAME_REJECTED'); } } });
    fireEvent.change(await screen.findByLabelText(/Naam van je squad/), { target: { value: 'Rot op' } });
    fireEvent.click(screen.getByRole('button', { name: 'Maak squad' }));
    expect(await screen.findByText('Kies een andere naam.')).toBeTruthy();
  });
});

describe('squad rules on the client (spec §4.4)', () => {
  it('a squad day needs half of the active members, rounded up, at least 2', () => {
    expect([3, 4, 5, 6].map(squadDayNeeded)).toEqual([2, 2, 3, 3]);
  });
  it('counts Belofte days of the current ISO week only', () => {
    expect(weekStart('2026-12-02')).toBe('2026-11-30');
    expect(belofteWeek([{ day: '2026-11-29', met: true }, { day: '2026-11-30', met: true }, { day: '2026-12-02', met: true }], '2026-12-02')).toBe(2);
  });
});
