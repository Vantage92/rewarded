// reconcileDay (architecture §5.1): computes the desired end state of one user day and returns the
// difference with what is booked as journal entries. It never writes; the caller books the entries
// in the same transaction as the change that caused them.
import { keys } from './rules.ts';
import type {
  AccountRef,
  BookedDay,
  CauseType,
  DaySession,
  GoalState,
  JournalEntryDraft,
  PostingDraft,
  ReconcileDayInput,
  ReconcileDayResult,
  RuleId,
} from './types.ts';

/** Counts for points, goal and streak: completed, not practice, not rejected (spec §4.1, §6.4). */
export function isCounting(s: DaySession): boolean {
  return s.status === 'completed' && !s.isPractice && s.reviewStatus !== 'rejected';
}

/** Points wait in pending_session while any flag is open (architecture §5.1). */
export function isOpen(s: DaySession): boolean {
  return s.openFlagIds.length > 0 || s.reviewStatus === 'pending';
}

export function isFinal(s: DaySession): boolean {
  return isCounting(s) && !isOpen(s);
}

/** Desired counted minutes per session under the daily cap (architecture §5.1, rule 1). */
export function allocateCap(input: Pick<ReconcileDayInput, 'sessions' | 'booked' | 'params' | 'earnArm'>): Map<string, number> {
  const cap = input.params.dailyCapMin;
  const order = [...input.sessions].sort((a, b) => a.serverStartAt - b.serverStartAt || a.sessionId.localeCompare(b.sessionId));
  const out = new Map<string, number>();
  let used = 0;
  // A session keeps what it already has: a later restored session never takes minutes away.
  for (const s of order) {
    const b = input.booked.sessions[s.sessionId];
    const held = b ? b.available + b.pending : 0;
    const kept = isCounting(s) ? Math.max(0, Math.min(held, s.verifiedMin, cap - used)) : 0;
    out.set(s.sessionId, kept);
    used += kept;
  }
  if (input.earnArm === 'rest') return out;
  for (const s of order) {
    if (!isCounting(s)) continue;
    const kept = out.get(s.sessionId) ?? 0;
    const extra = Math.max(0, Math.min(s.verifiedMin - kept, cap - used));
    out.set(s.sessionId, kept + extra);
    used += extra;
  }
  return out;
}

interface DraftCtx {
  input: ReconcileDayInput;
  causeType?: CauseType;
  causeId?: string;
  flagRef: string;
  out: JournalEntryDraft[];
}

function push(ctx: DraftCtx, type: RuleId, key: string, refType: 'session' | 'user_day', refId: string, postings: PostingDraft[], extra: { reasonCode?: string; arm?: boolean } = {}): void {
  if (ctx.input.booked.keys.includes(key) || ctx.out.some((e) => e.idempotencyKey === key)) return;
  const { input } = ctx;
  ctx.out.push({
    type,
    idempotencyKey: key,
    refType,
    refId,
    ...(ctx.causeType !== undefined ? { causeType: ctx.causeType } : {}),
    ...(ctx.causeId !== undefined ? { causeId: ctx.causeId } : {}),
    focusDay: input.day,
    ...(extra.reasonCode !== undefined ? { reasonCode: extra.reasonCode } : {}),
    actor: 'system',
    ...(extra.arm && input.arm !== null ? { arm: input.arm } : {}),
    paramVersion: input.params.paramVersion,
    postings,
  });
}

function causeOf(input: ReconcileDayInput): { causeType?: CauseType; causeId?: string; flagRef: string } {
  const c = input.cause;
  switch (c.type) {
    case 'flag_decision':
      return { causeType: 'flag', causeId: c.flagId, flagRef: c.flagId };
    case 'restore':
      return { causeType: 'restore', causeId: c.sessionId, flagRef: `r${input.rev}` };
    case 'appeal':
      return { causeType: 'appeal', causeId: c.appealId, flagRef: `r${input.rev}` };
    default:
      return { flagRef: `r${input.rev}` };
  }
}

