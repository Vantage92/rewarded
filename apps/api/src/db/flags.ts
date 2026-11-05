// Feature flags (architecture §3.5, table feature_flag of WP-3). Unset flags are off. Writing a flag
// (PUT /admin/feature-flags/:key, WP-6) goes through setFeatureFlag, which writes the audit line too.
import { FeatureFlagKey, type FeatureFlags } from '@rewarded/contracts';
import type { Db } from './types.ts';

/** Keys of the feature_flag table: the contracts keys plus two server-only flags (§3.5). */
export type FeatureFlagName = FeatureFlagKey | 'competence_feedback' | 'expansion';

export function readFeatureFlags(db: Db): FeatureFlags {
  const rows = db.all<{ key: string; enabled: number }>('SELECT key, enabled FROM feature_flag');
  const on = new Map(rows.map((r) => [r.key, r.enabled === 1]));
  return Object.fromEntries(FeatureFlagKey.options.map((k) => [k, k === 'draws' ? false : (on.get(k) ?? false)])) as FeatureFlags;
}

export function isFeatureEnabled(db: Db, key: FeatureFlagName): boolean {
  if (key === 'draws') return false;
  return db.get<{ enabled: number }>('SELECT enabled FROM feature_flag WHERE key = ?', [key])?.enabled === 1;
}

/** Low-level write; the caller is responsible for the four-eyes rule and the audit line. */
export function setFeatureFlag(tx: Db, key: FeatureFlagName, enabled: boolean, by: string, at: Date): void {
  if (key === 'draws' && enabled) throw new Error('draws can never be enabled');
  tx.run(
    `INSERT INTO feature_flag (key, enabled, updated_at, updated_by) VALUES (?, ?, ?, ?)
     ON CONFLICT (key) DO UPDATE SET enabled = excluded.enabled, updated_at = excluded.updated_at, updated_by = excluded.updated_by`,
    [key, enabled ? 1 : 0, at.toISOString(), by],
  );
}
