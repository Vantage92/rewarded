// /api/v1/dev: only in the dev build; the production bundle has no dev module (architecture §10.3).
import { z } from 'zod';
import { Instant, NonNegInt } from './common.ts';
import { defineRoutes } from './route.ts';

export const DevInboxQuery = z.strictObject({ to: z.string().max(254).optional() });
export const DevInboxMessage = z.discriminatedUnion('channel', [
  z.strictObject({ channel: z.literal('email'), at: Instant, to: z.string().max(254), subject: z.string().max(500), text: z.string(), html: z.string().optional() }),
  z.strictObject({ channel: z.literal('sms'), at: Instant, to: z.string().max(32), text: z.string() }),
]);
export const DevInboxResponse = z.strictObject({ messages: z.array(DevInboxMessage) });
export const DevClockRequest = z
  .strictObject({ set: Instant.optional(), advance_ms: z.number().int().min(0).max(400 * 24 * 3600 * 1000).optional() })
  .refine((v) => v.set !== undefined || v.advance_ms !== undefined, { message: 'set_or_advance' });
export const DevClockResponse = z.strictObject({ now: Instant });
export const DevJobParams = z.strictObject({ job: z.enum(['day_close', 'week_open', 'week_close', 'hourly', 'sweep', 'reminders', 'retention']) });
export const DevJobRequest = z.strictObject({ run_key: z.string().max(64).optional() });
export const DevJobResponse = z.strictObject({ status: z.enum(['done', 'skipped', 'failed']), run_key: z.string().max(64) });
export const DevResetRequest = z.strictObject({ seed: z.enum(['demo', 'empty']).optional() });
export const DevResetResponse = z.strictObject({ ok: z.literal(true) });
export const AaCheckRequest = z.strictObject({ users: z.number().int().min(10).max(100_000), seed: z.string().max(64) });
export const AaCheckResponse = z.strictObject({
  factors: z.array(z.strictObject({ factor: z.string().max(16), stratum: z.string().max(32), counts: z.record(z.string(), NonNegInt) })),
  checks: z.array(z.strictObject({ name: z.string().max(64), passed: z.boolean(), detail: z.string().max(500) })),
});

export const devRoutes = defineRoutes({
  'dev.inbox': {
    module: 'dev', method: 'GET', path: '/dev/inbox', auth: ['dev'],
    query: DevInboxQuery, response: DevInboxResponse, responseKind: 'json', status: [200], errors: [], spec: 'arch §8.2 Ontwikkeling',
  },
  'dev.clock': {
    module: 'dev', method: 'POST', path: '/dev/clock', auth: ['dev'],
    body: DevClockRequest, response: DevClockResponse, responseKind: 'json', status: [200], errors: [], spec: 'arch §8.2 Ontwikkeling',
  },
  'dev.runJob': {
    module: 'dev', method: 'POST', path: '/dev/jobs/:job/run', auth: ['dev'],
    params: DevJobParams, body: DevJobRequest, response: DevJobResponse, responseKind: 'json', status: [200], errors: [], spec: 'arch §8.2 Ontwikkeling',
  },
  'dev.reset': {
    module: 'dev', method: 'POST', path: '/dev/reset', auth: ['dev'],
    body: DevResetRequest, response: DevResetResponse, responseKind: 'json', status: [200], errors: [], spec: 'arch §8.2 Ontwikkeling',
  },
  'dev.aaCheck': {
    module: 'dev', method: 'POST', path: '/dev/aa-check', auth: ['dev'],
    body: AaCheckRequest, response: AaCheckResponse, responseKind: 'json', status: [200], errors: [], spec: 'arch §8.2 Ontwikkeling, voorregistratie §9.3',
  },
});
