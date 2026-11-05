// Error codes with their owning module and HTTP status (architecture §8.1, §8.3, §12.3).
// The message key is `errors.<module>.<code in lower case>`; the namespace is the module that owns
// the code and therefore its translation file i18n/<lang>/errors/<module>.json.
import { z } from 'zod';

/** API modules (architecture §2) plus `common` for the shared codes of WP-3. */
export const API_MODULES = [
  'common',
  'auth',
  'waitlist',
  'dev',
  'events',
  'sessions',
  'points',
  'catalog',
  'redemptions',
  'phone',
  'squads',
  'invites',
  'duels',
  'clubs',
  'challenges',
  'leaderboards',
  'belofte',
  'cards',
  'referral',
  'reminders',
  'surveys',
  'fraud',
  'draws',
  'privacy',
  'kpi',
  'support',
  'admin',
] as const;
export type ApiModuleName = (typeof API_MODULES)[number];

type ErrorDef = { module: ApiModuleName; http: number };

/** Every code from architecture §8.3, exactly once, with one owner. */
export const ERROR_CODES = {
  // common (WP-3): shared by every module
  VALIDATION_FAILED: { module: 'common', http: 422 },
  AUTH_REQUIRED: { module: 'common', http: 401 },
  FORBIDDEN: { module: 'common', http: 403 },
  CSRF_INVALID: { module: 'common', http: 403 },
  NOT_FOUND: { module: 'common', http: 404 },
  FEATURE_DISABLED: { module: 'common', http: 404 },
  IDEMPOTENCY_CONFLICT: { module: 'common', http: 409 },
  RATE_LIMITED: { module: 'common', http: 429 },
  INTERNAL: { module: 'common', http: 500 },
  MAINTENANCE: { module: 'common', http: 503 },
  // auth
  LINK_INVALID: { module: 'auth', http: 401 },
  LINK_EXPIRED: { module: 'auth', http: 401 },
  CODE_INVALID: { module: 'auth', http: 422 },
  CODE_EXPIRED: { module: 'auth', http: 410 },
  TOO_MANY_ATTEMPTS: { module: 'auth', http: 429 },
  INVITE_REQUIRED: { module: 'auth', http: 403 },
  AGE_BELOW_MINIMUM: { module: 'auth', http: 403 },
  AGE_RESTRICTED: { module: 'auth', http: 403 },
  ACCOUNT_BLOCKED: { module: 'auth', http: 403 },
  TERMS_OUTDATED: { module: 'auth', http: 409 },
  ALREADY_OPTED_OUT: { module: 'auth', http: 409 },
  // admin
  MFA_REQUIRED: { module: 'admin', http: 401 },
  MFA_INVALID: { module: 'admin', http: 401 },
  REASON_REQUIRED: { module: 'admin', http: 422 },
  FOUR_EYES_REQUIRED: { module: 'admin', http: 409 },
  AGE_CHECK_REQUIRED: { module: 'admin', http: 409 },
  BOARD_MEMBER_CONFLICT: { module: 'admin', http: 409 },
  // sessions
  INVALID_DURATION: { module: 'sessions', http: 422 },
  SESSION_CLOSED: { module: 'sessions', http: 409 },
  SESSION_NOT_ABORTED: { module: 'sessions', http: 409 },
  SESSION_NOT_RESTORABLE: { module: 'sessions', http: 409 },
  NONCE_INVALID: { module: 'sessions', http: 409 },
  // points (goals, exam days, today)
  EXAM_DAY_LIMIT: { module: 'points', http: 422 },
  PERIOD_LOCKED: { module: 'points', http: 409 },
  OVERREACH_CONFIRM_REQUIRED: { module: 'points', http: 409 },
  // catalog (partners, budgets, rewards)
  CEILING_EXCEEDED: { module: 'catalog', http: 422 },
  KIND_NOT_ALLOWED: { module: 'catalog', http: 422 },
  DOCUMENT_REQUIRED: { module: 'catalog', http: 422 },
  DECLARATION_REQUIRED: { module: 'catalog', http: 422 },
  CASH_CHECK_REQUIRED: { module: 'catalog', http: 422 },
  COVERAGE_INSUFFICIENT: { module: 'catalog', http: 409 },
  PRICE_IMMUTABLE: { module: 'catalog', http: 409 },
  // redemptions
  EARN_IN_REQUIRED: { module: 'redemptions', http: 409 },
  FIRST_REDEEM_HOLD: { module: 'redemptions', http: 409 },
  WEEKLY_CAP: { module: 'redemptions', http: 409 },
  MONTHLY_CAP: { module: 'redemptions', http: 409 },
  OUT_OF_STOCK: { module: 'redemptions', http: 409 },
  INSUFFICIENT_POINTS: { module: 'redemptions', http: 409 },
  REFERRAL_SHARE_EXCEEDED: { module: 'redemptions', http: 409 },
  // phone
  PHONE_NOT_VERIFIED: { module: 'phone', http: 409 },
  PHONE_IN_USE: { module: 'phone', http: 409 },
  PHONE_TYPE_NOT_ALLOWED: { module: 'phone', http: 422 },
  // invites
  INVITE_INVALID: { module: 'invites', http: 410 },
  INVITE_EXPIRED: { module: 'invites', http: 410 },
  INVITE_EXHAUSTED: { module: 'invites', http: 410 },
  // squads
  ALREADY_IN_SQUAD: { module: 'squads', http: 409 },
  SQUAD_FULL: { module: 'squads', http: 409 },
  NOT_IN_SQUAD: { module: 'squads', http: 404 },
  COMPARE_OPT_IN_REQUIRED: { module: 'squads', http: 403 },
  INVITE_MOMENT_NOT_ALLOWED: { module: 'squads', http: 409 },
  NAME_REJECTED: { module: 'squads', http: 409 },
  NOT_ELIGIBLE: { module: 'squads', http: 409 },
  // duels
  DUEL_ACTIVE: { module: 'duels', http: 409 },
  // clubs
  ALREADY_LINKED: { module: 'clubs', http: 409 },
  AGREEMENT_REQUIRED: { module: 'clubs', http: 409 },
  MEMBERS_FIXED: { module: 'clubs', http: 409 },
  // challenges
  SEATS_FULL: { module: 'challenges', http: 409 },
  ENROLLMENT_CLOSED: { module: 'challenges', http: 409 },
  NOT_ENROLLED: { module: 'challenges', http: 404 },
  // belofte
  BELOFTE_ACTIVE: { module: 'belofte', http: 409 },
  OFFER_NOT_YET: { module: 'belofte', http: 409 },
  // cards
  SESSION_UNDER_REVIEW: { module: 'cards', http: 409 },
  CARD_UNAVAILABLE: { module: 'cards', http: 404 },
  // surveys
  NOT_DUE: { module: 'surveys', http: 409 },
  // events
  UNKNOWN_EVENT: { module: 'events', http: 422 },
  // fraud (queue, reports, appeals, samples, institution anchor)
  ALREADY_REPORTED: { module: 'fraud', http: 409 },
  ALREADY_APPEALED: { module: 'fraud', http: 409 },
  APPEAL_WINDOW_CLOSED: { module: 'fraud', http: 409 },
  SAME_REVIEWER: { module: 'fraud', http: 409 },
  NO_ELIGIBLE_REVIEWER: { module: 'fraud', http: 409 },
  SAMPLE_REQUIRED: { module: 'fraud', http: 409 },
  DOMAIN_NOT_ALLOWED: { module: 'fraud', http: 422 },
  INSTITUTION_EMAIL_IN_USE: { module: 'fraud', http: 409 },
  // privacy
  CONFIRMATION_REQUIRED: { module: 'privacy', http: 422 },
} as const satisfies Record<string, ErrorDef>;

