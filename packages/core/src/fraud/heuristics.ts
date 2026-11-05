// Heuristics H1–H12 as pure functions (spec §6.3; architecture §4.5). They only produce findings;
// the API turns a finding into a fraud_flag and a human decides (spec §6.4, architecture §10.8).
// Shared nets (campus, mobile CGNAT) are never skipped: they count with a higher threshold. While
// that threshold is null (until the red-team day) a shared-net group is reported as `skipped`
// instead of flagged, so the gap stays visible (fraudReleaseBlockers).
import { addDays, dayRange, isoWeekday, weekKey, type FocusDay, type WeekKey } from '../time/days.ts';
import { focusDayOf } from '../time/focus.ts';
import { fromLocal, MS_PER_HOUR, MS_PER_MINUTE, parseLocalTime, toLocalParts, type Instant } from '../time/zone.ts';
import type { Params } from '../params/index.ts';
import type { NetClassName as NetClass } from '../params/index.ts';
import { isSharedNet, type FraudRules } from './rules.ts';

export type HeuristicCode = 'H1' | 'H2' | 'H3' | 'H4' | 'H5' | 'H6' | 'H7' | 'H8' | 'H9' | 'H10' | 'H11' | 'H12';
export type SubjectType = 'session' | 'account' | 'squad' | 'club';

/** The session columns the heuristics read (architecture §3.2 focus_session). */
export interface SessionFact {
  sessionId: string;
  userId: string;
  status: 'active' | 'completed' | 'aborted';
  isPractice: boolean;
  startAt: Instant;
  /** server_end_at; null while active. */
  endAt: Instant | null;
  focusDay: FocusDay;
  plannedMin: number;
  verifiedMin: number;
  ipHash: string | null;
  netClass: NetClass | null;
  uaClass: string;
  webdriver: boolean;
  coveredGapS: number;
  clockSkewMs: number | null;
  claimDelayS: number | null;
  lateStart: boolean;
}

export interface Finding {
  code: HeuristicCode;
  subject: { type: SubjectType; id?: string };
  /** Completed sessions the flag touches (one fraud_flag_session row each). */
  sessionIds: string[];
  /** Accounts involved; stored as links, never inside the evidence text. */
  userIds: string[];
  /** Codes, counts and thresholds; no raw IP, phone or e-mail (architecture §10.4). */
  evidence: Record<string, unknown>;
  /** One flag per key: batch runs are idempotent (architecture §6.1). */
  dedupKey: string;
}

export interface Skipped {
  code: HeuristicCode;
  reason: 'shared_threshold_missing';
  key: string;
  netClass: NetClass;
  count: number;
}

export interface HeuristicResult {
  findings: Finding[];
  skipped: Skipped[];
}

const empty = (): HeuristicResult => ({ findings: [], skipped: [] });
const uniq = <T>(xs: Iterable<T>): T[] => [...new Set(xs)];
const sortStr = (xs: Iterable<string>): string[] => [...xs].sort();
const shortHash = (h: string): string => h.slice(0, 12);

/** Threshold for a net class: the base for `other`, the shared threshold (maybe null) for shared nets. */
export function thresholdFor(netClass: NetClass | null | undefined, base: number, shared: number | null): number | null {
  return isSharedNet(netClass) ? shared : base;
}

// ---------------------------------------------------------------------------------------------
// Per-session heuristics (run at the verdict by WP-4; kept here so the thresholds have one source).

/** H1: navigator.webdriver is true or the user agent names a headless browser. */
export function h1(s: Pick<SessionFact, 'webdriver' | 'uaClass'>, rules: FraudRules): boolean {
  return s.webdriver || rules.h1HeadlessUaClasses.includes(s.uaClass);
}

/** H3: covered heartbeat gaps above 10% of the planned duration. */
export function h3(s: Pick<SessionFact, 'coveredGapS' | 'plannedMin'>, rules: FraudRules): boolean {
  return s.coveredGapS > (rules.h3CoveredGapPct / 100) * s.plannedMin * 60;
}

