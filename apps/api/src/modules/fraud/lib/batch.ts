// Batch heuristics and harm signals (architecture §4.5, §6.1): day close step 7 (H2, H5, H6, H7, H12
// over the week so far, S1–S3), week close (H9, H12 over the week) and the hourly job (H10). Findings
// become flags; the sessions go to `pending` but no booking moves: only a human decision books
// (architecture §4.5 last paragraph, §10.8).
import { CURRENT_PARAMS, addDays, focusDayOf, focusDayStart, weekKey, type FocusDay, type Params } from '@rewarded/core';
import {
  fraudRules,
  h12,
  h2,
  h5,
  h6,
  h7,
  h9,
  h10,
  harmRules,
  harmSignals,
  type ClubLinkFact,
  type FraudRules,
  type HarmCode,
  type HarmDayFact,
  type HeuristicResult,
  type SessionFact,
  type SquadFact,
  type StreakBreak,
} from '@rewarded/core/fraud';
import type { Db } from '../../../db/types.ts';
import type { ModuleDeps } from '../../../module.ts';
import { installWp6Services } from './install.ts';
import { hasTables, idsOf } from './util.ts';
import type { SqlFlagService } from './flags.ts';

interface SessionSqlRow {
  id: string;
  user_id: string;
  status: SessionFact['status'];
  is_practice: number;
  server_start_at: number;
  server_end_at: number | null;
  focus_day: string;
  planned_min: number;
  verified_min: number;
  ip_hash: string | null;
  net_class: SessionFact['netClass'];
  ua_class: string;
  webdriver: number;
  covered_gap_s: number;
  clock_skew_ms: number | null;
  claim_delay_s: number | null;
  late_start: number;
}

const toFact = (r: SessionSqlRow): SessionFact => ({
  sessionId: r.id,
  userId: r.user_id,
  status: r.status,
  isPractice: r.is_practice === 1,
  startAt: r.server_start_at,
  endAt: r.server_end_at,
  focusDay: r.focus_day,
  plannedMin: r.planned_min,
  verifiedMin: r.verified_min,
  ipHash: r.ip_hash,
  netClass: r.net_class,
  uaClass: r.ua_class,
  webdriver: r.webdriver === 1,
  coveredGapS: r.covered_gap_s,
  clockSkewMs: r.clock_skew_ms,
  claimDelayS: r.claim_delay_s,
  lateStart: r.late_start === 1,
});

/** Sessions of non-team accounts whose focus day lies in [from, to]. */
export function sessionFacts(db: Db, from: FocusDay, to: FocusDay): SessionFact[] {
  return db
    .all<SessionSqlRow>(
      `SELECT s.id, s.user_id, s.status, s.is_practice, s.server_start_at, s.server_end_at, s.focus_day, s.planned_min, s.verified_min, s.ip_hash, s.net_class,
              s.ua_class, s.webdriver, s.covered_gap_s, s.clock_skew_ms, s.claim_delay_s, s.late_start
         FROM focus_session s JOIN user u ON u.id = s.user_id
        WHERE s.focus_day >= ? AND s.focus_day <= ? AND u.is_team = 0 ORDER BY s.server_start_at, s.id`,
      [from, to],
    )
    .map(toFact);
}

export interface BatchReport {
  raised: Record<string, number>;
  skipped: Record<string, number>;
  harm: Record<HarmCode, number>;
}

const emptyReport = (): BatchReport => ({ raised: {}, skipped: {}, harm: { S1: 0, S2: 0, S3: 0, S4: 0 } });

