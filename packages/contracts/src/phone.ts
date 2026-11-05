// /api/v1/me/phone (architecture §8.2; phone verification with line type, spec §4.3).
import { z } from 'zod';
import { Instant } from './common.ts';
import { defineRoutes } from './route.ts';

/** E.164 number; never logged (architecture §10.9). */
export const PhoneNumber = z.string().regex(/^\+[1-9]\d{7,14}$/);
export const PhoneStartRequest = z.strictObject({ phone: PhoneNumber });
export const PhoneStartResponse = z.strictObject({ expires_at: Instant });
export const PhoneConfirmRequest = z.strictObject({ code: z.string().regex(/^\d{6}$/) });
export const PhoneConfirmResponse = z.strictObject({ verified: z.literal(true) });

export const phoneRoutes = defineRoutes({
  'phone.start': {
    module: 'phone', method: 'POST', path: '/me/phone/start', auth: ['student'],
    body: PhoneStartRequest, response: PhoneStartResponse, responseKind: 'json', status: [202],
    errors: ['PHONE_IN_USE', 'PHONE_TYPE_NOT_ALLOWED', 'RATE_LIMITED'], spec: 'arch §8.2',
  },
  'phone.confirm': {
    module: 'phone', method: 'POST', path: '/me/phone/confirm', auth: ['student'],
    body: PhoneConfirmRequest, response: PhoneConfirmResponse, responseKind: 'json', status: [200],
    errors: ['CODE_INVALID', 'CODE_EXPIRED', 'TOO_MANY_ATTEMPTS'], spec: 'arch §8.2',
  },
});