/** H4: client/server clock skew of more than 5 minutes. */
export function h4(s: Pick<SessionFact, 'clockSkewMs'>, rules: FraudRules): boolean {
  return s.clockSkewMs !== null && Math.abs(s.clockSkewMs) > rules.h4ClockSkewS * 1000;
}

/** H8: a phone hash that was on a blocked account. */
export function h8(phoneHash: string, blocked: ReadonlySet<string>): boolean {
  return blocked.has(phoneHash);
}

/** H11: more than one account redeeming from the same client_device_id in one week. */
export function h11(accountsOnDeviceThisWeek: number, rules: FraudRules): boolean {
  return accountsOnDeviceThisWeek > rules.h11AccountsPerDeviceWeek;
}

const counted = (s: SessionFact): boolean => s.status === 'completed' && !s.isPractice;

// ---------------------------------------------------------------------------------------------
// H2: more than 3 accounts with completed sessions from one IP hash within 24 hours.

/**
 * Windows start at a completed session whose focus day is in `anchorDays` and run 24 hours.
 * One finding per IP hash and anchor day: the window with the most accounts.
 */
export function h2(sessions: readonly SessionFact[], anchorDays: readonly FocusDay[], rules: FraudRules): HeuristicResult {
  const out = empty();
  const anchors = new Set(anchorDays);
  const byIp = new Map<string, SessionFact[]>();
  for (const s of sessions) if (counted(s) && s.ipHash) (byIp.get(s.ipHash) ?? byIp.set(s.ipHash, []).get(s.ipHash)!).push(s);
  for (const [ip, list] of [...byIp].sort(([a], [b]) => a.localeCompare(b))) {
    list.sort((a, b) => a.startAt - b.startAt || a.sessionId.localeCompare(b.sessionId));
    const netClass = list.find((s) => s.netClass)?.netClass ?? 'other';
    const limit = thresholdFor(netClass, rules.h2AccountsPerIp24h, rules.h2SharedThreshold);
    const best = new Map<FocusDay, { users: Set<string>; window: SessionFact[]; from: Instant }>();
    for (let i = 0; i < list.length; i++) {
      const a = list[i] as SessionFact;
      if (!anchors.has(a.focusDay)) continue;
      const window = list.filter((s) => s.startAt >= a.startAt && s.startAt < a.startAt + 24 * MS_PER_HOUR);
      const users = new Set(window.map((s) => s.userId));
      const cur = best.get(a.focusDay);
      if (!cur || users.size > cur.users.size) best.set(a.focusDay, { users, window, from: a.startAt });
    }
    for (const [day, b] of [...best].sort(([x], [y]) => x.localeCompare(y))) {
      if (limit === null) {
        if (b.users.size > rules.h2AccountsPerIp24h) out.skipped.push({ code: 'H2', reason: 'shared_threshold_missing', key: `${shortHash(ip)}:${day}`, netClass, count: b.users.size });
        continue;
      }
      if (b.users.size <= limit) continue;
      out.findings.push({
        code: 'H2',
        subject: { type: 'session' },
        sessionIds: b.window.map((s) => s.sessionId),
        userIds: sortStr(b.users),
        evidence: { accounts: b.users.size, threshold: limit, net_class: netClass, window_from: b.from, window_h: 24 },
        dedupKey: `H2:${ip}:${day}`,
      });
    }
  }
  return out;
}

// ---------------------------------------------------------------------------------------------
// H5: more than 480 verified minutes a day, three days in a row.

export interface UserDayFact {
  userId: string;
  focusDay: FocusDay;
  verifiedMin: number;
}

