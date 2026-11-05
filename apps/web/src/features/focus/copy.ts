// Fixed abort codes and their copy keys (spec §4.1 "Wat telt als afgebroken", UX §6.2). Support
// uses the same codes, so the keys never depend on the wording.
import type { AbortReason, PlannedMin, SessionLengthMin } from '@rewarded/core/session';

export const ABORT_CODES: readonly AbortReason[] = ['hidden', 'heartbeat_gap', 'user_stop', 'second_session', 'late_end'];

export const SESSION_LENGTHS: readonly SessionLengthMin[] = [25, 50, 90];

/** Codes where an automatic signal costs points: "Klopt dit niet?" is a button, not a link (UX F6). */
export function reportIsProminent(code: AbortReason): boolean {
  return code === 'heartbeat_gap' || code === 'late_end';
}

/** The next shorter length after an aborted 50 or 90 (spec §3.3 step 3); null for 25 and practice. */
export function shorterLength(planned: PlannedMin): SessionLengthMin | null {
  if (planned === 90) return 50;
  if (planned === 50) return 25;
  return null;
}

/** Whole minutes held ("Je hield 18 minuten vol"). */
export function minutesHeld(elapsedS: number): number {
  return Math.max(0, Math.floor(elapsedS / 60));
}

/** Choices in the report sheet per code (UX §4.3 table). */
export const REPORT_CHOICES: Record<AbortReason, readonly string[]> = {
  hidden: ['call', 'notification', 'screen_off', 'other'],
  user_stop: ['accidental', 'other'],
  second_session: ['not_me', 'other'],
  heartbeat_gap: ['wifi', 'battery', 'other'],
  late_end: ['no_connection_end', 'other'],
};

export function reportToastKey(code: AbortReason): string {
  if (code === 'hidden') return 'focus:report.sent_hidden';
  if (code === 'user_stop') return 'focus:report.sent_user_stop';
  return 'focus:report.sent_review';
}

export function isSessionLength(n: number): n is SessionLengthMin {
  return n === 25 || n === 50 || n === 90;
}
