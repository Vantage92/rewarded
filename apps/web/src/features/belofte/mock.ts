// Mock-mode Belofte: an early offer, and a Belofte that exists after "Beloof het" (in memory).
import type { BelofteDto, MockHandlers } from '@rewarded/contracts';
import { mockError } from '@rewarded/contracts/mock';

let current: BelofteDto | null = null;

export const handlers: MockHandlers = {
  'belofte.offer': () => ({ offer: { suggested_days: 4, suggested_min: 50, trigger: 'early' } }),
  'beloftes.create': ({ body }) => {
    const b = body as { days_per_week: number; min_per_day: 25 | 50 | 90 | 120; witnesses: 'squad' | 'none' };
    current = { id: '01JC0000000000000000000140', days_per_week: b.days_per_week, min_per_day: b.min_per_day, witnesses: b.witnesses, start_day: '2026-12-03', end_day: '2026-12-16', status: 'active' };
    return { belofte: current };
  },
  'beloftes.current': () => {
    if (!current) throw mockError('NOT_FOUND');
    return { belofte: current, days: [{ day: '2026-12-03', minutes: 50, met: true }] };
  },
  'beloftes.stop': () => {
    if (current) current = { ...current, status: 'stopped' };
    return { status: 'stopped' };
  },
};
