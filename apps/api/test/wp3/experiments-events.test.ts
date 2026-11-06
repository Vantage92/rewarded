// Experiment assignment (voorregistratie §9, arch §3.5, §5.1) and the event writer in the transaction
// (arch §8.1); on both drivers.
import { describe, expect, it } from 'vitest';
import { armAt } from '../../src/db/services/experiments.ts';
import { DRIVERS, Client, lastLogin, register, seedInvite, userIdOf, wp3App } from './helpers.ts';

describe('assignment rule (voorregistratie §9.2)', () => {
  it('every complete block of four holds two of each arm; the same seed gives the same arms', () => {
    for (const factor of ['bonus', 'belofte', 'rest', 'prompt'] as const) {
      for (const stratum of ['club_a|club', 'none|waitlist']) {
        const arms = Array.from({ length: 40 }, (_, i) => armAt('seed-x', factor, stratum, i).arm);
        for (let b = 0; b < 10; b++) {
          const block = arms.slice(b * 4, b * 4 + 4);
          expect(new Set(block).size).toBe(2);
          expect(block.filter((a) => a === block[0]).length).toBe(2);
        }
        expect(Array.from({ length: 40 }, (_, i) => armAt('seed-x', factor, stratum, i).arm)).toEqual(arms);
      }
    }
    const a = Array.from({ length: 40 }, (_, i) => armAt('seed-x', 'bonus', 's', i).arm).join();
    const b = Array.from({ length: 40 }, (_, i) => armAt('seed-y', 'bonus', 's', i).arm).join();
    expect(a).not.toBe(b);
  });
});

