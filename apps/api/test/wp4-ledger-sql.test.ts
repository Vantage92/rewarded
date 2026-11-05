// WP-4 integration: the SQL ledger with flag decisions as WP-6 will make them (architecture §5.1
// "Wat er na een besluit gebeurt"), and fast-check properties of reconcileDay on the real tables:
// every entry closes on zero, the daily cap of 300 holds, a repeat books nothing (idempotent) and a
// sequence of decisions ends in the same balances as one recomputation from scratch (convergent).
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { CURRENT_PARAMS, focusDayOf } from '@rewarded/core';
import { ledgerChecks } from '../src/jobs/day_close/10-ledger-checks.ts';
import { createUser, wp4Harness, type Harness } from './wp4/harness.ts';
import { seedDevice } from './wp4/seed.ts';

const P = CURRENT_PARAMS;
const MIN = 60_000;

/** Inserts a completed session without booking it. */
function insertSession(h: Harness, userId: string, deviceId: string, n: number, min: number, review: 'none' | 'released' | 'rejected' = 'none'): string {
  const id = `01JPR0P${String(n).padStart(19, '0')}`;
  const start = Date.parse('2026-12-03T06:00:00Z') + n * 95 * MIN; // 07:00 Amsterdam onwards, same focus day
  h.db.run(
    `INSERT INTO focus_session (id, user_id, device_id, planned_min, is_practice, status, server_start_at, planned_end_at, server_end_at, end_received_at, verified_min,
       focus_day, late_start, review_status, nonce_hash, mono_start_ms, last_heartbeat_at, ua_class, closed_by)
     VALUES (?, ?, ?, ?, 0, 'completed', ?, ?, ?, ?, ?, ?, 0, ?, 'seed', 0, ?, 'desktop', 'end')`,
    [id, userId, deviceId, min, start, start + min * MIN, start + min * MIN, start + min * MIN, min, focusDayOf(start, P), review, start + min * MIN],
  );
  return id;
}

const DAY = '2026-12-03';

/** Decision as the admin route of WP-6 makes it: flag, review status, reconcileDay with the cause. */
function decide(h: Harness, userId: string, sessionId: string, decision: 'release' | 'reject'): void {
  h.db.transaction(() => {
    const open = h.flags.openForSessions([sessionId]).get(sessionId)?.find((f) => f.status === 'open');
    if (!open) throw new Error('no open flag');
    const res = h.flags.decide(h.db, open.id, decision, 'admin:test', 'reviewed');
    h.services.sessions.setReviewStatus(h.db, res.affectedSessionIds, decision === 'release' ? 'released' : 'rejected');
    h.services.ledger.reconcileDay(h.db, userId, DAY, { type: 'flag_decision', flagId: open.id });
  });
}

function journalHealthy(h: Harness): void {
  expect(h.db.all('SELECT entry_id FROM posting GROUP BY entry_id HAVING SUM(amount) <> 0')).toEqual([]);
  expect(ledgerChecks(h.db, DAY)).toEqual([]);
  const counted = h.db.get<{ t: number }>('SELECT COALESCE(SUM(counted_min), 0) AS t FROM focus_session WHERE focus_day = ?', [DAY])?.t ?? 0;
  expect(counted).toBeLessThanOrEqual(300);
}

describe('architecture §5.1 decisions on the SQL ledger', () => {
  it('§5.1 rejecting an earlier session on a capped day: reverse for it, earn_topup for the later one, the bonus stays', () => {
    const h = wp4Harness();
    const u = createUser(h);
    h.setArm(u.id, 'A');
    const dev = seedDevice(h, u.id);
    const ids = [0, 1, 2, 3].map((n) => insertSession(h, u.id, dev, n, 90));
    h.db.transaction(() => h.services.ledger.reconcileDay(h.db, u.id, DAY, { type: 'session_end', sessionId: ids[3] as string }));
    expect(h.services.ledger.balances(u.id).available).toBe(320); // 300 under the cap + 20 bonus
    // A batch heuristic flags the first session afterwards: its points stay available (§4.5).
    h.flags.raise(h.db, { code: 'H5', subject: { type: 'session', id: ids[0] as string }, sessionIds: [ids[0] as string], evidence: {} });
    h.services.sessions.setReviewStatus(h.db, [ids[0] as string], 'pending');
    h.db.transaction(() => h.services.ledger.reconcileDay(h.db, u.id, DAY, { type: 'session_end', sessionId: ids[0] as string }));
    expect(h.services.ledger.balances(u.id).available).toBe(320);
    decide(h, u.id, ids[0] as string, 'reject');
    const counted = h.db.all<{ id: string; counted_min: number }>('SELECT id, counted_min FROM focus_session ORDER BY server_start_at');
    expect(counted.map((r) => r.counted_min)).toEqual([0, 90, 90, 90]);
    expect(h.services.ledger.balances(u.id).available).toBe(290);
    const types = h.db.all<{ type: string }>('SELECT type FROM journal_entry ORDER BY id').map((r) => r.type);
    expect(types.filter((t) => t === 'reverse')).toHaveLength(1);
    expect(types.filter((t) => t === 'earn_topup')).toHaveLength(1);
    expect(h.services.userDays.get(u.id, DAY)?.rev).toBe(2);
    journalHealthy(h);
  });

  it('§5.1 a session flagged at the verdict: points and the bonus wait in pending_session; release moves both', () => {
    const h = wp4Harness();
    const u = createUser(h);
    h.setArm(u.id, 'A');
    const dev = seedDevice(h, u.id);
    const s = insertSession(h, u.id, dev, 0, 25);
    h.flags.raise(h.db, { code: 'H1', subject: { type: 'session', id: s }, sessionIds: [s], evidence: {} });
    h.services.sessions.setReviewStatus(h.db, [s], 'pending');
    h.db.transaction(() => h.services.ledger.reconcileDay(h.db, u.id, DAY, { type: 'session_end', sessionId: s }));
    expect(h.services.ledger.balances(u.id)).toMatchObject({ available: 0, pending: 45 });
    decide(h, u.id, s, 'release');
    expect(h.services.ledger.balances(u.id)).toMatchObject({ available: 45, pending: 0 });
    journalHealthy(h);
  });
});

