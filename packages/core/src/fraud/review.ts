// Human review rules (spec §4.11, §6.4, §6.5; architecture §10.8). Every decision carries a reason
// code from a fixed list, and the student sees that reason in plain language (i18n key per code).
// A heuristic never decides: only an admin, and a block or appeal needs another admin.
import { addWorkdays, type FocusDay } from '../time/days.ts';

/** Reason codes per decision (spec §4.11 "redencode uit een vaste lijst"). */
export const FLAG_REASON_CODES = {
  release: ['no_evidence', 'pattern_explained', 'shared_network', 'outage_confirmed', 'late_log_valid', 'false_positive'],
  reject: ['automation', 'multiple_accounts', 'shared_device', 'unattended_device', 'implausible_pattern', 'clock_manipulation', 'incomplete_evidence'],
  block: ['fraud_confirmed', 'repeat_offence', 'blocked_phone_reuse'],
} as const;
export type FlagDecisionKind = keyof typeof FLAG_REASON_CODES;

/** Judgement criteria of the sample (voorregistratie §7.2), used as reason codes. */
export const SAMPLE_REASON_CODES = {
  none: ['anchor_confirmed', 'contact_confirmed'],
  suspect: ['no_anchor_no_contact', 'open_flag_in_week', 'pattern_unexplained', 'institution_email_in_use'],
  fraud: ['two_or_more_criteria', 'block_confirmed'],
} as const;

/** Criteria for "frauduleus" (two or more), voorregistratie §7.2. */
export const FRAUD_CRITERIA = ['shared_phone', 'h12_with_fraud_account', 'contact_denies_membership', 'device_mismatch', 'address_mismatch'] as const;

export const APPEAL_REASON_CODES = ['appeal_upheld', 'appeal_rejected'] as const;

export function isValidFlagReason(decision: FlagDecisionKind, code: string): boolean {
  return (FLAG_REASON_CODES[decision] as readonly string[]).includes(code);
}

export function isValidSampleReason(judgement: keyof typeof SAMPLE_REASON_CODES, code: string): boolean {
  return (SAMPLE_REASON_CODES[judgement] as readonly string[]).includes(code);
}

/** Appeal within 14 days after the decision (spec §6.5). */
export function appealWindowOpen(decidedAt: number, now: number, windowDays: number): boolean {
  return now >= decidedAt && now <= decidedAt + windowDays * 86_400_000;
}

/** Due day for a review decision (3 workdays) or an appeal decision (5 workdays). */
export function dueDay(fromDay: FocusDay, workdays: number): FocusDay {
  return addWorkdays(fromDay, workdays);
}

/**
 * Who may decide an appeal: any admin except those who worked on the original decision
 * (decided_by, block_confirmed_by; for prizes also verified_by, final_by, final_confirmed_by).
 * Empty means waiting for a third person (`waiting_for_third`, architecture §10.8).
 */
export function eligibleAppealReviewers(admins: readonly string[], involved: readonly (string | null | undefined)[]): string[] {
  const out = new Set(involved.filter((x): x is string => typeof x === 'string'));
  return admins.filter((a) => !out.has(a));
}

/** Four eyes: the confirming admin is never the deciding one. */
export function fourEyesOk(decidedBy: string | null, confirmer: string): boolean {
  return decidedBy !== null && decidedBy !== confirmer;
}

/** A sample item where an interest was declared goes to the second reviewer (jurist should-fix 6). */
export function mayJudgeSampleItem(item: { interestDeclaredBy: string | null; reassignedTo: string | null }, actor: string): boolean {
  if (item.interestDeclaredBy === actor) return false;
  if (item.interestDeclaredBy !== null && item.reassignedTo !== null) return item.reassignedTo === actor;
  return true;
}

/** Voorregistratie §7.2: "frauduleus" needs two or more criteria (or a confirmed block). */
export function judgementFromCriteria(c: { fraudCriteria: readonly string[]; blockConfirmed: boolean; suspectCriteria: readonly string[] }): 'none' | 'suspect' | 'fraud' {
  if (c.blockConfirmed || new Set(c.fraudCriteria).size >= 2) return 'fraud';
  if (c.suspectCriteria.length > 0 || c.fraudCriteria.length === 1) return 'suspect';
  return 'none';
}