/** Session points: earn, top-up, release and reverse (architecture §5.1, rules 1 and 2). */
function sessionEntries(ctx: DraftCtx, s: DaySession, desired: number, booked: BookedDay): void {
  const b = booked.sessions[s.sessionId] ?? { available: 0, pending: 0 };
  let ba = b.available;
  let bp = b.pending;
  // Points already available stay there while a later flag is open (architecture §4.5).
  const targetAvail = isOpen(s) ? Math.min(ba, desired) : desired;
  const targetPending = desired - targetAvail;
  const sid = s.sessionId;

  const move = Math.min(Math.max(0, bp - targetPending), Math.max(0, targetAvail - ba));
  if (move > 0) {
    push(ctx, 'release_flag', keys.release(ctx.flagRef, sid), 'session', sid, [
      { account: 'user:pending_session', amount: -move },
      { account: 'user:available_own', amount: move },
    ]);
    bp -= move;
    ba += move;
  }
  const fromPending = Math.max(0, bp - targetPending);
  const fromAvail = Math.max(0, ba - targetAvail);
  if (fromPending + fromAvail > 0) {
    const postings: PostingDraft[] = [];
    if (fromPending > 0) postings.push({ account: 'user:pending_session', amount: -fromPending });
    if (fromAvail > 0) postings.push({ account: 'user:available_own', amount: -fromAvail });
    postings.push({ account: 'system:reversed', amount: fromPending + fromAvail });
    push(ctx, 'reverse', keys.reverse(ctx.flagRef, sid), 'session', sid, postings);
    bp -= fromPending;
    ba -= fromAvail;
  }
  const addAvail = Math.max(0, targetAvail - ba);
  const addPending = Math.max(0, targetPending - bp);
  if (addAvail + addPending > 0) {
    const pts = ctx.input.params.pointsPerVerifiedMin;
    const postings: PostingDraft[] = [{ account: 'system:issuance', amount: -(addAvail + addPending) * pts }];
    if (addAvail > 0) postings.push({ account: 'user:available_own', amount: addAvail * pts });
    if (addPending > 0) postings.push({ account: 'user:pending_session', amount: addPending * pts });
    const first = !booked.keys.includes(keys.earn(sid));
    if (first) push(ctx, 'earn_session', keys.earn(sid), 'session', sid, postings);
    else push(ctx, 'earn_topup', keys.earnTopup(sid, ctx.input.rev), 'session', sid, postings);
  }
}

type GoalTarget = 'available' | 'pending' | 'none';
type BudgetTarget = 'secured' | 'postponed' | 'lapsed' | 'exam' | 'pending';

