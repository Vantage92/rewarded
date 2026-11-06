// Retention (architecture §10.6), day close step 11. Idempotent: every rule is an UPDATE or DELETE
// with a cut-off from core/fraud/retention, and a rule whose table does not exist (yet) is skipped.
// Returns the number of rows touched per rule, which the retention test checks rule by rule.
import { CURRENT_PARAMS, weekKey } from '@rewarded/core';
import { reduceEvidence, retentionCutoffs } from '@rewarded/core/fraud';
import type { Db } from '../../../db/types.ts';
import type { ModuleDeps } from '../../../module.ts';
import { lapseUnconfirmedAnchors, markReconfirmDue } from './institution.ts';
import { hasColumn, hasTables, parseJson } from './util.ts';

export type RetentionReport = Record<string, number>;

const iso = (ms: number): string => new Date(ms).toISOString();

/** Moves sessions older than `cutoff` to a per-user placeholder device; returns the sessions moved. */
function retireSessionDevices(db: Db, cutoff: number, now: Date): number {
  const at = now.toISOString();
  db.run(
    `INSERT OR IGNORE INTO device (id, client_device_id, user_id, ua_class, first_seen_at, last_seen_at)
     SELECT DISTINCT 'retired_' || s.user_id, 'retired:' || s.user_id, s.user_id, 'other', ?, ?
       FROM focus_session s WHERE s.server_start_at < ? AND s.device_id <> 'retired_' || s.user_id`,
    [at, at, cutoff],
  );
  return db.run("UPDATE focus_session SET device_id = 'retired_' || user_id WHERE server_start_at < ? AND device_id <> 'retired_' || user_id", [cutoff]).changes;
}

