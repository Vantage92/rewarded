// Test harness for WP-3: in-memory SQLite with the WP-3 migrations, the dev platform, a memory
// logger, real WP-3 services and a small HTTP client with a cookie jar and the CSRF double submit.
import { createApp } from '../../src/app.ts';
import { MIGRATIONS_DIR } from '../../src/config.ts';
import { migrate, migrationOwner } from '../../src/db/migrate.ts';
import { openDb } from '../../src/db/open.ts';
import { idsFor } from '../../src/db/ids.ts';
import { createSqlServices } from '../../src/db/services/index.ts';
import type { DriverName } from '../../src/db/types.ts';
import type { HttpConfig } from '../../src/middleware/context.ts';
import type { ApiModule, ModuleDeps } from '../../src/module.ts';
import { module as auth } from '../../src/modules/auth/index.ts';
import { module as dev } from '../../src/modules/dev/index.ts';
import { module as events } from '../../src/modules/events/index.ts';
import { module as waitlist } from '../../src/modules/waitlist/index.ts';
import { DEV_PEPPERS, DevClock, DevInbox, DevMailer, DevSmsSender, SeededRandom } from '../../src/platform/dev.ts';
import { MemoryLogger } from '../../src/platform/log.ts';
import { DevNetClassifier } from '../../src/platform/net.ts';
import { HmacHasher } from '../../src/platform/system.ts';
import { createServices } from '../../src/services/index.ts';

export const DRIVERS: DriverName[] = ['better-sqlite3', 'node:sqlite'];
export const ORIGIN = 'http://app.test';
export const WP3_MODULES: readonly ApiModule[] = [auth, waitlist, events, dev];

export function wp3App(driver: DriverName = 'better-sqlite3', opts: { start?: string; modules?: readonly ApiModule[] } = {}) {
  const clock = new DevClock(new Date(opts.start ?? '2026-11-05T09:00:00Z'));
  const inbox = new DevInbox(clock);
  const db = openDb({ path: ':memory:', driver });
  migrate(db, { dir: MIGRATIONS_DIR, clock, only: (v) => migrationOwner(v) === 'WP-3' });
  const logger = new MemoryLogger(() => clock.now());
  const platform = {
    clock,
    random: new SeededRandom(7),
    mailer: new DevMailer(inbox, false),
    sms: new DevSmsSender(inbox, false),
    hasher: new HmacHasher(DEV_PEPPERS),
    logger,
    net: new DevNetClassifier(),
  };
  const http: HttpConfig = { appOrigin: ORIGIN, trustProxy: true, secureCookies: false, release: 'test' };
  const wp3 = createSqlServices(db, platform, { seed: 'test-seed-0000000000000000000000000000', seedVersion: 'test', release: 'test' });
  const services = createServices(wp3);
  const deps: ModuleDeps = { db, platform, services, http };
  const app = createApp({ modules: opts.modules ?? WP3_MODULES, deps });
  return { app, db, clock, inbox, logger, deps, wp3 };
}

export type TestApp = ReturnType<typeof wp3App>;

export interface Res<T = unknown> {
  status: number;
  body: T;
  headers: Headers;
}

/** A browser-like client: keeps cookies, sends Origin and the CSRF header on mutations. */
export class Client {
  readonly cookies = new Map<string, string>();
  ip: string;
  readonly t: TestApp;
  userAgent = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1';
  constructor(t: TestApp, ip = '203.0.113.10') {
    this.t = t;
    this.ip = ip;
  }

  private cookieHeader(): string {
    return [...this.cookies].map(([k, v]) => `${k}=${v}`).join('; ');
  }

  private store(headers: Headers): void {
    for (const line of headers.getSetCookie()) {
      const [pair] = line.split(';');
      const eq = pair!.indexOf('=');
      const name = pair!.slice(0, eq).trim();
      const value = pair!.slice(eq + 1).trim();
      if (value === '' || /Max-Age=0/i.test(line)) this.cookies.delete(name);
      else this.cookies.set(name, value);
    }
  }