/** Turns findings into flags (one per dedup key) and puts their completed sessions on pending. */
export function persistFindings(deps: ModuleDeps, tx: Db, result: HeuristicResult, report: BatchReport): void {
  const flags = deps.services.flags as SqlFlagService;
  for (const f of result.findings) {
    const existing = tx.get<{ id: string; status: string }>('SELECT id, status FROM fraud_flag WHERE dedup_key = ?', [f.dedupKey]);
    // A week key (H6, H12) is found again later in the week: the new sessions join the open flag and
    // go to pending as well (spec §6.3, §6.4). A decided flag is left alone.
    let newSessionIds: readonly string[] = f.sessionIds;
    if (existing) {
      if (existing.status !== 'open') continue;
      const known = new Set(tx.all<{ session_id: string | null }>('SELECT session_id FROM fraud_flag_session WHERE flag_id = ?', [existing.id]).map((r) => r.session_id));
      newSessionIds = f.sessionIds.filter((id) => !known.has(id));
      if (newSessionIds.length === 0) continue;
      for (const sid of newSessionIds) {
        const owner = tx.get<{ user_id: string }>('SELECT user_id FROM focus_session WHERE id = ?', [sid]);
        if (owner) tx.run('INSERT OR IGNORE INTO fraud_flag_session (flag_id, session_id, user_id) VALUES (?, ?, ?)', [existing.id, sid, owner.user_id]);
      }
    } else {
      if (f.subject.type === 'session' && f.sessionIds.length === 0) continue;
      flags.raise(tx, { code: f.code, subject: f.subject, sessionIds: f.sessionIds, evidence: f.evidence, userIds: f.userIds, dedupKey: f.dedupKey });
    }
    const sessions = (deps.services as Partial<ModuleDeps['services']>).sessions;
    if (sessions) {
      const pending = newSessionIds.filter((id) => {
        const s = sessions.get(id);
        return s !== undefined && s.status === 'completed' && s.reviewStatus !== 'pending' && s.reviewStatus !== 'rejected';
      });
      if (pending.length > 0) sessions.setReviewStatus(tx, pending, 'pending');
    }
    if (!existing) report.raised[f.code] = (report.raised[f.code] ?? 0) + 1;
  }
  for (const s of result.skipped) {
    report.skipped[s.code] = (report.skipped[s.code] ?? 0) + 1;
    deps.platform.logger?.log('warn', 'fraud_shared_threshold_missing', { error_code: s.code, net_class: s.netClass });
  }
}

function rulesOf(deps: ModuleDeps): FraudRules {
  const o = (deps.services as Partial<ModuleDeps['services']>).fraudRules;
  return o ?? fraudRules(CURRENT_PARAMS);
}

function squadFacts(db: Db): { squads: SquadFact[]; members: Set<string> } {
  if (!hasTables(db, 'squad', 'squad_membership')) return { squads: [], members: new Set() };
  const rows = db.all<{ squad_id: string; user_id: string; created_at: string; registration_ip_hash: string | null; registration_net_class: SessionFact['netClass'] }>(
    `SELECT m.squad_id, m.user_id, u.created_at, u.registration_ip_hash, u.registration_net_class
       FROM squad_membership m JOIN squad q ON q.id = m.squad_id JOIN user u ON u.id = m.user_id
      WHERE m.left_at IS NULL AND m.user_id IS NOT NULL AND q.status = 'active' AND u.is_team = 0 ORDER BY m.squad_id, m.user_id`,
  );
  const by = new Map<string, SquadFact['members'][number][]>();
  for (const r of rows)
    (by.get(r.squad_id) ?? by.set(r.squad_id, []).get(r.squad_id)!).push({ userId: r.user_id, registeredAt: Date.parse(r.created_at), ipHash: r.registration_ip_hash, netClass: r.registration_net_class });
  return { squads: [...by].map(([squadId, members]) => ({ squadId, members })), members: new Set(rows.map((r) => r.user_id)) };
}

/** Day close step 7: batch heuristics over D (and the week so far) and harm signals S1–S3. */
export function runDayBatch(deps: ModuleDeps, day: FocusDay, now: Date, params: Params = CURRENT_PARAMS): BatchReport {
  const report = emptyReport();
  const { db } = deps;
  if (!hasTables(db, 'fraud_flag', 'focus_session', 'user_day')) return report;
  installWp6Services(deps);
  const rules = rulesOf(deps);
  const week = weekKey(day, params.time.week_start_iso_weekday);
  const facts = sessionFacts(db, addDays(week, -1), addDays(day, 1));
  db.transaction(() => {
    persistFindings(deps, db, h2(facts.filter((s) => s.focusDay === day || s.focusDay === addDays(day, 1)), [day], rules), report);
    const days = db.all<{ user_id: string; focus_day: string; verified_min: number }>('SELECT user_id, focus_day, verified_min FROM user_day WHERE focus_day >= ? AND focus_day <= ?', [
      addDays(day, -(rules.h5ConsecutiveDays - 1)),
      day,
    ]);
    persistFindings(deps, db, h5(days.map((d) => ({ userId: d.user_id, focusDay: d.focus_day, verifiedMin: d.verified_min })), facts, day, rules), report);
    persistFindings(deps, db, h6(facts, week, params, rules), report);
    const sq = squadFacts(db);
    if (sq.squads.length > 0) {
      const memberFacts = sessionFacts(db, addDays(day, -30), day).filter((s) => sq.members.has(s.userId));
      persistFindings(deps, db, h7(sq.squads, memberFacts, rules), report);
    }
    persistFindings(deps, db, h12(facts.filter((s) => s.focusDay >= week && s.focusDay <= day), week, now.getTime(), rules), report);
  });
  db.transaction(() => raiseHarmSignals(deps, db, day, report));
  return report;
}

