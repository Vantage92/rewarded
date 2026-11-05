// Stored KPI queries (spec §7.2; architecture §6.5, §12.1 round 3). Plain SQL that the admin can read
// (architecture §2.1). Every query starts from the period `p` (from, to as focus days) and the set
// `ex` of excluded pseudonyms: team accounts always (spec §7), and for the `_clean` variant also
// the accounts the sample judged suspect or fraud ("ook zonder verdachte accounts"). Rejected
// sessions never count (`ok_completed`). Days are UTC dates of server_at (see the report).

export interface KpiQueryDef {
  name: string;
  spec: string;
  /** Tables the query needs; without them it answers with no rows. */
  needs: readonly string[];
  sql: string;
}

const PRELUDE = (clean: boolean) => `
WITH p AS (SELECT coalesce(?, '0000-01-01') AS f, coalesce(?, '9999-12-31') AS t),
ex AS (
  SELECT pseudonym FROM user WHERE is_team = 1
  ${clean ? "UNION SELECT u.pseudonym FROM fraud_sample_item i JOIN user u ON u.id = i.user_id WHERE i.judgement IN ('suspect', 'fraud')" : ''}
),
ev AS (SELECT * FROM event WHERE (pseudonym IS NULL OR pseudonym NOT IN (SELECT pseudonym FROM ex))),
ok_completed AS (
  SELECT e.* FROM ev e WHERE e.name = 'session_completed'
     AND NOT EXISTS (SELECT 1 FROM focus_session s WHERE s.id = json_extract(e.props, '$.session_id') AND s.review_status = 'rejected')
)`;

const Q = (name: string, spec: string, needs: readonly string[], body: string): KpiQueryDef => ({ name, spec, needs, sql: body });

