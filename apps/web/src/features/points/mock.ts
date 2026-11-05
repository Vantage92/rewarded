// Mock-mode data for the Beloningen screens (WP-7 mock client; validated against contracts).
import type { MockHandlers } from '@rewarded/contracts';

const id = (n: number) => `01JC${String(n).padStart(22, '0')}`;

export const handlers: MockHandlers = {
  'points.balance': () => ({ available: 640, pending: 60, referral_unvested: 0, earn_in_min: 340, earn_in_required: 300 }),
  'catalog.list': () => ({
    week: { week: '2026-W49', released: 40, eligible_users: 120 },
    items: [
      { id: id(601), kind: 'in_kind', collective: true, title: 'Ontbijt voor je squad', partner: 'SV Delta', points_price: 600, stock_today: 2, terms: 'Op te halen bij de bar van SV Delta, tot en met 31 januari.' },
      { id: id(602), kind: 'service', collective: false, title: 'Workshop plannen voor tentamens', partner: 'Studentendecanaat', points_price: 300, stock_today: 0, next_release: '2026-12-03T03:00:00.000Z', terms: 'Online workshop van een uur, aanmelden met je code.' },
      { id: id(603), kind: 'partner_discount', collective: false, title: 'Korting op een studieboek', partner: 'Boekhandel', points_price: 450, stock_today: 5, terms: 'Eén keer te gebruiken, op één boek.' },
    ],
  }),
};
