// Sessions and authorisation levels (architecture §8.1, §10.1, §10.8).
// Cookie `rw_sid` (HttpOnly, SameSite=Lax, Secure outside localhost); the table stores only the
// SHA-256 of the cookie value. Sliding 30 days; admin sessions end 12 hours after creation and
// need a second factor (`mfa_at`) for everything except the MFA routes.
import { DomainError, type AuthLevel as ContractAuthLevel } from '@rewarded/contracts';
import type { Context, MiddlewareHandler } from 'hono';
import { deleteCookie, getCookie, setCookie } from 'hono/cookie';
import { randomToken, sha256 } from '../db/ids.ts';
import type { Db } from '../db/types.ts';
import type { Clock, Random } from '../platform/types.ts';
import type { AppEnv, AuthState, AuthUser } from './context.ts';

export type AuthLevel = ContractAuthLevel;

export const SESSION_COOKIE = 'rw_sid';
export const SESSION_TTL_MS = 30 * 24 * 3600 * 1000;
export const ADMIN_SESSION_TTL_MS = 12 * 3600 * 1000;
/** Pre sessions only live while the onboarding can run (event_pending: 24 hours, §3.5). */
export const PRE_SESSION_TTL_MS = 24 * 3600 * 1000;
const LAST_SEEN_RESOLUTION_MS = 60_000;

interface SessionRow {
  id: string;
  user_id: string | null;
  pending_email: string | null;
  pre_pseudonym: string | null;
  invite_token: string | null;
  created_at: string;
  expires_at: string;
  last_seen_at: string;
  mfa_at: string | null;
  u_pseudonym: string | null;
  u_email: string | null;
  u_age_band: AuthUser['ageBand'] | null;
  u_status: AuthUser['status'] | null;
  u_is_team: number | null;
  u_locale: AuthUser['locale'] | null;
  u_opted_out: string | null;
  a_role: AuthUser['adminRole'];
}

/** Reads the session for a cookie value; expired sessions are deleted and read as none. */
export function loadSession(db: Db, clock: Clock, cookieValue: string | undefined): AuthState {
  if (!cookieValue || cookieValue.length < 16 || cookieValue.length > 128) return { kind: 'none' };
  const id = sha256(cookieValue);
  const row = db.get<SessionRow>(
    `SELECT s.id, s.user_id, s.pending_email, s.pre_pseudonym, s.invite_token, s.created_at, s.expires_at, s.last_seen_at, s.mfa_at,
            u.pseudonym AS u_pseudonym, u.email AS u_email, u.age_band AS u_age_band, u.status AS u_status, u.is_team AS u_is_team,
            u.locale AS u_locale, u.research_opt_out_at AS u_opted_out, a.role AS a_role
       FROM auth_session s LEFT JOIN user u ON u.id = s.user_id LEFT JOIN admin a ON a.user_id = s.user_id
      WHERE s.id = ?`,
    [id],
  );
  if (!row) return { kind: 'none' };
  const now = clock.now();
  const isAdmin = row.a_role !== null && row.a_role !== undefined;
  const adminEnd = new Date(row.created_at).getTime() + ADMIN_SESSION_TTL_MS;
  if (new Date(row.expires_at).getTime() <= now.getTime() || (isAdmin && adminEnd <= now.getTime())) {
    db.run('DELETE FROM auth_session WHERE id = ?', [id]);
    return { kind: 'none' };
  }
  if (now.getTime() - new Date(row.last_seen_at).getTime() >= LAST_SEEN_RESOLUTION_MS && row.user_id !== null) {
    // Sliding expiry for users; pre sessions keep their fixed end.
    db.run('UPDATE auth_session SET last_seen_at = ?, expires_at = ? WHERE id = ?', [
      now.toISOString(),
      new Date(now.getTime() + SESSION_TTL_MS).toISOString(),
      id,
    ]);
  }
  if (row.user_id === null) {
    return {
      kind: 'pre',
      sessionId: id,
      email: row.pending_email ?? '',
      prePseudonym: row.pre_pseudonym ?? '',
      inviteToken: row.invite_token,
      createdAt: row.created_at,
    };
  }
  // A blocked account keeps a restricted session: appeal, export and delete only (spec §6.5,
  // art. 22 and 15–17 AVG); checkAuth refuses every other route with ACCOUNT_BLOCKED.
  if (row.u_status !== 'active' && row.u_status !== 'blocked') {
    db.run('DELETE FROM auth_session WHERE user_id = ?', [row.user_id]);
    return { kind: 'none' };
  }
  return {
    kind: 'user',
    sessionId: id,
    mfaAt: row.mfa_at,
    createdAt: row.created_at,
    user: {
      id: row.user_id,
      pseudonym: row.u_pseudonym ?? '',
      email: row.u_email ?? '',
      ageBand: row.u_age_band ?? '18_plus',
      status: row.u_status ?? 'active',
      isTeam: row.u_is_team === 1,
      locale: row.u_locale ?? 'nl',
      adminRole: row.a_role ?? null,
      researchOptedOut: row.u_opted_out !== null,
    },
  };
}

