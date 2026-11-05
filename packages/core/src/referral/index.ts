// core/referral (spec §3.11, §4.9; architecture §3.4 referral). Owner WP-5.
// Vesting: the invitee completes 3 sessions of ≥ 25 min within 7 × 24 hours and his first-redeem
// hold is over; same device id as the inviter lapses; same IP hash within 24 h or same phone goes
// to a human; max 5 vested per inviter per calendar month; rest-period parties vest later.
import { compareDays, type FocusDay } from '../time/index.ts';

/** The referral slice of the parameter set (params.referral). */
export interface ReferralParams {
  readonly starts_on: FocusDay;
  readonly points_per_party: number;
  readonly vest_sessions: number;
  readonly vest_session_min: number;
  readonly vest_window_h: number;
  readonly max_vested_per_month: number;
  readonly max_price_share_pct: number;
}

export type ReferralStatus = 'pending' | 'review' | 'vested' | 'lapsed';

export interface ReferralSession {
  /** Server start instant (ms). */
  startAt: number;
  verifiedMin: number;
  completed: boolean;
  rejected: boolean;
}

export interface VestingInput {
  /** Instant (ms) the referral was created (the invitee registered). */
  createdAt: number;
  now: number;
  sessions: readonly ReferralSession[];
  /** Instant (ms) the invitee's first-redeem hold ends, or null when not yet known (earn-in not reached). */
  inviteeFirstRedeemAfter: number | null;
  sameDevice: boolean;
  sameIpWithin24h: boolean;
  samePhone: boolean;
  /** Already vested referrals of the inviter in the calendar month of `now`. */
  inviterVestedThisMonth: number;
}

export interface VestingDecision {
  status: ReferralStatus;
  qualifyingSessions: number;
  reason?: 'same_device' | 'same_ip' | 'same_phone' | 'deadline' | 'monthly_cap';
}

/** Sessions that count: completed, not rejected, ≥ 25 min, started within the 7 × 24 h window. */
export function qualifyingSessions(input: Pick<VestingInput, 'createdAt' | 'sessions'>, p: Pick<ReferralParams, 'vest_session_min' | 'vest_window_h'>): number {
  const end = input.createdAt + p.vest_window_h * 3_600_000;
  return input.sessions.filter((s) => s.completed && !s.rejected && s.verifiedMin >= p.vest_session_min && s.startAt >= input.createdAt && s.startAt < end).length;
}

/**
 * Next status of a pending referral (spec §4.9). The status only moves forward: `vested` and
 * `lapsed` are final, `review` waits for a human.
 */
export function evaluateVesting(input: VestingInput, p: ReferralParams): VestingDecision {
  const q = qualifyingSessions(input, p);
  if (input.sameDevice) return { status: 'lapsed', qualifyingSessions: q, reason: 'same_device' };
  const deadline = input.createdAt + p.vest_window_h * 3_600_000;
  if (q < p.vest_sessions) {
    return input.now >= deadline ? { status: 'lapsed', qualifyingSessions: q, reason: 'deadline' } : { status: 'pending', qualifyingSessions: q };
  }
  if (input.sameIpWithin24h) return { status: 'review', qualifyingSessions: q, reason: 'same_ip' };
  if (input.samePhone) return { status: 'review', qualifyingSessions: q, reason: 'same_phone' };
  // Sessions done: wait (without lapsing) for the end of the first-redeem hold.
  if (input.inviteeFirstRedeemAfter === null || input.now < input.inviteeFirstRedeemAfter) return { status: 'pending', qualifyingSessions: q };
  if (input.inviterVestedThisMonth >= p.max_vested_per_month) return { status: 'lapsed', qualifyingSessions: q, reason: 'monthly_cap' };
  return { status: 'vested', qualifyingSessions: q };
}

/**
 * Vesting day of one party in the rest period (spec §4.9 Rustperiode): a party with earnArm = rest
 * on the vesting day vests on the day after its squad's April window or on the focus day after its
 * rest exit, whichever is first; the other party vests normally.
 */
export function partyVestDay(vestDay: FocusDay, rest: { inRest: boolean; afterRestDay: FocusDay | null; afterExitDay: FocusDay | null }): FocusDay {
  if (!rest.inRest) return vestDay;
  const options = [rest.afterRestDay, rest.afterExitDay].filter((d): d is FocusDay => d !== null).sort(compareDays);
  const first = options[0];
  return first !== undefined && compareDays(first, vestDay) > 0 ? first : vestDay;
}

/** Referral is live only from its start day and behind the flag (spec §4.9 Start). */
export function referralLive(day: FocusDay, flagOn: boolean, p: Pick<ReferralParams, 'starts_on'>): boolean {
  return flagOn && compareDays(day, p.starts_on) >= 0;
}
