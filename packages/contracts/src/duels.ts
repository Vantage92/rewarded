// /api/v1/duels (architecture §6.3, §8.2; spec §4.5: no points on the result).
import { z } from 'zod';
import { DuelStatus, FocusDay, NonNegInt, Ref, Ulid } from './common.ts';
import { InviteDto } from './invites.ts';
import { defineRoutes } from './route.ts';

export const DuelDto = z.strictObject({
  id: Ulid,
  status: DuelStatus,
  in_squad: z.boolean(),
  start_day: FocusDay.nullable(),
  end_day: FocusDay.nullable(),
  opponent_first_name: z.string().max(120).nullable(),
});
/** Without a squad member as opponent only allowed when the requester is 18_plus (spec §4.5). */
export const CreateDuelRequest = z.strictObject({ opponent_member_ref: Ref.optional() });
export const CreateDuelResponse = z.strictObject({ duel: DuelDto, invite: InviteDto });
export const CurrentDuelResponse = z.strictObject({
  duel: DuelDto,
  days: z.array(z.strictObject({ day: FocusDay, me_met: z.boolean(), opponent_met: z.boolean() })),
  me_total: NonNegInt,
  opponent_total: NonNegInt,
  result: z.enum(['won', 'lost', 'tie']).optional(),
});

export const duelRoutes = defineRoutes({
  'duels.create': {
    module: 'duels', method: 'POST', path: '/duels', auth: ['student'],
    body: CreateDuelRequest, response: CreateDuelResponse, responseKind: 'json', status: [201],
    errors: ['DUEL_ACTIVE', 'AGE_RESTRICTED', 'FEATURE_DISABLED'], spec: 'arch §8.2, spec §3.6',
  },
  'duels.current': {
    module: 'duels', method: 'GET', path: '/duels/current', auth: ['student'],
    response: CurrentDuelResponse, responseKind: 'json', status: [200], errors: ['NOT_FOUND'], spec: 'arch §8.2',
  },
});

// Inferred types (output side) for every schema above.
export type DuelDto = z.output<typeof DuelDto>;
export type CreateDuelRequest = z.output<typeof CreateDuelRequest>;
export type CreateDuelResponse = z.output<typeof CreateDuelResponse>;
export type CurrentDuelResponse = z.output<typeof CurrentDuelResponse>;
