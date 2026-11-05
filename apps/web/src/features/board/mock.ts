// Mock handlers for the board dashboard (mock mode, component tests): aggregates with small-group
// suppression as core/privacy would produce them (architecture §6.4). All figures are fictional.
import type { BoardDashboardResponse, MockHandlers } from '@rewarded/contracts';

const m = (value: number | null) => ({ value, suppressed: value === null });

export function boardDashboard(tab: 'stand' | 'werving' | 'prijs' | 'kwaliteit'): BoardDashboardResponse {
  switch (tab) {
    case 'stand':
      return {
        tab: 'stand',
        rank: m(2),
        pool: '150_500',
        participation_rate: m(0.21),
        intensity_min: m(46),
        weeks: [
          { week: '2026-W45', participation_rate: m(0.12), intensity_min: m(38), linked_members: m(25) },
          { week: '2026-W46', participation_rate: m(0.18), intensity_min: m(44), linked_members: m(40) },
          { week: '2026-W47', participation_rate: m(0.21), intensity_min: m(46), linked_members: m(55) },
        ],
      };
    case 'werving':
      return {
        tab: 'werving',
        linked_members: m(55),
        code_cap: 264,
        pending_admin: m(null),
        by_qr_source: [
          { qr_source: 'poster_bieb', linked: m(30) },
          { qr_source: 'story_insta', linked: m(20) },
          { qr_source: 'flyer_kantine', linked: m(null) },
        ],
      };
    case 'prijs':
      return { tab: 'prijs', prize_eligible: true, threshold_rate: 0.25, anchored_members: m(40), is_final: false };
    case 'kwaliteit':
      return { tab: 'kwaliteit', anchored_share: m(0.73), flagged_share: m(null), sample_status: 'drawn' };
  }
}

export const handlers: MockHandlers = {
  'board.dashboard': (input) => boardDashboard((input.query.tab as 'stand' | 'werving' | 'prijs' | 'kwaliteit' | undefined) ?? 'stand'),
  'board.promoKit': () => ({
    assets: [
      { kind: 'poster', url: '/promo/poster-bieb.pdf', qr_source: 'poster_bieb' },
      { kind: 'story', url: '/promo/story-insta.png', qr_source: 'story_insta' },
      { kind: 'qr', url: '/promo/qr-kantine.svg', qr_source: 'flyer_kantine' },
      { kind: 'text', url: '/promo/teksten.txt', qr_source: 'poster_bieb' },
    ],
  }),
};