export type NewSession =
  | { userId: string }
  | { pendingEmail: string; prePseudonym: string; inviteToken: string | null };

/** Creates a session row and returns the cookie value (only its hash is stored). */
export function createSession(tx: Db, deps: { clock: Clock; random: Random }, who: NewSession, uaClass: string): string {
  const value = randomToken(deps.random, 32);
  const now = deps.clock.now();
  const ttl = 'userId' in who ? SESSION_TTL_MS : PRE_SESSION_TTL_MS;
  tx.run(
    `INSERT INTO auth_session (id, user_id, pending_email, pre_pseudonym, invite_token, created_at, expires_at, last_seen_at, ua_class)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      sha256(value),
      'userId' in who ? who.userId : null,
      'userId' in who ? null : who.pendingEmail,
      'userId' in who ? null : who.prePseudonym,
      'userId' in who ? null : who.inviteToken,
      now.toISOString(),
      new Date(now.getTime() + ttl).toISOString(),
      now.toISOString(),
      uaClass,
    ],
  );
  return value;
}

/** Deletes every session of an account (logout, block; architecture §10.1). */
export function deleteUserSessions(tx: Db, userId: string): void {
  tx.run('DELETE FROM auth_session WHERE user_id = ?', [userId]);
}

export function setSessionCookie(c: Context<AppEnv>, value: string): void {
  setCookie(c, SESSION_COOKIE, value, {
    httpOnly: true,
    sameSite: 'Lax',
    secure: c.var.http.secureCookies,
    path: '/',
    maxAge: SESSION_TTL_MS / 1000,
  });
}

export function clearSessionCookie(c: Context<AppEnv>): void {
  deleteCookie(c, SESSION_COOKIE, { path: '/', secure: c.var.http.secureCookies });
}

/** Global middleware: reads `rw_sid` and puts the auth state on the context. */
export function sessionLoader(db: Db, clock: Clock): MiddlewareHandler<AppEnv> {
  return async (c, next) => {
    c.set('auth', loadSession(db, clock, getCookie(c, SESSION_COOKIE)));
    await next();
  };
}

export interface RequireAuthOptions {
  /** Only for POST /admin/mfa/enroll and /verify: admin without a second factor yet. */
  allowWithoutMfa?: boolean;
  /** Routes a blocked account may still use: GET /me, logout, appeals, export and DELETE /me. */
  allowBlocked?: boolean;
}

/** Whether the auth state satisfies one of the levels; throws the matching error otherwise. */
export function checkAuth(auth: AuthState, levels: readonly AuthLevel[], opts: RequireAuthOptions = {}): void {
  if (levels.includes('public') || levels.includes('dev')) return;
  if (auth.kind === 'pre' && levels.includes('pre')) return;
  if (auth.kind === 'user') {
    const u = auth.user;
    if (u.status === 'blocked' && !opts.allowBlocked) throw new DomainError('ACCOUNT_BLOCKED');
    if (levels.includes('admin') && u.adminRole !== null) {
      if (auth.mfaAt === null && !opts.allowWithoutMfa) throw new DomainError('MFA_REQUIRED');
      return;
    }
    if (levels.includes('student') || levels.includes('owner') || levels.includes('member') || levels.includes('board')) return;
    if (levels.includes('adult')) {
      if (u.ageBand === '18_plus') return;
      throw new DomainError('AGE_RESTRICTED');
    }
    throw new DomainError('FORBIDDEN');
  }
  if (auth.kind === 'none') throw new DomainError('AUTH_REQUIRED');
  throw new DomainError('FORBIDDEN');
}

/** Route middleware for one or more levels of architecture §8.1. */
export function requireAuth(level: AuthLevel | readonly AuthLevel[], opts: RequireAuthOptions = {}): MiddlewareHandler<AppEnv> {
  const levels = typeof level === 'string' ? [level] : level;
  return async (c, next) => {
    checkAuth(c.var.auth, levels, opts);
    await next();
  };
}
