// Export and deletion (architecture §10.7, §8.2).
import { z } from 'zod';
import { Instant } from './common.ts';
import { defineRoutes } from './route.ts';

/** GET /me/export: one JSON file with a section per module that registered an exporter. */
export const ExportFile = z.strictObject({
  format: z.literal('rewarded-export-v1'),
  generated_at: Instant,
  modules: z.record(z.string().regex(/^[a-z_]+$/), z.unknown()),
});
export const DeleteMeRequest = z.strictObject({ confirm: z.literal('VERWIJDER') });
export const DeleteMeResponse = z.strictObject({ deleted_at: Instant });

export const privacyRoutes = defineRoutes({
  'privacy.export': {
    module: 'privacy', method: 'GET', path: '/me/export', auth: ['student'],
    response: ExportFile, responseKind: 'file', status: [200], errors: ['RATE_LIMITED'], spec: 'arch §8.2, §10.7',
  },
  'privacy.deleteMe': {
    module: 'privacy', method: 'DELETE', path: '/me', auth: ['student'],
    body: DeleteMeRequest, response: DeleteMeResponse, responseKind: 'json', status: [202],
    errors: ['CONFIRMATION_REQUIRED'], spec: 'arch §8.2, §10.7',
  },
  'admin.users.delete': {
    module: 'privacy', method: 'DELETE', path: '/admin/users/:id', auth: ['admin'],
    params: z.strictObject({ id: z.ulid() }), response: DeleteMeResponse, responseKind: 'json', status: [202],
    errors: ['FOUR_EYES_REQUIRED', 'NOT_FOUND'], spec: 'arch §8.2 Beheer, §10.7',
  },
});

// Inferred types (output side) for every schema above.
export type ExportFile = z.output<typeof ExportFile>;
export type DeleteMeRequest = z.output<typeof DeleteMeRequest>;
export type DeleteMeResponse = z.output<typeof DeleteMeResponse>;
