// Repair (review finding 3): a blocked account keeps a restricted session for the appeal (spec §6.5,
// art. 22 AVG), the export and DELETE /me; everything else is ACCOUNT_BLOCKED.
import { describe, expect, it } from 'vitest';
import { login } from '../seed/flows.ts';
import { world } from './world.ts';

describe('spec §6.5 beroep na een blokkade (reparatie)', () => {
  it('§6.5 blocked: login works, only /me, /appeals, /appeals/mine, export and DELETE /me; an upheld appeal makes the account active again', async () => {
    const w = await world('2026-12-07');
    const s = await w.student();
    const flagId = w.db.transaction(() => w.ctx.deps.services.flags.raise(w.db, { code: 'H2', subject: { type: 'account', id: s.id }, sessionIds: [], evidence: { test: true } }));
    await w.anna.api.call('admin.flags.decide', { params: { id: flagId }, body: { decision: 'block', reason_code: 'fraud_confirmed', note: 'test' } });
    await w.bram.api.call('admin.blocks.confirm', { params: { id: flagId }, body: { note: 'bevestigd' } });
    expect(w.db.get<{ status: string }>('SELECT status FROM user WHERE id = ?', [s.id])?.status).toBe('blocked');
    // The block ended every session; logging in again gives a restricted session.
    await login(w.ctx.world, s.a, s.email);
    const me = await s.a.api.call('me.get');
    expect(me.user?.blocked).toBe(true);
    expect(await s.a.codeOf(s.a.api.call('points.balance'))).toBe('ACCOUNT_BLOCKED');
    const mine = await s.a.api.call('appeals.mine');
    expect(mine.items[0]).toMatchObject({ flag_id: flagId, kind: 'block', status: 'blocked', reason_code: 'fraud_confirmed', appeal: null });
    expect(mine.items[0]?.appeal_until).not.toBeNull();
    const exp = await s.a.api.call('privacy.export');
    expect(exp.format).toBe('rewarded-export-v1');
    const appeal = await s.a.api.call('appeals.create', { body: { object_type: 'block', object_id: flagId, text: 'Ik heb maar één account.' } });
    expect(appeal.appeal_id).toMatch(/^[0-9A-Z]{26}$/);
    // Anna decided and Bram confirmed: a third admin decides the appeal.
    const c = w.ctx.newActor('203.0.113.240');
    const { DEMO_ADMINS } = await import('../seed/admins.ts');
    const { adminLogin } = await import('../seed/flows.ts');
    await adminLogin(w.ctx.world, c, DEMO_ADMINS[2]!);
    await c.api.call('admin.appeals.decide', { params: { id: appeal.appeal_id }, body: { outcome: 'upheld', motivation: 'Geen tweede account gevonden.' } });
    expect(w.db.get<{ status: string }>('SELECT status FROM user WHERE id = ?', [s.id])?.status).toBe('active');
    await login(w.ctx.world, s.a, s.email);
    expect((await s.a.api.call('me.get')).user?.blocked).toBeUndefined();
    expect((await s.a.api.call('points.balance')).available).toBeGreaterThanOrEqual(0);
  }, 120_000);
});