export function runRetention(deps: ModuleDeps, now: Date): RetentionReport {
  const { db } = deps;
  const c = retentionCutoffs(now.getTime());
  const out: RetentionReport = {};
  const rule = (name: string, tables: string[], fn: () => number) => {
    if (!hasTables(db, ...tables)) return;
    out[name] = (out[name] ?? 0) + fn();
  };
  db.transaction(() => {
    // 30 days: network data (spec §4.10).
    rule('session_network', ['focus_session'], () => db.run('UPDATE focus_session SET ip_hash = NULL, net_class = NULL WHERE server_start_at < ? AND (ip_hash IS NOT NULL OR net_class IS NOT NULL)', [c.network]).changes);
    rule('magic_link_network', ['auth_magic_link'], () => db.run('UPDATE auth_magic_link SET ip_hash = NULL, net_class = NULL WHERE created_at < ? AND (ip_hash IS NOT NULL OR net_class IS NOT NULL)', [iso(c.network)]).changes);
    rule('registration_network', ['user'], () => db.run('UPDATE user SET registration_ip_hash = NULL, registration_net_class = NULL WHERE created_at < ? AND (registration_ip_hash IS NOT NULL OR registration_net_class IS NOT NULL)', [iso(c.network)]).changes);
    rule('club_link_network', ['club_membership'], () => db.run('UPDATE club_membership SET ip_hash = NULL, net_class = NULL WHERE linked_at < ? AND (ip_hash IS NOT NULL OR net_class IS NOT NULL)', [iso(c.network)]).changes);
    rule('waitlist_network', ['waitlist_entry'], () => db.run('UPDATE waitlist_entry SET ip_hash = NULL, net_class = NULL WHERE created_at < ? AND (ip_hash IS NOT NULL OR net_class IS NOT NULL)', [iso(c.network)]).changes);
    // ua_class on focus_session is NOT NULL (WP-4); it is reduced to the coarse class `other`.
    rule('session_ua', ['focus_session'], () => db.run("UPDATE focus_session SET ua_class = 'other' WHERE server_start_at < ? AND ua_class <> 'other'", [c.network]).changes);
    // 90 days: raw heartbeats and visibility events, after a summary per session.
    rule('heartbeats', ['session_heartbeat', 'visibility_event', 'session_summary', 'focus_session'], () => summariseAndDropSignals(db, c.heartbeat));
    // 30 days: a session keeps no link to the real device (spec §4.10, art. 11.7a Tw). device_id is
    // NOT NULL (WP-4), so older sessions point to one retired placeholder per user without a client id.
    rule('session_device', ['focus_session', 'device'], () => retireSessionDevices(db, c.network, now));
    // 180 days: devices not seen, once no session refers to them any more.
    rule('device', ['device'], () =>
      db.run(`DELETE FROM device WHERE last_seen_at < ? ${hasTables(db, 'focus_session') ? 'AND id NOT IN (SELECT device_id FROM focus_session)' : ''}`, [iso(c.device)]).changes,
    );
    // Flags: evidence reduced after decision + 14 days (or the appeal decision); rows after 2 years.
    rule('flag_evidence', ['fraud_flag', 'appeal'], () => reduceFlagEvidence(db, c.evidence, now));
    rule('flag_rows', ['fraud_flag'], () => db.run("DELETE FROM fraud_flag WHERE status <> 'open' AND coalesce(block_confirmed_at, decided_at, created_at) < ?", [iso(c.flagRow)]).changes);
    rule('appeal_text', ['appeal'], () => db.run('UPDATE appeal SET text = NULL WHERE text IS NOT NULL AND decided_at IS NOT NULL AND decided_at < ?', [iso(c.appealText)]).changes);
    rule('appeal_rows', ['appeal'], () => db.run('DELETE FROM appeal WHERE status <> \'open\' AND coalesce(decided_at, submitted_at) < ?', [iso(c.flagRow)]).changes);
    rule('blocked_phone_hash', ['blocked_phone_hash'], () => db.run('DELETE FROM blocked_phone_hash WHERE expires_at <= ?', [now.toISOString()]).changes);
    rule('blocked_institution_hash', ['blocked_institution_hash'], () => db.run('DELETE FROM blocked_institution_hash WHERE expires_at <= ?', [now.toISOString()]).changes);
    rule('sample_items', ['fraud_sample_item'], () => db.run('DELETE FROM fraud_sample_item WHERE judged_at IS NOT NULL AND judged_at < ?', [iso(c.flagRow)]).changes);
    rule('delivery_contact', ['prize_delivery_contact', 'prize'], () =>
      db.run('DELETE FROM prize_delivery_contact WHERE prize_id IN (SELECT id FROM prize WHERE delivered_at IS NOT NULL AND delivered_at < ?)', [iso(c.deliveryContact)]).changes,
    );
    rule('support_text', ['support_ticket'], () =>
      db.run('UPDATE support_ticket SET text = NULL, text_cleared_at = ? WHERE text IS NOT NULL AND resolved_at IS NOT NULL AND resolved_at < ?', [now.toISOString(), iso(c.supportText)]).changes,
    );
    // 24 hours.
    rule('phone_verification', ['phone_verification'], () => db.run('DELETE FROM phone_verification WHERE expires_at < ?', [iso(c.shortLived)]).changes);
    rule('idempotency', ['idempotency_record'], () => db.run('DELETE FROM idempotency_record WHERE created_at < ?', [iso(c.shortLived)]).changes);
    rule('magic_link', ['auth_magic_link'], () => db.run('DELETE FROM auth_magic_link WHERE created_at < ?', [iso(c.shortLived)]).changes);
    rule('institution_code', ['institution_verification'], () => db.run('DELETE FROM institution_verification WHERE expires_at < ?', [iso(c.shortLived)]).changes);
    rule('auth_session', ['auth_session'], () => db.run('DELETE FROM auth_session WHERE expires_at <= ?', [now.toISOString()]).changes);
    // 30 days.
    rule('reminder_log', ['reminder_log'], () => db.run(`DELETE FROM reminder_log WHERE ${hasColumn(db, 'reminder_log', 'sent_at') ? 'sent_at' : 'focus_day'} < ?`, [iso(c.reminder)]).changes);
    rule('waitlist_invited', ['waitlist_entry'], () => db.run('DELETE FROM waitlist_entry WHERE invited_at IS NOT NULL AND invited_at < ?', [iso(c.waitlistInvited)]).changes);
    rule('revoked_cards', ['card'], () => (hasColumn(db, 'card', 'revoked_at') ? db.run('DELETE FROM card WHERE revoked_at IS NOT NULL AND revoked_at < ?', [iso(c.revokedCard)]).changes : 0));
    // Audit log: 2 years, through the named rule of migration 0300.
    rule('audit_log', ['audit_retention', 'audit_log'], () => {
      db.run('INSERT INTO audit_retention (id, cutoff) VALUES (1, ?) ON CONFLICT (id) DO UPDATE SET cutoff = excluded.cutoff', [iso(c.audit)]);
      return db.run('DELETE FROM audit_log WHERE at < ?', [iso(c.audit)]).changes;
    });
    // Institution anchors confirmed before the HMAC: re-confirm before 4 January 2027, else they lapse (voorregistratie §7.8).
    rule('institution_reconfirm_due', ['institution_verification'], () => markReconfirmDue(db));
    rule('institution_anchor_lapsed', ['institution_verification'], () => lapseUnconfirmedAnchors(db, now));
    // After 15 June 2027: raw events, survey answers and harm signals aggregated, rows deleted.
    if (c.rawEventsExpired) {
      rule('events_aggregated', ['event', 'event_week_aggregate'], () => aggregateEvents(db));
      rule('harm_aggregated', ['harm_signal', 'research_aggregate'], () => aggregateHarm(db));
      rule('survey_aggregated', ['survey_response', 'research_aggregate'], () => aggregateSurveys(db));
    }
  });
  return out;
}

