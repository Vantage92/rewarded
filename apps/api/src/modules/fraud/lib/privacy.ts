// Export and deletion (architecture §10.7; spec §4.10). Every module registers an eraser and an
// exporter for its own tables in the PrivacyService registry; DELETE /me runs them all in one
// transaction and then removes the WP-3 rows (user, auth, devices) and pseudonymises the events:
// a new random pseudonym, a new random squad id per deleted user, and the ids in props removed.
import type { ApiModuleName } from '@rewarded/contracts';
import { reduceEvidence } from '@rewarded/core/fraud';
import { auditRef } from '../../../db/services/audit.ts';
import type { Db } from '../../../db/types.ts';
import type { ModuleDeps } from '../../../module.ts';
import type { ActorRef } from '../../../services/audit.ts';
import { SqlFlagService } from './flags.ts';
import { hasColumn, hasTables, idsOf, parseJson } from './util.ts';

const REGISTERED = Symbol.for('rewarded.wp6.privacy');
type Holder = { [REGISTERED]?: true };

/** Keys removed from event props on deletion (architecture §10.7). */
export const EVENT_ID_PROPS = ['session_id', 'invite_id', 'card_id', 'duel_id', 'redemption_id', 'referral_id', 'squad_id', 'prize_id', 'object_id', 'flag_id'] as const;

/** WP-6 tables: flags, appeals, samples, harm signals, prizes, institution codes. */
export function eraseFraud(deps: ModuleDeps, tx: Db, userId: string): void {
  if (!hasTables(tx, 'fraud_flag', 'fraud_flag_session')) return;
  const flags = deps.services.flags instanceof SqlFlagService ? deps.services.flags : new SqlFlagService({ db: tx, ids: idsOf(deps), clock: deps.platform.clock });
  flags.closeForUser(tx, userId);
  const touched = tx.all<{ id: string; evidence: string }>(
    `SELECT DISTINCT f.id, f.evidence FROM fraud_flag f LEFT JOIN fraud_flag_session l ON l.flag_id = f.id
      WHERE l.user_id = ? OR (f.subject_type = 'account' AND f.subject_id = ?)
         OR (f.subject_type = 'session' AND f.subject_id IN (SELECT id FROM focus_session WHERE user_id = ?))`,
    [userId, userId, userId],
  );
  const at = deps.platform.clock.now().toISOString();
  for (const f of touched) {
    tx.run("UPDATE fraud_flag SET subject_id = CASE WHEN subject_type IN ('account', 'session') THEN NULL ELSE subject_id END, evidence = ?, evidence_reduced_at = coalesce(evidence_reduced_at, ?), note = NULL WHERE id = ?", [
      JSON.stringify(reduceEvidence(parseJson(f.evidence, {}))),
      at,
      f.id,
    ]);
  }
  tx.run('DELETE FROM fraud_flag_session WHERE user_id = ?', [userId]);
  if (hasTables(tx, 'appeal')) {
    tx.run("UPDATE appeal SET status = 'closed', closed_reason = 'account_deleted' WHERE user_id = ? AND status = 'open'", [userId]);
    tx.run('UPDATE appeal SET user_id = NULL, text = NULL WHERE user_id = ?', [userId]);
  }
  if (hasTables(tx, 'fraud_sample_item')) tx.run('UPDATE fraud_sample_item SET user_id = NULL, checks = \'{}\' WHERE user_id = ?', [userId]);
  if (hasTables(tx, 'harm_signal')) tx.run('DELETE FROM harm_signal WHERE user_id = ?', [userId]);
  if (hasTables(tx, 'institution_verification')) tx.run('DELETE FROM institution_verification WHERE user_id = ?', [userId]);
  if (hasTables(tx, 'prize')) {
    tx.run('DELETE FROM prize_delivery_contact WHERE prize_id IN (SELECT id FROM prize WHERE winner_user_id = ?)', [userId]);
    tx.run('UPDATE prize SET winner_user_id = NULL, delivery_contact_ref = NULL WHERE winner_user_id = ?', [userId]);
  }
}

export function eraseSupport(_deps: ModuleDeps, tx: Db, userId: string): void {
  if (hasTables(tx, 'support_ticket')) tx.run('UPDATE support_ticket SET user_id = NULL, text = NULL WHERE user_id = ?', [userId]);
}

function exportFraud(db: Db, userId: string): unknown {
  if (!hasTables(db, 'fraud_flag')) return {};
  return {
    flags: db.all(
      `SELECT DISTINCT f.id, f.code, f.status, f.created_at, f.decision, f.decided_at, f.reason_code FROM fraud_flag f LEFT JOIN fraud_flag_session l ON l.flag_id = f.id
        WHERE l.user_id = ? OR (f.subject_type = 'account' AND f.subject_id = ?) ORDER BY f.created_at`,
      [userId, userId],
    ),
    appeals: db.all('SELECT id, object_type, object_id, text, status, submitted_at, decided_at, outcome, motivation FROM appeal WHERE user_id = ? ORDER BY submitted_at', [userId]),
    harm_signals: hasTables(db, 'harm_signal') ? db.all('SELECT code, focus_day, card_shown_at, help_opened_at FROM harm_signal WHERE user_id = ? ORDER BY focus_day', [userId]) : [],
    prizes: hasTables(db, 'prize') ? db.all('SELECT id, kind, value_cents, status, verified_at, deliver_after, delivered_at FROM prize WHERE winner_user_id = ?', [userId]) : [],
    institution_anchor: db.get('SELECT institution_domain AS domain, institution_verified_at AS verified_at FROM user WHERE id = ?', [userId]) ?? null,
  };
}