describe('architecture §11 properties of reconcileDay on the SQL ledger (fast-check)', () => {
  const scenario = fc.record({
    sessions: fc.array(fc.record({ min: fc.constantFrom(25, 50, 90), flagged: fc.boolean(), outcome: fc.constantFrom<'release' | 'reject'>('release', 'reject') }), { minLength: 1, maxLength: 6 }),
    arm: fc.constantFrom<'A' | 'B' | null>('A', 'B', null),
    order: fc.array(fc.nat(), { minLength: 6, maxLength: 6 }),
  });

  it('§11 idempotent and convergent: decisions in any order end in the balances of one recomputation; zero-sum and cap hold', () => {
    fc.assert(
      fc.property(scenario, ({ sessions, arm, order }) => {
        // Incremental: book at the end of each session, then decide the flags in a random order.
        const h = wp4Harness();
        const u = createUser(h);
        h.setArm(u.id, arm);
        const dev = seedDevice(h, u.id);
        const ids = sessions.map((s, i) => {
          const id = insertSession(h, u.id, dev, i, s.min);
          if (s.flagged) {
            h.flags.raise(h.db, { code: 'H3', subject: { type: 'session', id }, sessionIds: [id], evidence: {} });
            h.services.sessions.setReviewStatus(h.db, [id], 'pending');
          }
          h.db.transaction(() => h.services.ledger.reconcileDay(h.db, u.id, DAY, { type: 'session_end', sessionId: id }));
          return id;
        });
        // Idempotent: a second reconcile without a change books nothing.
        const n = h.db.get<{ n: number }>('SELECT COUNT(*) AS n FROM journal_entry')?.n;
        const again = h.db.transaction(() => h.services.ledger.reconcileDay(h.db, u.id, DAY, { type: 'session_end', sessionId: ids[0] as string }));
        expect(again).toEqual([]);
        expect(h.db.get<{ n: number }>('SELECT COUNT(*) AS n FROM journal_entry')?.n).toBe(n);
        const flagged = ids.map((id, i) => ({ id, s: sessions[i] as (typeof sessions)[number] })).filter((x) => x.s.flagged);
        const decisions = [...flagged].sort((a, b) => (order[ids.indexOf(a.id)] ?? 0) - (order[ids.indexOf(b.id)] ?? 0));
        for (const d of decisions) decide(h, u.id, d.id, d.s.outcome);
        h.db.transaction(() => h.services.ledger.reconcileDay(h.db, u.id, DAY, { type: 'day_close' }));
        journalHealthy(h);

        // From scratch: the final review statuses at once, one reconcile and the close.
        const f = wp4Harness();
        const v = createUser(f);
        f.setArm(v.id, arm);
        const dev2 = seedDevice(f, v.id);
        sessions.forEach((s, i) => insertSession(f, v.id, dev2, i, s.min, s.flagged ? (s.outcome === 'release' ? 'released' : 'rejected') : 'none'));
        f.db.transaction(() => f.services.ledger.reconcileDay(f.db, v.id, DAY, { type: 'session_end', sessionId: ids[0] as string }));
        f.db.transaction(() => f.services.ledger.reconcileDay(f.db, v.id, DAY, { type: 'day_close' }));
        expect(h.services.ledger.balances(u.id).byKind).toEqual(f.services.ledger.balances(v.id).byKind);
        expect(h.services.userDays.get(u.id, DAY)?.countedMin).toBe(f.services.userDays.get(v.id, DAY)?.countedMin);
      }),
      { numRuns: 40, seed: 20261105 },
    );
  });
});
