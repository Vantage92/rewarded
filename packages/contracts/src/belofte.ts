// /api/v1/belofte and /api/v1/beloftes (architecture §8.2; spec §3.12, §4.12: no ledger entry on a Belofte).
import { z } from 'zod';
import { BelofteReflectionAction, BelofteStatus, BelofteTrigger, BelofteWitnesses, FocusDay, IdParam, Minutes, StakeInterest, Ulid } from './common.ts';
import { defineRoutes } from './route.ts';

const DaysPerWeek = z.number().int().min(1).max(7);
const MinPerDay = z.number().int().min(10).max(600);
export const BelofteOfferResponse = z.strictObject({
  offer: z.strictObject({ suggested_days: DaysPerWeek, suggested_min: MinPerDay, trigger: BelofteTrigger }).optional(),
});
export const CreateBelofteRequest = z.strictObject({ days_per_week: DaysPerWeek, min_per_day: MinPerDay, witnesses: BelofteWitnesses });
export const BelofteDto = z.strictObject({
  id: Ulid,
  days_per_week: DaysPerWeek,
  min_per_day: MinPerDay,
  witnesses: BelofteWitnesses,
  start_day: FocusDay,
  end_day: FocusDay,
  status: BelofteStatus,
});
export const CreateBelofteResponse = z.strictObject({ belofte: BelofteDto });
export const CurrentBelofteResponse = z.strictObject({
  belofte: BelofteDto,
  days: z.array(z.strictObject({ day: FocusDay, minutes: Minutes, met: z.boolean() })),
});
export const StopBelofteResponse = z.strictObject({ status: z.literal('stopped') });
/** `stake_interest` only for 18_plus (AGE_RESTRICTED otherwise). */
export const ReflectionRequest = z.strictObject({ action: BelofteReflectionAction, stake_interest: StakeInterest.optional() });
export const ReflectionResponse = z.strictObject({ next: z.enum(['new_belofte', 'adjust', 'done']).optional() });

export const belofteRoutes = defineRoutes({
  'belofte.offer': {
    module: 'belofte', method: 'GET', path: '/belofte/offer', auth: ['student'],
    response: BelofteOfferResponse, responseKind: 'json', status: [200], errors: ['FEATURE_DISABLED'], spec: 'arch §8.2, spec §4.12',
  },
  'beloftes.create': {
    module: 'belofte', method: 'POST', path: '/beloftes', auth: ['student'],
    body: CreateBelofteRequest, response: CreateBelofteResponse, responseKind: 'json', status: [201],
    errors: ['BELOFTE_ACTIVE', 'OFFER_NOT_YET', 'VALIDATION_FAILED'], spec: 'arch §8.2',
  },
  'beloftes.current': {
    module: 'belofte', method: 'GET', path: '/beloftes/current', auth: ['student'],
    response: CurrentBelofteResponse, responseKind: 'json', status: [200], errors: ['NOT_FOUND'], spec: 'arch §8.2',
  },
  'beloftes.stop': {
    module: 'belofte', method: 'POST', path: '/beloftes/:id/stop', auth: ['owner'],
    params: IdParam, response: StopBelofteResponse, responseKind: 'json', status: [200], errors: [], spec: 'arch §8.2',
  },
  'beloftes.reflection': {
    module: 'belofte', method: 'POST', path: '/beloftes/:id/reflection', auth: ['owner'],
    params: IdParam, body: ReflectionRequest, response: ReflectionResponse, responseKind: 'json', status: [200],
    errors: ['AGE_RESTRICTED'], spec: 'arch §8.2, spec §3.12',
  },
});

// Inferred types (output side) for every schema above.
export type BelofteOfferResponse = z.output<typeof BelofteOfferResponse>;
export type CreateBelofteRequest = z.output<typeof CreateBelofteRequest>;
export type BelofteDto = z.output<typeof BelofteDto>;
export type CreateBelofteResponse = z.output<typeof CreateBelofteResponse>;
export type CurrentBelofteResponse = z.output<typeof CurrentBelofteResponse>;
export type StopBelofteResponse = z.output<typeof StopBelofteResponse>;
export type ReflectionRequest = z.output<typeof ReflectionRequest>;
export type ReflectionResponse = z.output<typeof ReflectionResponse>;
