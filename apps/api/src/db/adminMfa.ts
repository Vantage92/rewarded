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
  return { mfa_at: at };
}
