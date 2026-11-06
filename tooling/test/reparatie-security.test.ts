// Repair wave, security findings (docs/build/REPARATIE.md): MFA attempts (architecture §10.2),
// reminders opt-in (P5), magic link to the account address, X-Forwarded-For.
import { describe, expect, it } from 'vitest';
import { DEMO_ADMINS } from '../seed/admins.ts';
import { adminTotp, seedContext } from '../seed/index.ts';
import { login } from '../seed/flows.ts';
import { world } from './world.ts';

describe('arch §10.2 rate limit op POST /admin/mfa/verify (reparatie)', () => {
  it('§10.2 the sixth wrong code in 15 minutes is RATE_LIMITED, also with the right code and after a restart', async () => {
    const w = await world('2026-12-07');
    const a = w.ctx.newActor('203.0.113.230');
    await login(w.ctx.world, a, DEMO_ADMINS[2]!.email);
    for (let i = 0; i < 5; i++) expect(await a.codeOf(a.api.call('admin.mfa.verify', { body: { code: '000000' } }))).toBe('MFA_INVALID');
    expect(await a.codeOf(a.api.call('admin.mfa.verify', { body: { code: '000000' } }))).toBe('RATE_LIMITED');
    const lock = w.db.get<{ failed_count: number; locked_until: string | null }>('SELECT failed_count, locked_until FROM admin_mfa a JOIN user u ON u.id = a.user_id WHERE u.email = ?', [DEMO_ADMINS[2]!.email]);
    expect(lock?.failed_count).toBe(5);
    expect(lock?.locked_until).not.toBeNull();
    // A restart (a new in-process API on the same database) keeps the lock, also for the right code.
    const ctx2 = await seedContext({ db: w.db, clock: w.clock, hasher: w.hasher }, 4242);
    const b = ctx2.newActor('203.0.113.231');
    await login(ctx2.world, b, DEMO_ADMINS[2]!.email);
    expect(await b.codeOf(b.api.call('admin.mfa.verify', { body: { code: adminTotp(DEMO_ADMINS[2]!.key, w.clock.now()) } }))).toBe('RATE_LIMITED');
  }, 60_000);
});

describe('arch §10.2 client-IP achter de proxy (reparatie)', () => {
  it('§10.2 a forged first X-Forwarded-For element is ignored; the element of our own proxy counts', async () => {
    const { clientIp } = await import('../../apps/api/src/middleware/request.ts');
    const h = new Headers({ 'x-forwarded-for': '10.9.9.9, 198.51.100.7' });
    expect(clientIp(h, undefined, true)).toBe('198.51.100.7');
    expect(clientIp(new Headers({ 'x-forwarded-for': '10.9.9.9, 198.51.100.7, 203.0.113.1' }), undefined, true, 2)).toBe('198.51.100.7');
    expect(clientIp(h, { incoming: { socket: { remoteAddress: '192.0.2.5' } } }, false)).toBe('192.0.2.5');
  });
});

describe('arch §10.1 inlogmail naar het adres van het account (reparatie)', () => {
  it('§10.1 a plus variant of an existing address gets no login mail; the mail goes to the account address', async () => {
    const w = await world('2026-12-07');
    const s = await w.student();
    const [local, domain] = s.email.split('@') as [string, string];
    const variant = `${local}+x@${domain}`;
    const before = (await w.ctx.world.inbox(s.email)).length;
    const a = w.ctx.newActor('203.0.113.250');
    await a.api.call('auth.magicLink', { body: { email: variant, locale: 'nl' } });
    expect(await w.ctx.world.inbox(variant)).toHaveLength(0);
    expect((await w.ctx.world.inbox(s.email)).length).toBe(before + 1);
    expect(w.db.get<{ email: string }>('SELECT email FROM auth_magic_link ORDER BY created_at DESC LIMIT 1')?.email).toBe(s.email);
  }, 60_000);
});
