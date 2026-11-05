// /api/v1/referral (architecture §8.2; spec §4.9, behind the `referral` flag).
import { z } from 'zod';
import { Instant, NonNegInt, ShortText, Url } from './common.ts';
import { defineRoutes } from './route.ts';

export const ReferralMineResponse = z.strictObject({
  link: Url.optional(),
  pending: z.array(z.strictObject({ first_name: ShortText, sessions_done: NonNegInt, deadline: Instant })),
});

export const referralRoutes = defineRoutes({
  'referral.mine': {
    module: 'referral', method: 'GET', path: '/referral/mine', auth: ['student'],
    response: ReferralMineResponse, responseKind: 'json', status: [200], errors: ['FEATURE_DISABLED'], spec: 'arch §8.2, spec §4.9',
  },
});
