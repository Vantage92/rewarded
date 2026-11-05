// /api/v1/redemptions (architecture §5.2, §8.2).
import { z } from 'zod';
import { FreeText, IdParam, Instant, Points, RedemptionStatus, ShortText, Ulid } from './common.ts';
import { defineRoutes } from './route.ts';

const VoucherCode = z.string().min(1).max(128);
export const RedeemRequest = z.strictObject({ reward_id: Ulid });
export const RedeemResponse = z.strictObject({ redemption_id: Ulid, voucher_code: VoucherCode, points: Points, points_from_referral: Points });
export const RedemptionDto = z.strictObject({
  id: Ulid,
  reward_id: Ulid,
  title: ShortText,
  partner: ShortText,
  voucher_code: VoucherCode,
  points: Points,
  status: RedemptionStatus,
  created_at: Instant,
});
export const RedemptionListResponse = z.strictObject({ items: z.array(RedemptionDto) });
export const BrokenRequest = z.strictObject({ text: FreeText(1000).optional() });
export const BrokenResponse = z.strictObject({ ticket_id: Ulid });
export const ReplaceVoucherRequest = z.strictObject({ voucher_code: VoucherCode.optional(), note: FreeText(1000) });
export const ReplaceVoucherResponse = z.strictObject({ redemption: RedemptionDto });

export const redemptionRoutes = defineRoutes({
  'redemptions.create': {
    module: 'redemptions', method: 'POST', path: '/redemptions', auth: ['student'],
    body: RedeemRequest, response: RedeemResponse, responseKind: 'json', status: [201], idempotencyKey: 'required',
    errors: [
      'EARN_IN_REQUIRED', 'FIRST_REDEEM_HOLD', 'PHONE_NOT_VERIFIED', 'WEEKLY_CAP', 'MONTHLY_CAP',
      'OUT_OF_STOCK', 'INSUFFICIENT_POINTS', 'REFERRAL_SHARE_EXCEEDED', 'IDEMPOTENCY_CONFLICT',
    ],
    spec: 'arch §8.2, §5.2',
  },
  'redemptions.list': {
    module: 'redemptions', method: 'GET', path: '/redemptions', auth: ['student'],
    response: RedemptionListResponse, responseKind: 'json', status: [200], errors: [], spec: 'arch §8.2',
  },
  'redemptions.broken': {
    module: 'redemptions', method: 'POST', path: '/redemptions/:id/broken', auth: ['owner'],
    params: IdParam, body: BrokenRequest, response: BrokenResponse, responseKind: 'json', status: [201],
    errors: ['ALREADY_REPORTED'], spec: 'arch §8.2',
  },
  'admin.redemptions.replace': {
    module: 'redemptions', method: 'POST', path: '/admin/redemptions/:id/replace', auth: ['admin'],
    params: IdParam, body: ReplaceVoucherRequest, response: ReplaceVoucherResponse, responseKind: 'json', status: [200],
    errors: ['OUT_OF_STOCK'], spec: 'arch §8.2 Beheer',
  },
});

// Inferred types (output side) for every schema above.
export type RedeemRequest = z.output<typeof RedeemRequest>;
export type RedeemResponse = z.output<typeof RedeemResponse>;
export type RedemptionDto = z.output<typeof RedemptionDto>;
export type RedemptionListResponse = z.output<typeof RedemptionListResponse>;
export type BrokenRequest = z.output<typeof BrokenRequest>;
export type BrokenResponse = z.output<typeof BrokenResponse>;
export type ReplaceVoucherRequest = z.output<typeof ReplaceVoucherRequest>;
export type ReplaceVoucherResponse = z.output<typeof ReplaceVoucherResponse>;
