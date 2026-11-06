// Second factor for admins (architecture §10.8): enrolment and verification on admin_mfa, and
// `mfa_at` on the session. The routes POST /admin/mfa/enroll and /verify belong to the admin module
// (WP-6) and call these two functions; the TOTP maths is in platform/totp.ts.
import { DomainError } from '@rewarded/contracts';
import { decryptSecret, encryptSecret, newTotpSecret, otpauthUri, verifyTotp, base32Encode } from '../platform/totp.ts';
import type { Clock, Random } from '../platform/types.ts';
import type { Db } from './types.ts';

export interface MfaDeps {
  clock: Clock;
  random: Random;
  /** Encryption key for TOTP secrets (Secrets.totpKey; DEV_TOTP_KEY in dev and tests). */
  totpKey: string;
}

/** MfaDeps from the platform; refuses to run without a configured key (no silent dev fallback). */
export function mfaDepsOf(platform: { clock: Clock; random: Random; totpKey?: string }): MfaDeps {
  if (!platform.totpKey || platform.totpKey.length < 32) throw new Error('No TOTP key configured (platform.totpKey)');
  return { clock: platform.clock, random: platform.random, totpKey: platform.totpKey };
}

/** Starts (or restarts, while not yet confirmed) enrolment; returns the data for the QR code. */
export function enrollMfa(tx: Db, deps: MfaDeps, userId: string, account: string): { secret: string; otpauth_uri: string } {
  const existing = tx.get<{ enrolled_at: string | null }>('SELECT enrolled_at FROM admin_mfa WHERE user_id = ?', [userId]);
  // An enrolled factor is never replaced through this route (that would bypass the factor itself).
  if (existing?.enrolled_at) throw new DomainError('FORBIDDEN', { reason: 'already_enrolled' });
  const secret = newTotpSecret(deps.random);
  const enc = encryptSecret(secret, deps.totpKey, deps.random);
  tx.run(
    `INSERT INTO admin_mfa (user_id, totp_secret_enc, enrolled_at, last_used_step) VALUES (?, ?, NULL, NULL)
     ON CONFLICT (user_id) DO UPDATE SET totp_secret_enc = excluded.totp_secret_enc, last_used_step = NULL`,
    [userId, enc],
  );
  return { secret: base32Encode(secret), otpauth_uri: otpauthUri(secret, account) };
}

/** Verifies a code, refuses reuse of a step, completes enrolment and sets `mfa_at` on the session. */
export function verifyMfa(tx: Db, deps: MfaDeps, userId: string, sessionId: string, code: string): { mfa_at: string } {
  const row = tx.get<{ totp_secret_enc: string; last_used_step: number | null }>('SELECT totp_secret_enc, last_used_step FROM admin_mfa WHERE user_id = ?', [userId]);
  if (!row) throw new DomainError('MFA_INVALID');
  const now = deps.clock.now();
  const step = verifyTotp(decryptSecret(row.totp_secret_enc, deps.totpKey), code, now, row.last_used_step);
  if (step === null) throw new DomainError('MFA_INVALID');
  const at = now.toISOString();
  tx.run('UPDATE admin_mfa SET last_used_step = ?, enrolled_at = coalesce(enrolled_at, ?) WHERE user_id = ?', [step, at, userId]);
  tx.run('UPDATE auth_session SET mfa_at = ? WHERE id = ? AND user_id = ?', [at, sessionId, userId]);
  clearMfaFailures(tx, userId);
  return { mfa_at: at };
}

/** Attempts per window before the lock (architecture §10.2: 5 per 15 minutes). */
export const MFA_MAX_FAILURES = 5;
export const MFA_WINDOW_MS = 15 * 60_000;

/** Refuses with RATE_LIMITED while the stored lock runs; survives a restart (unlike the memory buckets). */
export function assertMfaNotLocked(db: Db, deps: Pick<MfaDeps, 'clock'>, userId: string): void {
  const row = db.get<{ locked_until: string | null }>('SELECT locked_until FROM admin_mfa WHERE user_id = ?', [userId]);
  if (row?.locked_until && Date.parse(row.locked_until) > deps.clock.now().getTime()) {
    throw new DomainError('RATE_LIMITED', { retry_after_s: Math.ceil((Date.parse(row.locked_until) - deps.clock.now().getTime()) / 1000) });
  }
}

/** Counts a failed code in its own transaction; the fifth failure in the window sets the lock. */
export function recordMfaFailure(db: Db, deps: Pick<MfaDeps, 'clock'>, userId: string): void {
  const now = deps.clock.now();
  const row = db.get<{ failed_count: number; failed_window_start: string | null }>('SELECT failed_count, failed_window_start FROM admin_mfa WHERE user_id = ?', [userId]);
  if (!row) return;
  const fresh = row.failed_window_start === null || now.getTime() - Date.parse(row.failed_window_start) >= MFA_WINDOW_MS;
  const count = fresh ? 1 : row.failed_count + 1;
  const start = fresh ? now.toISOString() : row.failed_window_start;
  const locked = count >= MFA_MAX_FAILURES ? new Date(now.getTime() + MFA_WINDOW_MS).toISOString() : null;
  db.run('UPDATE admin_mfa SET failed_count = ?, failed_window_start = ?, locked_until = coalesce(?, locked_until) WHERE user_id = ?', [count, start, locked, userId]);
}

/** A correct code clears the counter. */
export function clearMfaFailures(db: Db, userId: string): void {
  // Harnesses of one work package migrate only their series; without migration 0400 there is nothing to clear.
  if (!db.get("SELECT 1 AS x FROM pragma_table_info('admin_mfa') WHERE name = 'failed_count'")) return;
  db.run('UPDATE admin_mfa SET failed_count = 0, failed_window_start = NULL, locked_until = NULL WHERE user_id = ?', [userId]);
}
