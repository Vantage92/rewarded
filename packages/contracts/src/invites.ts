// /api/v1/invites (architecture §3.1 invite, §8.2). Previews never mention points or prizes (spec §3.5).
import { z } from 'zod';
import { InviteSource, Instant, PosInt, NonNegInt, ShortText, Token, TokenParam, Ulid, Url } from './common.ts';
import { defineRoutes } from './route.ts';

export const InviteDto = z.strictObject({
  id: Ulid,
  token: Token,
  url: Url,
  source: InviteSource,
  max_uses: PosInt,
  uses: NonNegInt,
  expires_at: Instant,
});
export const InvitePreview = z.strictObject({
  source: InviteSource,
  inviter_first_name: ShortText.optional(),
  squad_name: ShortText.optional(),
  valid: z.boolean(),
});
export const AcceptedSquad = z.strictObject({ id: Ulid, name: ShortText });
export const AcceptedDuel = z.strictObject({ id: Ulid, start_day: z.iso.date(), end_day: z.iso.date() });
export const InviteAcceptResponse = z.union([
  z.strictObject({ squad: AcceptedSquad }),
  z.strictObject({ duel: AcceptedDuel }),
  z.strictObject({}),
]);

export const inviteRoutes = defineRoutes({
  'invites.preview': {
    module: 'invites', method: 'GET', path: '/invites/:token', auth: ['public'],
    params: TokenParam, response: InvitePreview, responseKind: 'json', status: [200],
    errors: ['INVITE_INVALID', 'INVITE_EXPIRED', 'INVITE_EXHAUSTED'], spec: 'arch §8.2, spec §3.5',
  },
  'invites.accept': {
    module: 'invites', method: 'POST', path: '/invites/:token/accept', auth: ['student'],
    params: TokenParam, response: InviteAcceptResponse, responseKind: 'json', status: [200],
    errors: ['INVITE_INVALID', 'INVITE_EXPIRED', 'INVITE_EXHAUSTED', 'ALREADY_IN_SQUAD', 'SQUAD_FULL', 'DUEL_ACTIVE'], spec: 'arch §8.2',
  },
});

// Inferred types (output side) for every schema above.
export type InviteDto = z.output<typeof InviteDto>;
export type InvitePreview = z.output<typeof InvitePreview>;
export type AcceptedSquad = z.output<typeof AcceptedSquad>;
export type AcceptedDuel = z.output<typeof AcceptedDuel>;
export type InviteAcceptResponse = z.output<typeof InviteAcceptResponse>;
