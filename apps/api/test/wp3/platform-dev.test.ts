// TOTP for admins (arch §10.8), the dev routes and the dev clock (arch §8.2 Ontwikkeling, §10.3),
// the migration series (§12.3) and the error namespaces of WP-3 (§12.3); on both drivers.
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { ERROR_CODES, errorModule, messageKey, type ErrorCode } from '@rewarded/contracts';
import { afterEach, describe, expect, it } from 'vitest';
import { enrollMfa, mfaDepsOf, verifyMfa } from '../../src/db/adminMfa.ts';
import { migrate, migrationOwner } from '../../src/db/migrate.ts';
import { openDb } from '../../src/db/open.ts';
import { modules } from '../../src/modules.gen.ts';
import { DEV_TOTP_KEY, DevClock } from '../../src/platform/dev.ts';
import { base32Decode, hotp, totpAt, verifyTotp } from '../../src/platform/totp.ts';
import { DRIVERS, Client, makeAdmin, register, seedInvite, wp3App } from './helpers.ts';

const RFC_SECRET = new TextEncoder().encode('12345678901234567890');

describe('TOTP (arch §10.8, RFC 6238)', () => {
  it('matches the RFC 6238 SHA-1 test vectors (last six digits)', () => {
    expect(totpAt(RFC_SECRET, new Date(59_000))).toBe('287082');
    expect(totpAt(RFC_SECRET, new Date(1_111_111_109_000))).toBe('081804');
    expect(totpAt(RFC_SECRET, new Date(1_234_567_890_000))).toBe('005924');
    expect(totpAt(RFC_SECRET, new Date(2_000_000_000_000))).toBe('279037');
    expect(hotp(RFC_SECRET, 0)).toBe('755224');
  });

  it('accepts one step of drift, refuses older steps and a step that was already used', () => {
    const now = new Date(1_234_567_890_000);
    const prev = totpAt(RFC_SECRET, new Date(now.getTime() - 30_000));
    const old = totpAt(RFC_SECRET, new Date(now.getTime() - 90_000));
    const step = verifyTotp(RFC_SECRET, prev, now, null);
    expect(step).not.toBeNull();
    expect(verifyTotp(RFC_SECRET, prev, now, step)).toBeNull();
    expect(verifyTotp(RFC_SECRET, old, now, null)).toBeNull();
    expect(verifyTotp(RFC_SECRET, '12345', now, null)).toBeNull();
  });

  it('mfaDepsOf refuses to run without a configured key', () => {
    const clock = new DevClock(new Date());
    expect(() => mfaDepsOf({ clock, random: { bytes: (n) => new Uint8Array(n), int: () => 0 } })).toThrow(/TOTP key/);
  });
});

describe.each(DRIVERS)('admin second factor on %s (arch §10.8)', (driver) => {
  it('enrol, verify sets mfa_at on the session, a code works once, an enrolled factor is not replaced', async () => {
    const t = wp3App(driver);
    const c = await register(t, 'beheer@example.nl', '1990-01-01');
    const userId = makeAdmin(t, 'beheer@example.nl', { mfa: false });
    expect((await c.get<{ error: { code: string } }>('/admin/waitlist')).body.error.code).toBe('MFA_REQUIRED');
    const deps = mfaDepsOf(t.deps.platform);
    const { secret, otpauth_uri } = t.db.transaction(() => enrollMfa(t.db, deps, userId, 'beheer@example.nl'));
    expect(otpauth_uri).toMatch(/^otpauth:\/\/totp\/Rewarded%3Abeheer%40example\.nl\?secret=[A-Z2-7]+&issuer=Rewarded&algorithm=SHA1&digits=6&period=30$/);
    // Stored encrypted, never as the base32 secret.
    const stored = t.db.get<{ totp_secret_enc: string }>('SELECT totp_secret_enc FROM admin_mfa WHERE user_id = ?', [userId])!.totp_secret_enc;
    expect(stored.startsWith('v1.')).toBe(true);
    expect(stored).not.toContain(secret);

    const sessionId = t.db.get<{ id: string }>('SELECT id FROM auth_session WHERE user_id = ?', [userId])!.id;
    const codeNow = totpAt(base32Decode(secret), t.clock.now());
    expect(() => t.db.transaction(() => verifyMfa(t.db, deps, userId, sessionId, '000000' === codeNow ? '111111' : '000000'))).toThrow('MFA_INVALID');
    const r = t.db.transaction(() => verifyMfa(t.db, deps, userId, sessionId, codeNow));
    expect(r.mfa_at).toBe(t.clock.now().toISOString());
    expect(t.db.get('SELECT mfa_at FROM auth_session WHERE id = ?', [sessionId])).toEqual({ mfa_at: r.mfa_at });
    expect((await c.get('/admin/waitlist')).status).toBe(200);
    // Replay of the same code is refused.
    expect(() => t.db.transaction(() => verifyMfa(t.db, deps, userId, sessionId, codeNow))).toThrow('MFA_INVALID');
    expect(() => t.db.transaction(() => enrollMfa(t.db, deps, userId, 'beheer@example.nl'))).toThrow('FORBIDDEN');
    // Another key cannot decrypt the secret.
    expect(() => verifyMfa(t.db, { ...deps, totpKey: `${DEV_TOTP_KEY}-other` }, userId, sessionId, codeNow)).toThrow(/authenticate/);
  });

  it('an admin session ends 12 hours after it started, even when active (§10.1)', async () => {
    const t = wp3App(driver);
    const c = await register(t, 'beheer@example.nl', '1990-01-01');
    makeAdmin(t, 'beheer@example.nl');
    t.clock.advance(11 * 3600_000);
    expect((await c.get('/admin/waitlist')).status).toBe(200);
    t.clock.advance(3600_000);
    expect((await c.get<{ error: { code: string } }>('/admin/waitlist')).body.error.code).toBe('AUTH_REQUIRED');
  });
});

