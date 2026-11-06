// Admin module (WP-6; architecture §8.2 "Beheer", §10.8; spec §4.11). Owner WP-6.
// Admin routes that belong to no other domain: second factor, users (every view with a reason and
// an audit line), prizes (winner verification, age check, delivery contact), vacation pause,
// experiments, feature flags with four eyes, the wellbeing summary, the arm B stop, ambassadors
// and the audit log.
import { DomainError, routes, type AdminPrize, type FeatureFlagKey } from '@rewarded/contracts';
import { CURRENT_PARAMS, addDays, focusDayOf, weekKey } from '@rewarded/core';
import { harmRules, HARM_CODES, type HarmCode } from '@rewarded/core/fraud';
import { enrollMfa, mfaDepsOf, verifyMfa } from '../../db/adminMfa.ts';
import { isFeatureEnabled, setFeatureFlag } from '../../db/flags.ts';
import type { Db } from '../../db/types.ts';
import { mount, reply } from '../../middleware/route.ts';
import type { ApiModule, ModuleDeps } from '../../module.ts';
import { installWp6Services } from '../fraud/lib/install.ts';
import { loadPrize, type PrizeRow } from '../fraud/lib/prizes.ts';
import type { SqlPrizeService } from '../fraud/lib/prizes.ts';
import { actorOf, hasTables, idsOf, parseJson, ref } from '../fraud/lib/util.ts';
import { ambassadorPayout, createAmbassador, listAmbassadors } from './ambassadors.ts';

/** Flags whose switch needs a second admin (architecture §8.2): turning arm B or the rest arm on, and stopping arm B. */
export function needsFourEyes(key: FeatureFlagKey, enabled: boolean): boolean {
  if (key === 'rest_period') return enabled;
  return key === 'arm_b';
}

export function prizeDto(deps: ModuleDeps, p: PrizeRow): AdminPrize {
  return {
    id: p.id,
    kind: p.kind === 'drawn' ? 'earned_collective' : p.kind,
    challenge_id: p.challenge_id,
    value_cents: p.value_cents,
    min_age_band: p.min_age_band,
    winner_ref: p.winner_user_id ? ref(deps, p.winner_user_id) : null,
    winner_club_id: p.winner_club_id,
    status: p.status,
    verified_by_ref: p.verified_by ? p.verified_by.slice('admin:'.length) : null,
    age_check_outcome: p.age_check_outcome,
    deliver_after: p.deliver_after,
  };
}

/** Four-eyes request through the audit log: the first admin records it, another admin confirms. */
export function fourEyes(deps: ModuleDeps, tx: Db, action: string, objectRef: string, value: string, actor: `admin:${string}`): boolean {
  const last = tx.get<{ actor_ref: string; reason: string | null; at: string }>(
    'SELECT actor_ref, reason, at FROM audit_log WHERE action = ? AND object_ref = ? ORDER BY at DESC, id DESC LIMIT 1',
    [`${action}_requested`, objectRef],
  );
  const applied = tx.get<{ at: string }>('SELECT at FROM audit_log WHERE action = ? AND object_ref = ? ORDER BY at DESC, id DESC LIMIT 1', [`${action}_applied`, objectRef]);
  const open = last && last.reason === value && (!applied || applied.at <= last.at);
  if (!open) {
    deps.services.audit.audit(tx, { actor, action: `${action}_requested`, objectType: action, objectRef, reason: value });
    return false;
  }
  if (last.actor_ref === actor) throw new DomainError('FOUR_EYES_REQUIRED');
  deps.services.audit.audit(tx, { actor, action: `${action}_applied`, objectType: action, objectRef, reason: value });
  return true;
}

function lastClosedDay(db: Db): string | null {
  return db.get<{ k: string }>("SELECT max(run_key) AS k FROM job_run WHERE job = 'day_close' AND status = 'done'")?.k?.replace(/^day_close:/, '') ?? null;
}

