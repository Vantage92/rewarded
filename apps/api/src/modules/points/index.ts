// Points module (architecture §5, §8.2): balance in three parts, ledger history, daily goal with the
// overreach brake, exam days and /me/today. Owner WP-4. Bookings happen in sessions, redemptions and
// the day close; this module only reads the journal and stores the goal settings.
import { CURRENT_PARAMS, addDays, compareDays, daysBetween, focusDayOf, weekKey, weekStartAt } from '@rewarded/core';
import { examDayAllowed, goalEffectiveFrom, goalSuggestion, needsOverreachConfirm } from '@rewarded/core/goals';
import { DomainError, routes, type LedgerItem, type TodayResponse } from '@rewarded/contracts';
import type { Db } from '../../db/types.ts';
import type { AuthState } from '../../middleware/context.ts';
import { mount } from '../../middleware/route.ts';
import type { ApiModule, ModuleDeps } from '../../module.ts';
import type { UserDay } from '../../services/userDay.ts';
import { earnInMinutes } from './ledger.ts';
import { installWp4Services } from './services.ts';
import { registerRestExit } from './restarm.ts';

const P = CURRENT_PARAMS;
const WEEK_START = P.time.week_start_iso_weekday;
type GoalMin = 25 | 50 | 90 | 120;

function userOf(auth: AuthState): { id: string; pseudonym: string } {
  if (auth.kind !== 'user') throw new DomainError('AUTH_REQUIRED');
  return { id: auth.user.id, pseudonym: auth.user.pseudonym };
}

const asGoal = (m: number): GoalMin => (([25, 50, 90, 120] as const).find((g) => g === m) ?? 25);

/** Status of one posting line on a user account (contracts LedgerLineStatus). */
function lineStatus(kind: string, amount: number, counterSystem: string | null): LedgerItem['status'] {
  if (amount < 0 && counterSystem) {
    if (counterSystem === 'redeemed') return 'redeemed';
    if (counterSystem === 'lapsed') return 'lapsed';
    if (counterSystem === 'expired') return 'expired';
    return 'reversed';
  }
  if (kind === 'pending_session' || kind === 'pending_goal_budget') return 'pending';
  if (kind === 'referral_unvested') return 'unvested';
  return 'available';
}

/** Exam days of the calendar week of `day` (user_day.exam_day, spec §3.13). */
function examDaysOfWeek(db: Db, userId: string, day: string): string[] {
  const week = weekKey(day, WEEK_START);
  return db
    .all<{ focus_day: string }>('SELECT focus_day FROM user_day WHERE user_id = ? AND exam_day = 1 AND focus_day >= ? AND focus_day <= ? ORDER BY focus_day', [userId, week, addDays(week, 6)])
    .map((r) => r.focus_day);
}

/** Active redemption in the week of `day` (one per week, spec §4.2 Weekplafond). */
export function hasRedemptionInWeek(db: Db, userId: string, week: string): boolean {
  try {
    return db.get("SELECT 1 AS x FROM redemption WHERE user_id = ? AND week_key = ? AND status IN ('reserved', 'delivered', 'replaced')", [userId, week]) !== undefined;
  } catch {
    return false;
  }
}

