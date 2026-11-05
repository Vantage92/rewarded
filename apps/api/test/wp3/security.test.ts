// CSRF refusal (architecture §8.1, §10.3), security headers, the audit log that refuses UPDATE and
// DELETE (§10.8), idempotency (§4.7, §5.4) and authorisation levels (§8.1); on both drivers.
import { describe, expect, it } from 'vitest';
import { Hono } from 'hono';
import { DRIVERS, Client, ORIGIN, lastLogin, makeAdmin, register, seedInvite, wp3App } from './helpers.ts';
import { adminActor, auditRef } from '../../src/db/services/audit.ts';
import { csrfValueMatches } from '../../src/middleware/csrf.ts';
import type { AppEnv } from '../../src/middleware/context.ts';
import type { ApiModule } from '../../src/module.ts';
import { WP3_MODULES } from './helpers.ts';

type Err = { error: { code: string } };
const code = (r: { body: unknown }) => (r.body as Err).error?.code;

describe.each(DRIVERS)('CSRF on %s (arch §10.3)', (driver) => {
  it('refuses a mutation without the X-CSRF-Token header', async () => {
    const t = wp3App(driver);
    const c = new Client(t);
    const res = await c.post('/auth/magic-link', { email: 'a@example.nl', locale: 'nl', invite_token: seedInvite(t) }, { csrf: false });
    expect(res.status).toBe(403);
    expect(code(res)).toBe('CSRF_INVALID');
    expect(t.inbox.list()).toHaveLength(0);
  });

  it('refuses a token that differs from the cookie, a foreign Origin and a missing Origin', async () => {
    const t = wp3App(driver);
    const c = new Client(t);
    await c.get('/health');
    const body = { email: 'a@example.nl', locale: 'nl', invite_token: seedInvite(t) };
    expect(code(await c.post('/auth/magic-link', body, { headers: { 'X-CSRF-Token': 'x'.repeat(32) } }))).toBe('CSRF_INVALID');
    expect(code(await c.post('/auth/magic-link', body, { origin: 'https://evil.example' }))).toBe('CSRF_INVALID');
    expect(code(await c.post('/auth/magic-link', body, { origin: null }))).toBe('CSRF_INVALID');
    expect((await c.post('/auth/magic-link', body)).status).toBe(202);
  });

  it('refuses a mutation without the rw_csrf cookie and hands one out on that answer', async () => {
    const t = wp3App(driver);
    const res = await t.app.request('/api/v1/auth/logout', { method: 'POST', headers: { Origin: ORIGIN } });
    expect(res.status).toBe(403);
    expect(res.headers.getSetCookie().some((h) => h.startsWith('rw_csrf=') && !/HttpOnly/i.test(h))).toBe(true);
  });

  it('a signed-in student is refused too (no state change without the token)', async () => {
    const t = wp3App(driver);
    const c = await register(t, 'sanne@example.nl', '2000-01-01');
    const res = await c.request('PATCH', '/me/settings', { compare_opt_in: true }, { csrf: false });
    expect(code(res)).toBe('CSRF_INVALID');
    expect(t.db.get('SELECT compare_opt_in FROM user')).toEqual({ compare_opt_in: 0 });
  });

  it('the beacon path takes the token from the body (sendBeacon sets no headers, §8.1)', async () => {
    const probe: ApiModule = {
      name: 'probe',
      owner: 'test',
      register(api) {
        api.post('/sessions/:id/events', async (c) => {
          const b = (await c.req.json()) as { csrf?: string };
          return c.json({ ok: csrfValueMatches(c as unknown as import('hono').Context<AppEnv>, b.csrf) });
        });
      },
    };
    const t = wp3App(driver, { modules: [...WP3_MODULES, probe] });
    const c = new Client(t);
    await c.get('/health');
    const ok = await c.post<{ ok: boolean }>('/sessions/01JC0000000000000000000000/events', { csrf: c.cookies.get('rw_csrf') }, { csrf: false });
    expect(ok.body.ok).toBe(true);
    expect(code(await c.post('/sessions/x/events', {}, { csrf: false, origin: 'https://evil.example' }))).toBe('CSRF_INVALID');
  });

  it('sets the security headers of §10.3 on every answer', async () => {
    const t = wp3App(driver);
    const res = await t.app.request('/api/v1/health');
    expect(res.headers.get('Content-Security-Policy')).toContain("default-src 'self'");
    expect(res.headers.get('Referrer-Policy')).toBe('same-origin');
    expect(res.headers.get('X-Content-Type-Options')).toBe('nosniff');
    expect(res.headers.get('Permissions-Policy')).toBe('camera=(), microphone=(), geolocation=()');
  });
});