/** Flags the sessions of `day` when `day` closes a run of h5ConsecutiveDays days above the limit. */
export function h5(days: readonly UserDayFact[], sessions: readonly SessionFact[], day: FocusDay, rules: FraudRules): HeuristicResult {
  const out = empty();
  const byUser = new Map<string, Map<FocusDay, number>>();
  for (const d of days) (byUser.get(d.userId) ?? byUser.set(d.userId, new Map()).get(d.userId)!).set(d.focusDay, d.verifiedMin);
  for (const [userId, m] of [...byUser].sort(([a], [b]) => a.localeCompare(b))) {
    const run = dayRange(addDays(day, -(rules.h5ConsecutiveDays - 1)), day);
    if (!run.every((d) => (m.get(d) ?? 0) > rules.h5DailyMin)) continue;
    const ids = sessions.filter((s) => s.userId === userId && s.focusDay === day && counted(s)).map((s) => s.sessionId);
    out.findings.push({
      code: 'H5',
      subject: { type: 'account', id: userId },
      sessionIds: ids,
      userIds: [userId],
      evidence: { days: run.length, minutes: run.map((d) => m.get(d) ?? 0), threshold: rules.h5DailyMin },
      dedupKey: `H5:${userId}:${day}`,
    });
  }
  return out;
}

// ---------------------------------------------------------------------------------------------
// H6: sessions without a break between 01:00 and 06:00 on more than 2 nights a week.

/** Local night windows [date 01:00, date 06:00) that touch the given focus days. */
function nightWindows(fromDay: FocusDay, toDay: FocusDay, w: { from: string; to: string }): { start: Instant; end: Instant; label: FocusDay }[] {
  const out: { start: Instant; end: Instant; label: FocusDay }[] = [];
  const f = parseLocalTime(w.from);
  const t = parseLocalTime(w.to);
  // A night window lies on the calendar date after focus day D (01:00–06:00 of D + 1).
  for (const d of dayRange(fromDay, addDays(toDay, 1))) {
    const [y, mo, da] = d.split('-').map(Number) as [number, number, number];
    out.push({ start: fromLocal(y, mo, da, Math.floor(f / 60), f % 60), end: fromLocal(y, mo, da, Math.floor(t / 60), t % 60), label: d });
  }
  return out;
}

/** True when completed sessions cover [start, end) with no break longer than `maxBreakMs`. */
export function coversWithoutBreak(intervals: readonly { start: Instant; end: Instant }[], start: Instant, end: Instant, maxBreakMs: number): boolean {
  const xs = intervals.filter((i) => i.end > start && i.start < end).sort((a, b) => a.start - b.start);
  let cursor = start;
  for (const i of xs) {
    if (i.start > cursor + maxBreakMs) return false;
    cursor = Math.max(cursor, i.end);
    if (cursor >= end) return true;
  }
  return cursor + maxBreakMs >= end;
}

export function h6(sessions: readonly SessionFact[], week: WeekKey, params: Params, rules: FraudRules): HeuristicResult {
  const out = empty();
  const weekEnd = addDays(week, 6);
  const byUser = new Map<string, SessionFact[]>();
  for (const s of sessions) if (counted(s) && s.endAt !== null) (byUser.get(s.userId) ?? byUser.set(s.userId, []).get(s.userId)!).push(s);
  const maxBreak = rules.h6MaxBreakMin * MS_PER_MINUTE;
  for (const [userId, list] of [...byUser].sort(([a], [b]) => a.localeCompare(b))) {
    const intervals = list.map((s) => ({ start: s.startAt, end: s.endAt as Instant, id: s.sessionId }));
    const nights = nightWindows(addDays(week, -1), weekEnd, rules.h6Window).filter(
      (n) => weekKey(focusDayOf(n.start, params), params.time.week_start_iso_weekday) === week && coversWithoutBreak(intervals, n.start, n.end, maxBreak),
    );
    if (nights.length <= rules.h6NightsPerWeek) continue;
    const ids = intervals.filter((i) => nights.some((n) => i.end > n.start && i.start < n.end)).map((i) => i.id);
    out.findings.push({
      code: 'H6',
      subject: { type: 'account', id: userId },
      sessionIds: uniq(ids),
      userIds: [userId],
      evidence: { nights: nights.length, threshold: rules.h6NightsPerWeek, week },
      dedupKey: `H6:${userId}:${week}`,
    });
  }
  return out;
}

