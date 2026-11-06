// Mock-mode data for the club screens (validated against contracts by the mock client).
import type { MockHandlers } from '@rewarded/contracts';

const id = (n: number) => `01JC${String(n).padStart(22, '0')}`;

export const handlers: MockHandlers = {
  'challenges.list': () => ({
    items: [
      { id: id(110), type: 'club_warmup', title: 'Aanloopklassement', period: { start_day: '2026-11-02', end_day: '2026-12-20' }, prize: null },
      {
        id: id(111),
        type: 'performance',
        title: 'Elke dag van de tentamenweek 120 minuten',
        period: { start_day: '2027-01-11', end_day: '2027-01-17' },
        seats_left: 12,
        prize: { kind: 'earned_individual', description: 'Een boekenbon' },
      },
    ],
  }),
  'leaderboards.get': () => ({
    pools: [
      {
        pool: '150_500',
        rows: [
          { club_name: 'SV Delta', declared_members: 420, members_source_kind: 'institution', prize_eligible: true, participation_rate: 0.31, intensity_min: 42.5, rank: 1 },
          { club_name: 'Studievereniging Gamma', declared_members: 260, members_source_kind: 'board_grant', prize_eligible: true, participation_rate: 0.24, intensity_min: 51, rank: 2 },
          { club_name: 'Vereniging Epsilon', declared_members: 180, members_source_kind: 'self', prize_eligible: false, participation_rate: 0.18, intensity_min: 38, rank: 3 },
        ],
      },
    ],
    is_final: false,
    computed_at: new Date().toISOString(),
  }),
};
