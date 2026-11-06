// Exam calendar of a unit (spec §4.13, architecture §3.4): the one place in the API that turns
// exam_calendar rows into core/calendar dates. A squad follows its club (without a club the
// maker's club), a solo user his own club, and everything else the default calendar: the
// is_default row when it exists, else the default built from params (core defaultCalendar).
import { CURRENT_PARAMS, calendarDates, defaultCalendar, type CalendarDates, type CalendarRange, type ExamCalendar, type Params } from '@rewarded/core';
import type { Db } from './types.ts';

export interface ExamCalendarRow {
  id: string;
  institution: string;
  faculty: string | null;
  is_default: number;
  t_day: string;
  n_start_day: string | null;
  n_end_day: string | null;
  a_start_day: string | null;
  a_end_day: string | null;
  a_resit_days: string;
  exam_periods: string;
  source_ref: string;
  checked_at: string;
  club_confirmation_ref: string | null;
  fixed_at: string | null;
  pending_patch: string | null;
  pending_by: string | null;
  created_at: string;
}

function hasTable(db: Db, name: string): boolean {
  return db.get("SELECT 1 AS x FROM sqlite_master WHERE type = 'table' AND name = ?", [name]) !== undefined;
}

function hasColumn(db: Db, table: string, column: string): boolean {
  return db.all<{ name: string }>(`PRAGMA table_info(${table})`).some((c) => c.name === column);
}

function parseJson<T>(text: string | null | undefined, fallback: T): T {
  if (!text) return fallback;
  try {
    return JSON.parse(text) as T;
  } catch {
    return fallback;
  }
}

/** Row to the core shape. */
export function calendarFromRow(row: Pick<ExamCalendarRow, 'id' | 't_day' | 'n_start_day' | 'n_end_day' | 'a_start_day' | 'a_end_day' | 'exam_periods'> & Partial<Pick<ExamCalendarRow, 'is_default' | 'a_resit_days'>>): ExamCalendar {
  return {
    id: row.id,
    isDefault: row.is_default === 1,
    tDay: row.t_day,
    nStartDay: row.n_start_day,
    nEndDay: row.n_end_day,
    aStartDay: row.a_start_day,
    aEndDay: row.a_end_day,
    aResitDays: parseJson<string[]>(row.a_resit_days, []),
    examPeriods: parseJson<CalendarRange[]>(row.exam_periods, []),
  };
}

/** The default calendar: the is_default row, else the params default (spec §4.13). */
export function defaultExamCalendar(db: Db, params: Params = CURRENT_PARAMS): ExamCalendar {
  if (hasTable(db, 'exam_calendar') && hasColumn(db, 'exam_calendar', 'is_default')) {
    const row = db.get<ExamCalendarRow>('SELECT * FROM exam_calendar WHERE is_default = 1');
    if (row) return calendarFromRow(row);
  }
  return defaultCalendar(params);
}

/** Calendar by id; a missing or null id gives the default calendar. */
export function examCalendarById(db: Db, id: string | null | undefined, params: Params = CURRENT_PARAMS): ExamCalendar {
  if (id && hasTable(db, 'exam_calendar')) {
    const row = db.get<ExamCalendarRow>('SELECT * FROM exam_calendar WHERE id = ?', [id]);
    if (row) return calendarFromRow(row);
  }
  return defaultExamCalendar(db, params);
}

/** Calendar id of a unit: open squad first, then the user's approved club link (spec §4.13). */
export function calendarIdOfUser(db: Db, userId: string): string | null {
  if (hasTable(db, 'squad_membership')) {
    const sq = db.get<{ calendar_id: string | null; club_id: string | null }>(
      `SELECT s.calendar_id, s.club_id FROM squad_membership m JOIN squad s ON s.id = m.squad_id
        WHERE m.user_id = ? AND m.left_at IS NULL ORDER BY m.joined_at DESC LIMIT 1`,
      [userId],
    );
    if (sq) return sq.calendar_id ?? calendarIdOfClub(db, sq.club_id);
  }
  if (hasTable(db, 'club_membership')) {
    const cl = db.get<{ club_id: string }>('SELECT club_id FROM club_membership WHERE user_id = ? AND left_at IS NULL AND pending_admin = 0', [userId]);
    if (cl) return calendarIdOfClub(db, cl.club_id);
  }
  return null;
}

export function calendarIdOfSquad(db: Db, squadId: string | null | undefined): string | null {
  if (!squadId || !hasTable(db, 'squad')) return null;
  const sq = db.get<{ calendar_id: string | null; club_id: string | null }>('SELECT calendar_id, club_id FROM squad WHERE id = ?', [squadId]);
  return sq ? (sq.calendar_id ?? calendarIdOfClub(db, sq.club_id)) : null;
}

export function calendarIdOfClub(db: Db, clubId: string | null | undefined): string | null {
  if (!clubId || !hasTable(db, 'club')) return null;
  return db.get<{ exam_calendar_id: string | null }>('SELECT exam_calendar_id FROM club WHERE id = ?', [clubId])?.exam_calendar_id ?? null;
}

/** Calendar of the user's unit. */
export function examCalendarOfUser(db: Db, userId: string, params: Params = CURRENT_PARAMS): ExamCalendar {
  return examCalendarById(db, calendarIdOfUser(db, userId), params);
}

/** Derived dates of the user's calendar (season, bonus stop, rest period, ...). */
export function calendarDatesOfUser(db: Db, userId: string, params: Params = CURRENT_PARAMS): CalendarDates {
  return calendarDates(examCalendarOfUser(db, userId, params), params);
}

export function calendarDatesById(db: Db, id: string | null | undefined, params: Params = CURRENT_PARAMS): CalendarDates {
  return calendarDates(examCalendarById(db, id, params), params);
}

/** Every stored calendar plus the default, for jobs that work per calendar. */
export function allCalendarDates(db: Db, params: Params = CURRENT_PARAMS): CalendarDates[] {
  const out: CalendarDates[] = [];
  let hasDefault = false;
  if (hasTable(db, 'exam_calendar')) {
    for (const row of db.all<ExamCalendarRow>('SELECT * FROM exam_calendar ORDER BY t_day, id')) {
      const cal = calendarFromRow(row);
      if (cal.isDefault) hasDefault = true;
      out.push(calendarDates(cal, params));
    }
  }
  if (!hasDefault) out.push(calendarDates(defaultCalendar(params), params));
  return out;
}
