// Mock-mode challenge progress: not enrolled until "Schrijf je in" (in memory).
import type { MockHandlers } from '@rewarded/contracts';
import { mockError } from '@rewarded/contracts/mock';

let enrolled = false;

export const handlers: MockHandlers = {
  'challenges.enroll': ({ params }) => {
    enrolled = true;
    return { enrollment: { id: '01JC0000000000000000000150', challenge_id: String(params['id']), status: 'enrolled', enrolled_at: '2026-12-02T09:00:00.000Z' }, seat_no: 9 };
  },
  'challenges.progress': () => {
    if (!enrolled) throw mockError('NOT_ENROLLED');
    return { days: [], status: 'enrolled' };
  },
};
