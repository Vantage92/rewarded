// Seed "empty" (architecture §11 Seeddata): only the three pilot admins, with an enrolled TOTP
// factor, so four eyes and an appeal after a block can be tested from zero. Direct SQL, because no
// route creates an admin (the role is granted outside the app). The TOTP secrets are fixed and
// fictitious, so specs and the demo can compute codes; they are never used outside dev.
import { createHash } from 'node:crypto';
import { idsFor, randomToken } from '../../apps/api/src/db/ids.ts';
import type { Db } from '../../apps/api/src/db/types.ts';
import { normalizeEmail } from '../../apps/api/src/platform/email.ts';
import { base32Encode, encryptSecret, totpAt } from '../../apps/api/src/platform/totp.ts';
import type { Platform } from '../../apps/api/src/platform/types.ts';

export interface DemoAdmin {
  key: 'anna' | 'bram' | 'chris';
  email: string;
  firstName: string;
  role: 'admin' | 'reviewer';
}

export const DEMO_ADMINS: readonly DemoAdmin[] = [
  { key: 'anna', email: 'anna.beheer@rewarded.test', firstName: 'Anna', role: 'admin' },
  { key: 'bram', email: 'bram.beheer@rewarded.test', firstName: 'Bram', role: 'admin' },
  { key: 'chris', email: 'chris.beheer@rewarded.test', firstName: 'Chris', role: 'reviewer' },
];

/** Fixed, fictitious TOTP secret of a demo admin (20 bytes). */
export function adminSecret(key: DemoAdmin['key']): Uint8Array {
  return new Uint8Array(createHash('sha256').update(`rewarded-demo-admin-${key}`).digest().subarray(0, 20));
}

export function adminSecretBase32(key: DemoAdmin['key']): string {
  return base32Encode(adminSecret(key));
}

/** Current six-digit code of a demo admin at `now` (server time). */
export function adminTotp(key: DemoAdmin['key'], now: Date): string {
  return totpAt(adminSecret(key), now);
}

export const DEMO_INSTITUTION_DOMAINS: readonly [string, string][] = [
  ['student.hogeschooldemostad.test', 'Hogeschool Demostad (fictief)'],
  ['student.unidemostad.test', 'Universiteit Demostad (fictief)'],
];

export type SeedPlatform = Pick<Platform, 'clock' | 'random' | 'hasher'> & { totpKey: string };

/** Rows that migrations insert (system accounts, default calendar); shared with POST /dev/reset. */
import { restoreMigrationRows } from '../../apps/api/src/db/migration-rows.ts';
export { restoreMigrationRows };

/** Inserts the three admins (idempotent per address). Returns their user ids by key. */
export function seedAdmins(db: Db, platform: SeedPlatform): Record<DemoAdmin['key'], string> {
  const ids = idsFor(platform);
  const now = platform.clock.now().toISOString();
  const out = {} as Record<DemoAdmin['key'], string>;
  db.transaction(() => {
    restoreMigrationRows(db);
    for (const a of DEMO_ADMINS) {
      const normHash = platform.hasher.hash('email', normalizeEmail(a.email));
      const existing = db.get<{ id: string }>('SELECT id FROM user WHERE email_norm_hash = ?', [normHash]);
      const id = existing?.id ?? ids.ulid();
      if (!existing) {
        db.run(
          `INSERT INTO user (id, email, email_norm_hash, first_name, locale, age_band, pseudonym, registration_source, daily_goal_min, cohort,
             registration_channel, terms_version, privacy_version, research_info_version, created_at, is_team)
           VALUES (?, ?, ?, ?, 'nl', '18_plus', ?, 'personal', 25, 'expansion', 'other', '0.3', '0.3', '0.3', ?, 1)`,
          [id, a.email, normHash, a.firstName, randomToken(platform.random, 16), now],
        );
      }
      db.run('INSERT OR IGNORE INTO admin (user_id, role, created_at, created_by) VALUES (?, ?, ?, ?)', [id, a.role, now, 'seed']);
      db.run(
        `INSERT INTO admin_mfa (user_id, totp_secret_enc, enrolled_at, last_used_step) VALUES (?, ?, ?, NULL)
         ON CONFLICT (user_id) DO NOTHING`,
        [id, encryptSecret(adminSecret(a.key), platform.totpKey, platform.random), now],
      );
      out[a.key] = id;
    }
    // Fictitious institution domains for the institution anchor (no route manages the list yet).
    for (const [domain, name] of DEMO_INSTITUTION_DOMAINS) {
      db.run('INSERT OR IGNORE INTO institution_domain (domain, institution, added_by, added_at) VALUES (?, ?, ?, ?)', [domain, name, 'seed', now]);
    }
  });
  return out;
}