describe.each(DRIVERS)('audit log on %s (arch §10.8)', (driver) => {
  it('the audit writer appends; SQLite refuses UPDATE and DELETE on audit_log', () => {
    const t = wp3App(driver);
    const id = t.db.transaction(() =>
      t.wp3.audit.audit(t.db, { actor: adminActor(t.deps.platform.hasher, 'user-1'), action: 'user_viewed', objectType: 'user', objectRef: auditRef(t.deps.platform.hasher, 'user-2'), reason: 'support' }),
    );
    const row = t.db.get<{ actor_ref: string; object_ref: string }>('SELECT actor_ref, object_ref FROM audit_log WHERE id = ?', [id])!;
    expect(row.object_ref).toMatch(/^u_[0-9a-f]{32}$/);
    expect(JSON.stringify(row)).not.toContain('user-2');
    expect(() => t.db.run("UPDATE audit_log SET reason = 'x'")).toThrow(/append-only/);
    expect(() => t.db.run('DELETE FROM audit_log')).toThrow(/append-only/);
    expect(() => t.db.run('DELETE FROM audit_log WHERE id = ?', [id])).toThrow(/append-only/);
    expect(t.db.get('SELECT count(*) AS n FROM audit_log')).toEqual({ n: 1 });
  });

  it('an audit line written in a transaction that rolls back is gone with it', () => {
    const t = wp3App(driver);
    expect(() =>
      t.db.transaction(() => {
        t.wp3.audit.audit(t.db, { actor: 'system', action: 'flag_decided', objectType: 'flag', objectRef: 'f1' });
        throw new Error('decision failed');
      }),
    ).toThrow('decision failed');
    expect(t.db.get('SELECT count(*) AS n FROM audit_log')).toEqual({ n: 0 });
    expect(() => t.wp3.audit.audit(t.db, { actor: 'system', action: 'Bad Action', objectType: 'x', objectRef: 'y' })).toThrow();
  });
});

describe.each(DRIVERS)('idempotency on %s (arch §4.7, §5.4)', (driver) => {
  const body = { email: 'lotte@example.nl', locale: 'nl', source: 'landing', consent_version: 'v1' };

  it('replays the stored answer for the same key and body, conflicts on another body, requires the header', async () => {
    const t = wp3App(driver);
    const c = new Client(t);
    const key = { headers: { 'Idempotency-Key': 'key-123456789' } };
    expect((await c.post('/waitlist', body, key)).status).toBe(202);
    const again = await c.post('/waitlist', body, key);
    expect(again.status).toBe(202);
    expect(again.headers.get('Idempotent-Replayed')).toBe('true');
    expect(t.inbox.list('lotte@example.nl')).toHaveLength(1);
    const other = await c.post('/waitlist', { ...body, email: 'other@example.nl' }, key);
    expect(other.status).toBe(409);
    expect(code(other)).toBe('IDEMPOTENCY_CONFLICT');
    expect(code(await c.post('/waitlist', body))).toBe('VALIDATION_FAILED');
    // After 24 hours the key may be used again (§10.6).
    t.clock.advance(24 * 3600 * 1000 + 1);
    expect((await c.post('/waitlist', { ...body, email: 'other@example.nl' }, key)).status).toBe(202);
  });
});

describe.each(DRIVERS)('authorisation levels on %s (arch §8.1, §10.8)', (driver) => {
  it('public, pre, student and admin with second factor', async () => {
    const t = wp3App(driver);
    const anon = new Client(t);
    expect(code(await anon.get('/me'))).toBe('AUTH_REQUIRED');
    expect(code(await anon.get('/admin/waitlist'))).toBe('AUTH_REQUIRED');
    const pre = new Client(t);
    await pre.post('/auth/magic-link', { email: 'p@example.nl', locale: 'nl', invite_token: seedInvite(t) });
    await pre.post('/auth/confirm', { token: lastLogin(t, 'p@example.nl').token });
    expect(code(await pre.request('PATCH', '/me/settings', { compare_opt_in: true }))).toBe('FORBIDDEN');
    const student = await register(t, 's@example.nl', '2000-01-01');
    expect(code(await student.get('/admin/waitlist'))).toBe('FORBIDDEN');
    expect(code(await student.post('/onboarding', {}))).toBe('FORBIDDEN');
    const admin = await register(t, 'admin@example.nl', '1990-01-01');
    makeAdmin(t, 'admin@example.nl', { mfa: false });
    expect(code(await admin.get('/admin/waitlist'))).toBe('MFA_REQUIRED');
    t.db.run('UPDATE auth_session SET mfa_at = ? WHERE user_id IS NOT NULL', [t.clock.now().toISOString()]);
    expect((await admin.get('/admin/waitlist')).status).toBe(200);
    // Admin sessions end 12 hours after creation.
    t.clock.advance(12 * 3600 * 1000);
    expect(code(await admin.get('/admin/waitlist'))).toBe('AUTH_REQUIRED');
    expect((await student.get('/me')).status).toBe(200);
  });

  it('routes validate strictly: unknown fields and bad JSON give VALIDATION_FAILED without echoing values', async () => {
    const t = wp3App(driver);
    const c = new Client(t);
    const res = await c.post<{ error: { details: unknown } }>('/auth/magic-link', { email: 'geheim@example.nl', locale: 'nl', foo: 1 });
    expect(code(res)).toBe('VALIDATION_FAILED');
    expect(JSON.stringify(res.body)).not.toContain('geheim@example.nl');
    const raw = await t.app.request('/api/v1/auth/confirm', {
      method: 'POST',
      headers: { Origin: ORIGIN, Cookie: `rw_csrf=${c.cookies.get('rw_csrf')}`, 'X-CSRF-Token': c.cookies.get('rw_csrf')!, 'Content-Type': 'application/json' },
      body: '{not json',
    });
    expect(raw.status).toBe(422);
  });
});

describe('error handler', () => {
  it('maps unknown errors to INTERNAL without the message', async () => {
    const boom: ApiModule = {
      name: 'boom',
      owner: 'test',
      register(api: Hono<AppEnv>) {
        api.get('/boom', () => {
          throw new Error('secret sanne@example.nl');
        });
      },
    };
    const t = wp3App('better-sqlite3', { modules: [...WP3_MODULES, boom] });
    const res = await t.app.request('/api/v1/boom');
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: { code: 'INTERNAL', message_key: 'errors.common.internal' } });
    expect(t.logger.text()).not.toContain('sanne@example.nl');
  });
});