export const module: ApiModule = {
  name: 'points',
  owner: 'WP-4',
  register(api, deps: ModuleDeps) {
    installWp4Services(deps);
    registerRestExit(api, deps);
    const { db } = deps;
    const ctx = deps.services.pointsContext;
    const now = () => deps.platform.clock.now().getTime();
    const today = () => focusDayOf(now(), P);

    /** Writes one user_day flag (exam day) through the repository, creating the row at rev 1. */
    const putExamDay = (userId: string, day: string, exam: boolean): void => {
      const repo = deps.services.userDays;
      const p = ctx.profile(db, userId);
      const row: UserDay = repo.get(userId, day) ?? {
        userId,
        focusDay: day,
        rev: 1,
        verifiedMin: 0,
        countedMin: 0,
        countedMinFinal: 0,
        goalMin: p ? ctx.goalFor(db, p, day) : P.goals.default_min,
        goalMet: false,
        goalMetFinal: false,
        goalBonusEligible: false,
        examDay: false,
        goalState: 'none',
        jokerUsed: false,
        vacation: ctx.isVacation(db, day),
        closedAt: null,
      };
      repo.put(db, { ...row, examDay: exam });
    };

    mount(api, routes['points.balance'], ({ auth }) => {
      const user = userOf(auth);
      const b = deps.services.ledger.balances(user.id);
      const p = ctx.profile(db, user.id);
      const t = today();
      const week = weekKey(t, WEEK_START);
      const holdUntil = p?.firstRedeemAfter && Date.parse(p.firstRedeemAfter) > now() ? p.firstRedeemAfter : undefined;
      const nextWeek = hasRedemptionInWeek(db, user.id, week) ? new Date(weekStartAt(addDays(week, 7), P)).toISOString() : undefined;
      return {
        available: b.available,
        pending: b.pending,
        referral_unvested: b.referralUnvested,
        earn_in_min: Math.min(P.points.earn_in_min, earnInMinutes(db, user.id)),
        earn_in_required: 300 as const,
        ...(holdUntil ? { first_redeem_after: new Date(Date.parse(holdUntil)).toISOString() } : {}),
        ...(nextWeek ? { next_redeem_from: nextWeek } : {}),
      };
    });

    mount(api, routes['points.ledger'], ({ auth, query }) => {
      const user = userOf(auth);
      const limit = query.limit ?? 50;
      const set = db.get<{ account_set: string }>(
        'SELECT a.account_set FROM ledger_account_owner o JOIN ledger_account a ON a.id = o.account_id WHERE o.user_id = ? LIMIT 1',
        [user.id],
      )?.account_set;
      if (!set) return { items: [], next_cursor: null };
      const entries = db.all<{ id: string; type: LedgerItem['type']; idempotency_key: string; ref_type: string; ref_id: string; created_at: number }>(
        'SELECT id, type, idempotency_key, ref_type, ref_id, created_at FROM journal_entry WHERE account_set = ? AND id < ? ORDER BY id DESC LIMIT ?',
        [set, query.cursor ?? '~', limit + 1],
      );
      const page = entries.slice(0, limit);
      const items: LedgerItem[] = [];
      for (const e of page) {
        const lines = db.all<{ amount: number; owner_type: string; kind: string }>(
          'SELECT p.amount, a.owner_type, a.kind FROM posting p JOIN ledger_account a ON a.id = p.account_id WHERE p.entry_id = ? ORDER BY p.id',
          [e.id],
        );
        const system = lines.find((l) => l.owner_type === 'system')?.kind ?? null;
        for (const l of lines) {
          if (l.owner_type !== 'user') continue;
          // A transfer between two user accounts shows only its destination line.
          if (l.amount < 0 && !system) continue;
          items.push({
            type: e.type,
            amount: l.amount,
            status: lineStatus(l.kind, l.amount, system),
            ref: `${e.ref_type}:${e.ref_id}`.slice(0, 64),
            rule_key: e.idempotency_key.slice(0, 64),
            created_at: new Date(e.created_at).toISOString(),
          });
        }
      }
      return { items, next_cursor: entries.length > limit ? (page[page.length - 1]?.id ?? null) : null };
    });

    mount(api, routes['me.dailyGoal'], ({ auth, body }) => {
      const user = userOf(auth);
      const p = ctx.profile(db, user.id);
      if (!p) throw new DomainError('NOT_FOUND');
      const t = today();
      const since = daysBetween(focusDayOf(Date.parse(p.createdAt), P), t);
      const overreach = needsOverreachConfirm(P, body.minutes, since);
      if (overreach && body.confirm_overreach !== true) throw new DomainError('OVERREACH_CONFIRM_REQUIRED');
      const from = goalEffectiveFrom(t);
      return db.transaction(() => {
        // A pending change that is already in effect becomes the current goal first.
        const current = ctx.goalFor(db, p, t);
        db.run('UPDATE user SET daily_goal_min = ?, daily_goal_next = ?, daily_goal_next_from = ? WHERE id = ?', [current, body.minutes, from, user.id]);
        const bron = body.from_suggestion ? ('voorstel' as const) : ('zelf' as const);
        deps.services.events.event(db, 'daily_goal_set', { minuten: body.minutes, bron, overmoed_bevestigd: overreach }, { pseudonym: user.pseudonym });
        if (body.from_suggestion) deps.services.events.event(db, 'goal_suggestion_accepted', { voorgesteld: body.minutes, huidig: asGoal(current) }, { pseudonym: user.pseudonym });
        return { goal_min: body.minutes, effective_from_day: from };
      });
    });

    const examGuard = (userId: string, day: string): void => {
      const t = today();
      if (compareDays(day, t) < 0 || deps.services.userDays.get(userId, day)?.closedAt != null) throw new DomainError('PERIOD_LOCKED');
    };

    mount(api, routes['me.examDays.put'], ({ auth, params }) => {
      const user = userOf(auth);
      examGuard(user.id, params.day);
      return db.transaction(() => {
        const existing = examDaysOfWeek(db, user.id, params.day);
        const verdict = examDayAllowed(P, today(), params.day, existing);
        if (verdict !== 'ok') throw new DomainError(verdict);
        if (!existing.includes(params.day)) {
          putExamDay(user.id, params.day, true);
          deps.services.events.event(db, 'exam_day_set', { datum: params.day }, { pseudonym: user.pseudonym });
        }
        return { exam_days_this_week: examDaysOfWeek(db, user.id, params.day) };
      });
    });

    mount(api, routes['me.examDays.delete'], ({ auth, params }) => {
      const user = userOf(auth);
      examGuard(user.id, params.day);
      return db.transaction(() => {
        if (deps.services.userDays.get(user.id, params.day)?.examDay) putExamDay(user.id, params.day, false);
        return { exam_days_this_week: examDaysOfWeek(db, user.id, params.day) };
      });
    });

    mount(api, routes['me.today'], ({ auth }) => {
      const user = userOf(auth);
      const p = ctx.profile(db, user.id);
      if (!p) throw new DomainError('NOT_FOUND');
      const t = today();
      const week = weekKey(t, WEEK_START);
      const dc = ctx.day(db, user.id, t);
      const row = deps.services.userDays.get(user.id, t);
      const weekRows = deps.services.userDays.range([user.id], week, addDays(week, 6));
      const res: TodayResponse = {
        focus_day: t,
        counted_min: row?.countedMin ?? 0,
        goal_min: asGoal(dc.goalMin),
        goal_met: row?.goalMet ?? false,
        goal_days_this_week: weekRows.filter((r) => r.goalMet).length,
        exam_day: dc.examDay,
        joker_available: !weekRows.some((r) => r.jokerUsed),
        bonus_rule: dc.arm ?? 'none',
        earn_arm: dc.earnArm,
        // The squad streak, prompt, harm card and survey come from WP-5 and WP-6.
        streak: null,
      };
      // Goal suggestion after 7 days (spec §4.4): the median of the active days of the last week.
      const since = daysBetween(focusDayOf(Date.parse(p.createdAt), P), t);
      if (since >= P.goals.confirm_window_days) {
        const last = deps.services.userDays.range([user.id], addDays(t, -7), addDays(t, -1)).map((r) => r.verifiedMin);
        const s = goalSuggestion(P, last);
        if (s !== null && s !== res.goal_min) res.goal_suggestion = { suggested_min: s };
      }
      if (dc.earnArm === 'rest') res.rest_notice = { arm_rest: 'rest' };
      return res;
    });
  },
};
