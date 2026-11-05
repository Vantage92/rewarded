// Day close steps 4 and 5 against spec §4.4: streak on half of the active members, rest-day joker,
// exam day, freeze below 3 active members through pauses, automatic pause, recovery and vacation.
import { describe, expect, it } from 'vitest';
import { DRIVERS, closeDay, putDay, putSession, squadOf, wp5Harness, type Harness, type TestUser } from './harness.ts';

function met(h: Harness, u: TestUser, day: string) {
  putSession(h, u.id, day, { minutes: 25 });
  putDay(h, u.id, day, { goalMet: true, countedMin: 25 });
}

function squadDay(h: Harness, squadId: string, day: string) {
  return h.db.get<{ result: string; active_members: number; met: number; jokers: number; exam_days: number; streak_after: number; recovered: number }>(
    'SELECT result, active_members, met, jokers, exam_days, streak_after, recovered FROM squad_day WHERE squad_id = ? AND focus_day = ?',
    [squadId, day],
  );
}

describe.each(DRIVERS)('day close steps 4 and 5 on %s', (driver) => {
  it('spec §4.4 Squadstreak, Rustdag-joker, tentamendag, streakherstel, automatische pauze, bevriezen onder 3 en vakantiepauze', async () => {
    const h = wp5Harness({ driver, start: '2026-12-03T10:00:00Z' });
    const { users, squadId } = await squadOf(h, 4);
    const [a, b, c, d] = users as [TestUser, TestUser, TestUser, TestUser];

    // Thu 3 Dec: members count from the next day, so the squad day is frozen (0 active).
    await closeDay(h, '2026-12-03');
    expect(squadDay(h, squadId, '2026-12-03')).toMatchObject({ result: 'frozen', active_members: 0 });

    // Fri 4 Dec: A and B met, C and D use their joker of the week.
    met(h, a, '2026-12-04');
    met(h, b, '2026-12-04');
    await closeDay(h, '2026-12-04');
    expect(squadDay(h, squadId, '2026-12-04')).toMatchObject({ result: 'success', active_members: 4, met: 2, jokers: 2, streak_after: 1 });

    // Sat 5 Dec: only A met; B uses its joker, C and D have none left (not saved up). C focuses without meeting the goal.
    met(h, a, '2026-12-05');
    putSession(h, c.id, '2026-12-05', { minutes: 25 });
    putDay(h, c.id, '2026-12-05', { goalMet: false, countedMin: 10 });
    await closeDay(h, '2026-12-05');
    expect(squadDay(h, squadId, '2026-12-05')).toMatchObject({ result: 'success', met: 1, jokers: 1, streak_after: 2 });

    // Sun 6 Dec: A met, B has an exam day (no joker used, spec §3.13): 1 + 1 of the needed 2.
    met(h, a, '2026-12-06');
    putDay(h, b.id, '2026-12-06', { examDay: true });
    await closeDay(h, '2026-12-06');
    expect(squadDay(h, squadId, '2026-12-06')).toMatchObject({ result: 'success', met: 1, exam_days: 1, jokers: 0, streak_after: 3 });

    // Mon 7 Dec: a new week, a new joker for everybody.
    await closeDay(h, '2026-12-07');
    expect(squadDay(h, squadId, '2026-12-07')).toMatchObject({ result: 'success', met: 0, jokers: 4, streak_after: 4 });

    // Tue 8 Dec: nobody met and the jokers are used: the streak breaks.
    await closeDay(h, '2026-12-08');
    expect(squadDay(h, squadId, '2026-12-08')).toMatchObject({ result: 'fail', streak_after: 0 });
    expect(h.db.get<{ streak_before_break: number }>('SELECT streak_before_break FROM squad WHERE id = ?', [squadId])!.streak_before_break).toBe(4);

    // Wed 9 and Thu 10 Dec: two successful days right after the break restore the old length.
    met(h, a, '2026-12-09');
    met(h, b, '2026-12-09');
    await closeDay(h, '2026-12-09');
    expect(squadDay(h, squadId, '2026-12-09')).toMatchObject({ result: 'success', streak_after: 1, recovered: 0 });
    // D had no completed session since joining: paused from 10 Dec (spec §4.4 Automatische pauze).
    expect(h.events.named('member_paused').map((e) => e.pseudonym)).toEqual([d.pseudonym]);
    met(h, a, '2026-12-10');
    met(h, b, '2026-12-10');
    await closeDay(h, '2026-12-10');
    expect(squadDay(h, squadId, '2026-12-10')).toMatchObject({ result: 'success', active_members: 3, streak_after: 4, recovered: 1 });
    expect(h.events.named('streak_recovered')[0]!.props).toEqual({ squad_id: squadId, lengte: 4 });

    // C's last session was on 5 Dec: paused at the close of 12 Dec.
    met(h, a, '2026-12-11');
    met(h, b, '2026-12-11');
    await closeDay(h, '2026-12-11');
    expect(squadDay(h, squadId, '2026-12-11')).toMatchObject({ result: 'success', streak_after: 5 });
    met(h, a, '2026-12-12');
    met(h, b, '2026-12-12');
    await closeDay(h, '2026-12-12');
    expect(squadDay(h, squadId, '2026-12-12')).toMatchObject({ result: 'success', active_members: 3, streak_after: 6 });
    expect(h.events.named('member_paused').map((e) => e.pseudonym)).toEqual([d.pseudonym, c.pseudonym]);
    // With 2 active members the streak freezes instead of breaking (spec §4.4 Onder 3 actieve leden).
    met(h, a, '2026-12-13');
    await closeDay(h, '2026-12-13');
    expect(squadDay(h, squadId, '2026-12-13')).toMatchObject({ result: 'frozen', active_members: 2, streak_after: 6 });

    // Vacation pause (spec §4.4): days do not count and break nothing; no pauses or offers either.
    h.db.run("INSERT INTO vacation_pause (id, first_day, last_day, created_at, created_by) VALUES ('vp1', '2026-12-14', '2026-12-14', '2026-12-01T00:00:00Z', 'admin')");
    await closeDay(h, '2026-12-14');
    expect(squadDay(h, squadId, '2026-12-14')).toMatchObject({ result: 'vacation', streak_after: 6 });

    // A paused member comes back with a session and counts from the next day.
    putSession(h, d.id, '2026-12-15', { minutes: 25 });
    putDay(h, d.id, '2026-12-15', { goalMet: true, countedMin: 25 });
    met(h, a, '2026-12-15');
    await closeDay(h, '2026-12-15');
    expect(squadDay(h, squadId, '2026-12-15')).toMatchObject({ result: 'frozen', active_members: 2 });
    expect(h.events.named('member_resumed')).toHaveLength(1);
    met(h, a, '2026-12-16');
    met(h, d, '2026-12-16');
    await closeDay(h, '2026-12-16');
    expect(squadDay(h, squadId, '2026-12-16')).toMatchObject({ result: 'success', active_members: 3, met: 2, streak_after: 7 });
  });

  it('spec §4.4: a rerun of the day close for the same day changes nothing (idempotent)', async () => {
    const h = wp5Harness({ driver, start: '2026-12-03T10:00:00Z' });
    const { users, squadId } = await squadOf(h, 3);
    met(h, users[0]!, '2026-12-04');
    met(h, users[1]!, '2026-12-04');
    await closeDay(h, '2026-12-04');
    await closeDay(h, '2026-12-04');
    expect(h.db.get<{ streak: number }>('SELECT streak FROM squad WHERE id = ?', [squadId])!.streak).toBe(1);
    expect(h.events.named('squad_day_evaluated')).toHaveLength(1);
  });

  it('spec §3.5 step 7: 7 days with fewer than 2 active members inside an exam period gives the regroup offer once', async () => {
    const h = wp5Harness({ driver, start: '2026-12-03T10:00:00Z' });
    const { users, squadId } = await squadOf(h, 3);
    putSession(h, users[0]!.id, '2026-12-05');
    for (const day of ['2026-12-09', '2026-12-10']) await closeDay(h, day, [4]);
    expect(h.db.get<{ low_activity_since_day: string }>('SELECT low_activity_since_day FROM squad WHERE id = ?', [squadId])!.low_activity_since_day).toBe('2026-12-09');
    expect(h.events.named('squad_regroup_offered')).toHaveLength(1);
  });
});
