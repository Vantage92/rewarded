// SQL for the auth module: magic links, users, invites and login statistics (architecture §3.1).
import { CURRENT_PARAMS, focusDayOf } from '@rewarded/core';
import type { InviteSource } from '@rewarded/contracts';
import type { Db } from '../../db/types.ts';

export const MAGIC_LINK_TTL_MS = 15 * 60 * 1000;
export const CODE_ATTEMPTS = 5;

export interface MagicLinkRow {
  id: string;
  email: string;
  token_hash: string;
  code_hash: string;
  invite_token: string | null;
  locale: 'nl' | 'en';
  created_at: string;
  expires_at: string;
  attempts: number;
  used_at: string | null;
}

export interface InviteRow {
  id: string;
  token: string;
  source: InviteSource;
  squad_id: string | null;
  club_id: string | null;
  qr_source: string | null;
  creator_user_id?: string | null;
  max_uses: number;
  uses: number;
  expires_at: string;
}

export interface UserRow {
  id: string;
  email: string;
  first_name: string;
  last_name: string | null;
  locale: 'nl' | 'en';
  age_band: '16_17' | '18_plus';
  status: 'active' | 'blocked' | 'deleted';
  is_team: number;
  pseudonym: string;
  daily_goal_min: 25 | 50 | 90 | 120;
  compare_opt_in: number;
  silent_mode: number;
  squad_name_on_cards: number;
  no_points_mode: number;
  email_reminders: number;
  reminder_time?: string;
  reminder_days?: string;
  phone_verified_at: string | null;
  institution_domain: string | null;
  research_opt_out_at: string | null;
  registration_channel: string;
  cohort: 'experiment' | 'expansion';
  created_at: string;
}

export type StatColumn = 'requested' | 'consumed_link' | 'consumed_code' | 'invalid';

/** Live counters of auth_daily_stat (no personal data; §10.1). */
export function bumpStat(tx: Db, now: Date, column: StatColumn): void {
  const day = focusDayOf(now.getTime(), CURRENT_PARAMS);
  tx.run(`INSERT INTO auth_daily_stat (day, ${column}) VALUES (?, 1) ON CONFLICT (day) DO UPDATE SET ${column} = ${column} + 1`, [day]);
}

/** An invite that still admits someone: known, not expired, uses left. */
export function usableInvite(db: Db, token: string | null | undefined, now: Date): InviteRow | undefined {
  if (!token) return undefined;
  const inv = db.get<InviteRow>('SELECT id, token, source, squad_id, club_id, qr_source, max_uses, uses, expires_at FROM invite WHERE token = ?', [token]);
  if (!inv || inv.expires_at <= now.toISOString() || inv.uses >= inv.max_uses) return undefined;
  return inv;
}

export function userByNormHash(db: Db, hash: string): UserRow | undefined {
  return db.get<UserRow>('SELECT * FROM user WHERE email_norm_hash = ?', [hash]);
}

export function userById(db: Db, id: string): UserRow | undefined {
  return db.get<UserRow>('SELECT * FROM user WHERE id = ?', [id]);
}

/** Channel of registration (spec §7.2) from the invite source. */
export function channelOf(source: InviteSource): 'club' | 'squad_invite' | 'ambassador' | 'waitlist' | 'other' {
  switch (source) {
    case 'club':
      return 'club';
    case 'squad':
      return 'squad_invite';
    case 'ambassador':
      return 'ambassador';
    case 'waitlist':
      return 'waitlist';
    default:
      return 'other';
  }
}

/** Removes everything a pre user left behind (spec §3.1 step 5: under 16 nothing is kept). */
export function erasePreUser(tx: Db, pre: { sessionId: string; email: string; prePseudonym: string }): void {
  tx.run('DELETE FROM auth_session WHERE id = ?', [pre.sessionId]);
  tx.run('DELETE FROM auth_session WHERE pending_email = ?', [pre.email]);
  tx.run('DELETE FROM auth_magic_link WHERE email = ?', [pre.email]);
  tx.run('DELETE FROM event_pending WHERE pre_pseudonym = ?', [pre.prePseudonym]);
}

/** Moves the pre user's pending events to `event` under the new pseudonym (architecture §8.1). */
export function movePendingEvents(tx: Db, prePseudonym: string, pseudonym: string, release: string, cohort: string, channel: string): number {
  const r = tx.run(
    `INSERT INTO event (id, name, pseudonym, server_at, props, release, channel, cohort)
     SELECT id, name, ?, server_at, props, ?, ?, ? FROM event_pending WHERE pre_pseudonym = ?`,
    [pseudonym, release, channel, cohort, prePseudonym],
  );
  tx.run('DELETE FROM event_pending WHERE pre_pseudonym = ?', [prePseudonym]);
  return r.changes;
}