// ---------------------------------------------------------------------------------------------
// H7: a squad whose members all registered within 10 minutes from the same IP hash.

export interface SquadFact {
  squadId: string;
  members: readonly { userId: string; registeredAt: Instant; ipHash: string | null; netClass: NetClass | null }[];
}

/**
 * Runs when a squad becomes active (3 members) and daily. For `other` any active squad counts; for
 * shared nets at least h7SharedThreshold members must have registered together.
 */
export function h7(squads: readonly SquadFact[], sessions: readonly SessionFact[], rules: FraudRules): HeuristicResult {
  const out = empty();
  for (const sq of [...squads].sort((a, b) => a.squadId.localeCompare(b.squadId))) {
    const m = sq.members;
    if (m.length < 3) continue;
    const ip = m[0]?.ipHash;
    if (!ip || !m.every((x) => x.ipHash === ip)) continue;
    const times = m.map((x) => x.registeredAt);
    const spreadMs = Math.max(...times) - Math.min(...times);
    if (spreadMs > rules.h7WindowMin * MS_PER_MINUTE) continue;
    const netClass = m.find((x) => x.netClass)?.netClass ?? 'other';
    if (isSharedNet(netClass)) {
      if (rules.h7SharedThreshold === null) {
        out.skipped.push({ code: 'H7', reason: 'shared_threshold_missing', key: sq.squadId, netClass, count: m.length });
        continue;
      }
      if (m.length < rules.h7SharedThreshold) continue;
    }
    const users = new Set(m.map((x) => x.userId));
    const minReg = Math.min(...times);
    out.findings.push({
      code: 'H7',
      subject: { type: 'squad', id: sq.squadId },
      sessionIds: sessions.filter((s) => users.has(s.userId) && counted(s) && s.startAt >= minReg).map((s) => s.sessionId),
      userIds: sortStr(users),
      evidence: { members: m.length, spread_min: Math.round(spreadMs / MS_PER_MINUTE), window_min: rules.h7WindowMin, net_class: netClass },
      dedupKey: `H7:${sq.squadId}`,
    });
  }
  return out;
}

// ---------------------------------------------------------------------------------------------
// H9: more than 80% of the completed sessions of a week with a claim delay above 15 minutes.

export function h9(sessions: readonly SessionFact[], week: WeekKey, rules: FraudRules): HeuristicResult {
  const out = empty();
  const byUser = new Map<string, SessionFact[]>();
  for (const s of sessions) if (counted(s)) (byUser.get(s.userId) ?? byUser.set(s.userId, []).get(s.userId)!).push(s);
  for (const [userId, list] of [...byUser].sort(([a], [b]) => a.localeCompare(b))) {
    const late = list.filter((s) => (s.claimDelayS ?? 0) > rules.h9ClaimDelayMin * 60);
    if (late.length * 100 <= rules.h9SharePct * list.length) continue;
    out.findings.push({
      code: 'H9',
      subject: { type: 'account', id: userId },
      sessionIds: list.map((s) => s.sessionId),
      userIds: [userId],
      evidence: { sessions: list.length, delayed: late.length, share_pct: Math.round((late.length * 100) / list.length), threshold_pct: rules.h9SharePct, week },
      dedupKey: `H9:${userId}:${week}`,
    });
  }
  return out;
}

// ---------------------------------------------------------------------------------------------
// H10: more than 20 new linked members of one club in 48 hours, more than half on ≤ 3 IP hashes.

export interface ClubLinkFact {
  clubId: string;
  userId: string;
  linkedAt: Instant;
  ipHash: string | null;
  netClass: NetClass | null;
}

