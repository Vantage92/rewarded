// Retention periods (architecture §10.6) as data, so the retention step and its test read one table.
// The periods are working hypotheses (spec §4.10 where it names one, else a choice), to be fixed in
// the DPIA. Cut-offs are computed from `now`; the API applies them per table.

export const DAY_MS = 86_400_000;

export const RETENTION = {
  /** ip_hash, net_class, ua_class on sessions, magic links, registration, club links, waitlist (spec §4.10). */
  networkDays: 30,
  /** focus_session.device_id, 30 days after the end of the session. */
  sessionDeviceDays: 30,
  /** Raw heartbeats and visibility events (spec §4.10), then summarised. */
  heartbeatDays: 90,
  /** device rows after last_seen_at. */
  deviceDays: 180,
  /** fraud_flag.evidence: decision plus the appeal window, or until the appeal decision. */
  appealWindowDays: 14,
  /** fraud_flag row and fraud_sample_item after the decision or judgement. */
  flagYears: 2,
  /** appeal.text after the decision. */
  appealTextDays: 90,
  /** support_ticket.text after resolution (founder J8). */
  supportTextDays: 90,
  /** prize_delivery_contact after delivery. */
  deliveryContactDays: 30,
  /** auth_magic_link, phone_verification, idempotency_record. */
  shortLivedHours: 24,
  /** reminder_log. */
  reminderDays: 30,
  /** Invited waitlist entries after the invitation. */
  waitlistInvitedDays: 30,
  /** Revoked cards after revocation. */
  revokedCardDays: 30,
  /** audit_log (founder JS5). */
  auditYears: 2,
  /** Raw events, survey_response and harm_signal: until after the April analysis (founder JS5). */
  rawEventsUntil: '2027-06-15',
} as const;

export function daysBefore(now: number, days: number): number {
  return now - days * DAY_MS;
}

/** Calendar years back (2 years after a decision on 2026-12-01 is 2028-12-01). */
export function yearsBefore(now: number, years: number): number {
  const d = new Date(now);
  d.setUTCFullYear(d.getUTCFullYear() - years);
  return d.getTime();
}

export interface RetentionCutoffs {
  network: number;
  sessionDevice: number;
  heartbeat: number;
  device: number;
  evidence: number;
  flagRow: number;
  appealText: number;
  supportText: number;
  deliveryContact: number;
  shortLived: number;
  reminder: number;
  waitlistInvited: number;
  revokedCard: number;
  audit: number;
  /** True once the raw events may be aggregated (after 15 June 2027, end of day UTC). */
  rawEventsExpired: boolean;
}

export function retentionCutoffs(now: number): RetentionCutoffs {
  const r = RETENTION;
  return {
    network: daysBefore(now, r.networkDays),
    sessionDevice: daysBefore(now, r.sessionDeviceDays),
    heartbeat: daysBefore(now, r.heartbeatDays),
    device: daysBefore(now, r.deviceDays),
    evidence: daysBefore(now, r.appealWindowDays),
    flagRow: yearsBefore(now, r.flagYears),
    appealText: daysBefore(now, r.appealTextDays),
    supportText: daysBefore(now, r.supportTextDays),
    deliveryContact: daysBefore(now, r.deliveryContactDays),
    shortLived: now - r.shortLivedHours * 3_600_000,
    reminder: daysBefore(now, r.reminderDays),
    waitlistInvited: daysBefore(now, r.waitlistInvitedDays),
    revokedCard: daysBefore(now, r.revokedCardDays),
    audit: yearsBefore(now, r.auditYears),
    rawEventsExpired: now >= Date.parse(`${r.rawEventsUntil}T23:59:59.999Z`),
  };
}

/** Evidence keys that survive the reduction: codes and threshold values only (architecture §10.6). */
export const REDUCED_EVIDENCE_KEYS = ['threshold', 'threshold_pct', 'min_overlap_min', 'window_h', 'window_min', 'days', 'net_class', 'ua_class', 'week'] as const;

export function reduceEvidence(evidence: Readonly<Record<string, unknown>>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const k of REDUCED_EVIDENCE_KEYS) if (k in evidence && (typeof evidence[k] !== 'object' || evidence[k] === null)) out[k] = evidence[k];
  return out;
}