export type ErrorCode = keyof typeof ERROR_CODES;
export const ERROR_CODE_LIST = Object.keys(ERROR_CODES) as ErrorCode[];
export const ErrorCodeSchema = z.enum(ERROR_CODE_LIST as [ErrorCode, ...ErrorCode[]]);

export function errorModule(code: ErrorCode): ApiModuleName {
  return ERROR_CODES[code].module;
}
export function errorStatus(code: ErrorCode): number {
  return ERROR_CODES[code].http;
}
/** i18n key in the namespace of the owning module, e.g. errors.redemptions.weekly_cap. */
export function messageKey(code: ErrorCode): string {
  return `errors.${ERROR_CODES[code].module}.${code.toLowerCase()}`;
}
export function isErrorCode(value: string): value is ErrorCode {
  return Object.hasOwn(ERROR_CODES, value);
}

/** Codes any route can return without listing them (middleware: auth, CSRF, validation, rate limit). */
export const IMPLICIT_ERRORS = ['VALIDATION_FAILED', 'AUTH_REQUIRED', 'FORBIDDEN', 'CSRF_INVALID', 'RATE_LIMITED', 'INTERNAL', 'MAINTENANCE'] as const satisfies readonly ErrorCode[];

export const ApiErrorBodySchema = z.strictObject({
  error: z.strictObject({
    code: z.string().regex(/^[A-Z][A-Z0-9_]{1,63}$/),
    message_key: z.string().regex(/^errors\.[a-z_]+\.[a-z0-9_]+$/),
    details: z.record(z.string(), z.unknown()).optional(),
  }),
});

/** Shape of every error response (architecture §8.1). */
export type ApiErrorBody = {
  error: {
    code: string;
    message_key: string;
    details?: Record<string, unknown>;
  };
};

/** Builds an error body with the right message key; used by the API and by the mock client. */
export function errorBody(code: ErrorCode, details?: Record<string, unknown>): ApiErrorBody {
  return { error: details ? { code, message_key: messageKey(code), details } : { code, message_key: messageKey(code) } };
}

/**
 * Error thrown by domain code and service implementations; the API error handler maps it to the
 * error body with the status and message key of the code (architecture §8.1).
 */
export class DomainError extends Error {
  readonly code: ErrorCode;
  readonly details: Record<string, unknown> | undefined;
  constructor(code: ErrorCode, details?: Record<string, unknown>) {
    super(code);
    this.name = 'DomainError';
    this.code = code;
    this.details = details;
  }
  get status(): number {
    return ERROR_CODES[this.code].http;
  }
  get messageKey(): string {
    return messageKey(this.code);
  }
}
