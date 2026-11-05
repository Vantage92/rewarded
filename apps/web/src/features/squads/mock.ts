// Mock-mode data for the squad screens (validated against contracts by the mock client).
import type { MockHandlers } from '@rewarded/contracts';

export const handlers: MockHandlers = {
  'squads.presence': () => ({
    members: [
      { member_ref: 'mref-0001', focusing: true, remaining_min: 32 },
      { member_ref: 'mref-0002', focusing: false },
    ],
    polled_at: new Date().toISOString(),
  }),
  'squads.beloftes': () => ({
    items: [
      {
        first_name: 'Sem',
        days_per_week: 5,
        min_per_day: 50,
        start_day: '2026-11-30',
        end_day: '2026-12-13',
        status: 'active',
        days: [
          { day: '2026-11-30', met: true },
          { day: '2026-12-01', met: false },
          { day: '2026-12-02', met: true },
        ],
      },
    ],
  }),
};
