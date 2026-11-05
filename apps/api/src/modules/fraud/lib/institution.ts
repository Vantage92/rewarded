// Institution anchor unique per address (spec §4.10; architecture §10.4; voorregistratie §7.8).
// Only the domain and HMAC(normalised address) are stored, with a unique index; the address itself
// only lives in memory while the code is sent. The same code flow serves the re-confirmation and the
// sample contact (architecture §6.5): then the code only counts if the HMAC equals the stored one.
import { DomainError } from '@rewarded/contracts';
import { sha256, sixDigitCode } from '../../../db/ids.ts';
import type { Db } from '../../../db/types.ts';
import type { ModuleDeps } from '../../../module.ts';
import { normalizeEmail } from '../../../platform/email.ts';
import { eventFor } from './util.ts';

export const CODE_TTL_MS = 15 * 60_000;
export const MAX_ATTEMPTS = 5;

/**
 * HMAC of the normalised address. Architecture §10.9 names a separate pepper_inst; the platform
 * Hasher (WP-3) has no such purpose yet, so the e-mail pepper is used with a domain separator.
 */
export function institutionHash(deps: ModuleDeps, email: string): string {
  return deps.platform.hasher.hash('email', `inst|${normalizeEmail(email)}`);
}

export function domainOf(email: string): string {
  const n = normalizeEmail(email);
  return n.slice(n.lastIndexOf('@') + 1);
}

/** A domain on the list, or a subdomain of one (students.uu.nl under uu.nl). */
export function domainAllowed(db: Db, domain: string): boolean {
  const parts = domain.split('.');
  for (let i = 0; i < parts.length - 1; i++) if (db.get('SELECT 1 AS x FROM institution_domain WHERE domain = ?', [parts.slice(i).join('.')])) return true;
  return false;
}

type Purpose = 'anchor' | 'reconfirm' | 'sample';

function codeHash(userId: string, code: string): string {
  return sha256(`${userId}|${code}`);
}

/** POST /me/institution-email/start: mails a code, or records a mismatch for a sample contact. */
export async function startInstitution(deps: ModuleDeps, userId: string, email: string): Promise<void> {
  const { db } = deps;
  const domain = domainOf(email);
  if (!domainAllowed(db, domain)) throw new DomainError('DOMAIN_NOT_ALLOWED');
  const hash = institutionHash(deps, email);
  const user = db.get<{ institution_email_hash: string | null; institution_reconfirm_due: number }>('SELECT institution_email_hash, institution_reconfirm_due FROM user WHERE id = ?', [userId]);
  if (!user) throw new DomainError('NOT_FOUND');
  const sampleItem = db.get<{ id: string }>(
    "SELECT id FROM fraud_sample_item WHERE user_id = ? AND contact_channel = 'institution' AND contact_requested_at IS NOT NULL AND contact_confirmed_at IS NULL ORDER BY contact_requested_at DESC LIMIT 1",
    [userId],
  );
  let purpose: Purpose = 'anchor';
  if (sampleItem && user.institution_email_hash) {
    purpose = 'sample';
    if (hash !== user.institution_email_hash) {
      // The code only counts for the anchored address (§6.5): record the mismatch, send nothing.
      db.run('UPDATE fraud_sample_item SET address_mismatch = 1 WHERE id = ?', [sampleItem.id]);
      return;
    }
  } else if (user.institution_reconfirm_due === 1) purpose = 'reconfirm';
  if (purpose !== 'sample') {
    const taken = db.get('SELECT 1 AS x FROM user WHERE institution_email_hash = ? AND id <> ?', [hash, userId]) ?? db.get('SELECT 1 AS x FROM blocked_institution_hash WHERE institution_email_hash = ?', [hash]);
    if (taken) throw new DomainError('INSTITUTION_EMAIL_IN_USE');
  }
  const code = sixDigitCode(deps.platform.random);
  const now = deps.platform.clock.now();
  db.run(
    `INSERT INTO institution_verification (user_id, purpose, email_hash, domain, code_hash, attempts, created_at, expires_at) VALUES (?, ?, ?, ?, ?, 0, ?, ?)
     ON CONFLICT (user_id) DO UPDATE SET purpose = excluded.purpose, email_hash = excluded.email_hash, domain = excluded.domain, code_hash = excluded.code_hash, attempts = 0,
       created_at = excluded.created_at, expires_at = excluded.expires_at`,
    [userId, purpose, hash, domain, codeHash(userId, code), now.toISOString(), new Date(now.getTime() + CODE_TTL_MS).toISOString()],
  );
  await deps.platform.mailer.send({ to: email, subject: 'Rewarded: je code', text: `Je bevestigingscode is ${code}. / Your confirmation code is ${code}.` });
}

/** POST /me/institution-email/confirm. */
export function confirmInstitution(deps: ModuleDeps, tx: Db, userId: string, code: string): { domain: string } {
  const v = tx.get<{ purpose: Purpose; email_hash: string; domain: string; code_hash: string; attempts: number; expires_at: string }>('SELECT * FROM institution_verification WHERE user_id = ?', [userId]);
  if (!v) throw new DomainError('CODE_INVALID');
  const now = deps.platform.clock.now();
  if (v.attempts >= MAX_ATTEMPTS) throw new DomainError('TOO_MANY_ATTEMPTS');
  if (now.toISOString() >= v.expires_at) throw new DomainError('CODE_EXPIRED');
  if (codeHash(userId, code) !== v.code_hash) {
    tx.run('UPDATE institution_verification SET attempts = attempts + 1 WHERE user_id = ?', [userId]);
    throw new DomainError('CODE_INVALID', { attempts_left: Math.max(0, MAX_ATTEMPTS - v.attempts - 1) });
  }
  tx.run('DELETE FROM institution_verification WHERE user_id = ?', [userId]);
  const at = now.toISOString();
  if (v.purpose === 'sample') {
    tx.run("UPDATE fraud_sample_item SET contact_confirmed_at = ? WHERE user_id = ? AND contact_channel = 'institution' AND contact_confirmed_at IS NULL", [at, userId]);
    return { domain: v.domain };
  }
  const taken = tx.get('SELECT 1 AS x FROM user WHERE institution_email_hash = ? AND id <> ?', [v.email_hash, userId]) ?? tx.get('SELECT 1 AS x FROM blocked_institution_hash WHERE institution_email_hash = ?', [v.email_hash]);
  if (taken) throw new DomainError('INSTITUTION_EMAIL_IN_USE');
  tx.run('UPDATE user SET institution_domain = ?, institution_verified_at = ?, institution_email_hash = ?, institution_reconfirm_due = 0 WHERE id = ?', [v.domain, at, v.email_hash, userId]);
  eventFor(deps, tx, userId, 'institution_email_verified', { domein: v.domain });
  return { domain: v.domain };
}

/**
 * Anchors confirmed before the HMAC existed must be confirmed again before 4 January 2027
 * (voorregistratie §7.8): mark them due; without re-confirmation by then the anchor lapses.
 */
export function markReconfirmDue(db: Db): number {
  return db.run('UPDATE user SET institution_reconfirm_due = 1 WHERE institution_verified_at IS NOT NULL AND institution_email_hash IS NULL AND institution_reconfirm_due = 0').changes;
}

export function lapseUnconfirmedAnchors(db: Db, now: Date, deadline = '2027-01-04T03:00:00.000Z'): number {
  if (now.toISOString() < deadline) return 0;
  return db.run('UPDATE user SET institution_verified_at = NULL, institution_domain = NULL WHERE institution_reconfirm_due = 1 AND institution_email_hash IS NULL').changes;
}
