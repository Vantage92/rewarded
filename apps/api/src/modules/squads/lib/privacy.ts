// Erasers and exporters of the WP-5 tables (architecture §10.7, PrivacyService §12.2).
// Rows that feed an aggregate (club links in the denominator, squad days, duels) keep their place
// without the user id; personal rows (Beloftes, cards, reminders, jokers, reports) are deleted.
import type { ApiModuleName } from '@rewarded/contracts';
import type { Db } from '../../../db/types.ts';
import type { ModuleDeps } from '../../../module.ts';

const REGISTERED = Symbol.for('rewarded.wp5.privacy');
type Holder = { [REGISTERED]?: true };

const ERASERS: Record<string, (tx: Db, userId: string) => void> = {
  squads: (tx, id) => {
    // The admin role goes to the longest-sitting open member (spec §4.4, architecture §10.7), else NULL.
    for (const q of tx.all<{ id: string }>('SELECT id FROM squad WHERE admin_user_id = ?', [id])) {
      const next = tx.get<{ user_id: string }>('SELECT user_id FROM squad_membership WHERE squad_id = ? AND left_at IS NULL AND user_id IS NOT NULL AND user_id <> ? ORDER BY joined_at, id LIMIT 1', [q.id, id]);
      tx.run('UPDATE squad SET admin_user_id = ? WHERE id = ?', [next?.user_id ?? null, q.id]);
    }
    tx.run("UPDATE squad_membership SET left_at = coalesce(left_at, strftime('%Y-%m-%dT%H:%M:%fZ', 'now')), left_day = coalesce(left_day, date('now')) WHERE user_id = ? AND left_at IS NULL", [id]);
    tx.run('UPDATE squad_membership SET user_id = NULL WHERE user_id = ?', [id]);
    tx.run('UPDATE squad_merge_request SET requested_by = NULL WHERE requested_by = ?', [id]);
    tx.run('DELETE FROM squad_joker WHERE user_id = ?', [id]);
    tx.run('DELETE FROM squad_name_report WHERE reporter_user_id = ?', [id]);
  },
  duels: (tx, id) => {
    tx.run('UPDATE duel SET challenger_id = NULL WHERE challenger_id = ?', [id]);
    tx.run('UPDATE duel SET opponent_id = NULL WHERE opponent_id = ?', [id]);
  },
  clubs: (tx, id) => {
    // The link stays in the denominator of its weeks without a user id (architecture §6.2, §10.7).
    tx.run('UPDATE club_membership SET user_id = NULL, ip_hash = NULL WHERE user_id = ?', [id]);
    tx.run('DELETE FROM club_board_member WHERE user_id = ?', [id]);
  },
  challenges: (tx, id) => tx.run('UPDATE challenge_enrollment SET user_id = NULL WHERE user_id = ?', [id]),
  belofte: (tx, id) => {
    tx.run('DELETE FROM belofte_day WHERE belofte_id IN (SELECT id FROM belofte WHERE user_id = ?)', [id]);
    tx.run('UPDATE belofte SET renewal_of = NULL WHERE renewal_of IN (SELECT id FROM belofte WHERE user_id = ?)', [id]);
    tx.run('DELETE FROM belofte WHERE user_id = ?', [id]);
    tx.run('DELETE FROM belofte_offer WHERE user_id = ?', [id]);
  },
  cards: (tx, id) => tx.run('DELETE FROM card WHERE user_id = ?', [id]),
  referral: (tx, id) => {
    tx.run('UPDATE referral SET inviter_id = NULL WHERE inviter_id = ?', [id]);
    tx.run('UPDATE referral SET invitee_id = NULL WHERE invitee_id = ?', [id]);
  },
  reminders: (tx, id) => tx.run('DELETE FROM reminder_log WHERE user_id = ?', [id]),
};

function exporters(db: Db): Record<string, (userId: string) => unknown> {
  return {
    squads: (id) => ({
      memberships: db.all('SELECT squad_id, role, joined_at, active_from_day, left_at, paused_since_day FROM squad_membership WHERE user_id = ?', [id]),
      jokers: db.all('SELECT week_start, used_day FROM squad_joker WHERE user_id = ?', [id]),
      name_reports: db.all('SELECT squad_id, created_at FROM squad_name_report WHERE reporter_user_id = ?', [id]),
    }),
    duels: (id) => db.all('SELECT id, in_squad, status, start_day, end_day, result, created_at FROM duel WHERE challenger_id = ? OR opponent_id = ?', [id, id]),
    clubs: (id) => ({
      links: db.all('SELECT club_id, linked_at, qr_source, left_at, pending_admin FROM club_membership WHERE user_id = ?', [id]),
      board: db.all('SELECT club_id, role, created_at FROM club_board_member WHERE user_id = ?', [id]),
    }),
    challenges: (id) => db.all('SELECT challenge_id, seat_no, enrolled_at, status FROM challenge_enrollment WHERE user_id = ?', [id]),
    belofte: (id) => ({
      offer: db.get('SELECT trigger, due_day, offered_at FROM belofte_offer WHERE user_id = ?', [id]) ?? null,
      beloftes: db.all('SELECT id, days_per_week, min_per_day, witnesses, start_day, end_day, status, reflection_action, stake_interest FROM belofte WHERE user_id = ?', [id]),
      days: db.all('SELECT d.belofte_id, d.focus_day, d.minutes, d.met FROM belofte_day d JOIN belofte b ON b.id = d.belofte_id WHERE b.user_id = ?', [id]),
    }),
    cards: (id) => db.all('SELECT id, kind, fields, created_at, revoked_at FROM card WHERE user_id = ?', [id]),
    referral: (id) => db.all('SELECT id, status, created_at, vested_at, CASE WHEN inviter_id = ? THEN \'inviter\' ELSE \'invitee\' END AS role FROM referral WHERE inviter_id = ? OR invitee_id = ?', [id, id, id]),
    reminders: (id) => db.all('SELECT focus_day, kind, sent_at FROM reminder_log WHERE user_id = ?', [id]),
  };
}

/** Registers the WP-5 erasers and exporters once per Services object. */
export function registerSocialPrivacy(deps: ModuleDeps): void {
  const holder = deps.services as unknown as Holder;
  if (holder[REGISTERED]) return;
  holder[REGISTERED] = true;
  const exp = exporters(deps.db);
  for (const [module, eraser] of Object.entries(ERASERS)) deps.services.privacy.registerEraser(module as ApiModuleName, eraser);
  for (const [module, exporter] of Object.entries(exp)) deps.services.privacy.registerExporter(module as ApiModuleName, exporter);
}
