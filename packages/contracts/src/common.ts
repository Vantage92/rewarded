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