/** Week close: H9 and H12 over the full past week. `week` is the Monday of that week. */
export function runWeekBatch(deps: ModuleDeps, week: FocusDay, now: Date): BatchReport {
  const report = emptyReport();
  const { db } = deps;
  if (!hasTables(db, 'fraud_flag', 'focus_session')) return report;
  installWp6Services(deps);
  const rules = rulesOf(deps);
  const facts = sessionFacts(db, week, addDays(week, 6));
  db.transaction(() => {
    persistFindings(deps, db, h9(facts, week, rules), report);
    persistFindings(deps, db, h12(facts, week, now.getTime(), rules), report);
  });
  return report;
}

/** Hourly job: H10 over the club links of the last 48 hours. */
export function runHourlyBatch(deps: ModuleDeps, now: Date, params: Params = CURRENT_PARAMS): BatchReport {
  const report = emptyReport();
  const { db } = deps;
  if (!hasTables(db, 'fraud_flag', 'club_membership', 'focus_session')) return report;
  installWp6Services(deps);
  const rules = rulesOf(deps);
  const from = new Date(now.getTime() - rules.h10WindowH * 3_600_000).toISOString();
  const links: ClubLinkFact[] = db
    .all<{ club_id: string; user_id: string; linked_at: string; ip_hash: string | null; net_class: SessionFact['netClass'] }>(
      `SELECT m.club_id, m.user_id, m.linked_at, m.ip_hash, m.net_class FROM club_membership m JOIN user u ON u.id = m.user_id
        WHERE m.linked_at >= ? AND m.user_id IS NOT NULL AND u.is_team = 0`,
      [from],
    )
    .map((l) => ({ clubId: l.club_id, userId: l.user_id, linkedAt: Date.parse(l.linked_at), ipHash: l.ip_hash, netClass: l.net_class }));
  const today = focusDayOf(now.getTime(), params);
  const facts = sessionFacts(db, addDays(today, -3), today);
  db.transaction(() => persistFindings(deps, db, h10(links, facts, now.getTime(), weekKey(today, params.time.week_start_iso_weekday), rules), report));
  return report;
}

/** Latest arms of a user as stamped on their events (the same columns the KPI analysis uses). */
export function armsOfUser(db: Db, userId: string): { arm_bonus: 'A' | 'B' | null; arm_rest: 'rest' | 'continue' | null } {
  return (
    db.get<{ arm_bonus: 'A' | 'B' | null; arm_rest: 'rest' | 'continue' | null }>(
      'SELECT e.arm_bonus, e.arm_rest FROM event e JOIN user u ON u.pseudonym = e.pseudonym WHERE u.id = ? AND (e.arm_bonus IS NOT NULL OR e.arm_rest IS NOT NULL) ORDER BY e.server_at DESC, e.id DESC LIMIT 1',
      [userId],
    ) ?? { arm_bonus: null, arm_rest: null }
  );
}