export const module: ApiModule = {
  name: 'admin',
  owner: 'WP-6',
  register(api, deps) {
    installWp6Services(deps);
    const { db } = deps;

    // --- second factor (only these two without a factor, §10.8) --------------------------------
    mount(
      api,
      routes['admin.mfa.enroll'],
      ({ auth }) => {
        if (auth.kind !== 'user' || auth.user.adminRole === null) throw new DomainError('FORBIDDEN');
        const r = db.transaction(() => enrollMfa(db, mfaDepsOf(deps.platform), auth.user.id, auth.user.email));
        return { otpauth_uri: r.otpauth_uri, secret_base32: r.secret };
      },
      { allowWithoutMfa: true },
    );
    mount(
      api,
      routes['admin.mfa.verify'],
      ({ auth, body }) => {
        if (auth.kind !== 'user' || auth.user.adminRole === null) throw new DomainError('FORBIDDEN');
        return db.transaction(() => verifyMfa(db, mfaDepsOf(deps.platform), auth.user.id, auth.sessionId, body.code));
      },
      { allowWithoutMfa: true },
    );

    // --- users ------------------------------------------------------------------------------
    type UserRow = { id: string; first_name: string; email: string; age_band: '16_17' | '18_plus'; status: 'active' | 'blocked' | 'deleted'; is_team: number; created_at: string };
    const summary = (u: UserRow) => ({ id: u.id, first_name: u.first_name, email: u.email, age_band: u.age_band, status: u.status, is_team: u.is_team === 1, created_at: u.created_at });

    mount(api, routes['admin.users.search'], ({ auth, query }) => {
      const actor = actorOf(deps, auth);
      const q = `${query.q.toLowerCase()}%`;
      const rows = db.all<UserRow>('SELECT id, first_name, email, age_band, status, is_team, created_at FROM user WHERE lower(email) LIKE ? OR lower(first_name) LIKE ? OR id = ? ORDER BY created_at LIMIT 50', [q, q, query.q]);
      db.transaction(() => deps.services.audit.audit(db, { actor, action: 'users_searched', objectType: 'user', objectRef: `count:${rows.length}`, reason: query.reason }));
      return { items: rows.map(summary) };
    });

    mount(api, routes['admin.users.get'], ({ auth, params, query }) => {
      const actor = actorOf(deps, auth);
      const u = db.get<UserRow>('SELECT id, first_name, email, age_band, status, is_team, created_at FROM user WHERE id = ?', [params.id]);
      if (!u) throw new DomainError('NOT_FOUND');
      // The audit line is written before the answer (architecture §10.8).
      db.transaction(() => deps.services.audit.audit(db, { actor, action: 'user_viewed', objectType: 'user', objectRef: ref(deps, u.id), reason: query.reason }));
      const sessions = hasTables(db, 'focus_session')
        ? db.all<{ id: string; planned_min: 1 | 25 | 50 | 90; is_practice: number; status: 'active' | 'completed' | 'aborted'; focus_day: string; server_start_at: number; planned_end_at: number; server_end_at: number | null; verified_min: number; counted_min: number; late_start: number; review_status: 'none' | 'pending' | 'released' | 'rejected' }>(
            'SELECT id, planned_min, is_practice, status, focus_day, server_start_at, planned_end_at, server_end_at, verified_min, counted_min, late_start, review_status FROM focus_session WHERE user_id = ? ORDER BY server_start_at DESC LIMIT 100',
            [u.id],
          )
        : [];
      const open = db.get<{ n: number }>(
        "SELECT count(DISTINCT f.id) AS n FROM fraud_flag f LEFT JOIN fraud_flag_session l ON l.flag_id = f.id WHERE f.status = 'open' AND (l.user_id = ? OR (f.subject_type = 'account' AND f.subject_id = ?))",
        [u.id, u.id],
      );
      return {
        user: summary(u),
        sessions: sessions.map((s) => ({
          id: s.id,
          planned_min: s.planned_min,
          is_practice: s.is_practice === 1,
          status: s.status,
          focus_day: s.focus_day,
          server_start_at: new Date(s.server_start_at).toISOString(),
          planned_end_at: new Date(s.planned_end_at).toISOString(),
          server_end_at: s.server_end_at === null ? null : new Date(s.server_end_at).toISOString(),
          verified_min: s.verified_min,
          counted_min: s.counted_min,
          late_start: s.late_start === 1,
          review_status: s.review_status,
        })),
        open_flags: open?.n ?? 0,
      };
    });

    mount(api, routes['admin.users.teamFlag'], ({ auth, params }) => {
      const actor = actorOf(deps, auth);
      return db.transaction(() => {
        if (db.run('UPDATE user SET is_team = 1 WHERE id = ?', [params.id]).changes === 0) throw new DomainError('NOT_FOUND');
        deps.services.audit.audit(db, { actor, action: 'team_flag_set', objectType: 'user', objectRef: ref(deps, params.id) });
        return { user_id: params.id, is_team: true as const };
      });
    });

    // --- prizes (spec §4.7) -------------------------------------------------------------------
    const prizes = () => deps.services.prizes as SqlPrizeService;
    mount(api, routes['admin.prizes.verify'], ({ auth, params, body }) => {
      const actor = actorOf(deps, auth);
      return db.transaction(() => {
        prizes().verify(db, params.id, actor);
        deps.services.audit.audit(db, { actor, action: 'prize_verified', objectType: 'prize', objectRef: params.id, reason: body.note ?? JSON.stringify(body.checks) });
        return { prize: prizeDto(deps, loadPrize(db, params.id) as PrizeRow) };
      });
    });
    mount(api, routes['admin.prizes.ageCheck'], ({ auth, params, body }) => {
      const actor = actorOf(deps, auth);
      return db.transaction(() => {
        // Outcome, date and checker only; the kind of document is not stored (spec §4.7 step 6).
        prizes().recordAgeCheck(db, params.id, body.outcome, actor);
        deps.services.audit.audit(db, { actor, action: 'prize_age_checked', objectType: 'prize', objectRef: params.id, reason: body.outcome });
        return { prize: prizeDto(deps, loadPrize(db, params.id) as PrizeRow) };
      });
    });
    mount(api, routes['admin.prizes.deliveryContact'], ({ auth, params, body }) => {
      const actor = actorOf(deps, auth);
      return db.transaction(() => {
        const p = loadPrize(db, params.id);
        if (!p) throw new DomainError('NOT_FOUND');
        if (p.min_age_band === '18_plus' && p.age_check_outcome !== 'ok') throw new DomainError('AGE_CHECK_REQUIRED');
        if (p.status !== 'verified' && p.status !== 'candidate') throw new DomainError('NOT_FOUND', { reason: 'prize_closed' });
        const id = idsOf(deps).ulid();
        db.run('DELETE FROM prize_delivery_contact WHERE prize_id = ?', [p.id]);
        db.run('INSERT INTO prize_delivery_contact (id, prize_id, full_name, address, created_at) VALUES (?, ?, ?, ?, ?)', [id, p.id, body.full_name, body.address, deps.platform.clock.now().toISOString()]);
        db.run('UPDATE prize SET delivery_contact_ref = ? WHERE id = ?', [id, p.id]);
        deps.services.audit.audit(db, { actor, action: 'prize_contact_recorded', objectType: 'prize', objectRef: p.id });
        return { prize: prizeDto(deps, loadPrize(db, p.id) as PrizeRow) };
      });
    });

    // --- vacation pause (spec §4.11) ---------------------------------------------------------
    mount(api, routes['admin.vacationPause'], ({ auth, body }) => {
      const actor = actorOf(deps, auth);
      return db.transaction(() => {
        const closed = lastClosedDay(db);
        if (closed !== null && body.start_day <= closed) throw new DomainError('PERIOD_LOCKED', { last_closed_day: closed });
        const at = deps.platform.clock.now().toISOString();
        // One planned pause: pauses that have not started yet are replaced.
        db.run('DELETE FROM vacation_pause WHERE first_day > ?', [closed ?? '0000-00-00']);
        db.run('INSERT INTO vacation_pause (id, first_day, last_day, created_at, created_by) VALUES (?, ?, ?, ?, ?)', [idsOf(deps).ulid(), body.start_day, body.end_day, at, actor]);
        deps.services.audit.audit(db, { actor, action: 'vacation_pause_set', objectType: 'vacation_pause', objectRef: `${body.start_day}..${body.end_day}` });
        return { start_day: body.start_day, end_day: body.end_day, updated_at: at };
      });
    });

    // --- experiments ------------------------------------------------------------------------
    mount(api, routes['admin.experiments'], ({ auth }) => {
      const actor = actorOf(deps, auth);
      const a = db.all<{ unit_type: 'squad' | 'solo'; unit_id: string; factor: 'bonus' | 'belofte' | 'rest' | 'prompt'; arm: string; stratum: string; block: string; assigned_at: string }>(
        'SELECT unit_type, unit_id, factor, arm, stratum, block, assigned_at FROM experiment_assignment ORDER BY assigned_at, unit_id, factor LIMIT 5000',
      );
      const sw = db.all<{ user_id: string | null; factor: string; from: string; to: string; reason: 'join' | 'merge' | 'minor' | 'opt_out' | 'arm_b_stopped'; at: string }>(
        "SELECT user_id, factor, \"from\", \"to\", reason, at FROM arm_switch WHERE factor <> 'calendar' ORDER BY at LIMIT 5000",
      );
      db.transaction(() => deps.services.audit.audit(db, { actor, action: 'experiments_viewed', objectType: 'experiment', objectRef: 'all' }));
      const unitRef = (t: string, id: string) => (t === 'solo' && !id.startsWith('del_') ? ref(deps, id) : id.replace(/[^A-Za-z0-9_-]/g, '_').slice(0, 64).padEnd(8, '_'));
      return {
        assignments: a.map((x) => ({ unit_type: x.unit_type, unit_ref: unitRef(x.unit_type, x.unit_id), factor: x.factor, arm: x.arm, stratum: x.stratum.slice(0, 32), block: x.block.slice(0, 64), assigned_at: x.assigned_at })),
        switches: sw
          .filter((x) => ['bonus', 'belofte', 'rest', 'prompt'].includes(x.factor))
          .map((x) => ({ user_ref: x.user_id ? unitRef('solo', x.user_id) : 'u_deleted0', factor: x.factor as 'bonus', from: x.from, to: x.to, reason: x.reason, at: x.at })),
      };
    });

    // --- feature flags (four eyes for arm_b and turning the rest arm on) ------------------------
    mount(api, routes['admin.featureFlags.put'], ({ auth, params, body }) => {
      const actor = actorOf(deps, auth);
      if (params.key === 'draws') throw new DomainError('FEATURE_DISABLED');
      return db.transaction(() => {
        const key = params.key;
        if (needsFourEyes(key, body.enabled) && isFeatureEnabled(db, key) !== body.enabled) {
          if (!fourEyes(deps, db, 'feature_flag_change', key, body.enabled ? 'on' : 'off', actor)) return { key, enabled: isFeatureEnabled(db, key), pending_confirmation: true };
        }
        setFeatureFlag(db, key, body.enabled, actor, deps.platform.clock.now());
        deps.services.audit.audit(db, { actor, action: 'feature_flag_set', objectType: 'feature_flag', objectRef: key, reason: body.enabled ? 'on' : 'off' });
        return { key, enabled: body.enabled, pending_confirmation: false };
      });
    });

    // --- wellbeing summary (spec §6.6, §4.11 Schadesignalen) ------------------------------------
    mount(api, routes['admin.wellbeing.summary'], ({ auth }) => {
      const actor = actorOf(deps, auth);
      const today = focusDayOf(deps.platform.clock.now().getTime(), CURRENT_PARAMS);
      const lastWeek = addDays(weekKey(today, CURRENT_PARAMS.time.week_start_iso_weekday), -7);
      const rows = hasTables(db, 'harm_signal')
        ? db.all<{ code: HarmCode; arm: string; n: number }>(
            "SELECT code, coalesce(arm_bonus, 'none') AS arm, count(DISTINCT user_id) AS n FROM harm_signal WHERE week_key >= ? GROUP BY code, arm_bonus ORDER BY code, arm",
            [lastWeek],
          )
        : [];
      const signals = rows.filter((r) => (HARM_CODES as readonly string[]).includes(r.code)).map((r) => ({ code: r.code, arm: r.arm.slice(0, 16), count: r.n }));
      const hw = hasTables(db, 'harm_week') ? db.get<{ per_arm: string; stop_rule: string }>('SELECT per_arm, stop_rule FROM harm_week ORDER BY week_key DESC LIMIT 1') : undefined;
      const perArm = parseJson<Record<string, { actives: number; withSignal: number }>>(hw?.per_arm, {});
      const a = perArm.bonus_A ?? { actives: 0, withSignal: 0 };
      const b = perArm.bonus_B ?? { actives: 0, withSignal: 0 };
      const R = harmRules(CURRENT_PARAMS);
      // Users with a signal in B needed to exceed twice the share of A (criterion 2).
      const threshold = Math.max(1, Math.floor(a.actives === 0 ? 1 : R.armRatio * (a.withSignal / a.actives) * b.actives) + 1);
      db.transaction(() => deps.services.audit.audit(db, { actor, action: 'wellbeing_viewed', objectType: 'harm_week', objectRef: lastWeek }));
      return { signals, stop_rule: { count: b.withSignal, threshold, triggered: parseJson<{ triggered?: boolean }>(hw?.stop_rule, {}).triggered === true } };
    });

    mount(api, routes['admin.experiments.stopArmB'], ({ auth, body }) => {
      const actor = actorOf(deps, auth);
      return db.transaction(() => {
        const r = deps.services.experiments.stopArmB(db, actor);
        deps.services.audit.audit(db, { actor, action: r.effective ? 'arm_b_stop_confirmed' : 'arm_b_stop_reason', objectType: 'experiment', objectRef: 'arm_b', reason: body.reason });
        const today = focusDayOf(deps.platform.clock.now().getTime(), CURRENT_PARAMS);
        const monday = addDays(weekKey(today, CURRENT_PARAMS.time.week_start_iso_weekday), 7);
        return { effective_from_day: monday, pending_confirmation: !r.effective };
      });
    });

    // --- ambassadors (spec §4.9) --------------------------------------------------------------
    mount(api, routes['admin.ambassadors.list'], ({ auth }) => {
      actorOf(deps, auth);
      return { items: listAmbassadors(db) };
    });
    mount(api, routes['admin.ambassadors.create'], ({ auth, body }) => {
      const actor = actorOf(deps, auth);
      return db.transaction(() => reply(201, { ambassador: createAmbassador(deps, db, body, actor) }));
    });
    // POST /admin/ambassadors/:id/payouts (architecture §8.2, §6.5; route added in the integration wave).
    mount(api, routes['admin.ambassadors.payout'], ({ auth, params, body }) => {
      const actor = actorOf(deps, auth);
      return db.transaction(() => {
        const r = ambassadorPayout(deps, db, params.id, body.month_key, actor);
        const sampleSize = db.get<{ n: number }>('SELECT count(*) AS n FROM fraud_sample_item WHERE sample_id = ?', [r.sampleId])?.n ?? 0;
        const status = r.status === 'sampled' ? ('sample_drawn' as const) : r.status === 'proposed' ? ('pending_four_eyes' as const) : ('recorded' as const);
        return reply(status === 'recorded' ? 200 : 202, { status, sample_size: sampleSize, payable_registrations: r.counted });
      });
    });

    // --- audit log --------------------------------------------------------------------------
    mount(api, routes['admin.audit'], ({ auth, query }) => {
      actorOf(deps, auth);
      const rows = db.all<{ id: string; actor_ref: string; action: string; object_type: string; object_ref: string; reason: string | null; at: string; net_class: 'campus' | 'mobile_cgnat' | 'other' | null }>(
        `SELECT * FROM audit_log WHERE (? IS NULL OR object_type = ?) AND (? IS NULL OR actor_ref = ?) AND (? IS NULL OR id < ?) ORDER BY id DESC LIMIT 101`,
        [query.object ?? null, query.object ?? null, query.actor ?? null, query.actor ?? null, query.cursor ?? null, query.cursor ?? null],
      );
      const page = rows.slice(0, 100);
      return {
        items: page.map((r) => ({ ...r, actor_ref: r.actor_ref.slice(0, 64), object_ref: r.object_ref.slice(0, 64), object_type: r.object_type.slice(0, 64), reason: r.reason ? r.reason.slice(0, 2000) : null })),
        next_cursor: rows.length > 100 ? (page[page.length - 1]?.id ?? null) : null,
      };
    });
  },
};