function summariseAndDropSignals(db: Db, cutoff: number): number {
  const old = db.all<{ id: string }>(
    'SELECT DISTINCT s.id FROM focus_session s WHERE s.server_start_at < ? AND (EXISTS (SELECT 1 FROM session_heartbeat h WHERE h.session_id = s.id) OR EXISTS (SELECT 1 FROM visibility_event v WHERE v.session_id = s.id))',
    [cutoff],
  );
  let n = 0;
  const cols = db.all<{ name: string }>('SELECT name FROM pragma_table_info(?)', ['session_summary']).map((c) => c.name);
  for (const { id } of old) {
    if (!db.get('SELECT 1 AS x FROM session_summary WHERE session_id = ?', [id])) {
      const s = db.get<{ covered_gap_s: number; clock_skew_ms: number | null; claim_delay_s: number | null }>('SELECT covered_gap_s, clock_skew_ms, claim_delay_s FROM focus_session WHERE id = ?', [id]);
      const hidden = db.get<{ n: number }>("SELECT count(*) AS n FROM visibility_event WHERE session_id = ? AND kind = 'hidden'", [id])?.n ?? 0;
      const states = db.all<{ kind: string }>("SELECT DISTINCT kind FROM visibility_event WHERE session_id = ? AND kind LIKE 'wakelock_%'", [id]).map((r) => r.kind);
      const values: Record<string, unknown> = {
        session_id: id,
        hidden_count: hidden,
        max_gap_s: 0,
        covered_gap_s: s?.covered_gap_s ?? 0,
        wakelock_states: JSON.stringify(states),
        skew_ms: s?.clock_skew_ms ?? null,
        claim_delay_s: s?.claim_delay_s ?? null,
      };
      const use = Object.keys(values).filter((k) => cols.includes(k));
      db.run(`INSERT INTO session_summary (${use.join(', ')}) VALUES (${use.map(() => '?').join(', ')})`, use.map((k) => values[k] as never));
    }
    n += db.run('DELETE FROM session_heartbeat WHERE session_id = ?', [id]).changes;
    n += db.run('DELETE FROM visibility_event WHERE session_id = ?', [id]).changes;
  }
  return n;
}

function reduceFlagEvidence(db: Db, cutoff: number, now: Date): number {
  const rows = db.all<{ id: string; evidence: string }>(
    `SELECT f.id, f.evidence FROM fraud_flag f
      WHERE f.evidence_reduced_at IS NULL AND f.status <> 'open' AND coalesce(f.block_confirmed_at, f.decided_at, f.created_at) < ?
        AND NOT EXISTS (SELECT 1 FROM appeal a WHERE a.object_id = f.id AND a.status = 'open')`,
    [new Date(cutoff).toISOString()],
  );
  for (const r of rows) db.run('UPDATE fraud_flag SET evidence = ?, evidence_reduced_at = ?, note = NULL WHERE id = ?', [JSON.stringify(reduceEvidence(parseJson(r.evidence, {}))), now.toISOString(), r.id]);
  return rows.length;
}

function aggregateEvents(db: Db): number {
  const rows = db.all<{ server_at: string; name: string; arm_bonus: string | null; arm_rest: string | null; channel: string | null; release: string }>('SELECT server_at, name, arm_bonus, arm_rest, channel, release FROM event');
  const agg = new Map<string, number>();
  for (const r of rows) {
    const week = weekKey(r.server_at.slice(0, 10), CURRENT_PARAMS.time.week_start_iso_weekday);
    const k = JSON.stringify([week, r.name, r.arm_bonus ?? '', r.arm_rest ?? '', r.channel ?? '', r.release]);
    agg.set(k, (agg.get(k) ?? 0) + 1);
  }
  for (const [k, n] of agg) {
    const [week, name, ab, ar, ch, rel] = JSON.parse(k) as string[];
    db.run(
      `INSERT INTO event_week_aggregate (week_key, name, arm_bonus, arm_rest, channel, release, n) VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT (week_key, name, arm_bonus, arm_rest, channel, release) DO UPDATE SET n = n + excluded.n`,
      [week as string, name as string, ab as string, ar as string, ch as string, rel as string, n],
    );
  }
  return db.run('DELETE FROM event').changes;
}

function aggregateHarm(db: Db): number {
  db.run(
    `INSERT INTO research_aggregate (kind, week_key, key, arm, n)
       SELECT 'harm', week_key, code, coalesce(arm_bonus, '') || '|' || coalesce(arm_rest, ''), count(*) FROM harm_signal GROUP BY week_key, code, arm_bonus, arm_rest
     ON CONFLICT (kind, week_key, key, arm) DO UPDATE SET n = n + excluded.n`,
  );
  return db.run('DELETE FROM harm_signal').changes;
}

function aggregateSurveys(db: Db): number {
  const hasMoment = hasColumn(db, 'survey_response', 'moment');
  if (!hasMoment) return 0;
  db.run(
    `INSERT INTO research_aggregate (kind, week_key, key, arm, n)
       SELECT 'survey', coalesce(week_key, substr(created_at, 1, 10)), moment, '', count(*) FROM survey_response GROUP BY 2, moment
     ON CONFLICT (kind, week_key, key, arm) DO UPDATE SET n = n + excluded.n`,
  );
  return db.run('DELETE FROM survey_response').changes;
}
