// Repair (review finding 1): bonus and rest arm per focus day (spec §5 Toewijzing, §4.13). A solo
// arm-A user who joins an arm-B squad on Wednesday keeps A until Sunday and gets B from Monday.
import { describe, expect, it } from 'vitest';
import { world } from './world.ts';

describe('spec §5 Toewijzing: arm per focusdag (reparatie)', () => {
  it('§5 Toewijzing: a solo arm-A user joins an arm-B squad on Wednesday; Wednesday to Sunday stay A, Monday becomes B', async () => {
    const w = await world('2026-11-09');
    await w.armBOn();
    const soloArm = (id: string) => w.db.get<{ arm: string }>("SELECT arm FROM experiment_assignment WHERE unit_type = 'solo' AND unit_id = ? AND factor = 'bonus'", [id])?.arm;
    let joiner: Awaited<ReturnType<typeof w.student>> | undefined;
    for (let i = 0; i < 8 && !joiner; i++) {
      const s = await w.student();
      if (soloArm(s.id) === 'A') joiner = s;
    }
    expect(joiner).toBeDefined();
    let token = '';
    let squadId = '';
    for (let i = 0; i < 8 && !token; i++) {
      const f = await w.student();
      const r = await f.a.api.call('squads.create', { body: { name: `Squad B ${i}` } });
      const arm = w.db.get<{ arm_bonus: string | null }>('SELECT arm_bonus FROM squad WHERE id = ?', [r.squad.id])?.arm_bonus;
      if (arm === 'B') {
        token = r.invite.token;
        squadId = r.squad.id;
      } else await f.a.api.call('squads.leave');
    }
    expect(token).not.toBe('');
    // Wednesday 11 November 2026.
    await w.at('2026-11-11', '10:00');
    await joiner!.a.api.call('invites.accept', { params: { token } });
    const pc = w.ctx.deps.services.pointsContext;
    const armOn = (day: string) => pc.arms(w.db, joiner!.id, day).bonus;
    for (const d of ['2026-11-10', '2026-11-11', '2026-11-12', '2026-11-13', '2026-11-14', '2026-11-15']) expect({ d, arm: armOn(d) }).toEqual({ d, arm: 'A' });
    expect(armOn('2026-11-16')).toBe('B');
    // Re-evaluating an older day after the switch still books with the arm of that day.
    await w.at('2026-11-17', '10:00');
    expect(armOn('2026-11-12')).toBe('A');
    expect(armOn('2026-11-17')).toBe('B');
    expect(w.db.get<{ n: number }>('SELECT count(*) AS n FROM squad_membership WHERE squad_id = ? AND user_id = ?', [squadId, joiner!.id])?.n).toBe(1);
  }, 120_000);
});

describe('spec §5 arm B weekbudget bij instap midden in de week (reparatie)', () => {
  it('§5 arm B: the arm B flag goes on on Thursday; the budget is 20 × the remaining days and nothing stays pending after the week close', async () => {
    const w = await world('2026-12-07');
    const soloArm = (id: string) => w.db.get<{ arm: string }>("SELECT arm FROM experiment_assignment WHERE unit_type = 'solo' AND unit_id = ? AND factor = 'bonus'", [id])?.arm;
    let b: Awaited<ReturnType<typeof w.student>> | undefined;
    for (let i = 0; i < 8 && !b; i++) {
      const s = await w.student();
      if (soloArm(s.id) === 'B') b = s;
    }
    expect(b).toBeDefined();
    await w.at('2026-12-10', '09:00');
    await w.armBOn();
    await w.at('2026-12-10', '10:00');
    expect(await w.session25(b!)).toBe('completed');
    const sum = (type: string) =>
      Number(w.db.get<{ n: number }>(
        `SELECT COALESCE(SUM(p.amount), 0) AS n FROM journal_entry e JOIN posting p ON p.entry_id = e.id JOIN ledger_account_owner o ON o.account_id = p.account_id
         WHERE e.type = ? AND o.user_id = ? AND o.kind = 'pending_goal_budget'`,
        [type, b!.id],
      )?.n ?? 0);
    expect(sum('goal_budget_grant')).toBe(80);
    const pending = () =>
      Number(w.db.get<{ n: number }>(
        `SELECT COALESCE(SUM(p.amount), 0) AS n FROM posting p JOIN ledger_account_owner o ON o.account_id = p.account_id WHERE o.user_id = ? AND o.kind = 'pending_goal_budget'`,
        [b!.id],
      )?.n ?? 0);
    expect(pending()).toBe(60);
    for (const d of ['2026-12-11', '2026-12-12', '2026-12-13', '2026-12-14', '2026-12-15']) {
      await w.at(d, '06:30');
      await w.ctx.scheduler.tick();
    }
    // Monday's new weekly budget aside, the rest of last week is gone.
    const thisWeek = Number(w.db.get<{ n: number }>("SELECT COALESCE(SUM(p.amount), 0) AS n FROM journal_entry e JOIN posting p ON p.entry_id = e.id JOIN ledger_account_owner o ON o.account_id = p.account_id WHERE e.type = 'goal_budget_grant' AND e.ref_id = '2026-12-14' AND o.user_id = ? AND o.kind = 'pending_goal_budget'", [b!.id])?.n ?? 0);
    const lapsedMon = Number(w.db.get<{ n: number }>("SELECT count(*) AS n FROM journal_entry WHERE type = 'goal_budget_lapse' AND focus_day = '2026-12-14'")?.n ?? 0);
    expect(pending()).toBe(thisWeek - 20 * lapsedMon);
  }, 120_000);
});