describe.each(DRIVERS)('experiment service on %s', (driver) => {
  it('2 × 2 for squads (Belofte × rest) plus bonus; locked; balanced per stratum', () => {
    const t = wp3App(driver);
    const ex = t.wp3.experiments;
    const cells = new Map<string, number>();
    t.db.transaction(() => {
      for (let i = 0; i < 16; i++) {
        const a = ex.assign(t.db, { type: 'squad', id: `squad-${i}`, stratum: 'club_a|club' });
        expect(a.arms.prompt).toBe('na');
        const cell = `${a.arms.belofte}/${a.arms.rest}`;
        cells.set(cell, (cells.get(cell) ?? 0) + 1);
      }
    });
    expect([...cells.keys()].sort()).toEqual(['early/continue', 'early/rest', 'late/continue', 'late/rest']);
    const first = ex.get({ type: 'squad', id: 'squad-0', stratum: '' })!;
    expect(t.db.transaction(() => ex.assign(t.db, { type: 'squad', id: 'squad-0', stratum: 'other|x' }))).toEqual(first);
    const counts = t.db.all<{ factor: string; arm: string; n: number }>('SELECT factor, arm, count(*) AS n FROM experiment_assignment GROUP BY factor, arm');
    for (const c of counts) expect(c.n).toBe(8);
    expect(() => t.db.run("UPDATE experiment_assignment SET arm = 'X'")).toThrow(/locked/);
    expect(() => t.db.run("UPDATE experiment_assignment SET arm = 'A' WHERE factor = 'bonus'")).toThrow(/locked/);
    // The privacy eraser may replace the unit id (arch §10.7).
    expect(t.db.run("UPDATE experiment_assignment SET unit_id = 'replaced' WHERE unit_id = 'squad-1'").changes).toBe(3);
  });

  it('§5.1: a minor in a squad with arm B and rest personally gets A and continue, logged as arm_switch minor', async () => {
    const t = wp3App(driver);
    // Find a squad whose arms are B and rest.
    let squadId = '';
    t.db.transaction(() => {
      for (let i = 0; i < 40 && !squadId; i++) {
        const a = t.wp3.experiments.assign(t.db, { type: 'squad', id: `01JC00000000000000000000${String(i).padStart(2, '0')}`, stratum: 'none|squad_invite' });
        if (a.arms.bonus === 'B' && a.arms.rest === 'rest') squadId = a.unit.id;
      }
    });
    expect(squadId).not.toBe('');
    const c = await register(t, 'minor@example.nl', '2009-03-03', seedInvite(t, { source: 'squad', squadId }));
    const me = await c.get<{ user: { id: string } }>('/me');
    const userId = me.body.user.id;
    const switches = t.db.all<{ factor: string; from: string; to: string; reason: string }>('SELECT factor, "from", "to", reason FROM arm_switch WHERE user_id = ? ORDER BY factor', [userId]);
    expect(switches).toEqual([
      { factor: 'bonus', from: 'B', to: 'A', reason: 'minor' },
      { factor: 'rest', from: 'rest', to: 'continue', reason: 'minor' },
    ]);
    const arms = t.wp3.experiments.armsFor({ userId, ageBand: '16_17', optedOut: false, unit: { type: 'squad', id: squadId, stratum: '' } });
    expect(arms).toMatchObject({ bonus: 'A', rest: 'continue' });
    // An adult in the same squad keeps the squad's arms.
    const adult = await register(t, 'adult@example.nl', '2000-03-03', seedInvite(t, { source: 'squad', squadId }));
    void adult;
    const adultArms = t.wp3.experiments.armsFor({ userId: userIdOf(t, 'adult@example.nl'), ageBand: '18_plus', optedOut: false, unit: { type: 'squad', id: squadId, stratum: '' } });
    expect(adultArms).toMatchObject({ bonus: 'B', rest: 'rest' });
    expect(t.db.get("SELECT count(*) AS n FROM event WHERE name = 'arm_switched'")).toEqual({ n: 2 });
  });

  it('switchArm from join takes effect from the next Monday; arm B stop needs four eyes', () => {
    const t = wp3App(driver); // Thursday 5 November 2026
    const ex = t.wp3.experiments;
    t.db.run(
      `INSERT INTO user (id, email, email_norm_hash, first_name, locale, age_band, pseudonym, registration_source, daily_goal_min, cohort, registration_channel, terms_version, privacy_version, research_info_version, created_at)
       VALUES ('u1', 'u1@example.nl', 'h1', 'U', 'nl', '18_plus', 'pseudo-u1-xx', 'personal', 25, 'experiment', 'other', '0.3', '0.3', '0.3', '2026-11-05')`,
    );
    const solo = t.db.transaction(() => ex.assign(t.db, { type: 'solo', id: 'u1', stratum: 'none|other' }));
    const to = solo.arms.bonus === 'A' ? 'B' : 'A';
    t.db.transaction(() => ex.switchArm(t.db, { userId: 'u1', factor: 'bonus', from: solo.arms.bonus, to, reason: 'join' }));
    expect(t.db.get('SELECT effective_from_day FROM arm_switch')).toEqual({ effective_from_day: '2026-11-09' });
    // A join switch belongs to a squad membership: on the solo unit it changes nothing. The squad
    // case (A until Sunday, B from Monday) is covered in tooling/test/reparatie-arms.test.ts.
    const ctx = { userId: 'u1', ageBand: '18_plus' as const, optedOut: false, unit: { type: 'solo' as const, id: 'u1', stratum: '' } };
    expect(ex.armsFor(ctx).bonus).toBe(solo.arms.bonus);
    t.clock.set(new Date('2026-11-09T05:00:00Z'));
    expect(ex.armsFor(ctx).bonus).toBe(solo.arms.bonus);
    void to;

    expect(t.db.transaction(() => ex.stopArmB(t.db, 'admin:u_aaaa'))).toEqual({ effective: false });
    expect(() => t.db.transaction(() => ex.stopArmB(t.db, 'admin:u_aaaa'))).toThrow('FOUR_EYES_REQUIRED');
    expect(t.db.transaction(() => ex.stopArmB(t.db, 'admin:u_bbbb'))).toEqual({ effective: true });
    expect(ex.armBStoppedFrom()).toBe('2026-11-16');
    // The stop is not retroactive: a day before the stop keeps its arm.
    expect(ex.armsFor({ ...ctx, day: '2026-11-15' }).bonus).toBe(solo.arms.bonus);
    t.clock.set(new Date('2026-11-16T05:00:00Z'));
    expect(ex.armsFor(ctx).bonus).toBe('A');
    expect(ex.armsFor({ ...ctx, day: '2026-11-15' }).bonus).toBe(solo.arms.bonus);
  });
});

