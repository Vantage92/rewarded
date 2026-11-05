// /api/v1/cards and /api/v1/verify (architecture §8.2, §10.3 SVG headers; spec §4.8).
import { z } from 'zod';
import { CardFormat, CardKind, FocusDay, IdParam, Minutes, NonNegInt, ShortText, Token, TokenParam, Ulid, Url } from './common.ts';
import { defineRoutes } from './route.ts';

/** Which optional fields the student shows on the card. */
export const CardFields = z.strictObject({
  first_name: z.boolean(),
  squad_name: z.boolean().optional(),
  streak: z.boolean().optional(),
  duration: z.boolean().optional(),
});
export const CreateCardRequest = z.strictObject({ kind: CardKind, ref_id: Ulid, fields: CardFields });
export const CreateCardResponse = z.strictObject({ card_id: Ulid, token: Token, image_url: Url });
export const CardImageQuery = z.strictObject({ format: CardFormat.optional() });
export const VerifyResponse = z.strictObject({
  first_name: ShortText,
  duration_min: Minutes,
  from: FocusDay,
  to: FocusDay,
  streak: NonNegInt.optional(),
  /** i18n key of the statement, including what the card does not prove. */
  statement_key: z.string().regex(/^[a-z][a-z0-9_.]+$/).max(120),
  focus_ook_url: Url,
});

export const cardRoutes = defineRoutes({
  'cards.create': {
    module: 'cards', method: 'POST', path: '/cards', auth: ['student'],
    body: CreateCardRequest, response: CreateCardResponse, responseKind: 'json', status: [201],
    errors: ['SESSION_UNDER_REVIEW', 'FEATURE_DISABLED'], spec: 'arch §8.2, spec §4.8',
  },
  'cards.image': {
    module: 'cards', method: 'GET', path: '/cards/:id/image', auth: ['owner'],
    params: IdParam, query: CardImageQuery, response: z.string().max(500_000), responseKind: 'svg', status: [200],
    errors: ['NOT_FOUND'], spec: 'arch §8.2, §10.3',
  },
  'cards.delete': {
    module: 'cards', method: 'DELETE', path: '/cards/:id', auth: ['owner'],
    params: IdParam, response: z.undefined(), responseKind: 'empty', status: [204], errors: [], spec: 'arch §8.2',
  },
  'verify.get': {
    module: 'cards', method: 'GET', path: '/verify/:token', auth: ['public'],
    params: TokenParam, response: VerifyResponse, responseKind: 'json', status: [200], errors: ['CARD_UNAVAILABLE'], spec: 'arch §8.2, spec §4.8',
  },
});

// Inferred types (output side) for every schema above.
export type CardFields = z.output<typeof CardFields>;
export type CreateCardRequest = z.output<typeof CreateCardRequest>;
export type CreateCardResponse = z.output<typeof CreateCardResponse>;
export type CardImageQuery = z.output<typeof CardImageQuery>;
export type VerifyResponse = z.output<typeof VerifyResponse>;