/** reconcileDay (architecture §5.1). Pure and idempotent: booked = result of the entries → no entries. */
export function reconcileDay(input: ReconcileDayInput): ReconcileDayResult {
  const { booked, params, day, userId, rev } = input;
  const cause = causeOf(input);
  const ctx: DraftCtx = { input, ...cause, out: [] };
  const desired = allocateCap(input);

  for (const s of input.sessions) sessionEntries(ctx, s, desired.get(s.sessionId) ?? 0, booked);

  const counting = input.sessions.filter(isCounting);
  const final = counting.filter((s) => !isOpen(s));
  const sum = (xs: readonly DaySession[]) => xs.reduce((t, s) => t + s.verifiedMin, 0);
  const verifiedAll = sum(counting);
  const goalMin = input.goalMin;
  const goalMet = goalMin > 0 && verifiedAll >= goalMin;
  const goalMetFinal = goalMin > 0 && sum(final) >= goalMin;
  // Night rule: only sessions started outside 01:00–04:00 earn the goal bonus (spec §4.2).
  const nonLateAll = sum(counting.filter((s) => !s.lateStart));
  const nonLateFinal = sum(final.filter((s) => !s.lateStart));
  const bonusApplies = input.inSeason && input.arm !== null;
  const goalBonusEligible = bonusApplies && goalMin > 0 && nonLateAll >= goalMin;
  const closed = input.dayClosed ?? input.cause.type === 'day_close';
  const bonus = params.goalBonusPoints;
  const g = booked.goal;
  let goalState: GoalState = 'none';

  if (bonusApplies && input.arm === 'A') {
    let target: GoalTarget = nonLateFinal >= goalMin ? 'available' : goalBonusEligible ? 'pending' : 'none';
    if (target === 'pending' && g.available > 0) target = 'available';
    const total = g.available + g.pending;
    if (target !== 'none' && total === 0) {
      const key = booked.keys.includes(keys.goalBonus(userId, day)) ? keys.goalBonus(userId, day, rev) : keys.goalBonus(userId, day);
      const account: AccountRef = target === 'available' ? 'user:available_own' : 'user:pending_session';
      push(ctx, 'goal_bonus', key, 'user_day', day, [{ account: 'system:issuance', amount: -bonus }, { account, amount: bonus }], { arm: true });
    } else if (target === 'available' && g.pending > 0) {
      push(ctx, 'goal_bonus_release', keys.goalBonusRelease(userId, day, rev), 'user_day', day, [
        { account: 'user:pending_session', amount: -g.pending },
        { account: 'user:available_own', amount: g.pending },
      ], { arm: true });
    } else if (target === 'none' && total !== 0) {
      const postings: PostingDraft[] = [];
      if (g.available !== 0) postings.push({ account: 'user:available_own', amount: -g.available });
      if (g.pending !== 0) postings.push({ account: 'user:pending_session', amount: -g.pending });
      postings.push({ account: 'system:reversed', amount: total });
      push(ctx, 'goal_bonus_reverse', keys.goalBonusReverse(userId, day, rev), 'user_day', day, postings, { arm: true });
    }
    goalState = target;
  } else if (bonusApplies && input.arm === 'B') {
    const target: BudgetTarget =
      nonLateFinal >= goalMin ? 'secured' : goalBonusEligible ? 'postponed' : closed ? (input.examDay ? 'exam' : 'lapsed') : 'pending';
    if (target === 'secured' && g.available < bonus) {
      if (g.lapsed > 0) {
        push(ctx, 'goal_lapse_reverse', keys.goalLapseReverse(userId, day, rev), 'user_day', day, transfer2('system:lapsed', 'user:available_own', bonus), { arm: true });
      } else {
        const key = booked.keys.includes(keys.goalSecure(userId, day)) ? keys.goalSecure(userId, day, rev) : keys.goalSecure(userId, day);
        push(ctx, 'goal_budget_secure', key, 'user_day', day, transfer2('user:pending_goal_budget', 'user:available_own', bonus), { arm: true });
      }
    } else if (target === 'lapsed' || target === 'exam') {
      if (g.available > 0) {
        push(ctx, 'goal_secure_reverse', keys.goalSecureReverse(userId, day, rev), 'user_day', day, transfer2('user:available_own', 'system:reversed', g.available), { arm: true });
      } else if (g.lapsed <= 0) {
        const key = booked.keys.includes(keys.goalLapse(userId, day)) ? keys.goalLapse(userId, day, rev) : keys.goalLapse(userId, day);
        push(ctx, 'goal_budget_lapse', key, 'user_day', day, transfer2('user:pending_goal_budget', 'system:lapsed', bonus), {
          arm: true,
          ...(target === 'exam' ? { reasonCode: 'exam_day' } : {}),
        });
      }
    }
    goalState = target;
  }
  if (input.examDay && !goalMet) goalState = 'exam';

  let countedMin = 0;
  let countedMinFinal = 0;
  for (const s of counting) {
    const d = desired.get(s.sessionId) ?? 0;
    countedMin += d;
    if (!isOpen(s)) countedMinFinal += d;
  }

  return {
    userDay: {
      userId,
      focusDay: day,
      verifiedMin: verifiedAll,
      countedMin,
      countedMinFinal,
      goalMin,
      goalMet,
      goalMetFinal,
      goalBonusEligible,
      examDay: input.examDay,
      goalState,
      jokerUsed: false,
      vacation: false,
    },
    entries: ctx.out,
  };
}

function transfer2(from: AccountRef, to: AccountRef, amount: number): PostingDraft[] {
  return [
    { account: from, amount: -amount },
    { account: to, amount },
  ];
}
