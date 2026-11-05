// Server verifier (architecture §4.3, spec §4.1). One pure function: same input, same verdict.
// Steps: nonce chain (contacts), hidden, gaps (with buffered log and outages), end, flags (H1, H3, H4).
import { MS_PER_MINUTE } from '../time/index.ts';
import type { Instant } from '../time/index.ts';
import { ABORTING_EVENT_KINDS } from './types.ts';
import type {
  AbortReason,
  EvaluateSessionInput,
  Heartbeat,
  OutageWindow,
  SessionFlagCode,
  SessionMetrics,
  SessionVerdict,
} from './types.ts';

/** A moment of proven contact: server receive time plus the client's monotonic reading. */
interface Contact {
  at: Instant;
  mono: number;
}

interface Abort {
  reason: AbortReason;
  at: Instant;
}

const S = 1000;

function median(values: readonly number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1 ? (sorted[mid] as number) : Math.round(((sorted[mid - 1] as number) + (sorted[mid] as number)) / 2);
}

function overlapsOutage(from: Instant, to: Instant, outages: readonly OutageWindow[]): boolean {
  return outages.some((o) => o.from < to && o.to > from);
}

/** Planned duration in ms. */
export function plannedMs(plannedMin: number): number {
  return plannedMin * MS_PER_MINUTE;
}

/**
 * Valid online contacts in server order: the start, online/resume heartbeats that carried the
 * current nonce (architecture §4.3 step 1), and the end report. Buffered heartbeats never count.
 */
export function validContacts(input: EvaluateSessionInput): Contact[] {
  const { session, heartbeats, endReport } = input;
  const out: Contact[] = [{ at: session.serverStartAt, mono: session.monoStartMs }];
  for (const h of heartbeats) {
    if (h.kind !== 'buffered' && h.nonceOk && !h.buffered) out.push({ at: h.serverRecvAt, mono: h.monoMs });
  }
  if (endReport) out.push({ at: endReport.serverRecvAt, mono: endReport.monoMs });
  return out.sort((a, b) => a.at - b.at || a.mono - b.mono);
}

/**
 * Whether the buffered log covers the gap between two contacts (spec §4.1 table, architecture §4.3):
 * buffered heartbeats at most `gap_ok_s` apart in monotonic time, no hidden in the gap (checked
 * separately), and the monotonic elapsed time within `mono_tolerance_s` of the server elapsed time.
 * `ref` is the contact used for the clock comparison (the end report for the final gap).
 */
function gapCovered(a: Contact, bMono: number, ref: Contact, buffered: readonly Heartbeat[], gapOkMs: number, toleranceMs: number): boolean {
  const points = [a.mono, ...buffered.filter((h) => h.monoMs > a.mono && h.monoMs < bMono).map((h) => h.monoMs).sort((x, y) => x - y), bMono];
  for (let i = 1; i < points.length; i++) {
    if ((points[i] as number) - (points[i - 1] as number) > gapOkMs) return false;
  }
  return Math.abs(ref.mono - a.mono - (ref.at - a.at)) <= toleranceMs;
}

