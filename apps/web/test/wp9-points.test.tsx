// WP-9 Beloningen: B1–B4 and B7 (spec §3.4, §4.3; UX §3.6, §4.6, §6.2).
import { cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react';
import { mockError, type BalanceResponse, type CatalogResponse } from '@rewarded/contracts';
import { afterEach, describe, expect, it } from 'vitest';
import { nextMonthStart, redeemGate, sortCatalog } from '../src/features/points/redeem.ts';
import { bodyText, renderAt, trackedEvents } from './wp9/helpers.tsx';

afterEach(cleanup);

const id = (n: number) => `01JC${String(n).padStart(22, '0')}`;
const balance = (o: Partial<BalanceResponse> = {}): BalanceResponse => ({ available: 640, pending: 60, referral_unvested: 0, earn_in_min: 340, earn_in_required: 300, ...o });
const catalog: CatalogResponse = {
  week: { week: '2026-W49', released: 40, eligible_users: 120 },
  items: [
    { id: id(601), kind: 'service', collective: false, title: 'Workshop plannen', partner: 'Decanaat', points_price: 300, stock_today: 0, next_release: '2026-12-03T03:00:00.000Z', terms: 'Online.' },
    { id: id(602), kind: 'in_kind', collective: true, title: 'Ontbijt voor je squad', partner: 'SV Delta', points_price: 600, stock_today: 2, terms: 'Bij de bar.' },
  ],
};
const todayB = { focus_day: '2026-12-02', counted_min: 0, goal_min: 50 as const, goal_met: false, goal_days_this_week: 1, exam_day: false, joker_available: true, bonus_rule: 'B' as const, earn_arm: 'earn' as const, streak: 3 };

describe('B1 Saldo en catalogus (spec §3.4)', () => {
  it('spec §3.4 step 1: balance in three parts, referral only with the flag, earn-in progress', async () => {
    renderAt('/punten', { handlers: { 'points.balance': () => balance({ referral_unvested: 150 }), 'catalog.list': () => catalog }, me: { flags: { referral: true } } });
    expect(await screen.findByTestId('balance-available')).toHaveProperty('textContent', '640 punten');
    expect(screen.getByText('Wordt nagekeken')).toBeTruthy();
    expect(screen.getByText('Referral, nog niet vrij')).toBeTruthy();
    expect(screen.getByRole('progressbar', { name: 'Inverdienperiode' }).getAttribute('aria-valuenow')).toBe('300');
  });

  it('spec §3.4 step 1: arm B names the weekly budget as part of "in afwachting"; no referral line without the flag', async () => {
    renderAt('/punten', { handlers: { 'points.balance': () => balance(), 'catalog.list': () => catalog, 'me.today': () => todayB } });
    expect(await screen.findByText('Weekbudget (nog niet veilig) en wat wordt nagekeken')).toBeTruthy();
    expect(screen.queryByText('Referral, nog niet vrij')).toBeNull();
  });

  it('spec §3.4 step 2: disclaimer and the stock of the week next to the students who may redeem', async () => {
    renderAt('/punten', { handlers: { 'points.balance': () => balance(), 'catalog.list': () => catalog } });
    expect(await screen.findByText('Deze week 40 beloningen voor 120 studenten die mogen verzilveren.')).toBeTruthy();
    expect(screen.getByText(/Punten zijn geen geld en geven geen recht op een bepaalde beloning\./)).toBeTruthy();
  });

  it('spec §3.4 step 3: under 300 minutes every Verzilveren is off, with the remaining time', async () => {
    renderAt('/punten', { handlers: { 'points.balance': () => balance({ earn_in_min: 212 }), 'catalog.list': () => catalog } });
    await screen.findAllByRole('button', { name: /Bekijk/ });
    for (const b of screen.getAllByRole('button', { name: /Bekijk/ })) expect((b as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getAllByText('Nog 88 minuten focus, dan kun je verzilveren. Je punten staan al klaar.').length).toBeGreaterThan(1);
  });

  it('spec §3.4 step 3: the waiting period shows the date of the first redemption', async () => {
    renderAt('/punten', { handlers: { 'points.balance': () => balance({ first_redeem_after: '2099-12-09T09:00:00.000Z' }), 'catalog.list': () => catalog } });
    expect((await screen.findAllByText(/Je eerste verzilvering kan vanaf .*9 december\. We kijken kort mee, zoals bij iedereen\./)).length).toBeGreaterThan(0);
  });

  it('spec §4.3 Weekvrijgave: stock zero says "Vandaag op", collective rewards first', async () => {
    renderAt('/punten', { handlers: { 'points.balance': () => balance(), 'catalog.list': () => catalog } });
    const list = await screen.findByRole('list', { name: 'Beloningen' });
    const titles = within(list).getAllByRole('heading').map((h) => h.textContent);
    expect(titles).toEqual(['Ontbijt voor je squad', 'Workshop plannen']);
    expect(within(list).getAllByText('Vandaag op. Morgen komt er weer een deel bij.').length).toBeGreaterThan(0);
  });

  it('UX P7: no euro value next to points on Beloningen', async () => {
    renderAt('/punten', { handlers: { 'points.balance': () => balance(), 'catalog.list': () => catalog } });
    await screen.findByTestId('balance-available');
    await screen.findByRole('list', { name: 'Beloningen' });
    expect(bodyText()).not.toMatch(/€|EUR|euro/i);
  });

  it('spec §4.3: an empty catalogue says it opens once partners commit', async () => {
    renderAt('/punten', { handlers: { 'points.balance': () => balance(), 'catalog.list': () => ({ items: [] }) } });
    expect(await screen.findByText('De catalogus opent zodra partners hun beloningen hebben vastgelegd. Je punten tellen al.')).toBeTruthy();
  });

  it('spec §7.1: catalog_viewed is tracked once with the visible items', async () => {
    const { api } = renderAt('/punten', { handlers: { 'points.balance': () => balance(), 'catalog.list': () => catalog } });
    await waitFor(() => expect(trackedEvents(api).map((e) => e.name)).toContain('catalog_viewed'));
    expect(trackedEvents(api).find((e) => e.name === 'catalog_viewed')?.props).toEqual({ items_zichtbaar: 2, saldo: 640, inverdiend: true });
  });

  it('spec §4.10: in the mode without points Beloningen shows no points', async () => {
    renderAt('/punten', { me: { settings: { no_points_mode: true } }, handlers: { 'points.balance': () => balance(), 'catalog.list': () => catalog } });
    expect(await screen.findByText(/modus zonder punten aan/)).toBeTruthy();
    expect(screen.queryByTestId('balance-available')).toBeNull();
  });
});

describe('B2–B4 Verzilveren (spec §3.4 steps 4–6, UX §4.6)', () => {
  const open = async () => {
    fireEvent.click(await screen.findByRole('button', { name: 'Bekijk Ontbijt voor je squad' }));
    return screen.findByRole('dialog');
  };

  it('UX §3.6 B2: shows what is deducted and what remains, then the voucher with idempotency key', async () => {
    const { api } = renderAt('/punten', {
      handlers: { 'points.balance': () => balance(), 'catalog.list': () => catalog, 'redemptions.create': () => ({ redemption_id: id(70), voucher_code: 'ONTBIJT-42', points: 600, points_from_referral: 0 }) },
    });
    const sheet = await open();
    expect(within(sheet).getByText('Beschikbaar daarna').nextSibling?.textContent).toBe('40 punten');
    fireEvent.click(within(sheet).getByRole('button', { name: 'Verzilver voor 600 punten' }));
    expect((await within(await screen.findByRole('dialog')).findByTestId('voucher-code')).textContent).toBe('ONTBIJT-42');
    const call = api.mock!.calls.find((c) => c.id === 'redemptions.create')!;
    expect(call.input.idempotencyKey).toBeTruthy();
  });

  it('spec §3.4 step 6: the weekly cap says Monday, nothing deducted', async () => {
    renderAt('/punten', { handlers: { 'points.balance': () => balance(), 'catalog.list': () => catalog, 'redemptions.create': () => { throw mockError('WEEKLY_CAP'); } } });
    const sheet = await open();
    fireEvent.click(within(sheet).getByRole('button', { name: /Verzilver voor/ }));
    expect((await screen.findByTestId('redeem-blocked')).textContent).toBe('Je verzilverde deze week al iets. Maandag kun je weer verzilveren. Je punten blijven staan.');
  });

  it('spec §4.3: stock gone during checkout takes nothing', async () => {
    renderAt('/punten', { handlers: { 'points.balance': () => balance(), 'catalog.list': () => catalog, 'redemptions.create': () => { throw mockError('OUT_OF_STOCK'); } } });
    const sheet = await open();
    fireEvent.click(within(sheet).getByRole('button', { name: /Verzilver voor/ }));
    expect((await screen.findByTestId('redeem-blocked')).textContent).toBe('Deze is net op. Er is niets afgeschreven.');
  });

  it('spec §3.4 step 4: the first redemption asks for a mobile number with one-time-code input', async () => {
    renderAt('/punten', { handlers: { 'points.balance': () => balance(), 'catalog.list': () => catalog, 'redemptions.create': () => { throw mockError('PHONE_NOT_VERIFIED'); } } });
    const sheet = await open();
    fireEvent.click(within(sheet).getByRole('button', { name: /Verzilver voor/ }));
    expect(await screen.findByRole('heading', { name: 'Je mobiele nummer bevestigen' })).toBeTruthy();
    fireEvent.change(screen.getByLabelText(/Mobiel nummer/), { target: { value: '+31612345678' } });
    fireEvent.click(screen.getByRole('button', { name: 'Stuur code' }));
    const code = await screen.findByLabelText('Code uit de sms');
    expect(code.getAttribute('autocomplete')).toBe('one-time-code');
  });

  it('spec §3.4 step 4: a VoIP or landline number is refused with the UX copy', async () => {
    renderAt('/punten', {
      handlers: { 'points.balance': () => balance(), 'catalog.list': () => catalog, 'redemptions.create': () => { throw mockError('PHONE_NOT_VERIFIED'); }, 'phone.start': () => { throw mockError('PHONE_TYPE_NOT_ALLOWED'); } },
    });
    const sheet = await open();
    fireEvent.click(within(sheet).getByRole('button', { name: /Verzilver voor/ }));
    fireEvent.change(await screen.findByLabelText(/Mobiel nummer/), { target: { value: '+31201234567' } });
    fireEvent.click(screen.getByRole('button', { name: 'Stuur code' }));
    expect(await screen.findByText('Dit nummer kunnen we niet gebruiken. Gebruik het nummer van je eigen mobiele telefoon.')).toBeTruthy();
  });

  it('spec §4.3 Kapotte code: "Werkt niet" reports the code', async () => {
    const { api } = renderAt('/punten', { handlers: { 'points.balance': () => balance(), 'catalog.list': () => catalog } });
    fireEvent.click(await screen.findByRole('button', { name: 'Werkt niet' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Meld het' }));
    expect(await screen.findByText('Je melding is binnen. Binnen twee werkdagen hoor je van ons.')).toBeTruthy();
    expect(api.mock!.calls.some((c) => c.id === 'redemptions.broken')).toBe(true);
  });
});

describe('B7 Bonusregel and history (spec §5 Transparantie)', () => {
  it('spec §5: arm B sees its own rule named, with the other rule next to it', async () => {
    renderAt('/punten/bonusregel', { handlers: { 'me.today': () => todayB } });
    expect(await screen.findByText("Jouw squad heeft de regel 'weekbudget'; de andere is 'per gehaald doel +20'.")).toBeTruthy();
    expect(screen.getByText('De joker beschermt je squadstreak, niet de doelbonus.')).toBeTruthy();
  });

  it('architecture §9.1 /punten/geschiedenis lists ledger lines', async () => {
    renderAt('/punten/geschiedenis');
    expect(await screen.findByText('Focussessie')).toBeTruthy();
    expect(screen.getByText('+25')).toBeTruthy();
  });
});

describe('redeem rules on the client (spec §4.3)', () => {
  it('orders the gates like the server: earn-in, waiting period, weekly cap', () => {
    const now = Date.parse('2026-12-02T10:00:00Z');
    expect(redeemGate(balance({ earn_in_min: 10 }), now)).toEqual({ kind: 'earn_in', minutes: 290 });
    expect(redeemGate(balance({ first_redeem_after: '2026-12-09T00:00:00Z' }), now)?.kind).toBe('hold');
    expect(redeemGate(balance({ next_redeem_from: '2026-12-07T03:00:00Z' }), now)?.kind).toBe('weekly');
    expect(redeemGate(balance(), now)).toBeNull();
  });

  it('puts collective rewards first and computes the next month in Amsterdam', () => {
    expect(sortCatalog(catalog.items).map((i) => i.collective)).toEqual([true, false]);
    // 23:30 UTC on 31 December is already January in Amsterdam.
    expect(nextMonthStart(Date.parse('2026-12-31T23:30:00Z'))).toBe('2027-02-01');
    expect(nextMonthStart(Date.parse('2026-12-31T20:00:00Z'))).toBe('2027-01-01');
    expect(nextMonthStart(Date.parse('2026-11-05T12:00:00Z'))).toBe('2026-12-01');
  });
});
