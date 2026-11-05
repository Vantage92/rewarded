// /api/v1/waitlist and its admin routes (architecture §3.1 toegangspoort, §8.2).
import { z } from 'zod';
import { Email, Empty, Instant, Locale, NoContent, NonNegInt, PosInt, Token, Ulid, VersionTag, WaitlistPriority, WaitlistSource } from './common.ts';
import { defineRoutes } from './route.ts';

export const WaitlistRequest = z.strictObject({
  email: Email,
  locale: Locale,
  source: WaitlistSource,
  group_token: z.string().regex(/^[A-Za-z0-9_-]{8,64}$/).optional(),
  /** Free club name, shortened by the server. */
  club_hint: z.string().trim().min(1).max(80).optional(),
  consent_version: VersionTag,
});
export const WaitlistUnsubscribeRequest = z.strictObject({ token: Token });

export const AdminWaitlistOverview = z.strictObject({
  classes: z.array(
    z.strictObject({ priority_reason: WaitlistPriority, waiting: NonNegInt, groups: NonNegInt, invited: NonNegInt, oldest_at: Instant.nullable() }),
  ),
  total_waiting: NonNegInt,
});
export const InviteBatchRequest = z.strictObject({ count: z.number().int().min(1).max(500), dry_run: z.boolean().optional() });
export const InviteBatchResponse = z.strictObject({
  dry_run: z.boolean(),
  invites: z.array(z.strictObject({ invite_id: Ulid.nullable(), priority_reason: WaitlistPriority, group_size: PosInt })),
  entries_invited: NonNegInt,
});

export const waitlistRoutes = defineRoutes({
  'waitlist.join': {
    module: 'waitlist', method: 'POST', path: '/waitlist', auth: ['public'],
    body: WaitlistRequest, response: Empty, responseKind: 'json', status: [202], idempotencyKey: 'required',
    errors: ['VALIDATION_FAILED', 'RATE_LIMITED'], spec: 'arch §8.2',
  },
  'waitlist.unsubscribe': {
    module: 'waitlist', method: 'POST', path: '/waitlist/unsubscribe', auth: ['public'],
    body: WaitlistUnsubscribeRequest, response: NoContent, responseKind: 'empty', status: [204],
    errors: ['LINK_INVALID'], spec: 'arch §8.2',
  },
  'admin.waitlist.overview': {
    module: 'waitlist', method: 'GET', path: '/admin/waitlist', auth: ['admin'],
    response: AdminWaitlistOverview, responseKind: 'json', status: [200], errors: [], spec: 'arch §8.2 Beheer, §3.1',
  },
  'admin.waitlist.inviteBatch': {
    module: 'waitlist', method: 'POST', path: '/admin/waitlist/invite-batch', auth: ['admin'],
    body: InviteBatchRequest, response: InviteBatchResponse, responseKind: 'json', status: [200], errors: [], spec: 'arch §8.2 Beheer, §3.1',
  },
});
