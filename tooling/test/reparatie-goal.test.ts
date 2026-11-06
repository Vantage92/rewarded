// Repair (review finding 12): the goal of a day that closes later is the goal that applied on it
// (spec §4.4: nobody lowers the goal at the last moment to save the streak).
import { describe, expect, it } from 'vitest';
import { world } from './world.ts';

describe('spec §4.4 Dagdoel: wijziging geldt vanaf de volgende dag (reparatie)', () => {
  it('§4.4 a second goal change between 04:00 and the day close does not lower the goal of yesterday', async () => {
    const w = await world('2026-12-07');
    const s = await w.student();
    await s.a.api.call('me.dailyGoal', { body: { minutes: 120, confirm_overreach: true } });
    // Wednesday: a 25-minute session and a change to 25 (from Thursday).
    await w.at('2026-12-09', '10:00');
    expect(await w.session25(s)).toBe('completed');
    await s.a.api.call('me.dailyGoal', { body: { minutes: 25 } });
    // Thursday 04:20, before the day close of Wednesday (05:45): a change to 50 (from Friday).
    await w.at('2026-12-10', '04:20');
    await s.a.api.call('me.dailyGoal', { body: { minutes: 50 } });
    await w.at('2026-12-10', '06:30');
    await w.ctx.scheduler.tick();
    const wed = w.db.get<{ goal_min: number; goal_met: number; closed_at: string | null }>("SELECT goal_min, goal_met, closed_at FROM user_day WHERE user_id = ? AND focus_day = '2026-12-09'", [s.id]);
    expect(wed).toMatchObject({ goal_min: 120, goal_met: 0 });
    expect(wed?.closed_at).not.toBeNull();
    expect(w.bonusRows(s.id)).toBe(0);
    const pc = w.ctx.deps.services.pointsContext;
    const p = pc.profile(w.db, s.id)!;
    expect(pc.goalFor(w.db, p, '2026-12-10')).toBe(25);
    expect(pc.goalFor(w.db, p, '2026-12-11')).toBe(50);
  }, 120_000);
});
