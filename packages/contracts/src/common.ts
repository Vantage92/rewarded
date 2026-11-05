// Shared primitives and domain enumerations used by the module schemas (architecture §3, §8.1).
// Every object schema is strict: unknown fields are rejected on both sides (architecture §10.3).
// Domain unions mirror architecture §3; packages/core is still a stub (WP-1), so they live here
// as zod enums and core can re-export or narrow them later without changing the wire format.
import { z } from 'zod';

/** Server-generated identifier (architecture §3). */
export const Ulid = z.ulid();
/** Opaque reference for another person (member_ref, user_ref); never a raw user id. */
export const Ref = z.string().regex(/^[A-Za-z0-9_-]{8,64}$/);
/** 128-bit random token, base64url (invites, cards, magic links). */
export const Token = z.string().regex(/^[A-Za-z0-9_-]{16,128}$/);
/** ISO-8601 instant in UTC. */
export const Instant = z.iso.datetime({ offset: false });
/** Focus day YYYY-MM-DD (day boundary 04:00 Europe/Amsterdam, spec §4.2). */
export const FocusDay = z.iso.date();
/** ISO week key, e.g. 2026-W49. */
export const WeekKey = z.string().regex(/^\d{4}-W\d{2}$/);
export const Email = z.email().max(254);
export const Cents = z.number().int();
export const Points = z.number().int();
export const Minutes = z.number().int().min(0);
export const NonNegInt = z.number().int().min(0);
export const PosInt = z.number().int().min(1);
/** Bounded free text, stored as text and never rendered as HTML (architecture §10.3). */
export const FreeText = (max = 500) => z.string().trim().min(1).max(max);
export const ShortText = z.string().trim().min(1).max(120);
export const VersionTag = z.string().regex(/^[A-Za-z0-9._-]{1,32}$/);
export const Url = z.string().max(2048).regex(/^(https?:\/\/|\/)[^\s]*$/);
export const ReasonCode = z.string().regex(/^[a-z][a-z0-9_]{1,47}$/);

export const Locale = z.enum(['nl', 'en']);
export const AgeBand = z.enum(['16_17', '18_plus']);
export const UserStatus = z.enum(['active', 'blocked', 'deleted']);
/** Coarse user-agent class; the client reports it, the server stores it (architecture §3.1 device). */
export const UaClass = z.enum(['ios_safari', 'ios_webview', 'android_chrome', 'android_webview', 'desktop', 'other']);
export const NetClass = z.enum(['campus', 'mobile_cgnat', 'other']);

export const InviteSource = z.enum(['squad', 'duel', 'club', 'personal', 'ambassador', 'waitlist', 'card']);
export const WaitlistSource = z.enum(['landing', 'card', 'club_qr', 'ambassador', 'creator', 'other']);
export const WaitlistPriority = z.enum(['group', 'club', 'card', 'none']);

// Sessions (architecture §3.2, spec §4.1).
export const PlannedMin = z.union([z.literal(1), z.literal(25), z.literal(50), z.literal(90)]);
export const SessionStatus = z.enum(['active', 'completed', 'aborted']);
export const AbortReason = z.enum(['hidden', 'heartbeat_gap', 'user_stop', 'second_session', 'late_end']);
export const ReviewStatus = z.enum(['none', 'pending', 'released', 'rejected']);
export const Visibility = z.enum(['visible', 'hidden']);
export const WakelockState = z.enum(['acquired', 'denied', 'released', 'unsupported']);
export const VisibilityEventKind = z.enum([
  'visible',
  'hidden',
  'pagehide',
  'pageshow',
  'blur',
  'focus',
  'wakelock_acquired',
  'wakelock_denied',
  'wakelock_released',
  'online',
  'offline',
  'first_interaction_after_end',
]);
export const PointsStatus = z.enum(['available', 'pending', 'none']);

