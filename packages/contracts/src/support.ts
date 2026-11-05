// /api/v1/admin/support (architecture §3.3 support_ticket, §8.2).
import { z } from 'zod';
import { FocusDay, IdParam, Instant, Ref, SupportKind, SupportLabel, SupportStatus, Ulid } from './common.ts';
import { defineRoutes } from './route.ts';

export const SupportTicket = z.strictObject({
  id: Ulid,
  user_ref: Ref.nullable(),
  kind: SupportKind,
  ref_id: Ulid.nullable(),
  text: z.string().max(2000).nullable(),
  label: SupportLabel.nullable(),
  status: SupportStatus,
  created_at: Instant,
});
export const SupportListResponse = z.strictObject({ items: z.array(SupportTicket) });
/** External messages carry only a label and a date (architecture §3.3). */
export const ExternalTicketRequest = z.strictObject({ label: SupportLabel, received_on: FocusDay });
export const TicketPatchRequest = z
  .strictObject({ label: SupportLabel.optional(), status: SupportStatus.optional() })
  .refine((v) => Object.keys(v).length > 0, { message: 'empty_patch' });
export const TicketResponse = z.strictObject({ ticket: SupportTicket });

export const supportRoutes = defineRoutes({
  'admin.support.list': {
    module: 'support', method: 'GET', path: '/admin/support', auth: ['admin'],
    response: SupportListResponse, responseKind: 'json', status: [200], errors: [], spec: 'arch §8.2 Beheer',
  },
  'admin.support.create': {
    module: 'support', method: 'POST', path: '/admin/support', auth: ['admin'],
    body: ExternalTicketRequest, response: TicketResponse, responseKind: 'json', status: [201], errors: [], spec: 'arch §8.2 Beheer',
  },
  'admin.support.patch': {
    module: 'support', method: 'PATCH', path: '/admin/support/:id', auth: ['admin'],
    params: IdParam, body: TicketPatchRequest, response: TicketResponse, responseKind: 'json', status: [200], errors: ['NOT_FOUND'], spec: 'arch §8.2 Beheer',
  },
});

// Inferred types (output side) for every schema above.
export type SupportTicket = z.output<typeof SupportTicket>;
export type SupportListResponse = z.output<typeof SupportListResponse>;
export type ExternalTicketRequest = z.output<typeof ExternalTicketRequest>;
export type TicketPatchRequest = z.output<typeof TicketPatchRequest>;
export type TicketResponse = z.output<typeof TicketResponse>;
