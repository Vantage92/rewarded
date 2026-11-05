// What the journal holds for one day, derived from entries (architecture §5.1 BookedDay).
import { GOAL_DAY_RULES } from './rules.ts';
import type { BookedDay, JournalEntryDraft } from './types.ts';

export type BookedSource = Pick<JournalEntryDraft, 'type' | 'refType' | 'refId' | 'postings' | 'idempotencyKey'>;

/**
 * Per session: points on available_own and pending_session. Goal: available_own and pending_session
 * from goal entries; `lapsed` is the part of an arm-B day budget that left pending without being
 * available (lapse, minus lapse reversal, plus reversed secured points).
 */
export function bookedDayFrom(entries: readonly BookedSource[]): BookedDay {
  const sessions: Record<string, { available: number; pending: number }> = {};
  const goal = { available: 0, pending: 0, lapsed: 0 };
  const keyList: string[] = [];
  for (const e of entries) {
    keyList.push(e.idempotencyKey);
    if (e.refType === 'session') {
      const s = (sessions[e.refId] ??= { available: 0, pending: 0 });
      for (const p of e.postings) {
        if (p.account === 'user:available_own') s.available += p.amount;
        else if (p.account === 'user:pending_session') s.pending += p.amount;
      }
    } else if (GOAL_DAY_RULES.includes(e.type)) {
      for (const p of e.postings) {
        if (p.account === 'user:available_own') goal.available += p.amount;
        else if (p.account === 'user:pending_session') goal.pending += p.amount;
        else if (p.account === 'system:lapsed') goal.lapsed += p.amount;
        else if (p.account === 'system:reversed' && e.type === 'goal_secure_reverse') goal.lapsed += p.amount;
      }
    }
  }
  return { sessions, goal, keys: keyList };
}

export function emptyBookedDay(): BookedDay {
  return { sessions: {}, goal: { available: 0, pending: 0, lapsed: 0 }, keys: [] };
}