// Fraud and review (architecture §3.2, spec §6).
export const FlagCode = z.enum(['H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'H7', 'H8', 'H9', 'H10', 'H11', 'USER_REPORT', 'NAME_REPORT', 'SAMPLE', 'OUTAGE']);
export const FlagSubjectType = z.enum(['session', 'account', 'squad', 'club']);
export const FlagStatus = z.enum(['open', 'released', 'rejected', 'blocked', 'closed']);
export const FlagDecision = z.enum(['release', 'reject', 'block']);
export const AppealObjectType = z.enum(['flag', 'redemption', 'block', 'prize']);
export const AppealOutcome = z.enum(['upheld', 'rejected']);
export const HarmCode = z.enum(['S1', 'S2', 'S3', 'S4']);
export const SampleJudgement = z.enum(['none', 'suspect', 'fraud']);
export const RestoreReason = z.enum(['outage', 'late_log', 'appeal_upheld']);

// Points, catalog and redemptions (architecture §3.3, §5.1).
export const LedgerEntryType = z.enum([
  'earn_session',
  'earn_topup',
  'release_flag',
  'reverse',
  'goal_bonus',
  'goal_bonus_release',
  'goal_bonus_reverse',
  'goal_budget_grant',
  'goal_budget_secure',
  'goal_budget_lapse',
  'goal_secure_reverse',
  'goal_lapse_reverse',
  'redeem',
  'redeem_refund',
  'adjust',
  'referral_pending',
  'referral_vest',
  'referral_lapse',
  'expire',
]);
export const LedgerLineStatus = z.enum(['available', 'pending', 'unvested', 'reversed', 'lapsed', 'redeemed', 'expired']);
export const RewardKind = z.enum(['in_kind', 'service', 'partner_discount']);
export const RewardStatus = z.enum(['draft', 'published', 'offline']);
export const PartnerKind = z.enum(['vereniging', 'faculteit', 'sponsor', 'werkgever', 'rewarded']);
export const BudgetKind = z.enum(['direct_reward', 'revenue', 'own_budget']);
export const RedemptionStatus = z.enum(['reserved', 'delivered', 'replaced', 'refunded']);

// Experiments (spec §7.3, architecture §3.5).
export const ArmBonus = z.enum(['A', 'B']);
export const ArmBelofte = z.enum(['early', 'late']);
export const ArmRest = z.enum(['rest', 'continue']);
export const ArmPrompt = z.enum(['strong', 'standard', 'na']);
export const ExperimentFactor = z.enum(['bonus', 'belofte', 'rest', 'prompt']);
export const ExperimentUnit = z.enum(['squad', 'solo']);
export const ArmSwitchReason = z.enum(['join', 'merge', 'minor', 'opt_out', 'arm_b_stopped']);
export const EarnArm = z.enum(['earn', 'rest']);
export const GoalState = z.enum(['none', 'pending', 'available', 'secured', 'lapsed', 'postponed', 'exam']);

// Social (architecture §3.4).
export const SquadStatus = z.enum(['building', 'active', 'archived']);
export const SquadNameStatus = z.enum(['pending', 'ok', 'rejected', 'reported']);
export const DuelStatus = z.enum(['open', 'expired', 'running', 'pending_review', 'finished']);
export const DuelResult = z.enum(['challenger', 'opponent', 'tie']);
export const ClubPool = z.enum(['lt150', '150_500', 'gt500']);
export const MembersSourceKind = z.enum(['institution', 'board_grant', 'faculty', 'self']);
export const ChallengeType = z.enum(['club_warmup', 'club_prize', 'performance']);
export const ChallengeStatus = z.enum(['draft', 'published', 'running', 'review', 'final']);
export const EnrollmentStatus = z.enum(['enrolled', 'achieved', 'failed', 'verified', 'rejected', 'withdrawn']);
export const BelofteWitnesses = z.enum(['squad', 'none']);
export const BelofteStatus = z.enum(['active', 'completed', 'stopped']);
export const BelofteTrigger = z.enum(['early', 'late', 'outside']);
export const BelofteReflectionAction = z.enum(['extend', 'adjust', 'stop']);
export const StakeInterest = z.enum(['yes', 'no', 'unsure']);
export const SurveyMoment = z.enum(['intake', 'reflection', 'end_january', 'april']);
export const CardKind = z.enum(['session', 'streak', 'week', 'belofte']);
export const CardFormat = z.enum(['9x16', '1x1']);
export const ReferralStatus = z.enum(['pending', 'review', 'vested', 'lapsed']);
export const PrizeKind = z.enum(['earned_collective', 'earned_individual']);
export const PrizeStatus = z.enum(['open', 'candidate', 'verified', 'delivered', 'rejected']);
export const SupportKind = z.enum(['redemption_broken', 'session', 'other', 'external']);
export const SupportLabel = z.enum(['uitbetalen', 'focus', 'vrienden', 'techniek', 'welzijn']);
export const SupportStatus = z.enum(['open', 'resolved']);
export const AdminRole = z.enum(['reviewer', 'admin']);

/** Feature flags (architecture §3.5); `draws` is an empty placeholder that can never be enabled. */
export const FeatureFlagKey = z.enum([
  'referral',
  'cards',
  'duels',
  'belofte',
  'arm_b',
  'rest_period',
  'squad_prompt',
  'no_points_mode',
  'plus_door',
  'reminders',
  'draws',
]);
export const FeatureFlags = z.strictObject(
  Object.fromEntries(FeatureFlagKey.options.map((k) => [k, z.boolean()])) as Record<z.infer<typeof FeatureFlagKey>, z.ZodBoolean>,
);

/** Cursor pagination (architecture §8.1). */
export const PageQuery = z.strictObject({
  cursor: z.string().max(256).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});
export const NextCursor = z.string().max(256).nullable();

export const Empty = z.strictObject({});
/** 204 No Content. */
export const NoContent = z.undefined();

export const IdParam = z.strictObject({ id: Ulid });
export const TokenParam = z.strictObject({ token: Token });

// Inferred types (output side) for every schema above.
export type Ulid = z.output<typeof Ulid>;
export type Ref = z.output<typeof Ref>;
export type Token = z.output<typeof Token>;
export type Instant = z.output<typeof Instant>;
export type FocusDay = z.output<typeof FocusDay>;
export type WeekKey = z.output<typeof WeekKey>;
export type Email = z.output<typeof Email>;
export type Cents = z.output<typeof Cents>;
export type Points = z.output<typeof Points>;
export type Minutes = z.output<typeof Minutes>;
export type NonNegInt = z.output<typeof NonNegInt>;
export type PosInt = z.output<typeof PosInt>;
export type ShortText = z.output<typeof ShortText>;
export type VersionTag = z.output<typeof VersionTag>;
export type Url = z.output<typeof Url>;
export type ReasonCode = z.output<typeof ReasonCode>;
export type Locale = z.output<typeof Locale>;
export type AgeBand = z.output<typeof AgeBand>;
export type UserStatus = z.output<typeof UserStatus>;
export type UaClass = z.output<typeof UaClass>;
export type NetClass = z.output<typeof NetClass>;
export type InviteSource = z.output<typeof InviteSource>;
export type WaitlistSource = z.output<typeof WaitlistSource>;
export type WaitlistPriority = z.output<typeof WaitlistPriority>;
export type PlannedMin = z.output<typeof PlannedMin>;
export type SessionStatus = z.output<typeof SessionStatus>;
export type AbortReason = z.output<typeof AbortReason>;
export type ReviewStatus = z.output<typeof ReviewStatus>;
export type Visibility = z.output<typeof Visibility>;
export type WakelockState = z.output<typeof WakelockState>;
export type VisibilityEventKind = z.output<typeof VisibilityEventKind>;
export type PointsStatus = z.output<typeof PointsStatus>;
export type FlagCode = z.output<typeof FlagCode>;
export type FlagSubjectType = z.output<typeof FlagSubjectType>;
export type FlagStatus = z.output<typeof FlagStatus>;
export type FlagDecision = z.output<typeof FlagDecision>;
export type AppealObjectType = z.output<typeof AppealObjectType>;
export type AppealOutcome = z.output<typeof AppealOutcome>;
export type HarmCode = z.output<typeof HarmCode>;
export type SampleJudgement = z.output<typeof SampleJudgement>;
export type RestoreReason = z.output<typeof RestoreReason>;
export type LedgerEntryType = z.output<typeof LedgerEntryType>;
export type LedgerLineStatus = z.output<typeof LedgerLineStatus>;
export type RewardKind = z.output<typeof RewardKind>;
export type RewardStatus = z.output<typeof RewardStatus>;
export type PartnerKind = z.output<typeof PartnerKind>;
export type BudgetKind = z.output<typeof BudgetKind>;
export type RedemptionStatus = z.output<typeof RedemptionStatus>;
export type ArmBonus = z.output<typeof ArmBonus>;
export type ArmBelofte = z.output<typeof ArmBelofte>;
export type ArmRest = z.output<typeof ArmRest>;
export type ArmPrompt = z.output<typeof ArmPrompt>;
export type ExperimentFactor = z.output<typeof ExperimentFactor>;
export type ExperimentUnit = z.output<typeof ExperimentUnit>;
export type ArmSwitchReason = z.output<typeof ArmSwitchReason>;
export type EarnArm = z.output<typeof EarnArm>;
export type GoalState = z.output<typeof GoalState>;
export type SquadStatus = z.output<typeof SquadStatus>;
export type SquadNameStatus = z.output<typeof SquadNameStatus>;
export type DuelStatus = z.output<typeof DuelStatus>;
export type DuelResult = z.output<typeof DuelResult>;
export type ClubPool = z.output<typeof ClubPool>;
export type MembersSourceKind = z.output<typeof MembersSourceKind>;
export type ChallengeType = z.output<typeof ChallengeType>;
export type ChallengeStatus = z.output<typeof ChallengeStatus>;
export type EnrollmentStatus = z.output<typeof EnrollmentStatus>;
export type BelofteWitnesses = z.output<typeof BelofteWitnesses>;
export type BelofteStatus = z.output<typeof BelofteStatus>;
export type BelofteTrigger = z.output<typeof BelofteTrigger>;
export type BelofteReflectionAction = z.output<typeof BelofteReflectionAction>;
export type StakeInterest = z.output<typeof StakeInterest>;
export type SurveyMoment = z.output<typeof SurveyMoment>;
export type CardKind = z.output<typeof CardKind>;
export type CardFormat = z.output<typeof CardFormat>;
export type ReferralStatus = z.output<typeof ReferralStatus>;
export type PrizeKind = z.output<typeof PrizeKind>;
export type PrizeStatus = z.output<typeof PrizeStatus>;
export type SupportKind = z.output<typeof SupportKind>;
export type SupportLabel = z.output<typeof SupportLabel>;
export type SupportStatus = z.output<typeof SupportStatus>;
export type AdminRole = z.output<typeof AdminRole>;
export type FeatureFlagKey = z.output<typeof FeatureFlagKey>;
export type FeatureFlags = z.output<typeof FeatureFlags>;
export type PageQuery = z.output<typeof PageQuery>;
export type NextCursor = z.output<typeof NextCursor>;
export type Empty = z.output<typeof Empty>;
export type NoContent = z.output<typeof NoContent>;
export type IdParam = z.output<typeof IdParam>;
export type TokenParam = z.output<typeof TokenParam>;
