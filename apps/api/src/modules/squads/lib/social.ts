// Shared helpers of the WP-5 modules (squads, invites, duels, clubs, challenges, leaderboards,
// belofte, cards, referral, reminders). Everything here stays inside WP-5's own folders; other work
// packages are reached only through services and their documented tables.
import { CURRENT_PARAMS, addDays, compareDays, focusDayOf, type FocusDay, type Params } from '@rewarded/core';
import { DomainError, type InviteDto, type InviteSource } from '@rewarded/contracts';
import { idsFor, randomToken } from '../../../db/ids.ts';
import type { Db } from '../../../db/types.ts';
import { isVacation as isVacationDay } from '../../../jobs/day_close/index.ts';
import type { AuthState } from '../../../middleware/context.ts';
import type { ModuleDeps } from '../../../module.ts';
import type { UserDay, UserDayRepository } from '../../../services/userDay.ts';

export const P: Params = CURRENT_PARAMS;

/** Current focus day from the platform clock (architecture §3). */
export function today(deps: ModuleDeps): FocusDay {
  return focusDayOf(deps.platform.clock.now().getTime(), P);
}

export function nowIso(deps: ModuleDeps): string {
  return deps.platform.clock.now().toISOString();
}

export function ids(deps: ModuleDeps) {
  return idsFor(deps.platform);
}

export function focusDayOfIso(iso: string): FocusDay {
  return focusDayOf(Date.parse(iso), P);
}

export interface SocialUser {
  id: string;
  pseudonym: string;
  first_name: string;
  last_name: string | null;
  email: string;
  locale: 'nl' | 'en';
  age_band: '16_17' | '18_plus';
  status: 'active' | 'blocked' | 'deleted';
  is_team: number;
  cohort: 'experiment' | 'expansion';
  registration_channel: string;
  created_at: string;
  research_opt_out_at: string | null;
  rest_exit_at: string | null;
  silent_mode: number;
  compare_opt_in: number;
  squad_name_on_cards: number;
  email_reminders: number;
  institution_verified_at: string | null;
  phone_verified_at: string | null;
  phone_hash: string | null;
  first_redeem_after: string | null;
  daily_goal_min: number;
}

const USER_COLUMNS = `id, pseudonym, first_name, last_name, email, locale, age_band, status, is_team, cohort, registration_channel, created_at,
  research_opt_out_at, rest_exit_at, silent_mode, compare_opt_in, squad_name_on_cards, email_reminders, institution_verified_at,
  phone_verified_at, phone_hash, first_redeem_after, daily_goal_min`;

export function userById(db: Db, id: string): SocialUser | undefined {
  return db.get<SocialUser>(`SELECT ${USER_COLUMNS} FROM user WHERE id = ?`, [id]);
}

/** The logged-in student, or AUTH_REQUIRED. */
export function studentOf(auth: AuthState): { id: string; pseudonym: string; ageBand: '16_17' | '18_plus' } {
  if (auth.kind !== 'user') throw new DomainError('AUTH_REQUIRED');
  return { id: auth.user.id, pseudonym: auth.user.pseudonym, ageBand: auth.user.ageBand };
}

// ---- Squads and memberships -------------------------------------------------------------------

export interface SquadRow {
  id: string;
  name: string;
  name_status: 'pending' | 'ok' | 'rejected' | 'reported';
  club_id: string | null;
  calendar_id: string | null;
  cohort: 'experiment' | 'expansion';
  admin_user_id: string | null;
  status: 'building' | 'active' | 'archived';
  arm_bonus: 'A' | 'B' | null;
  arm_belofte: 'early' | 'late' | null;
  arm_rest: 'rest' | 'continue' | null;
  streak: number;
  streak_before_break: number | null;
  recovery_progress: number;
  low_activity_since_day: string | null;
  regroup_offered_at: string | null;
  last_active_day: string | null;
  became_active_at: string | null;
  merged_into: string | null;
  created_at: string;
  created_day: string;
}