  async request<T = unknown>(
    method: string,
    path: string,
    body?: unknown,
    extra: { headers?: Record<string, string>; csrf?: boolean; origin?: string | null } = {},
  ): Promise<Res<T>> {
    if (method !== 'GET' && !this.cookies.has('rw_csrf')) await this.request('GET', '/health');
    const headers: Record<string, string> = { 'User-Agent': this.userAgent, 'X-Forwarded-For': this.ip, ...(extra.headers ?? {}) };
    const cookie = this.cookieHeader();
    if (cookie) headers.Cookie = cookie;
    if (method !== 'GET') {
      if (extra.origin !== null) headers.Origin = extra.origin ?? ORIGIN;
      if (extra.csrf !== false && this.cookies.has('rw_csrf') && !headers['X-CSRF-Token']) headers['X-CSRF-Token'] = this.cookies.get('rw_csrf')!;
    }
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    const res = await this.t.app.request(`/api/v1${path}`, { method, headers, ...(body !== undefined ? { body: JSON.stringify(body) } : {}) });
    this.store(res.headers);
    const text = await res.text();
    return { status: res.status, body: (text ? JSON.parse(text) : undefined) as T, headers: res.headers };
  }

  get<T = unknown>(path: string) {
    return this.request<T>('GET', path);
  }
  post<T = unknown>(path: string, body?: unknown, extra?: Parameters<Client['request']>[3]) {
    return this.request<T>('POST', path, body, extra);
  }
}

/** Latest login mail to `to`: the token from the URL fragment and the six-digit code. */
export function lastLogin(t: TestApp, to: string): { token: string; code: string } {
  const mail = t.inbox.list(to).filter((m) => m.channel === 'email').at(-1);
  if (!mail || mail.channel !== 'email') throw new Error(`No mail to ${to}`);
  const token = /#t=([A-Za-z0-9_-]+)/.exec(mail.text)?.[1];
  const code = /(\d{6})/.exec(mail.text.replace(/#t=[^\s]+/, ''))?.[1];
  if (!token || !code) throw new Error('No token or code in the mail');
  return { token, code };
}

/** An invite row as the invites module (WP-5) or the waitlist batch would create it. */
export function seedInvite(t: TestApp, opts: { token?: string; source?: string; maxUses?: number; squadId?: string; clubId?: string; expiresAt?: string } = {}): string {
  const token = opts.token ?? `inv${Math.random().toString(36).slice(2).padEnd(20, 'x')}`;
  t.db.run(
    'INSERT INTO invite (id, token, source, squad_id, club_id, max_uses, uses, expires_at, created_at) VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?)',
    [
      idsFor(t.deps.platform).ulid(),
      token,
      opts.source ?? 'squad',
      opts.squadId ?? null,
      opts.clubId ?? null,
      opts.maxUses ?? 5,
      opts.expiresAt ?? '2026-12-31T00:00:00.000Z',
      t.clock.now().toISOString(),
    ],
  );
  return token;
}

export const ONBOARDING = {
  first_name: 'Sanne',
  terms_version: '0.3',
  privacy_version: '0.3',
  research_info_version: '0.3',
  daily_goal_min: 25,
} as const;

/** Full registration through link confirmation; returns the logged-in client. */
export async function register(t: TestApp, email: string, birthDate: string, inviteToken = seedInvite(t), ip?: string): Promise<Client> {
  const c = new Client(t, ip);
  const ml = await c.post('/auth/magic-link', { email, locale: 'nl', invite_token: inviteToken });
  if (ml.status !== 202) throw new Error(`magic-link ${ml.status} ${JSON.stringify(ml.body)}`);
  const conf = await c.post('/auth/confirm', { token: lastLogin(t, email).token });
  if (conf.status !== 200) throw new Error(`confirm ${conf.status}`);
  const ob = await c.post('/onboarding', { ...ONBOARDING, birth_date: birthDate });
  if (ob.status !== 201) throw new Error(`onboarding ${ob.status} ${JSON.stringify(ob.body)}`);
  return c;
}

export function userIdOf(t: TestApp, email: string): string {
  return t.db.get<{ id: string }>('SELECT id FROM user WHERE email = ?', [email])!.id;
}

/** Makes a registered user an admin; with `mfa` the current sessions count as verified. */
export function makeAdmin(t: TestApp, email: string, opts: { role?: 'admin' | 'reviewer'; mfa?: boolean } = {}): string {
  const userId = userIdOf(t, email);
  t.db.run('INSERT INTO admin (user_id, role, created_at, created_by) VALUES (?, ?, ?, ?)', [userId, opts.role ?? 'admin', t.clock.now().toISOString(), 'test']);
  t.db.run('UPDATE user SET is_team = 1 WHERE id = ?', [userId]);
  if (opts.mfa !== false) t.db.run('UPDATE auth_session SET mfa_at = ? WHERE user_id = ?', [t.clock.now().toISOString(), userId]);
  return userId;
}