describe.each(DRIVERS)('dev routes on %s (arch §8.2 Ontwikkeling)', (driver) => {
  it('dev clock: set and advance; the inbox holds the login mail with the fragment link and the code', async () => {
    const t = wp3App(driver);
    const c = new Client(t);
    const set = await c.post<{ now: string }>('/dev/clock', { set: '2026-11-20T08:00:00.000Z' });
    expect(set.body.now).toBe('2026-11-20T08:00:00.000Z');
    expect((await c.post<{ now: string }>('/dev/clock', { advance_ms: 90_000 })).body.now).toBe('2026-11-20T08:01:30.000Z');
    expect(t.clock.now().toISOString()).toBe('2026-11-20T08:01:30.000Z');
    await c.post('/auth/magic-link', { email: 'dev@example.nl', locale: 'en', invite_token: seedInvite(t) });
    const inbox = await c.get<{ messages: { channel: string; to: string; text: string }[] }>('/dev/inbox?to=dev@example.nl');
    expect(inbox.body.messages).toHaveLength(1);
    expect(inbox.body.messages[0]!.text).toMatch(/\/auth\/bevestig#t=[A-Za-z0-9_-]{43}/);
    expect(inbox.body.messages[0]!.text).toMatch(/\b\d{6}\b/);
  });

  it('dev job run: day close once per run_key, a second run is skipped', async () => {
    const t = wp3App(driver);
    const c = new Client(t);
    const first = await c.post<{ status: string; run_key: string }>('/dev/jobs/day_close/run', { run_key: 'day_close:2026-11-04' });
    expect(first.body).toEqual({ status: 'done', run_key: 'day_close:2026-11-04' });
    expect((await c.post<{ status: string }>('/dev/jobs/day_close/run', { run_key: 'day_close:2026-11-04' })).body.status).toBe('skipped');
    // A job name outside the contract is invalid. Since the integration wave every contract name has
    // a job file (jobs/retention.ts and jobs/sweep.ts), so retention runs.
    expect((await c.post<{ error: { code: string } }>('/dev/jobs/nope/run', {})).body.error.code).toBe('VALIDATION_FAILED');
    expect((await c.post<{ status: string }>('/dev/jobs/retention/run', {})).body.status).toBe('done');
  });

  it('dev reset empties the tables, keeps the migration log and the append-only triggers', async () => {
    const t = wp3App(driver);
    const c = await register(t, 'sanne@example.nl', '2000-01-01');
    t.db.transaction(() => t.wp3.audit.audit(t.db, { actor: 'system', action: 'test_line', objectType: 'test', objectRef: 'x' }));
    const anon = new Client(t);
    expect((await anon.post<{ ok: boolean }>('/dev/reset', {})).body).toEqual({ ok: true });
    expect(t.db.get('SELECT count(*) AS n FROM user')).toEqual({ n: 0 });
    expect(t.db.get('SELECT count(*) AS n FROM audit_log')).toEqual({ n: 0 });
    expect(t.db.get<{ n: number }>('SELECT count(*) AS n FROM schema_migration')!.n).toBeGreaterThan(0);
    expect(t.inbox.list()).toEqual([]);
    t.db.transaction(() => t.wp3.audit.audit(t.db, { actor: 'system', action: 'test_line', objectType: 'test', objectRef: 'y' }));
    expect(() => t.db.run('DELETE FROM audit_log')).toThrow(/append-only/);
    expect((await c.get('/me')).status).toBe(401);
  });

  it('A/A check on the assignment rule passes (voorregistratie §9.3)', async () => {
    const t = wp3App(driver);
    const r = await new Client(t).post<{ checks: { name: string; passed: boolean }[] }>('/dev/aa-check', { users: 400, seed: 'aa-seed-000000000000000000000000' });
    expect(r.status).toBe(200);
    expect(r.body.checks.every((ch) => ch.passed)).toBe(true);
  });

  it('the production module list has no dev routes (arch §10.3)', async () => {
    const t = wp3App(driver, { modules });
    const c = new Client(t);
    expect((await c.get('/dev/inbox')).status).toBe(404);
    expect((await c.post('/dev/clock', { advance_ms: 1 })).status).toBe(404);
    expect((await c.post('/dev/reset', {})).status).toBe(404);
  });
});

describe.each(DRIVERS)('migration series on %s (arch §12.3)', (driver) => {
  const dirs: string[] = [];
  afterEach(() => {
    for (const d of dirs.splice(0)) rmSync(d, { recursive: true, force: true });
  });
  it('WP-3 owns 0001–0079; a file outside every series is refused', () => {
    expect(migrationOwner('0001')).toBe('WP-3');
    expect(migrationOwner('0079')).toBe('WP-3');
    expect(migrationOwner('0080')).toBe('WP-6');
    expect(migrationOwner('0400')).toBeUndefined();
    const dir = mkdtempSync(join(tmpdir(), 'rw-wp3-'));
    dirs.push(dir);
    writeFileSync(join(dir, '0001_a.sql'), 'CREATE TABLE a (x INTEGER) STRICT;');
    writeFileSync(join(dir, '0400_b.sql'), 'CREATE TABLE b (x INTEGER) STRICT;');
    const db = openDb({ path: ':memory:', driver });
    expect(() => migrate(db, { dir, clock: new DevClock(new Date()) })).toThrow(/outside every work-package range/);
    expect(db.get("SELECT 1 AS x FROM sqlite_master WHERE name = 'a'")).toBeUndefined();
  });
});

describe('error namespaces of WP-3 (arch §12.3)', () => {
  const web = join(import.meta.dirname, '../../../web/src/i18n');
  it('every code of common, auth and events has a text in errors/<module>.json, in NL and EN', () => {
    for (const module of ['common', 'auth', 'events'] as const) {
      const codes = (Object.keys(ERROR_CODES) as ErrorCode[]).filter((c) => errorModule(c) === module);
      expect(codes.length).toBeGreaterThan(0);
      for (const locale of ['nl', 'en']) {
        const texts = JSON.parse(readFileSync(join(web, locale, 'errors', `${module}.json`), 'utf8')) as Record<string, string>;
        for (const code of codes) {
          const key = messageKey(code).split('.').at(-1)!;
          expect(texts[key], `${locale}/errors/${module}.json ${key}`).toMatch(/\S/);
        }
        expect(Object.keys(texts).sort()).toEqual(codes.map((c) => messageKey(c).split('.').at(-1)!).sort());
      }
    }
  });
});


describe('production bundle (arch §10.3)', () => {
  it('does not contain the dev routes, the dev clock or the dev TOTP key', async () => {
    const { build } = await import('vite');
    const { readdirSync } = await import('node:fs');
    const apiDir = join(import.meta.dirname, '../..');
    const outDir = join(apiDir, '.cache/wp3-prod-bundle');
    rmSync(outDir, { recursive: true, force: true });
    await build({ root: apiDir, configFile: join(apiDir, 'vite.config.ts'), logLevel: 'silent', build: { outDir } });
    const code = readdirSync(outDir, { recursive: true, encoding: 'utf8' })
      .filter((f) => f.endsWith('.js'))
      .map((f) => readFileSync(join(outDir, f), 'utf8'))
      .join('\n');
    rmSync(outDir, { recursive: true, force: true });
    for (const needle of ['dev/clock', 'dev/inbox', 'dev/reset', DEV_TOTP_KEY, 'DEV_PEPPERS', 'SeededRandom']) expect(code.includes(needle) ? needle : '').toBe('');
    expect(code).toContain('day_close');
  }, 60_000);
});
