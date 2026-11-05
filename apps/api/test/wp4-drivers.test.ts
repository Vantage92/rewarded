// WP-4 on both SQLite drivers (architecture §2.1, §11): a session through the protocol, a
// redemption, the day close, and DELETE /me through the WP-4 erasers (§10.7).
import { describe, expect, it } from 'vitest';
import { createScheduler } from '../src/jobs/scheduler.ts';
import { dayCloseJob } from '../src/jobs/day_close/index.ts';
import { step as step1 } from '../src/jobs/day_close/01-sessions-closed.ts';
import { step as step2 } from '../src/jobs/day_close/02-reconcile-days.ts';
import { step as step10 } from '../src/jobs/day_close/10-ledger-checks.ts';
import type { DriverName } from '../src/db/types.ts';
import { call, createUser, device, wp4Harness } from './wp4/harness.ts';
import { FocusClient } from './wp4/client.ts';
import { redeemKey, seedEarnIn, seedPhone, seedReward } from './wp4/seed.ts';

const WP4_USER_TABLES = ['focus_session', 'user_day', 'ledger_account_owner', 'redemption', 'phone_verification'] as const;

for (const driver of ['better-sqlite3', 'node:sqlite'] as DriverName[]) {
  describe(`WP-4 on ${driver}`, () => {
    it('§4.1 + §3.4 + §6.1: session, redemption, day close; the journal closes on zero and the checks stay empty', async () => {
      const h = wp4Harness({ driver });
      const { rewardId } = await seedReward(h, { stock: 2 });
      const u = createUser(h);
      h.setArm(u.id, 'A');
      const c = new FocusClient(h, u, await device(h, u));
      const end = await c.complete(25);
      expect(end.body).toMatchObject({ status: 'completed', points: 25, goal_met: true });
      seedEarnIn(h, u.id);
      h.db.run('UPDATE user SET first_redeem_after = ? WHERE id = ?', [new Date(h.clock.now().getTime() - 1).toISOString(), u.id]);
      seedPhone(h, u.id);
      const r = await call(h, u, 'POST', '/redemptions', { reward_id: rewardId }, { 'Idempotency-Key': redeemKey() });
      expect(r.status).toBe(201);
      // 25 + 275 more counted minutes under the cap (300) + the arm A bonus 20 − 250.
      expect(h.services.ledger.balances(u.id).available).toBe(300 + 20 - 250);
      h.clock.advance(24 * 3_600_000);
      const s = createScheduler({ clock: h.clock, moduleDeps: h.deps });
      s.register(dayCloseJob(async () => [step1, step2, step10]));
      expect((await s.runNow('day_close', 'day_close:2026-12-03')).status).toBe('done');
      expect(h.db.all('SELECT * FROM ledger_alert')).toEqual([]);
      expect(h.db.all('SELECT entry_id FROM posting GROUP BY entry_id HAVING SUM(amount) <> 0')).toEqual([]);
    });

    it('§10.7 DELETE /me: expire to zero, then nothing in the WP-4 tables links to the user; the journal is unchanged', async () => {
      const h = wp4Harness({ driver });
      const { rewardId } = await seedReward(h, { stock: 1 });
      const u = createUser(h);
      seedEarnIn(h, u.id);
      h.db.run('UPDATE user SET first_redeem_after = ? WHERE id = ?', [new Date(h.clock.now().getTime() - 1).toISOString(), u.id]);
      seedPhone(h, u.id);
      expect((await call(h, u, 'POST', '/redemptions', { reward_id: rewardId }, { 'Idempotency-Key': redeemKey() })).status).toBe(201);
      const journal = h.db.get<{ n: number }>('SELECT COUNT(*) AS n FROM posting')?.n ?? 0;
      h.db.transaction(() => h.services.privacy.eraseUser(h.db, u.id));
      for (const t of WP4_USER_TABLES) expect(h.db.get<{ n: number }>(`SELECT COUNT(*) AS n FROM ${t} WHERE user_id = ?`, [u.id])?.n).toBe(0);
      expect(h.db.get<{ n: number }>('SELECT COUNT(*) AS n FROM redemption WHERE user_id IS NULL')?.n).toBe(1);
      // The expire entry added postings; nothing old changed and every entry still closes on zero.
      expect(h.db.get<{ n: number }>('SELECT COUNT(*) AS n FROM posting')?.n).toBeGreaterThan(journal);
      expect(h.db.all('SELECT entry_id FROM posting GROUP BY entry_id HAVING SUM(amount) <> 0')).toEqual([]);
      expect(h.db.all("SELECT type FROM journal_entry WHERE type = 'expire' AND reason_code = 'account_deleted'")).toHaveLength(1);
      expect(h.services.privacy.exportUser(u.id)).toMatchObject({ sessions: { sessions: [] }, redemptions: { redemptions: [] } });
    });
  });
}
