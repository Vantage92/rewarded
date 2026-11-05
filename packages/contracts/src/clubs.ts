// /api/v1/clubs, the board routes and the club admin routes (architecture §6.2, §6.4, §8.2).
import { z } from 'zod';
import { ClubPool, IdParam, Instant, MembersSourceKind, NonNegInt, Ref, ShortText, Ulid, Url, WeekKey } from './common.ts';
import { defineRoutes } from './route.ts';

export const JoinCode = z.string().regex(/^[A-Z0-9]{4,12}$/);
export const QrSource = z.string().regex(/^[a-z0-9_-]{1,32}$/);
export const ClubDto = z.strictObject({
  id: Ulid,
  name: ShortText,
  city: ShortText,
  declared_members: NonNegInt,
  members_source_kind: MembersSourceKind,
  prize_eligible: z.boolean(),
  pool: ClubPool,
});
export const JoinClubRequest = z.strictObject({ code: JoinCode, qr_source: QrSource.optional() });
export const JoinClubResponse = z.strictObject({ club: ClubDto, status: z.enum(['linked', 'pending_admin']) });

/** A number that small-group suppression may hide (architecture §6.4): null with suppressed = true. */
export const Metric = z.strictObject({ value: z.number().nullable(), suppressed: z.boolean() });
export const BoardTab = z.enum(['stand', 'werving', 'prijs', 'kwaliteit']);
export const BoardDashboardQuery = z.strictObject({ tab: BoardTab.optional() });
const WeekRow = z.strictObject({ week: WeekKey, participation_rate: Metric, intensity_min: Metric, linked_members: Metric });
export const BoardDashboardResponse = z.discriminatedUnion('tab', [
  z.strictObject({ tab: z.literal('stand'), rank: Metric, pool: ClubPool, participation_rate: Metric, intensity_min: Metric, weeks: z.array(WeekRow) }),
  z.strictObject({
    tab: z.literal('werving'),
    linked_members: Metric,
    code_cap: NonNegInt,
    pending_admin: Metric,
    by_qr_source: z.array(z.strictObject({ qr_source: QrSource, linked: Metric })),
  }),
  z.strictObject({ tab: z.literal('prijs'), prize_eligible: z.boolean(), threshold_rate: z.number().nullable(), anchored_members: Metric, is_final: z.boolean() }),
  z.strictObject({ tab: z.literal('kwaliteit'), anchored_share: Metric, flagged_share: Metric, sample_status: z.enum(['none', 'drawn', 'judged']) }),
]);
export const PromoKitResponse = z.strictObject({
  assets: z.array(z.strictObject({ kind: z.enum(['poster', 'story', 'qr', 'text']), url: Url, qr_source: QrSource })),
});

export const AdminClub = ClubDto.extend({
  members_source_ref: z.string().max(200),
  members_fixed_at: Instant.nullable(),
  agreement_ref: z.string().max(200).nullable(),
  join_code: JoinCode.nullable(),
  code_cap: NonNegInt,
  status: z.enum(['draft', 'active', 'archived']),
  help_resources: z.array(z.strictObject({ label: ShortText, url: Url })).max(10),
  board_member_refs: z.array(Ref),
});
export const AdminClubCreate = z.strictObject({
  name: ShortText,
  city: ShortText,
  declared_members: z.number().int().min(1).max(100_000),
  members_source_kind: MembersSourceKind,
  members_source_ref: z.string().trim().min(1).max(200),
  agreement_ref: z.string().trim().min(1).max(200).optional(),
  help_resources: z.array(z.strictObject({ label: ShortText, url: Url })).max(10).optional(),
  pool: ClubPool.optional(),
  board_member_emails: z.array(z.email().max(254)).max(10).optional(),
});
export const AdminClubPatch = AdminClubCreate.partial().extend({ fix_members: z.literal(true).optional() });
export const AdminClubResponse = z.strictObject({ club: AdminClub });
export const AdminClubListResponse = z.strictObject({ items: z.array(AdminClub) });
export const PendingLinksResponse = z.strictObject({
  items: z.array(z.strictObject({ user_ref: Ref, first_name: ShortText, linked_at: Instant, qr_source: QrSource.nullable() })),
});
export const DecideLinkRequest = z.strictObject({ user_ref: Ref, decision: z.enum(['approve', 'reject']) });
export const DecideLinkResponse = z.strictObject({ user_ref: Ref, status: z.enum(['linked', 'rejected']) });