export function h10(links: readonly ClubLinkFact[], sessions: readonly SessionFact[], now: Instant, week: WeekKey, rules: FraudRules): HeuristicResult {
  const out = empty();
  const from = now - rules.h10WindowH * MS_PER_HOUR;
  const byClub = new Map<string, ClubLinkFact[]>();
  for (const l of links) if (l.linkedAt >= from && l.linkedAt <= now) (byClub.get(l.clubId) ?? byClub.set(l.clubId, []).get(l.clubId)!).push(l);
  for (const [clubId, list] of [...byClub].sort(([a], [b]) => a.localeCompare(b))) {
    const perIp = new Map<string, ClubLinkFact[]>();
    for (const l of list) if (l.ipHash) (perIp.get(l.ipHash) ?? perIp.set(l.ipHash, []).get(l.ipHash)!).push(l);
    const top = [...perIp.values()].sort((a, b) => b.length - a.length).slice(0, rules.h10MaxIpHashes);
    const onTop = top.reduce((n, g) => n + g.length, 0);
    if (onTop * 100 <= rules.h10SharePct * list.length) continue;
    const shared = top.some((g) => isSharedNet(g[0]?.netClass));
    const netClass: NetClass = shared ? (top.find((g) => isSharedNet(g[0]?.netClass))?.[0]?.netClass ?? 'campus') : 'other';
    const limit = thresholdFor(netClass, rules.h10NewMembers, rules.h10SharedThreshold);
    if (limit === null) {
      if (list.length > rules.h10NewMembers) out.skipped.push({ code: 'H10', reason: 'shared_threshold_missing', key: clubId, netClass, count: list.length });
      continue;
    }
    if (list.length <= limit) continue;
    const users = new Set(list.map((l) => l.userId));
    out.findings.push({
      code: 'H10',
      subject: { type: 'club', id: clubId },
      sessionIds: sessions.filter((s) => users.has(s.userId) && counted(s) && s.startAt >= from).map((s) => s.sessionId),
      userIds: sortStr(users),
      evidence: { new_members: list.length, threshold: limit, on_top_ip_hashes: onTop, ip_hashes: top.length, window_h: rules.h10WindowH, net_class: netClass },
      dedupKey: `H10:${clubId}:${week}`,
    });
  }
  return out;
}

// ---------------------------------------------------------------------------------------------
// H12: accounts with concurrently running sessions from the same IP hash and UA class, measured on
// overlap over the whole session duration (spec §6.3 after round 3).

export interface OverlapDay {
  day: FocusDay;
  /** Minutes in which at least `threshold` accounts ran at the same time. */
  overlapMin: number;
  users: string[];
  intervals: { start: Instant; end: Instant }[];
}

/** Sweep over one key and one day: time with ≥ `threshold` distinct accounts running together. */
export function overlapOfDay(sessions: readonly SessionFact[], threshold: number, now: Instant): Omit<OverlapDay, 'day'> {
  const ev: { t: Instant; d: 1 | -1; u: string }[] = [];
  for (const s of sessions) {
    const end = s.endAt ?? now;
    if (end <= s.startAt) continue;
    ev.push({ t: s.startAt, d: 1, u: s.userId }, { t: end, d: -1, u: s.userId });
  }
  // Ends before starts at the same instant: touching sessions do not overlap.
  ev.sort((a, b) => a.t - b.t || a.d - b.d);
  const running = new Map<string, number>();
  const users = new Set<string>();
  const intervals: { start: Instant; end: Instant }[] = [];
  let ms = 0;
  for (let i = 0; i < ev.length; i++) {
    const e = ev[i] as (typeof ev)[number];
    running.set(e.u, (running.get(e.u) ?? 0) + e.d);
    if ((running.get(e.u) ?? 0) <= 0) running.delete(e.u);
    const next = ev[i + 1];
    if (!next || next.t <= e.t) continue;
    if (running.size >= threshold) {
      ms += next.t - e.t;
      for (const u of running.keys()) users.add(u);
      const last = intervals[intervals.length - 1];
      if (last && last.end === e.t) last.end = next.t;
      else intervals.push({ start: e.t, end: next.t });
    }
  }
  return { overlapMin: ms / MS_PER_MINUTE, users: sortStr(users), intervals };
}