export const KPI_QUERIES: readonly KpiQueryDef[] = [
  Q('activation', 'spec §7.2 Activatie', ['event', 'focus_session'], `
, created AS (SELECT pseudonym, server_at, coalesce(channel, 'other') AS channel FROM ev, p WHERE name = 'account_created' AND substr(server_at, 1, 10) BETWEEN p.f AND p.t),
act AS (SELECT DISTINCT c.pseudonym FROM created c JOIN ok_completed e ON e.pseudonym = c.pseudonym
         WHERE json_extract(e.props, '$.minuten') >= 25 AND e.server_at <= strftime('%Y-%m-%dT%H:%M:%fZ', c.server_at, '+1 day'))
SELECT channel, count(*) AS accounts, count(a.pseudonym) AS activated, round(100.0 * count(a.pseudonym) / count(*), 1) AS pct
  FROM created c LEFT JOIN act a ON a.pseudonym = c.pseudonym GROUP BY channel
UNION ALL
SELECT 'total', count(*), count(a.pseudonym), round(100.0 * count(a.pseudonym) / max(count(*), 1), 1) FROM created c LEFT JOIN act a ON a.pseudonym = c.pseudonym`),

  Q('d7_go_no_go', 'spec §7.2 D7 go/no-go-cohort (dag 6–8)', ['event', 'focus_session'], `
, cohort AS (SELECT pseudonym, date(server_at) AS reg_day, strftime('%w', server_at) AS weekday FROM ev, p WHERE name = 'account_created' AND substr(server_at, 1, 10) BETWEEN p.f AND p.t),
d7 AS (SELECT DISTINCT c.pseudonym FROM cohort c JOIN ok_completed e ON e.pseudonym = c.pseudonym
        WHERE json_extract(e.props, '$.minuten') >= 1 AND julianday(date(e.server_at)) - julianday(c.reg_day) BETWEEN 6 AND 8)
SELECT c.reg_day, c.weekday, count(*) AS registered, count(d.pseudonym) AS active_day_6_8, round(100.0 * count(d.pseudonym) / count(*), 1) AS pct
  FROM cohort c LEFT JOIN d7 d ON d.pseudonym = c.pseudonym GROUP BY c.reg_day, c.weekday
UNION ALL
SELECT 'total', NULL, count(*), count(d.pseudonym), round(100.0 * count(d.pseudonym) / max(count(*), 1), 1) FROM cohort c LEFT JOIN d7 d ON d.pseudonym = c.pseudonym`),

  Q('d30_post_season', 'spec §7.2 D30 buiten de tentamenweken (venster N per kalender)', ['event', 'focus_session', 'exam_calendar'], `
, cohort AS (SELECT pseudonym, calendar_id FROM ev, p WHERE name = 'account_created' AND substr(server_at, 1, 10) BETWEEN p.f AND p.t),
hit AS (SELECT DISTINCT c.pseudonym FROM cohort c JOIN exam_calendar k ON k.id = coalesce(c.calendar_id, (SELECT id FROM exam_calendar ORDER BY t_day LIMIT 1))
         JOIN ok_completed e ON e.pseudonym = c.pseudonym WHERE date(e.server_at) BETWEEN k.n_start_day AND k.n_end_day)
SELECT count(*) AS cohort, count(h.pseudonym) AS active_in_n, round(100.0 * count(h.pseudonym) / max(count(*), 1), 1) AS pct FROM cohort c LEFT JOIN hit h ON h.pseudonym = c.pseudonym`),

  Q('january_actives_cd', 'spec §7.2 januari-actieven T−13…T−7, voorwaarden (c) en (d), per rustarm', ['event', 'focus_session', 'exam_calendar'], `
, k AS (SELECT * FROM exam_calendar),
days AS (SELECT DISTINCT e.pseudonym, date(e.server_at) AS d, e.arm_rest, e.calendar_id FROM ok_completed e),
jan AS (SELECT d.pseudonym, coalesce(max(d.arm_rest), 'continue') AS arm, max(d.calendar_id) AS calendar_id FROM days d JOIN k ON k.id = d.calendar_id
         WHERE d.d BETWEEN date(k.t_day, '-13 days') AND date(k.t_day, '-7 days') GROUP BY d.pseudonym HAVING count(DISTINCT d.d) >= 2),
c_ok AS (SELECT j.pseudonym FROM jan j WHERE
          (SELECT count(DISTINCT d) FROM days x WHERE x.pseudonym = j.pseudonym AND x.d BETWEEN '2027-02-01' AND '2027-02-07') >= 2 AND
          (SELECT count(DISTINCT d) FROM days x WHERE x.pseudonym = j.pseudonym AND x.d BETWEEN '2027-02-08' AND '2027-02-14') >= 2),
d_ok AS (SELECT j.pseudonym FROM jan j JOIN k ON k.id = j.calendar_id WHERE EXISTS (SELECT 1 FROM days x WHERE x.pseudonym = j.pseudonym AND x.d BETWEEN k.a_start_day AND k.a_end_day))
SELECT j.arm, count(*) AS january_actives, count(c.pseudonym) AS c_met, round(100.0 * count(c.pseudonym) / count(*), 1) AS c_pct,
       count(dd.pseudonym) AS d_met, round(100.0 * count(dd.pseudonym) / count(*), 1) AS d_pct
  FROM jan j LEFT JOIN c_ok c ON c.pseudonym = j.pseudonym LEFT JOIN d_ok dd ON dd.pseudonym = j.pseudonym GROUP BY j.arm`),

  Q('costs', 'spec §7.2 Kosten in de pilot (per post, cumulatief)', ['redemption', 'reward_voucher', 'prize'], `
SELECT 'catalog' AS kind, v.pool AS post, count(*) AS items, sum(x.cost_cents) AS cost_cents
  FROM redemption x JOIN reward_voucher v ON v.id = x.voucher_id, p WHERE x.status IN ('reserved', 'delivered', 'replaced') AND substr(x.created_at, 1, 10) BETWEEN p.f AND p.t
 GROUP BY v.pool
UNION ALL
SELECT 'prize', kind, count(*), sum(value_cents) FROM prize, p WHERE status IN ('verified', 'delivered') AND substr(verified_at, 1, 10) BETWEEN p.f AND p.t GROUP BY kind`),

  Q('harm_threshold', 'spec §7.2 Absolute schadegrens, per code naast elkaar', ['harm_week'], `
SELECT week_key, actives, with_signal, round(100.0 * with_signal / max(actives, 1), 2) AS pct,
       json_extract(per_code, '$.S1') AS s1, json_extract(per_code, '$.S2') AS s2, json_extract(per_code, '$.S3') AS s3, json_extract(per_code, '$.S4') AS s4,
       absolute_exceeded FROM harm_week, p WHERE week_key BETWEEN p.f AND p.t ORDER BY week_key`),

  Q('guard_rule_rest', 'spec §7.2 Bewakingsregel rustarm', ['harm_week'], `
SELECT week_key,
       json_extract(per_arm, '$.rest_rest.actives') AS rest_actives, json_extract(per_arm, '$.rest_rest.withSignal') AS rest_with_signal,
       json_extract(per_arm, '$.rest_continue.actives') AS continue_actives, json_extract(per_arm, '$.rest_continue.withSignal') AS continue_with_signal,
       json_extract(guard_rule, '$.exceeded') AS exceeded FROM harm_week, p WHERE week_key BETWEEN p.f AND p.t ORDER BY week_key`),

  Q('harm_per_arm', 'spec §7.2 Schadesignalen per arm', ['event'], `
SELECT date(server_at, 'weekday 1', '-7 days') AS week, json_extract(props, '$.code') AS code, coalesce(arm_bonus, '-') AS arm_bonus, coalesce(arm_rest, '-') AS arm_rest,
       count(DISTINCT pseudonym) AS users
  FROM ev, p WHERE name = 'harm_signal_raised' AND substr(server_at, 1, 10) BETWEEN p.f AND p.t GROUP BY 1, 2, 3, 4 ORDER BY 1, 2, 3, 4`),

  Q('squad_share', 'spec §7.2 Aandeel actieven in een squad', ['event', 'squad', 'focus_session'], `
, w AS (SELECT date(e.server_at, 'weekday 1', '-7 days') AS week, e.pseudonym,
               max(CASE WHEN q.became_active_at IS NOT NULL AND q.became_active_at <= e.server_at THEN 1 ELSE 0 END) AS in_squad
          FROM ok_completed e LEFT JOIN squad q ON q.id = e.squad_id, p WHERE substr(e.server_at, 1, 10) BETWEEN p.f AND p.t GROUP BY 1, 2)
SELECT week, count(*) AS active_users, sum(in_squad) AS in_active_squad, round(100.0 * sum(in_squad) / count(*), 1) AS pct FROM w GROUP BY week ORDER BY week`),

  Q('squad_survival', 'spec §7.2 Squadoverleving (week 4 en 8)', ['squad', 'squad_membership', 'focus_session'], `
, sq AS (SELECT id, date(became_active_at) AS d0 FROM squad, p WHERE became_active_at IS NOT NULL AND date(became_active_at) BETWEEN p.f AND p.t),
act AS (SELECT sq.id, n.wk, count(DISTINCT m.user_id) AS actives FROM sq CROSS JOIN (SELECT 4 AS wk UNION ALL SELECT 8) n
          JOIN squad_membership m ON m.squad_id = sq.id AND m.user_id IS NOT NULL
          JOIN focus_session s ON s.user_id = m.user_id AND s.status = 'completed' AND s.is_practice = 0 AND s.review_status <> 'rejected'
           AND s.focus_day BETWEEN date(sq.d0, '+' || ((n.wk - 1) * 7) || ' days') AND date(sq.d0, '+' || (n.wk * 7 - 1) || ' days')
         GROUP BY sq.id, n.wk)
SELECT n.wk AS week_after_active, (SELECT count(*) FROM sq) AS squads, count(CASE WHEN a.actives >= 2 THEN 1 END) AS surviving
  FROM (SELECT 4 AS wk UNION ALL SELECT 8) n LEFT JOIN act a ON a.wk = n.wk GROUP BY n.wk`),

  Q('squad_reactivation', 'spec §7.2 Reactivering van squads per rustarm', ['squad', 'squad_membership', 'focus_session', 'exam_calendar'], `
, sq AS (SELECT q.id, coalesce(q.arm_rest, 'none') AS arm, k.t_day, k.a_start_day, k.a_end_day FROM squad q JOIN exam_calendar k ON k.id = q.calendar_id),
cnt AS (SELECT sq.id, sq.arm,
          (SELECT count(DISTINCT m.user_id) FROM squad_membership m JOIN focus_session s ON s.user_id = m.user_id AND s.status = 'completed' AND s.is_practice = 0
            WHERE m.squad_id = sq.id AND s.focus_day BETWEEN date(sq.t_day, '-13 days') AND sq.t_day) AS before_n,
          (SELECT count(DISTINCT m.user_id) FROM squad_membership m JOIN focus_session s ON s.user_id = m.user_id AND s.status = 'completed' AND s.is_practice = 0
            WHERE m.squad_id = sq.id AND s.focus_day BETWEEN sq.a_start_day AND sq.a_end_day) AS april_n FROM sq)
SELECT arm, count(*) AS active_before, count(CASE WHEN april_n >= 2 THEN 1 END) AS reactivated FROM cnt WHERE before_n >= 2 GROUP BY arm`),

  Q('club_participation', 'spec §7.2 Deelnamegraad per vereniging', ['club', 'club_membership', 'focus_session'], `
, wk AS (SELECT m.club_id, date(s.focus_day, 'weekday 1', '-7 days') AS week, s.user_id, count(DISTINCT s.focus_day) AS days
           FROM club_membership m JOIN focus_session s ON s.user_id = m.user_id AND s.status = 'completed' AND s.is_practice = 0 AND s.review_status <> 'rejected', p
          WHERE m.left_at IS NULL AND m.pending_admin = 0 AND s.focus_day BETWEEN p.f AND p.t GROUP BY 1, 2, 3)
SELECT c.name, w.week, c.declared_members, count(CASE WHEN w.days >= 2 THEN 1 END) AS members_2_days, round(100.0 * count(CASE WHEN w.days >= 2 THEN 1 END) / c.declared_members, 1) AS participation_pct
  FROM wk w JOIN club c ON c.id = w.club_id GROUP BY c.id, w.week ORDER BY c.name, w.week`),

  Q('exits_per_arm', 'spec §7.2 Uitstap per arm', ['event'], `
SELECT name, coalesce(json_extract(props, '$.bron'), '-') AS source, coalesce(arm_rest, '-') AS arm_rest, coalesce(arm_bonus, '-') AS arm_bonus, count(DISTINCT pseudonym) AS users
  FROM ev, p WHERE name IN ('rest_period_exit', 'research_opt_out') AND substr(server_at, 1, 10) BETWEEN p.f AND p.t GROUP BY 1, 2, 3, 4 ORDER BY 1, 2, 3, 4`),

  Q('mixed_rest_squads', 'spec §7.2 Gemengde rustsquads', ['squad', 'squad_membership'], `
, rs AS (SELECT q.id, max(CASE WHEN u.age_band = '16_17' OR u.cohort = 'expansion' OR u.research_opt_out_at IS NOT NULL OR u.rest_exit_at IS NOT NULL THEN 1 ELSE 0 END) AS mixed
           FROM squad q JOIN squad_membership m ON m.squad_id = q.id AND m.left_at IS NULL JOIN user u ON u.id = m.user_id WHERE q.arm_rest = 'rest' GROUP BY q.id)
SELECT count(*) AS rest_squads, sum(mixed) AS mixed, round(100.0 * sum(mixed) / max(count(*), 1), 1) AS pct FROM rs`),

  Q('eligible_without_redemption', 'spec §7.2 Gerechtigden zonder verzilvering (per week en arm)', ['event'], `
, wk AS (SELECT date(server_at, 'weekday 1', '-7 days') AS week, pseudonym, coalesce(arm_bonus, '-') AS arm,
                max(CASE WHEN name = 'redemption_completed' THEN 1 ELSE 0 END) AS redeemed,
                max(CASE WHEN (name = 'redemption_blocked' AND json_extract(props, '$.reden') = 'voorraad') OR name = 'catalog_empty_seen' THEN 1 ELSE 0 END) AS empty
           FROM ev, p WHERE name IN ('redemption_completed', 'redemption_blocked', 'catalog_empty_seen', 'catalog_viewed') AND substr(server_at, 1, 10) BETWEEN p.f AND p.t
          GROUP BY 1, 2, 3)
SELECT week, arm, count(*) AS eligible_seen, sum(CASE WHEN empty = 1 AND redeemed = 0 THEN 1 ELSE 0 END) AS without_redemption,
       round(100.0 * sum(CASE WHEN empty = 1 AND redeemed = 0 THEN 1 ELSE 0 END) / count(*), 1) AS pct FROM wk GROUP BY week, arm ORDER BY week, arm`),

  Q('k_factor', 'spec §7.2 K uit uitnodigingen van gebruiker aan gebruiker', ['event', 'focus_session'], `
, created AS (SELECT pseudonym, json_extract(props, '$.bron') AS bron, server_at FROM ev, p WHERE name = 'account_created' AND substr(server_at, 1, 10) BETWEEN p.f AND p.t),
activated AS (SELECT DISTINCT c.pseudonym, c.bron FROM created c JOIN ok_completed e ON e.pseudonym = c.pseudonym AND json_extract(e.props, '$.minuten') >= 25)
SELECT bron, count(*) AS activated, round(1.0 * count(*) / max((SELECT count(*) FROM activated), 1), 3) AS k_share
  FROM activated WHERE bron IN ('squad', 'duel', 'personal') GROUP BY bron
UNION ALL SELECT 'all_activated', (SELECT count(*) FROM activated), NULL`),

  Q('flag_queue_load', 'spec §7.2 Gemarkeerde sessies (wachtrijlast) en doorlooptijd', ['event'], `
, c AS (SELECT date(server_at, 'weekday 1', '-7 days') AS week, json_extract(props, '$.flagged') AS flagged FROM ev, p WHERE name = 'session_completed' AND substr(server_at, 1, 10) BETWEEN p.f AND p.t),
r AS (SELECT date(server_at, 'weekday 1', '-7 days') AS week, avg(json_extract(props, '$.doorlooptijd_u')) AS lead_h, count(*) AS decisions FROM ev, p
       WHERE name = 'flag_reviewed' AND substr(server_at, 1, 10) BETWEEN p.f AND p.t GROUP BY 1)
SELECT c.week, count(*) AS completed, sum(CASE WHEN c.flagged IN (1, 'true') THEN 1 ELSE 0 END) AS flagged,
       round(100.0 * sum(CASE WHEN c.flagged IN (1, 'true') THEN 1 ELSE 0 END) / count(*), 1) AS pct, max(r.decisions) AS decisions, round(max(r.lead_h), 1) AS avg_lead_hours
  FROM c LEFT JOIN r ON r.week = c.week GROUP BY c.week ORDER BY c.week`),

  Q('rejected_after_review', 'spec §7.2 Afgekeurd na herbeoordeling, per bron', ['focus_session'], `
SELECT u.registration_source AS source, count(*) AS completed, sum(CASE WHEN s.review_status = 'rejected' THEN 1 ELSE 0 END) AS rejected,
       round(100.0 * sum(CASE WHEN s.review_status = 'rejected' THEN 1 ELSE 0 END) / count(*), 2) AS pct
  FROM focus_session s JOIN user u ON u.id = s.user_id, p
 WHERE s.status = 'completed' AND s.is_practice = 0 AND u.is_team = 0 AND s.focus_day BETWEEN p.f AND p.t GROUP BY u.registration_source`),

  Q('reward_hunters', 'spec §7.2 Beloningsjagers (signaal)', ['event', 'support_ticket'], `
, red AS (SELECT pseudonym, min(server_at) AS at FROM ev, p WHERE name = 'redemption_completed' AND substr(server_at, 1, 10) BETWEEN p.f AND p.t GROUP BY pseudonym),
quiet AS (SELECT r.pseudonym FROM red r WHERE NOT EXISTS (SELECT 1 FROM ok_completed e WHERE e.pseudonym = r.pseudonym AND e.server_at > r.at AND e.server_at <= strftime('%Y-%m-%dT%H:%M:%fZ', r.at, '+14 days')))
SELECT 'redeemed_then_14d_quiet' AS signal, (SELECT count(*) FROM quiet) AS users, (SELECT count(*) FROM red) AS base
UNION ALL SELECT 'support_label_uitbetalen', (SELECT count(*) FROM support_ticket WHERE label = 'uitbetalen'), (SELECT count(*) FROM support_ticket WHERE label IS NOT NULL)`),

  Q('w3_retention', 'spec §7.2 W3-retentie (dag 15–21)', ['event', 'focus_session'], `
, cohort AS (SELECT pseudonym, date(server_at) AS d0 FROM ev, p WHERE name = 'account_created' AND substr(server_at, 1, 10) BETWEEN p.f AND p.t),
w3 AS (SELECT c.pseudonym FROM cohort c JOIN ok_completed e ON e.pseudonym = c.pseudonym WHERE julianday(date(e.server_at)) - julianday(c.d0) BETWEEN 15 AND 21
        GROUP BY c.pseudonym HAVING count(DISTINCT date(e.server_at)) >= 2)
SELECT count(*) AS cohort, (SELECT count(*) FROM w3) AS retained, round(100.0 * (SELECT count(*) FROM w3) / max(count(*), 1), 1) AS pct FROM cohort`),

  Q('belofte', 'spec §7.2 Belofte-overname, -naleving en interesse in inzet', ['event'], `
SELECT coalesce(arm_bonus, '-') AS arm_bonus,
       count(DISTINCT CASE WHEN name = 'belofte_offered' THEN pseudonym END) AS offered,
       count(DISTINCT CASE WHEN name = 'belofte_made' THEN pseudonym END) AS made,
       sum(CASE WHEN name = 'belofte_day_result' AND json_extract(props, '$.gehaald') IN (1, 'true') THEN 1 ELSE 0 END) AS days_met,
       sum(CASE WHEN name = 'belofte_day_result' THEN 1 ELSE 0 END) AS days,
       sum(CASE WHEN name = 'belofte_reflection' AND json_extract(props, '$.stake_interest') = 'ja' THEN 1 ELSE 0 END) AS stake_interest_yes
  FROM ev, p WHERE name LIKE 'belofte_%' AND substr(server_at, 1, 10) BETWEEN p.f AND p.t GROUP BY 1`),

  Q('abort_recovery', 'spec §7.2 Herstel na afbreking', ['event'], `
, ab AS (SELECT pseudonym, date(server_at) AS d FROM ev, p WHERE name = 'session_aborted' AND substr(server_at, 1, 10) BETWEEN p.f AND p.t),
rec AS (SELECT a.pseudonym, a.d FROM ab a WHERE EXISTS (SELECT 1 FROM ok_completed e WHERE e.pseudonym = a.pseudonym AND date(e.server_at) = a.d))
SELECT (SELECT count(*) FROM ab) AS aborted, (SELECT count(*) FROM rec) AS completed_same_day,
       round(100.0 * (SELECT count(*) FROM rec) / max((SELECT count(*) FROM ab), 1), 1) AS pct`),

  Q('mode_and_plus', 'spec §7.2 Modus zonder punten en interesse in Plus', ['event'], `
SELECT name, count(DISTINCT pseudonym) AS users FROM ev, p WHERE name IN ('no_points_mode_changed', 'plus_interest') AND substr(server_at, 1, 10) BETWEEN p.f AND p.t GROUP BY name`),
];

/** The SQL text of a stored query (with the prelude), for display and for running. */
export function kpiSql(def: KpiQueryDef, clean: boolean): string {
  return `${PRELUDE(clean)}\n${def.sql.trimStart().startsWith(',') ? def.sql : `\n${def.sql}`}`;
}