export interface MembershipRow {
  id: string;
  squad_id: string;
  user_id: string | null;
  role: 'maker' | 'member';
  joined_at: string;
  active_from_day: string;
  left_at: string | null;
  left_day: string | null;
  paused_since_day: string | null;
  invite_id: string | null;
}

export function squadById(db: Db, id: string): SquadRow | undefined {
  return db.get<SquadRow>('SELECT * FROM squad WHERE id = ?', [id]);
}

export function openMembership(db: Db, userId: string): MembershipRow | undefined {
  return db.get<MembershipRow>('SELECT * FROM squad_membership WHERE user_id = ? AND left_at IS NULL', [userId]);
}

export function openMembers(db: Db, squadId: string): MembershipRow[] {
  return db.all<MembershipRow>('SELECT * FROM squad_membership WHERE squad_id = ? AND left_at IS NULL ORDER BY joined_at, rowid', [squadId]);
}

/** Memberships that may count on `day` (joined by then, not left before). */
export function membershipsOnDay(db: Db, squadId: string, day: FocusDay): MembershipRow[] {
  return db.all<MembershipRow>(
    'SELECT * FROM squad_membership WHERE squad_id = ? AND user_id IS NOT NULL AND (left_day IS NULL OR left_day >= ?) ORDER BY joined_at, rowid',
    [squadId, day],
  );
}

/** The squad of the logged-in member, or NOT_IN_SQUAD (authorisation level `member`). */
export function mySquad(db: Db, userId: string): { squad: SquadRow; membership: MembershipRow } {
  const membership = openMembership(db, userId);
  if (!membership) throw new DomainError('NOT_IN_SQUAD');
  const squad = squadById(db, membership.squad_id);
  if (!squad || squad.status === 'archived') throw new DomainError('NOT_IN_SQUAD');
  return { squad, membership };
}

// ---- Invites ----------------------------------------------------------------------------------

export interface InviteRow {
  id: string;
  token: string;
  source: InviteSource;
  creator_user_id: string | null;
  squad_id: string | null;
  duel_id: string | null;
  club_id: string | null;
  qr_source: string | null;
  max_uses: number;
  uses: number;
  expires_at: string;
  created_at: string;
}

export function inviteUrl(deps: ModuleDeps, token: string): string {
  return `${deps.http?.appOrigin ?? ''}/i/${token}`;
}

export function inviteDto(deps: ModuleDeps, r: InviteRow): InviteDto {
  return { id: r.id, token: r.token, url: inviteUrl(deps, r.token), source: r.source, max_uses: r.max_uses, uses: r.uses, expires_at: r.expires_at };
}

/** Creates an invite object (spec §4.4, §4.5) and writes invite_created in the same transaction. */
export function createInvite(
  tx: Db,
  deps: ModuleDeps,
  o: { source: InviteSource; creator: { id: string; pseudonym: string } | null; squadId?: string; duelId?: string; clubId?: string; qrSource?: string; maxUses: number; validMs: number },
): InviteRow {
  const now = deps.platform.clock.now();
  const row: InviteRow = {
    id: ids(deps).ulid(),
    token: randomToken(deps.platform.random, 16),
    source: o.source,
    creator_user_id: o.creator?.id ?? null,
    squad_id: o.squadId ?? null,
    duel_id: o.duelId ?? null,
    club_id: o.clubId ?? null,
    qr_source: o.qrSource ?? null,
    max_uses: o.maxUses,
    uses: 0,
    expires_at: new Date(now.getTime() + o.validMs).toISOString(),
    created_at: now.toISOString(),
  };
  tx.run(
    `INSERT INTO invite (id, token, source, creator_user_id, squad_id, duel_id, club_id, qr_source, max_uses, uses, expires_at, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)`,
    [row.id, row.token, row.source, row.creator_user_id, row.squad_id, row.duel_id, row.club_id, row.qr_source, row.max_uses, row.expires_at, row.created_at],
  );
  deps.services.events.event(
    tx,
    'invite_created',
    { invite_id: row.id, bron: row.source, maker: o.creator?.pseudonym ?? null, max_uses: row.max_uses, geldig_tot: row.expires_at },
    o.creator ? { pseudonym: o.creator.pseudonym, ...(o.squadId ? { squadId: o.squadId } : {}) } : {},
  );
  return row;
}

