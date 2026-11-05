// FakeLedgerService enforces the same invariants as the real ledger (architecture §12.2, §5.1, §5.5).
import { describe, expect, it } from 'vitest';
import { FakeLedgerService, LedgerInvariantError, assertValidDraft, fakeTx } from '../../src/services/ledger.ts';
import type { PostArgs } from '../../src/services/ledger.ts';

const tx = fakeTx();
const earn = (userId: string, sessionId: string, amount: number, flagged = false): PostArgs => ({
  userId,
  postings: [
    { account: 'system:issuance', amount: -amount },
    { account: flagged ? 'user:pending_session' : 'user:available_own', amount },
  ],
  refType: 'session',
  refId: sessionId,
  focusDay: '2026-12-14',
  actor: 'system',
});

function code(fn: () => unknown): string | undefined {
  try {
    fn();
  } catch (e) {
    return e instanceof LedgerInvariantError ? e.code : String(e);
  }
  return undefined;
}

describe('FakeLedgerService (arch §12.2 bevroren interface, §5.1 journaal)', () => {
  it('spec §4.2 / arch §5.1: earn_session books 1 point per minute and balances are derived', () => {
    const l = new FakeLedgerService();
    const r = l.post(tx, 'earn_session', 'earn:s1', earn('u1', 's1', 25));
    expect(r.created).toBe(true);
    expect(r.entry.accountSet).toBeTruthy();
    expect(r.entry).not.toHaveProperty('userId');
    expect(l.balances('u1')).toMatchObject({ available: 25, pending: 0, referralUnvested: 0 });
    expect(l.balances('nobody').available).toBe(0);
  });

  it('arch §5.4 idempotentie: the same key with the same content is "already done", not a second booking', () => {
    const l = new FakeLedgerService();
    l.post(tx, 'earn_session', 'earn:s1', earn('u1', 's1', 25));
    const again = l.post(tx, 'earn_session', 'earn:s1', earn('u1', 's1', 25));
    expect(again.created).toBe(false);
    expect(l.entries()).toHaveLength(1);
    expect(l.balances('u1').available).toBe(25);
  });

  it('arch §5.4 idempotentie: the same key with other content is rejected (unique key)', () => {
    const l = new FakeLedgerService();
    l.post(tx, 'earn_session', 'earn:s1', earn('u1', 's1', 25));
    expect(code(() => l.post(tx, 'earn_session', 'earn:s1', earn('u1', 's1', 50)))).toBe('KEY_CONFLICT');
    expect(code(() => l.post(tx, 'earn_session', 'earn:s1', earn('u2', 's1', 25)))).toBe('KEY_CONFLICT');
    expect(l.entries()).toHaveLength(1);
  });

  it('arch §3.3 posting: every entry sums to zero, has both sides and no zero lines', () => {
    const l = new FakeLedgerService();
    const bad = (postings: PostArgs['postings']): string | undefined => code(() => l.post(tx, 'earn_session', `k${postings.length}${postings[0]?.amount}`, { ...earn('u1', 'sx', 1), postings }));
    expect(bad([{ account: 'system:issuance', amount: -25 }, { account: 'user:available_own', amount: 24 }])).toBe('ZERO_SUM');
    expect(bad([{ account: 'user:available_own', amount: 25 }])).toBe('ONE_SIDED');
    expect(bad([{ account: 'system:issuance', amount: 0 }, { account: 'user:available_own', amount: 0 }])).toBe('ZERO_AMOUNT');
    expect(bad([{ account: 'system:issuance', amount: -1.5 }, { account: 'user:available_own', amount: 1.5 }])).toBe('ZERO_AMOUNT');
    expect(l.entries()).toHaveLength(0);
  });

  it('arch §5.1 tabel: a rule may only touch its own accounts', () => {
    const l = new FakeLedgerService();
    // earn_session may not credit available_referral.
    expect(
      code(() => l.post(tx, 'earn_session', 'earn:s2', { ...earn('u1', 's2', 25), postings: [{ account: 'system:issuance', amount: -25 }, { account: 'user:available_referral', amount: 25 }] })),
    ).toBe('ACCOUNT_NOT_ALLOWED');
    // redeem may not credit the user.
    expect(
      code(() => l.post(tx, 'redeem', 'redeem:r1', { ...earn('u1', 'r1', 1), refType: 'redemption', postings: [{ account: 'system:redeemed', amount: -50 }, { account: 'user:available_own', amount: 50 }] })),
    ).toBe('ACCOUNT_NOT_ALLOWED');
  });

  it('arch §5.1: adjust and expire need a reason code', () => {
    expect(code(() => assertValidDraft('adjust', 'adjust:a1', [{ account: 'system:issuance', amount: -5 }, { account: 'user:available_own', amount: 5 }]))).toBe('REASON_REQUIRED');
    expect(code(() => assertValidDraft('adjust', 'adjust:a1', [{ account: 'system:issuance', amount: -5 }, { account: 'user:available_own', amount: 5 }], 'appeal_upheld'))).toBeUndefined();
    expect(code(() => assertValidDraft('earn_session', '', [{ account: 'system:issuance', amount: -5 }, { account: 'user:available_own', amount: 5 }]))).toBe('EMPTY_KEY');
  });

  it('spec §4.2 Negatief saldo: a reversal of available points may make the balance negative', () => {
    const l = new FakeLedgerService();
    l.post(tx, 'earn_session', 'earn:s1', earn('u1', 's1', 25));
    l.post(tx, 'redeem', 'redeem:r1', { ...earn('u1', 'r1', 1), refType: 'redemption', postings: [{ account: 'user:available_own', amount: -20 }, { account: 'system:redeemed', amount: 20 }] });
    l.post(tx, 'reverse', 'reverse:f1:s1', { ...earn('u1', 's1', 1), causeType: 'flag', causeId: 'f1', postings: [{ account: 'user:available_own', amount: -25 }, { account: 'system:reversed', amount: 25 }] });
    expect(l.balances('u1').available).toBe(-20);
    expect(l.unbalancedEntryIds()).toEqual([]);
  });

  it('arch §5.2 Vervaldatum / §10.7: expireAll zeroes every user balance, also a negative one, in one balanced entry', () => {
    const l = new FakeLedgerService({ now: () => Date.parse('2026-12-20T10:00Z') });
    l.post(tx, 'earn_session', 'earn:s1', earn('u1', 's1', 50));
    l.post(tx, 'earn_session', 'earn:s2', earn('u1', 's2', 25, true));
    l.post(tx, 'reverse', 'reverse:f1:s1', { ...earn('u1', 's1', 1), postings: [{ account: 'user:available_own', amount: -60 }, { account: 'system:reversed', amount: 60 }] });
    const e = l.expireAll(tx, 'u1', 'account_deleted');
    expect(e?.idempotencyKey).toMatch(/^expire:set\d+:account_deleted:2026-12-20$/);
    expect(l.balances('u1')).toMatchObject({ available: 0, pending: 0, referralUnvested: 0 });
    expect(l.expireAll(tx, 'u1', 'account_deleted')).toBeNull();
    expect(l.unbalancedEntryIds()).toEqual([]);
  });

  it('arch §5.1 reconcileDay: the fake books what the injected reconciler proposes, idempotently', () => {
    const l = new FakeLedgerService({
      reconciler: (userId, day) => [
        {
          type: 'earn_session',
          idempotencyKey: `earn:${userId}-${day}`,
          refType: 'session',
          refId: 's1',
          actor: 'system',
          postings: [
            { account: 'system:issuance', amount: -25 },
            { account: 'user:available_own', amount: 25 },
          ],
        },
        {
          type: 'goal_bonus',
          idempotencyKey: `goal_bonus:${userId}:${day}`,
          refType: 'user_day',
          refId: `${userId}:${day}`,
          actor: 'system',
          arm: 'A',
          postings: [
            { account: 'system:issuance', amount: -20 },
            { account: 'user:available_own', amount: 20 },
          ],
        },
      ],
    });
    expect(l.reconcileDay(tx, 'u1', '2026-12-14', { type: 'session_end', sessionId: 's1' })).toHaveLength(2);
    expect(l.reconcileDay(tx, 'u1', '2026-12-14', { type: 'day_close' })).toHaveLength(0);
    expect(l.balances('u1').available).toBe(45);
    expect(l.entries().every((e) => e.focusDay === '2026-12-14')).toBe(true);
  });

  it('arch §5.5 nachtelijke controles (property): any random sequence of valid bookings keeps the journal at zero sum', () => {
    // Small deterministic PRNG so the test is reproducible.
    let seed = 42;
    const rnd = (n: number): number => {
      seed = (seed * 1103515245 + 12345) % 2 ** 31;
      return seed % n;
    };
    const l = new FakeLedgerService();
    const users = ['u1', 'u2', 'u3'];
    let rejected = 0;
    for (let i = 0; i < 500; i++) {
      const u = users[rnd(3)] as string;
      const amount = 1 + rnd(90);
      const key = `k${rnd(200)}`; // collisions on purpose
      try {
        switch (rnd(4)) {
          case 0:
            l.post(tx, 'earn_session', key, earn(u, key, amount));
            break;
          case 1:
            l.post(tx, 'earn_session', key, earn(u, key, amount, true));
            break;
          case 2:
            l.post(tx, 'release_flag', key, { ...earn(u, key, 1), postings: [{ account: 'user:pending_session', amount: -amount }, { account: 'user:available_own', amount }] });
            break;
          default:
            l.post(tx, 'redeem', key, { ...earn(u, key, 1), refType: 'redemption', postings: [{ account: 'user:available_own', amount: -amount }, { account: 'system:redeemed', amount }] });
        }
      } catch (e) {
        if (!(e instanceof LedgerInvariantError)) throw e;
        rejected += 1;
      }
    }
    expect(rejected).toBeGreaterThan(0);
    expect(l.unbalancedEntryIds()).toEqual([]);
    expect(l.totalSum()).toBe(0);
    const keys = l.entries().map((e) => e.idempotencyKey);
    expect(new Set(keys).size).toBe(keys.length);
    const userTotal = users.reduce((s, u) => {
      const b = l.balances(u);
      return s + b.available + b.pending + b.referralUnvested;
    }, 0);
    expect(userTotal + l.systemBalance('system:issuance') + l.systemBalance('system:redeemed')).toBe(0);
  });
});