function exportSupport(db: Db, userId: string): unknown {
  if (!hasTables(db, 'support_ticket')) return [];
  return db.all('SELECT id, kind, text, label, status, created_at, resolved_at FROM support_ticket WHERE user_id = ? ORDER BY created_at', [userId]);
}

/** Profile and access data of WP-3 (no hashes, no pseudonym). */
function exportProfile(db: Db, userId: string): unknown {
  return {
    profile:
      db.get(
        `SELECT first_name, last_name, email, locale, age_band, turns_18_on, status, daily_goal_min, compare_opt_in, silent_mode, squad_name_on_cards,
                no_points_mode, email_reminders, phone_line_type, phone_verified_at, institution_domain, institution_verified_at, wellbeing_consent_at,
                earn_in_reached_at, first_redeem_after, research_opt_out_at, rest_exit_at, cohort, registration_source, created_at FROM user WHERE id = ?`,
        [userId],
      ) ?? null,
    devices: db.all('SELECT ua_class, standalone, first_seen_at, last_seen_at FROM device WHERE user_id = ? ORDER BY first_seen_at', [userId]),
    sessions_logged_in: db.get<{ n: number }>('SELECT count(*) AS n FROM auth_session WHERE user_id = ?', [userId])?.n ?? 0,
    experiment_switches: db.all('SELECT factor, "from", "to", reason, effective_from_day, at FROM arm_switch WHERE user_id = ? ORDER BY at', [userId]),
  };
}

/** Registers the WP-6 erasers and exporters once per Services object. */
export function registerWp6Privacy(deps: ModuleDeps): void {
  const holder = deps.services as unknown as Holder;
  if (holder[REGISTERED]) return;
  holder[REGISTERED] = true;
  const p = deps.services.privacy;
  const reg = (m: ApiModuleName, e: (tx: Db, u: string) => void, x: (u: string) => unknown) => {
    const have = p.registeredModules();
    if (!have.erasers.includes(m)) p.registerEraser(m, e);
    if (!have.exporters.includes(m)) p.registerExporter(m, x);
  };
  reg('fraud', (tx, u) => eraseFraud(deps, tx, u), (u) => exportFraud(deps.db, u));
  reg('support', (tx, u) => eraseSupport(deps, tx, u), (u) => exportSupport(deps.db, u));
  reg('privacy', () => undefined, (u) => exportProfile(deps.db, u));
}

/** GET /me/export: one section per module that registered an exporter. */
export function exportAccount(deps: ModuleDeps, userId: string): Record<string, unknown> {
  registerWp6Privacy(deps);
  return deps.services.privacy.exportUser(userId);
}

/**
 * DELETE /me and DELETE /admin/users/:id. Runs inside the caller's transaction: WP-6 first (it needs
 * the session links), then every registered eraser, then the WP-3 rows and the events.
 */
export function deleteAccount(deps: ModuleDeps, tx: Db, userId: string, actor: ActorRef): void {
  const u = tx.get<{ email: string; pseudonym: string }>('SELECT email, pseudonym FROM user WHERE id = ?', [userId]);
  if (!u) return;
  registerWp6Privacy(deps);
  eraseFraud(deps, tx, userId);
  deps.services.privacy.eraseUser(tx, userId);
  const ids = idsOf(deps);
  const newPseudonym = `del_${ids.token(18)}`;
  const newSquad = `del_${ids.token(12)}`;
  const removeProps = EVENT_ID_PROPS.map((k) => `'$.${k}'`).join(', ');
  tx.run(`UPDATE event SET pseudonym = ?, squad_id = CASE WHEN squad_id IS NULL THEN NULL ELSE ? END, props = json_remove(props, ${removeProps}) WHERE pseudonym = ?`, [
    newPseudonym,
    newSquad,
    u.pseudonym,
  ]);
  // One new random id for the solo unit and the arm switches (architecture §10.7).
  const newUnit = `del_${ids.token(12)}`;
  tx.run("UPDATE experiment_assignment SET unit_id = ? WHERE unit_type = 'solo' AND unit_id = ?", [newUnit, userId]);
  tx.run('UPDATE arm_switch SET user_id = ? WHERE user_id = ?', [newUnit, userId]);
  tx.run('DELETE FROM auth_session WHERE user_id = ?', [userId]);
  tx.run('DELETE FROM auth_magic_link WHERE email = ?', [u.email]);
  tx.run('DELETE FROM idempotency_record WHERE scope_ref = ?', [userId]);
  tx.run('DELETE FROM waitlist_entry WHERE email = ?', [u.email]);
  tx.run('DELETE FROM admin_mfa WHERE user_id = ?', [userId]);
  tx.run('DELETE FROM admin WHERE user_id = ?', [userId]);
  if (hasTables(tx, 'focus_session')) {
    // Sessions refer to devices; the WP-4 eraser normally removed them already.
    tx.run('DELETE FROM focus_session WHERE user_id = ?', [userId]);
  }
  tx.run('DELETE FROM device WHERE user_id = ?', [userId]);
  if (hasColumn(tx, 'invite', 'creator_user_id')) tx.run('UPDATE invite SET creator_user_id = NULL WHERE creator_user_id = ?', [userId]);
  tx.run('DELETE FROM user WHERE id = ?', [userId]);
  deps.services.audit.audit(tx, { actor, action: 'account_deleted', objectType: 'user', objectRef: auditRef(deps.platform.hasher, userId) });
}
