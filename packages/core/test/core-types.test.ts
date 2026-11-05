// Frozen core types (tag core-types-v1): the code lists must match architecture §3.2, §3.3 and §5.1.
import { describe, expect, expectTypeOf, it } from 'vitest';
import {
  CAUSE_TYPES,
  GOAL_STATES,
  RULE_ACCOUNTS,
  RULE_IDS,
  SYSTEM_ACCOUNT_KINDS,
  USER_ACCOUNT_KINDS,
} from '../src/ledger/types.ts';
import type { AccountRef, Balances, Entry, JournalEntryDraft, RuleId } from '../src/ledger/types.ts';
import {
  ABORT_REASONS,
  ABORTING_EVENT_KINDS,
  CLOSED_BY,
  HEARTBEAT_KINDS,
  RESTORE_REASONS,
  REVIEW_STATUSES,
  SESSION_FLAG_CODES,
  SESSION_STATES,
  SESSION_STATUSES,
  VISIBILITY_EVENT_KINDS,
  WAKELOCK_STATES,
} from '../src/session/types.ts';
import type { AbortReason, PlannedMin, SessionVerdict, Verdict } from '../src/session/types.ts';

describe('session types (spec §4.1, arch §3.2 and §4.1)', () => {
  it('spec §4.1 Wat telt als afgebroken: five abort codes', () => {
    expect(ABORT_REASONS).toEqual(['hidden', 'heartbeat_gap', 'user_stop', 'second_session', 'late_end']);
    expectTypeOf<AbortReason>().toEqualTypeOf<'hidden' | 'heartbeat_gap' | 'user_stop' | 'second_session' | 'late_end'>();
  });

  it('arch §4.1 Toestandsmachine: states without a pause state', () => {
    expect(SESSION_STATES).toEqual(['idle', 'starting', 'running', 'running_offline', 'ending', 'stopping', 'aborted_local', 'completed', 'aborted']);
    expect(SESSION_STATES.some((s) => s.includes('pause'))).toBe(false);
  });

  it('arch §3.2 focus_session: status, review status, closed_by and restore reasons', () => {
    expect(SESSION_STATUSES).toEqual(['active', 'completed', 'aborted']);
    expect(REVIEW_STATUSES).toEqual(['none', 'pending', 'released', 'rejected']);
    expect(CLOSED_BY).toEqual(['end', 'stop', 'sweep', 'events', 'second_session', 'restore']);
    expect(RESTORE_REASONS).toEqual(['outage', 'late_log', 'appeal_upheld']);
    expectTypeOf<PlannedMin>().toEqualTypeOf<1 | 25 | 50 | 90>();
  });

  it('arch §3.2 session_heartbeat / visibility_event: kinds', () => {
    expect(HEARTBEAT_KINDS).toEqual(['online', 'buffered', 'resume']);
    expect(WAKELOCK_STATES).toEqual(['acquired', 'denied', 'released', 'unsupported']);
    expect(VISIBILITY_EVENT_KINDS).toHaveLength(12);
    expect(ABORTING_EVENT_KINDS).toEqual(['hidden', 'pagehide']);
    expect(SESSION_FLAG_CODES).toEqual(['H1', 'H3', 'H4']);
  });

  it('arch §4.3: Verdict is the SessionVerdict union with four outcomes', () => {
    expectTypeOf<Verdict>().toEqualTypeOf<SessionVerdict>();
    expectTypeOf<SessionVerdict['outcome']>().toEqualTypeOf<'pending' | 'completed' | 'aborted' | 'review'>();
  });
});

describe('ledger types (spec §4.2, arch §3.3 and §5.1)', () => {
  it('arch §3.3 ledger_account: five user and five system account kinds', () => {
    expect(USER_ACCOUNT_KINDS).toEqual(['available_own', 'available_referral', 'pending_session', 'pending_goal_budget', 'referral_unvested']);
    expect(SYSTEM_ACCOUNT_KINDS).toEqual(['issuance', 'redeemed', 'lapsed', 'reversed', 'expired']);
  });

  it('arch §5.1 boekingsregels: every rule has an account table, only adjust is free', () => {
    expect(RULE_IDS).toHaveLength(19);
    expect(Object.keys(RULE_ACCOUNTS).sort()).toEqual([...RULE_IDS].sort());
    const free = RULE_IDS.filter((r) => RULE_ACCOUNTS[r] === null);
    expect(free).toEqual(['adjust']);
  });

  it('arch §5.1: system debits are issuance, lapsed (lapse reverse), redeemed (refund) and expired (expire only)', () => {
    const sources = new Set<AccountRef>();
    for (const r of RULE_IDS) for (const a of RULE_ACCOUNTS[r]?.debit ?? []) if (a.startsWith('system:')) sources.add(a);
    expect([...sources].sort()).toEqual(['system:expired', 'system:issuance', 'system:lapsed', 'system:redeemed']);
    // system:expired only appears as a debit inside expire (zeroing a negative balance).
    expect(RULE_IDS.filter((r) => RULE_ACCOUNTS[r]?.debit.includes('system:expired'))).toEqual(['expire']);
  });

  it('spec §4.2 mutation types: every spec type exists as a rule', () => {
    const spec: RuleId[] = ['earn_session', 'goal_bonus', 'goal_budget_grant', 'goal_budget_secure', 'goal_budget_lapse', 'redeem', 'release_flag', 'reverse', 'adjust', 'referral_pending', 'referral_vest', 'referral_lapse', 'expire'];
    for (const t of spec) expect(RULE_IDS).toContain(t);
  });

  it('arch §3.4 user_day.goal_state and §3.3 cause types', () => {
    expect(GOAL_STATES).toEqual(['none', 'pending', 'available', 'secured', 'lapsed', 'postponed', 'exam']);
    expect(CAUSE_TYPES).toEqual(['flag', 'decision', 'appeal', 'restore']);
  });

  it('arch §3.3 journal_entry: an entry refers to an account set, never to a user', () => {
    expectTypeOf<Entry>().toHaveProperty('accountSet');
    expectTypeOf<Entry>().not.toHaveProperty('userId');
    expectTypeOf<JournalEntryDraft>().not.toHaveProperty('userId');
    expectTypeOf<Balances['byKind']>().toEqualTypeOf<Readonly<Record<(typeof USER_ACCOUNT_KINDS)[number], number>>>();
  });
});