describe.each(DRIVERS)('event writer on %s (arch §8.1)', (driver) => {
  it('a rolled-back transaction leaves no event; names and props come from the taxonomy', async () => {
    const t = wp3App(driver);
    await register(t, 'sanne@example.nl', '2000-01-01');
    const pseudonym = t.db.get<{ pseudonym: string }>('SELECT pseudonym FROM user')!.pseudonym;
    const before = t.db.get<{ n: number }>('SELECT count(*) AS n FROM event')!.n;
    expect(() =>
      t.db.transaction(() => {
        t.wp3.events.event(t.db, 'practice_completed', {}, { pseudonym });
        throw new Error('domain change failed');
      }),
    ).toThrow('domain change failed');
    expect(t.db.get('SELECT count(*) AS n FROM event')).toEqual({ n: before });
    t.db.transaction(() => t.wp3.events.event(t.db, 'practice_completed', {}, { pseudonym }));
    const row = t.db.get<Record<string, unknown>>("SELECT * FROM event WHERE name = 'practice_completed'")!;
    expect(row).toMatchObject({ release: 'test', channel: 'squad_invite', cohort: 'experiment' });
    expect(row.arm_bonus === 'A' || row.arm_bonus === 'B').toBe(true);
    // Unknown fields or names are refused.
    expect(() => t.wp3.events.event(t.db, 'practice_completed', { extra: 1 } as never, { pseudonym })).toThrow(/extra|Unrecognized/i);
    expect(() => t.wp3.events.event(t.db, 'session_completed' as never, {} as never, { pseudonym })).toThrow(/session_completed|Unknown|invalid/i);
    expect(() => t.wp3.events.event(t.db, 'practice_completed', {}, {})).toThrow(/pseudonym/);
  });

  it('§8.2 POST /events: client events only, UNKNOWN_EVENT otherwise; pre users go to event_pending', async () => {
    const t = wp3App(driver);
    const anon = new Client(t);
    expect((await anon.post('/events', { name: 'squad_prompt_shown', props: { dag: 1 } })).status).toBe(401);
    const pre = new Client(t);
    await pre.post('/auth/magic-link', { email: 'p@example.nl', locale: 'nl', invite_token: seedInvite(t) });
    await pre.post('/auth/confirm', { token: lastLogin(t, 'p@example.nl').token });
    expect((await pre.post('/events', { name: 'squad_prompt_shown', props: { dag: 2 } })).status).toBe(202);
    expect(t.db.get('SELECT name, props FROM event_pending')).toEqual({ name: 'squad_prompt_shown', props: '{"dag":2}' });
    const c = await register(t, 'sanne@example.nl', '2000-01-01');
    const unknown = await c.post<{ error: { code: string } }>('/events', { name: 'made_up', props: {} });
    expect(unknown.status).toBe(422);
    expect(unknown.body.error.code).toBe('UNKNOWN_EVENT');
    expect((await c.post<{ error: { code: string } }>('/events', { name: 'session_completed', props: {} })).body.error.code).toBe('UNKNOWN_EVENT');
    expect((await c.post('/events', { name: 'squad_prompt_shown', props: { dag: 9 } })).status).toBe(422);
    expect((await c.post('/events', { name: 'squad_prompt_shown', props: { dag: 1 } })).status).toBe(202);
  });

  it('§8.2 POST /me/plus-interest: FEATURE_DISABLED until the flag is on', async () => {
    const t = wp3App(driver);
    const c = await register(t, 'sanne@example.nl', '2000-01-01');
    expect((await c.post<{ error: { code: string } }>('/me/plus-interest')).body.error.code).toBe('FEATURE_DISABLED');
    t.db.run("INSERT INTO feature_flag (key, enabled, updated_at, updated_by) VALUES ('plus_door', 1, '2026-11-05', 'test')");
    expect((await c.post('/me/plus-interest')).status).toBe(204);
    expect(t.db.get("SELECT count(*) AS n FROM event WHERE name = 'plus_interest'")).toEqual({ n: 1 });
    expect(() => t.db.run("INSERT INTO feature_flag (key, enabled, updated_at, updated_by) VALUES ('draws', 1, 'x', 'y')")).toThrow(/CHECK constraint/);
  });
});