export const DAY_MS = 86_400_000;
export const HOUR_MS = 3_600_000;

// ---- Read-only views on WP-4 data -------------------------------------------------------------

interface UserDaySqlRow {
  user_id: string;
  focus_day: string;
  rev: number;
  verified_min: number;
  counted_min: number;
  counted_min_final: number;
  goal_min: number;
  goal_met: number;
  goal_met_final: number;
  goal_bonus_eligible: number;
  exam_day: number;
  goal_state: UserDay['goalState'];
  joker_used: number;
  vacation: number;
  closed_at: string | null;
}

function toUserDay(r: UserDaySqlRow): UserDay {
  return {
    userId: r.user_id,
    focusDay: r.focus_day,
    rev: r.rev,
    verifiedMin: r.verified_min,
    countedMin: r.counted_min,
    countedMinFinal: r.counted_min_final,
    goalMin: r.goal_min,
    goalMet: r.goal_met === 1,
    goalMetFinal: r.goal_met_final === 1,
    goalBonusEligible: r.goal_bonus_eligible === 1,
    examDay: r.exam_day === 1,
    goalState: r.goal_state,
    jokerUsed: r.joker_used === 1,
    vacation: r.vacation === 1,
    closedAt: (r.closed_at as unknown as UserDay['closedAt']) ?? null,
  };
}

/** Read side of user_day; the services object's repository when WP-4 installed it, else SQL. */
export interface UserDayReader {
  get(userId: string, day: FocusDay): UserDay | undefined;
  range(userIds: readonly string[], from: FocusDay, to: FocusDay): UserDay[];
}

export function userDays(deps: ModuleDeps): UserDayReader {
  const s = deps.services as unknown as { userDays?: UserDayRepository; userDay?: UserDayRepository };
  const repo = s.userDays ?? s.userDay;
  if (repo) return repo;
  const db = deps.db;
  return {
    get(userId, day) {
      const r = db.get<UserDaySqlRow>('SELECT * FROM user_day WHERE user_id = ? AND focus_day = ?', [userId, day]);
      return r ? toUserDay(r) : undefined;
    },
    range(userIds, from, to) {
      if (userIds.length === 0) return [];
      const marks = userIds.map(() => '?').join(', ');
      return db
        .all<UserDaySqlRow>(`SELECT * FROM user_day WHERE user_id IN (${marks}) AND focus_day >= ? AND focus_day <= ? ORDER BY user_id, focus_day`, [...userIds, from, to])
        .map(toUserDay);
    },
  };
}

/** Focus days with a completed, non-practice, non-rejected session (WP-4's focus_session, read only). */
export function sessionDays(db: Db, userId: string, from: FocusDay, to: FocusDay): FocusDay[] {
  return db
    .all<{ focus_day: string }>(
      `SELECT DISTINCT focus_day FROM focus_session
        WHERE user_id = ? AND status = 'completed' AND is_practice = 0 AND review_status <> 'rejected' AND focus_day >= ? AND focus_day <= ?
        ORDER BY focus_day`,
      [userId, from, to],
    )
    .map((r) => r.focus_day);
}

/** The running session of a user, for live presence (spec §4.4). */
export function activeSession(db: Db, userId: string): { planned_end_at: number } | undefined {
  return db.get<{ planned_end_at: number }>("SELECT planned_end_at FROM focus_session WHERE user_id = ? AND status = 'active' AND is_practice = 0", [userId]);
}

// ---- Calendar ---------------------------------------------------------------------------------

export interface CalendarDates {
  id: string | null;
  tDay: FocusDay;
  aStartDay: FocusDay | null;
  aEndDay: FocusDay | null;
  examPeriods: { first_day: FocusDay; last_day: FocusDay }[];
}

interface CalendarRow {
  id: string;
  t_day: string;
  a_start_day: string | null;
  a_end_day: string | null;
  exam_periods: string;
}