/** Stores one harm signal (at most one per code per 14 days) with its event; returns whether it was new. */
export function storeHarmSignal(deps: ModuleDeps, tx: Db, userId: string, code: HarmCode, day: FocusDay, now: Date, params: Params = CURRENT_PARAMS): boolean {
  const cooldown = harmRules(params).cooldownDays;
  const recent = tx.get('SELECT 1 AS x FROM harm_signal WHERE user_id = ? AND code = ? AND focus_day > ?', [userId, code, addDays(day, -cooldown)]);
  if (recent) return false;
  const u = tx.get<{ pseudonym: string }>('SELECT pseudonym FROM user WHERE id = ?', [userId]);
  if (!u) return false;
  const arms = armsOfUser(tx, userId);
  tx.run('INSERT OR IGNORE INTO harm_signal (id, user_id, code, focus_day, week_key, arm_bonus, arm_rest, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [
    idsOf(deps).ulid(),
    userId,
    code,
    day,
    weekKey(day, params.time.week_start_iso_weekday),
    arms.arm_bonus,
    arms.arm_rest,
    now.toISOString(),
  ]);
  deps.services.events.event(tx, 'harm_signal_raised', { code }, { pseudonym: u.pseudonym });
  return true;
}

function raiseHarmSignals(deps: ModuleDeps, db: Db, day: FocusDay, report: BatchReport): void {
  if (!hasTables(db, 'harm_signal')) return;
  const params = CURRENT_PARAMS;
  const R = harmRules(params);
  const from = addDays(day, -20);
  const rows = db.all<{ user_id: string; focus_day: string; verified_min: number; late: number; done: number }>(
    `SELECT s.user_id, s.focus_day, SUM(s.verified_min) AS verified_min, MAX(s.late_start) AS late,
            MAX(CASE WHEN s.status = 'completed' AND s.is_practice = 0 THEN 1 ELSE 0 END) AS done
       FROM focus_session s JOIN user u ON u.id = s.user_id
      WHERE s.focus_day >= ? AND s.focus_day <= ? AND u.status = 'active' AND u.is_team = 0 AND s.is_practice = 0
      GROUP BY s.user_id, s.focus_day`,
    [from, day],
  );
  const byUser = new Map<string, HarmDayFact[]>();
  for (const r of rows) (byUser.get(r.user_id) ?? byUser.set(r.user_id, []).get(r.user_id)!).push({ focusDay: r.focus_day, verifiedMin: r.verified_min, lateStart: r.late === 1, completed: r.done === 1 });
  const breaks = streakBreaks(db, addDays(day, -(R.s3InactiveDays + 7)), day);
  for (const [userId, days] of [...byUser].sort(([a], [b]) => a.localeCompare(b))) {
    const last = db.all<{ code: HarmCode; d: string }>('SELECT code, MAX(focus_day) AS d FROM harm_signal WHERE user_id = ? GROUP BY code', [userId]);
    const lastRaised = Object.fromEntries(last.map((l) => [l.code, l.d])) as Partial<Record<HarmCode, FocusDay>>;
    for (const code of harmSignals({ userId, day, days, breaks: breaks.get(userId) ?? [], lastRaised }, R))
      if (storeHarmSignal(deps, db, userId, code, day, deps.platform.clock.now(), params)) report.harm[code] += 1;
  }
}

/** Streak breaks of each user's open squad from squad_day (WP-5): a fail after a streak. */
function streakBreaks(db: Db, from: FocusDay, to: FocusDay): Map<string, StreakBreak[]> {
  const out = new Map<string, StreakBreak[]>();
  if (!hasTables(db, 'squad_day', 'squad_membership')) return out;
  const rows = db.all<{ user_id: string; focus_day: string; before: number }>(
    `SELECT m.user_id, d.focus_day, (SELECT p.streak_after FROM squad_day p WHERE p.squad_id = d.squad_id AND p.focus_day < d.focus_day ORDER BY p.focus_day DESC LIMIT 1) AS before
       FROM squad_day d JOIN squad_membership m ON m.squad_id = d.squad_id AND m.left_at IS NULL AND m.user_id IS NOT NULL
      WHERE d.result = 'fail' AND d.focus_day >= ? AND d.focus_day <= ?`,
    [from, to],
  );
  for (const r of rows) if (r.before !== null) (out.get(r.user_id) ?? out.set(r.user_id, []).get(r.user_id)!).push({ breakDay: r.focus_day, streakBefore: r.before });
  return out;
}

/** Instant of the start of a focus day (for SQL windows on ISO text columns). */
export function dayStartIso(day: FocusDay, params: Params = CURRENT_PARAMS): string {
  return new Date(focusDayStart(day, params)).toISOString();
}
