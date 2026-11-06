// Weekly harm evaluation in the week close (architecture §6.1; spec §6.6; voorregistratie §8.3):
// signals per code and arm, the stop-rule count for arm B, the guard rule of the rest arm (flag
// `rest_period` off when exceeded; protective, so without four eyes) and the absolute threshold.
// The stop rule itself is only counted and reported: stopping arm B is a founder decision through
// POST /admin/experiments/arm-b/stop with four eyes.
import { allCalendarDates } from '../../../db/calendar.ts';
import { CURRENT_PARAMS, addDays, type FocusDay } from '@rewarded/core';
import { absoluteHarm, guardRuleRestArm, harmRules, stopRuleArmB, HARM_CODES, type ArmCount, type HarmCode, type StopRuleResult } from '@rewarded/core/fraud';
import { isFeatureEnabled, setFeatureFlag } from '../../../db/flags.ts';
import type { Db } from '../../../db/types.ts';
import type { ModuleDeps } from '../../../module.ts';
import { armsOfUser } from './batch.ts';
import { hasTables } from './util.ts';

export interface HarmWeekResult {
  week: FocusDay;
  actives: number;
  withSignal: number;
  perCode: Record<HarmCode, number>;
  perArm: Record<string, ArmCount & { perCode: Record<HarmCode, number> }>;
  absoluteExceeded: boolean;
  stopRule: StopRuleResult;
  guard: { inWindow: boolean; exceeded: boolean; flagTurnedOff: boolean };
}

const zeroCodes = (): Record<HarmCode, number> => ({ S1: 0, S2: 0, S3: 0, S4: 0 });

/** Whether `week` overlaps T + 1 … A-end of any calendar, the default calendar included (spec §4.13). */
function guardWindow(db: Db, week: FocusDay): boolean {
  const end = addDays(week, 6);
  return allCalendarDates(db, CURRENT_PARAMS).some((d) => d.restPeriod.first_day <= end && week <= d.restPeriod.last_day);
}

export function evaluateHarmWeek(deps: ModuleDeps, week: FocusDay): HarmWeekResult | null {
  const { db } = deps;
  if (!hasTables(db, 'harm_signal', 'harm_week', 'focus_session')) return null;
  const R = harmRules(CURRENT_PARAMS);
  const actives = db
    .all<{ id: string }>(
      `SELECT DISTINCT s.user_id AS id FROM focus_session s JOIN user u ON u.id = s.user_id
        WHERE s.status = 'completed' AND s.is_practice = 0 AND s.review_status <> 'rejected' AND s.focus_day >= ? AND s.focus_day <= ? AND u.is_team = 0`,
      [week, addDays(week, 6)],
    )
    .map((r) => r.id);
  const signals = db.all<{ user_id: string; code: HarmCode }>('SELECT user_id, code FROM harm_signal WHERE week_key = ? AND user_id IS NOT NULL', [week]);
  const activeSet = new Set(actives);
  const byUser = new Map<string, Set<HarmCode>>();
  for (const s of signals) if (activeSet.has(s.user_id)) (byUser.get(s.user_id) ?? byUser.set(s.user_id, new Set()).get(s.user_id)!).add(s.code);
  const perCode = zeroCodes();
  for (const codes of byUser.values()) for (const c of codes) perCode[c] += 1;
  const perArm: HarmWeekResult['perArm'] = {};
  const bump = (arm: string, uid: string) => {
    const a = (perArm[arm] ??= { actives: 0, withSignal: 0, perCode: zeroCodes() });
    a.actives += 1;
    const codes = byUser.get(uid);
    if (codes) {
      a.withSignal += 1;
      for (const c of codes) a.perCode[c] += 1;
    }
  };
  for (const uid of actives) {
    const arms = armsOfUser(db, uid);
    if (arms.arm_bonus) bump(`bonus_${arms.arm_bonus}`, uid);
    if (arms.arm_rest) bump(`rest_${arms.arm_rest}`, uid);
  }
  const abs = absoluteHarm(actives.length, byUser.size, perCode, R);
  const zero: ArmCount = { actives: 0, withSignal: 0 };
  const stopRule = stopRuleArmB({ harm: { A: perArm.bonus_A ?? zero, B: perArm.bonus_B ?? zero } }, R);
  const inWindow = guardWindow(db, week);
  const exceeded = inWindow && guardRuleRestArm(perArm.rest_rest ?? zero, perArm.rest_continue ?? zero, R);
  let flagTurnedOff = false;
  const now = deps.platform.clock.now();
  db.transaction(() => {
    if (exceeded && isFeatureEnabled(db, 'rest_period')) {
      setFeatureFlag(db, 'rest_period', false, 'system', now);
      deps.services.audit.audit(db, { actor: 'system', action: 'rest_period_flag_off', objectType: 'feature_flag', objectRef: 'rest_period', reason: 'guard_rule' });
      deps.platform.logger?.log('warn', 'rest_period_flag_off', { error_code: 'GUARD_RULE' });
      flagTurnedOff = true;
    }
    if (stopRule.triggered) deps.services.audit.audit(db, { actor: 'system', action: 'stop_rule_triggered', objectType: 'experiment', objectRef: 'arm_b', reason: week });
    if (abs.exceeded) deps.services.audit.audit(db, { actor: 'system', action: 'harm_threshold_exceeded', objectType: 'harm_week', objectRef: week, reason: abs.sharePct.toFixed(2) });
    db.run(
      `INSERT INTO harm_week (week_key, actives, with_signal, per_code, per_arm, absolute_exceeded, stop_rule, guard_rule, computed_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT (week_key) DO UPDATE SET actives = excluded.actives, with_signal = excluded.with_signal, per_code = excluded.per_code, per_arm = excluded.per_arm,
         absolute_exceeded = excluded.absolute_exceeded, stop_rule = excluded.stop_rule, guard_rule = excluded.guard_rule, computed_at = excluded.computed_at`,
      [week, actives.length, byUser.size, JSON.stringify(perCode), JSON.stringify(perArm), abs.exceeded ? 1 : 0, JSON.stringify(stopRule), JSON.stringify({ inWindow, exceeded, flagTurnedOff }), now.toISOString()],
    );
  });
  return { week, actives: actives.length, withSignal: byUser.size, perCode, perArm, absoluteExceeded: abs.exceeded, stopRule, guard: { inWindow, exceeded, flagTurnedOff } };
}

export { HARM_CODES };