export const clubRoutes = defineRoutes({
  'clubs.join': {
    module: 'clubs', method: 'POST', path: '/clubs/join', auth: ['student'],
    body: JoinClubRequest, response: JoinClubResponse, responseKind: 'json', status: [200],
    errors: ['CODE_INVALID', 'ALREADY_LINKED'], spec: 'arch §8.2, spec §4.6',
  },
  'clubs.leave': {
    module: 'clubs', method: 'POST', path: '/clubs/leave', auth: ['student'],
    response: z.undefined(), responseKind: 'empty', status: [204], errors: [], spec: 'arch §8.2',
  },
  'board.dashboard': {
    module: 'clubs', method: 'GET', path: '/board/clubs/:id/dashboard', auth: ['board'],
    params: IdParam, query: BoardDashboardQuery, response: BoardDashboardResponse, responseKind: 'json', status: [200],
    errors: ['FORBIDDEN'], spec: 'arch §8.2, §6.4, spec §4.6',
  },
  'board.promoKit': {
    module: 'clubs', method: 'GET', path: '/board/clubs/:id/promo-kit', auth: ['board'],
    params: IdParam, response: PromoKitResponse, responseKind: 'json', status: [200], errors: ['FORBIDDEN'], spec: 'arch §8.2',
  },
  'admin.clubs.list': {
    module: 'clubs', method: 'GET', path: '/admin/clubs', auth: ['admin'],
    response: AdminClubListResponse, responseKind: 'json', status: [200], errors: [], spec: 'arch §8.2 Beheer',
  },
  'admin.clubs.get': {
    module: 'clubs', method: 'GET', path: '/admin/clubs/:id', auth: ['admin'],
    params: IdParam, response: AdminClubResponse, responseKind: 'json', status: [200], errors: ['NOT_FOUND'], spec: 'arch §8.2 Beheer',
  },
  'admin.clubs.create': {
    module: 'clubs', method: 'POST', path: '/admin/clubs', auth: ['admin'],
    body: AdminClubCreate, response: AdminClubResponse, responseKind: 'json', status: [201],
    errors: ['VALIDATION_FAILED', 'AGREEMENT_REQUIRED'], spec: 'arch §8.2 Beheer',
  },
  'admin.clubs.patch': {
    module: 'clubs', method: 'PATCH', path: '/admin/clubs/:id', auth: ['admin'],
    params: IdParam, body: AdminClubPatch, response: AdminClubResponse, responseKind: 'json', status: [200],
    errors: ['VALIDATION_FAILED', 'AGREEMENT_REQUIRED', 'MEMBERS_FIXED'], spec: 'arch §8.2 Beheer',
  },
  'admin.clubs.pendingLinks': {
    module: 'clubs', method: 'GET', path: '/admin/clubs/:id/pending-links', auth: ['admin'],
    params: IdParam, response: PendingLinksResponse, responseKind: 'json', status: [200], errors: [], spec: 'arch §8.2 Beheer',
  },
  'admin.clubs.decideLink': {
    module: 'clubs', method: 'POST', path: '/admin/clubs/:id/pending-links/decide', auth: ['admin'],
    params: IdParam, body: DecideLinkRequest, response: DecideLinkResponse, responseKind: 'json', status: [200], errors: [], spec: 'arch §8.2 Beheer',
  },
});

// Inferred types (output side) for every schema above.
export type JoinCode = z.output<typeof JoinCode>;
export type QrSource = z.output<typeof QrSource>;
export type ClubDto = z.output<typeof ClubDto>;
export type JoinClubRequest = z.output<typeof JoinClubRequest>;
export type JoinClubResponse = z.output<typeof JoinClubResponse>;
export type Metric = z.output<typeof Metric>;
export type BoardTab = z.output<typeof BoardTab>;
export type BoardDashboardQuery = z.output<typeof BoardDashboardQuery>;
export type BoardDashboardResponse = z.output<typeof BoardDashboardResponse>;
export type PromoKitResponse = z.output<typeof PromoKitResponse>;
export type AdminClub = z.output<typeof AdminClub>;
export type AdminClubCreate = z.output<typeof AdminClubCreate>;
export type AdminClubPatch = z.output<typeof AdminClubPatch>;
export type AdminClubResponse = z.output<typeof AdminClubResponse>;
export type AdminClubListResponse = z.output<typeof AdminClubListResponse>;
export type PendingLinksResponse = z.output<typeof PendingLinksResponse>;
export type DecideLinkRequest = z.output<typeof DecideLinkRequest>;
export type DecideLinkResponse = z.output<typeof DecideLinkResponse>;