/**
 * Calendar of a unit (spec §4.13): a squad follows its club's calendar, without a club its maker's
 * club. Until the per-club calendars are entered, the dates fall back to params v1: T = last day
 * of the goal-bonus season, exam period = pilot start until T (assumption, see the WP-5 report).
 */
export function calendarById(db: Db, id: string | null): CalendarDates {
  const row = id ? db.get<CalendarRow>('SELECT id, t_day, a_start_day, a_end_day, exam_periods FROM exam_calendar WHERE id = ?', [id]) : undefined;
  if (row) {
    let periods: { first_day: string; last_day: string }[] = [];
    try {
      periods = JSON.parse(row.exam_periods) as { first_day: string; last_day: string }[];
    } catch {
      periods = [];
    }
    if (periods.length === 0) periods = defaultExamPeriods(row.t_day, row.a_start_day, row.a_end_day);
    return { id: row.id, tDay: row.t_day, aStartDay: row.a_start_day, aEndDay: row.a_end_day, examPeriods: periods };
  }
  const t = P.goal_bonus.season.last_day;
  return { id: null, tDay: t, aStartDay: null, aEndDay: P.rest_period.last_day, examPeriods: defaultExamPeriods(t, null, null) };
}

/** Exam periods (spec §4.13): pilot start until T, and the April window with the week before it. */
export function defaultExamPeriods(tDay: FocusDay, aStart: FocusDay | null, aEnd: FocusDay | null): { first_day: FocusDay; last_day: FocusDay }[] {
  const out = [{ first_day: P.goal_bonus.season.first_day, last_day: tDay }];
  if (aStart && aEnd) out.push({ first_day: addDays(aStart, -7), last_day: aEnd });
  return out;
}

export function calendarOfClub(db: Db, clubId: string | null): string | null {
  if (!clubId) return null;
  return db.get<{ exam_calendar_id: string | null }>('SELECT exam_calendar_id FROM club WHERE id = ?', [clubId])?.exam_calendar_id ?? null;
}

/** Club of a user's open link (approved, not pending). */
export function clubOfUser(db: Db, userId: string): string | null {
  return db.get<{ club_id: string }>('SELECT club_id FROM club_membership WHERE user_id = ? AND left_at IS NULL AND pending_admin = 0', [userId])?.club_id ?? null;
}

export function isVacation(db: Db, day: FocusDay): boolean {
  return isVacationDay(db, day);
}

export function minDay(a: FocusDay, b: FocusDay): FocusDay {
  return compareDays(a, b) <= 0 ? a : b;
}

/** Whether WP-5's tables exist (a WP-3-only test database runs the day close without them). */
export function hasSocialTables(db: Db): boolean {
  return db.get("SELECT 1 AS x FROM sqlite_master WHERE type = 'table' AND name = 'squad'") !== undefined;
}

/** Whether WP-4's tables exist (user_day, focus_session). */
export function hasSessionTables(db: Db): boolean {
  return db.get("SELECT 1 AS x FROM sqlite_master WHERE type = 'table' AND name = 'user_day'") !== undefined;
}

/** Opaque per-viewer reference of a squad member (presence): no user id leaves the server. */
export function memberRef(deps: ModuleDeps, squadId: string, userId: string): string {
  return deps.platform.hasher.hash('audit', `member:${squadId}:${userId}`).slice(0, 24);
}

/**
 * Context for a squad-level server event (squad_became_active, squad_day_evaluated, …): the squad id
 * and the pseudonym of the squad admin, or of the longest-sitting member, so the event carries the
 * squad's arms like every other event (architecture §3.5).
 */
export function squadEventCtx(db: Db, squadId: string): { pseudonym?: string; squadId: string } {
  const row = db.get<{ pseudonym: string }>(
    `SELECT u.pseudonym FROM squad s JOIN user u ON u.id = s.admin_user_id WHERE s.id = ?
     UNION ALL
     SELECT u.pseudonym FROM squad_membership m JOIN user u ON u.id = m.user_id WHERE m.squad_id = ? AND m.left_at IS NULL
     LIMIT 1`,
    [squadId, squadId],
  );
  return row ? { pseudonym: row.pseudonym, squadId } : { squadId };
}