/**
 * H12 over the focus days given (the day close passes the week so far, the week close the full
 * week). Desktop UA classes count separately with the base threshold, also on campus (six browser
 * profiles on one laptop); other classes on shared nets use h12SharedThreshold.
 */
export function h12(sessions: readonly SessionFact[], week: WeekKey, now: Instant, rules: FraudRules): HeuristicResult {
  const out = empty();
  const groups = new Map<string, SessionFact[]>();
  for (const s of sessions) {
    if (s.isPractice || !s.ipHash || s.status === 'active') continue;
    const key = `${s.ipHash}|${s.uaClass}`;
    (groups.get(key) ?? groups.set(key, []).get(key)!).push(s);
  }
  for (const [key, list] of [...groups].sort(([a], [b]) => a.localeCompare(b))) {
    const [ip, ua] = key.split('|') as [string, string];
    const netClass = list.find((s) => s.netClass)?.netClass ?? 'other';
    const desktop = ua.startsWith('desktop');
    const threshold = desktop || !isSharedNet(netClass) ? rules.h12MinAccounts : rules.h12SharedThreshold;
    const accounts = new Set(list.map((s) => s.userId));
    if (threshold === null) {
      if (accounts.size >= rules.h12MinAccounts) out.skipped.push({ code: 'H12', reason: 'shared_threshold_missing', key: `${shortHash(ip)}:${ua}:${week}`, netClass, count: accounts.size });
      continue;
    }
    if (accounts.size < threshold) continue;
    const byDay = new Map<FocusDay, SessionFact[]>();
    for (const s of list) (byDay.get(s.focusDay) ?? byDay.set(s.focusDay, []).get(s.focusDay)!).push(s);
    const qualifying: OverlapDay[] = [];
    for (const [day, ds] of [...byDay].sort(([a], [b]) => a.localeCompare(b))) {
      const o = overlapOfDay(ds, threshold, now);
      if (o.overlapMin >= rules.h12MinOverlapMin) qualifying.push({ day, ...o });
    }
    if (qualifying.length < rules.h12MinDays) continue;
    const users = new Set(qualifying.flatMap((q) => q.users));
    const ids = list
      .filter((s) => counted(s) && users.has(s.userId) && qualifying.some((q) => q.day === s.focusDay && q.intervals.some((i) => (s.endAt ?? now) > i.start && s.startAt < i.end)))
      .map((s) => s.sessionId);
    out.findings.push({
      code: 'H12',
      subject: { type: 'session' },
      sessionIds: ids,
      userIds: sortStr(users),
      evidence: {
        accounts: users.size,
        threshold,
        days: qualifying.length,
        overlap_min: qualifying.map((q) => Math.round(q.overlapMin)),
        min_overlap_min: rules.h12MinOverlapMin,
        ua_class: ua,
        net_class: netClass,
        week,
      },
      dedupKey: `H12:${week}:${ip}:${ua}`,
    });
  }
  return out;
}

/** Monday of the week of `day`; exported for the jobs. */
export function weekOf(day: FocusDay, params: Params): WeekKey {
  return weekKey(day, params.time.week_start_iso_weekday);
}

/** True on the first focus day of a week (week close runs then). */
export function isWeekStart(day: FocusDay, params: Params): boolean {
  return isoWeekday(day) === params.time.week_start_iso_weekday;
}

/** Local hour of an instant (for evidence only). */
export function localHour(t: Instant): number {
  return toLocalParts(t).hour;
}