/** evaluateSession (architecture §4.3). Idempotent and monotone in `now`. */
export function evaluateSession(input: EvaluateSessionInput): SessionVerdict {
  const { session, heartbeats, events, endReport, outages, now, params } = input;
  const durationMs = plannedMs(session.plannedMin);
  const monoEnd = session.monoStartMs + durationMs;
  const gapOkMs = params.gap_ok_s * S;
  const gapMaxMs = params.gap_covered_max_s * S;
  const toleranceMs = params.mono_tolerance_s * S;
  const endToleranceMs = params.end_tolerance_s * S;
  const graceMs = params.end_grace_min * MS_PER_MINUTE;
  const contacts = validContacts(input);
  const buffered = heartbeats.filter((h) => h.kind === 'buffered' || h.buffered);

  // Step 2: earliest hidden/pagehide (events or heartbeats reporting hidden) before the end.
  const hiddenMarks: { mono: number; recv: Instant }[] = [];
  for (const e of events) {
    if (ABORTING_EVENT_KINDS.includes(e.kind) && e.monoMs < monoEnd) hiddenMarks.push({ mono: e.monoMs, recv: e.serverRecvAt });
  }
  for (const h of heartbeats) {
    if (h.visibility === 'hidden' && h.monoMs < monoEnd) hiddenMarks.push({ mono: h.monoMs, recv: h.serverRecvAt });
  }
  hiddenMarks.sort((a, b) => a.mono - b.mono);
  const hiddenCount = events.filter((e) => ABORTING_EVENT_KINDS.includes(e.kind)).length;

  let hiddenAbort: Abort | null = null;
  const firstHidden = hiddenMarks[0];
  if (firstHidden) {
    const raw = session.serverStartAt + Math.max(0, firstHidden.mono - session.monoStartMs);
    // Clamp between the last valid contact before it (in monotonic order) and its receive time.
    let lower = session.serverStartAt;
    for (const c of contacts) if (c.mono <= firstHidden.mono && c.at <= firstHidden.recv) lower = Math.max(lower, c.at);
    const at = Math.min(Math.max(raw, lower), Math.max(lower, firstHidden.recv));
    hiddenAbort = { reason: 'hidden', at };
  }

  // End evidence: the end report once server elapsed ≥ duration − 30 s, or any valid contact at or
  // after the planned end. A late end report (client offline at the end) is checked by the gap rules.
  const endEvidence =
    (endReport && endReport.serverRecvAt - session.serverStartAt >= durationMs - endToleranceMs
      ? { at: endReport.serverRecvAt, mono: endReport.monoMs }
      : null) ?? contacts.find((c) => c.at >= session.plannedEndAt) ?? null;
  const terminal = endEvidence;

  // Step 3: gaps between consecutive contacts inside [start, planned end].
  let coveredMs = 0;
  let maxGapMs = 0;
  let gapAbort: Abort | null = null;
  let review = false;
  const plannedEnd = session.plannedEndAt;
  const inSession = contacts.filter((c) => c.at < plannedEnd && c.mono < monoEnd);
  const lastContact = inSession[inSession.length - 1] as Contact;
  const segments: { a: Contact; bAt: Instant; bMono: number; ref: Contact }[] = [];
  for (let i = 1; i < inSession.length; i++) {
    const b = inSession[i] as Contact;
    segments.push({ a: inSession[i - 1] as Contact, bAt: b.at, bMono: b.mono, ref: b });
  }
  if (terminal) {
    // Final segment up to the planned end, compared against the terminal contact's clocks.
    segments.push({ a: lastContact, bAt: plannedEnd, bMono: monoEnd, ref: terminal });
  }
  for (const seg of segments) {
    const gap = Math.max(0, seg.bAt - seg.a.at);
    maxGapMs = Math.max(maxGapMs, gap);
    if (gap <= gapOkMs) continue;
    if (gap <= gapMaxMs && gapCovered(seg.a, seg.bMono, seg.ref, buffered, gapOkMs, toleranceMs)) {
      coveredMs += gap;
      continue;
    }
    if (overlapsOutage(seg.a.at, seg.bAt, outages)) {
      review = true;
      continue;
    }
    gapAbort = { reason: 'heartbeat_gap', at: seg.a.at };
    break;
  }

  const lastValidContactAt = contacts.reduce((m, c) => Math.max(m, c.at), session.serverStartAt);
  const skews = heartbeats.filter((h) => h.kind === 'online' && h.nonceOk).map((h) => h.clientTs - h.serverRecvAt);
  const clockSkewMs = median(skews);
  const claim = events
    .filter((e) => (e.kind === 'first_interaction_after_end' || e.kind === 'visible') && e.monoMs >= monoEnd)
    .sort((a, b) => a.monoMs - b.monoMs)[0];
  const metrics: SessionMetrics = {
    coveredGapS: Math.round(coveredMs / S),
    maxGapS: Math.round(maxGapMs / S),
    hiddenCount,
    clockSkewMs,
    claimDelayS: claim ? Math.round((claim.monoMs - monoEnd) / S) : null,
    lastValidContactAt,
  };

  // Earliest abort wins (a hidden inside a gap aborts at the hidden time, spec §4.1).
  const aborts = [hiddenAbort, gapAbort].filter((a): a is Abort => a !== null).sort((x, y) => x.at - y.at);
  const flags = flagsFor(input, metrics);
  if (aborts[0]) return { outcome: 'aborted', reason: aborts[0].reason, at: aborts[0].at, flags: [], metrics };
  if (review) return { outcome: 'review', cause: 'outage', flags, metrics };

  if (terminal) {
    // late_end: the end arrives > grace after the planned end without contact in between.
    const contactAfterEnd = contacts.some((c) => c.at >= plannedEnd && c.at < terminal.at);
    if (terminal.at > plannedEnd + graceMs && !contactAfterEnd) {
      return { outcome: 'aborted', reason: 'late_end', at: plannedEnd, flags: [], metrics };
    }
    return { outcome: 'completed', verifiedMin: session.isPractice ? 0 : session.plannedMin, flags, metrics };
  }

  // Nothing decisive yet. The sweep decides at planned end + grace (spec §4.1).
  if (now >= plannedEnd + graceMs) {
    if (overlapsOutage(lastContact.at, plannedEnd, outages)) return { outcome: 'review', cause: 'outage', flags, metrics };
    return { outcome: 'aborted', reason: 'heartbeat_gap', at: lastContact.at, flags: [], metrics };
  }
  return { outcome: 'pending', flags: [], metrics };
}

/** H1, H3, H4 at verdict time (architecture §4.3 step 6). */
export function flagsFor(input: EvaluateSessionInput, metrics: SessionMetrics): SessionFlagCode[] {
  const { session, params } = input;
  const out: SessionFlagCode[] = [];
  if (session.webdriver) out.push('H1');
  if (metrics.coveredGapS * 100 > params.covered_gap_flag_pct * session.plannedMin * 60) out.push('H3');
  if (metrics.clockSkewMs !== null && Math.abs(metrics.clockSkewMs) > params.clock_skew_flag_s * S) out.push('H4');
  return out;
}

/** Seconds from start to the abort or end, for the explanation ("Je hield 18 minuten vol"). */
export function elapsedSeconds(serverStartAt: Instant, until: Instant): number {
  return Math.max(0, Math.floor((until - serverStartAt) / S));
}
