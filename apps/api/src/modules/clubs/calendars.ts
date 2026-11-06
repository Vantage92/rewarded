// Admin routes for exam calendars (spec §4.13, architecture §8.2 "GET/POST/PATCH /admin/exam-calendars")
// and the April member count (POST /admin/clubs/:id/april-members). Added in the integration wave.
// After fixed_at a change needs a reason and a second admin: the first PATCH stores the change as
// pending (202), a PATCH of another admin with only a reason applies it (200).
import { calendarDates, validateCalendar, type CalendarDates } from '@rewarded/core';
import { DomainError, routes, type ExamCalendar, type ExamCalendarInput, type ExamCalendarPatch } from '@rewarded/contracts';
import { adminActor } from '../../db/services/audit.ts';
import { calendarFromRow, type ExamCalendarRow } from '../../db/calendar.ts';
import type { Db } from '../../db/types.ts';
import { mount, reply } from '../../middleware/route.ts';
import type { AppEnv, ModuleDeps } from '../../module.ts';
import type { Hono } from 'hono';
import { P, ids, nowIso, studentOf } from '../squads/lib/social.ts';

const DATE_FIELDS = ['institution', 'faculty', 'is_default', 't_day', 'n_start_day', 'n_end_day', 'a_start_day', 'a_end_day', 'a_resit_days', 'exam_periods', 'source_ref', 'checked_at', 'club_confirmation_ref'] as const;

function derivedDto(d: CalendarDates): ExamCalendar['derived'] {
  return {
    season: d.season,
    bonus_stop_at: d.bonusStopAt,
    prize_weeks: d.prizeWeeks,
    january_actives: d.januaryActives,
    early_offer_day: d.earlyOfferDay,
    rest_period: d.restPeriod,
    reflection_window: d.reflectionWindow,
    n: d.n,
    a: d.a,
    early_2_offer_day: d.early2OfferDay,
    rest_repeat_notice_day: d.restRepeatNoticeDay,
    late_offer_day: d.lateOfferDay,
    registration_last_day: d.registrationLastDay,
    exam_periods: d.examPeriods,
  };
}

export function calendarDto(db: Db, row: ExamCalendarRow): ExamCalendar {
  const clubs = db.all<{ id: string }>('SELECT id FROM club WHERE exam_calendar_id = ? ORDER BY id', [row.id]);
  return {
    id: row.id,
    institution: row.institution,
    faculty: row.faculty,
    is_default: row.is_default === 1,
    t_day: row.t_day,
    n_start_day: row.n_start_day,
    n_end_day: row.n_end_day,
    a_start_day: row.a_start_day,
    a_end_day: row.a_end_day,
    a_resit_days: JSON.parse(row.a_resit_days) as string[],
    exam_periods: JSON.parse(row.exam_periods) as { first_day: string; last_day: string }[],
    source_ref: row.source_ref,
    checked_at: row.checked_at,
    club_confirmation_ref: row.club_confirmation_ref,
    fixed_at: row.fixed_at,
    club_ids: clubs.map((c) => c.id),
    derived: derivedDto(calendarDates(calendarFromRow(row), P)),
    ...(row.pending_patch ? { pending_four_eyes: true } : {}),
  };
}

function rowById(db: Db, id: string): ExamCalendarRow | undefined {
  return db.get<ExamCalendarRow>('SELECT * FROM exam_calendar WHERE id = ?', [id]);
}

type Merged = Required<Pick<ExamCalendarInput, 'institution' | 't_day' | 'source_ref' | 'checked_at'>> & ExamCalendarInput;

function check(db: Db, merged: Merged, selfId: string | null): void {
  if (merged.source_ref.trim() === '') throw new DomainError('SOURCE_REQUIRED');
  const errors = validateCalendar({
    tDay: merged.t_day,
    nStartDay: merged.n_start_day ?? null,
    nEndDay: merged.n_end_day ?? null,
    aStartDay: merged.a_start_day ?? null,
    aEndDay: merged.a_end_day ?? null,
    aResitDays: merged.a_resit_days ?? [],
  });
  if (errors.length > 0) throw new DomainError('VALIDATION_FAILED', { field: 'calendar', reasons: errors });
  if (merged.is_default) {
    const other = db.get<{ id: string }>('SELECT id FROM exam_calendar WHERE is_default = 1 AND id <> ?', [selfId ?? '']);
    if (other) throw new DomainError('DEFAULT_CALENDAR_EXISTS', { calendar_id: other.id });
  }
}

function mergedOf(row: ExamCalendarRow, patch: ExamCalendarPatch): Merged {
  return {
    institution: patch.institution ?? row.institution,
    faculty: patch.faculty !== undefined ? patch.faculty : row.faculty,
    is_default: patch.is_default ?? row.is_default === 1,
    t_day: patch.t_day ?? row.t_day,
    n_start_day: patch.n_start_day !== undefined ? patch.n_start_day : row.n_start_day,
    n_end_day: patch.n_end_day !== undefined ? patch.n_end_day : row.n_end_day,
    a_start_day: patch.a_start_day !== undefined ? patch.a_start_day : row.a_start_day,
    a_end_day: patch.a_end_day !== undefined ? patch.a_end_day : row.a_end_day,
    a_resit_days: patch.a_resit_days ?? (JSON.parse(row.a_resit_days) as string[]),
    exam_periods: patch.exam_periods ?? (JSON.parse(row.exam_periods) as { first_day: string; last_day: string }[]),
    source_ref: patch.source_ref ?? row.source_ref,
    checked_at: patch.checked_at ?? row.checked_at,
    club_confirmation_ref: patch.club_confirmation_ref !== undefined ? patch.club_confirmation_ref : row.club_confirmation_ref,
  };
}

function write(db: Db, id: string, m: Merged): void {
  db.run(
    `UPDATE exam_calendar SET institution = ?, faculty = ?, is_default = ?, t_day = ?, n_start_day = ?, n_end_day = ?, a_start_day = ?, a_end_day = ?,
       a_resit_days = ?, exam_periods = ?, source_ref = ?, checked_at = ?, club_confirmation_ref = ?, pending_patch = NULL, pending_by = NULL WHERE id = ?`,
    [
      m.institution, m.faculty ?? null, m.is_default ? 1 : 0, m.t_day, m.n_start_day ?? null, m.n_end_day ?? null, m.a_start_day ?? null, m.a_end_day ?? null,
      JSON.stringify(m.a_resit_days ?? []), JSON.stringify(m.exam_periods ?? []), m.source_ref, m.checked_at, m.club_confirmation_ref ?? null, id,
    ],
  );
}

export function registerCalendarRoutes(api: Hono<AppEnv>, deps: ModuleDeps): void {
  const { db, services } = deps;
  const actorOf = (userId: string) => adminActor(deps.platform.hasher, userId);

  mount(api, routes['admin.examCalendars.list'], () => ({
    items: db.all<ExamCalendarRow>('SELECT * FROM exam_calendar ORDER BY is_default DESC, t_day, institution').map((r) => calendarDto(db, r)),
  }));

  mount(api, routes['admin.examCalendars.get'], ({ params }) => {
    const row = rowById(db, params.id);
    if (!row) throw new DomainError('NOT_FOUND');
    return { calendar: calendarDto(db, row) };
  });

  mount(api, routes['admin.examCalendars.create'], ({ auth, body }) => {
    const actor = actorOf(studentOf(auth).id);
    const id = ids(deps).ulid();
    const m: Merged = { ...body, is_default: body.is_default ?? false };
    return db.transaction(() => {
      check(db, m, null);
      db.run(
        `INSERT INTO exam_calendar (id, institution, faculty, is_default, t_day, n_start_day, n_end_day, a_start_day, a_end_day, a_resit_days, exam_periods,
           source_ref, checked_at, club_confirmation_ref, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id, m.institution, m.faculty ?? null, m.is_default ? 1 : 0, m.t_day, m.n_start_day ?? null, m.n_end_day ?? null, m.a_start_day ?? null, m.a_end_day ?? null,
          JSON.stringify(m.a_resit_days ?? []), JSON.stringify(m.exam_periods ?? []), m.source_ref, m.checked_at, m.club_confirmation_ref ?? null, nowIso(deps),
        ],
      );
      services.audit.audit(db, { actor, action: 'exam_calendar_created', objectType: 'exam_calendar', objectRef: id });
      return reply(201, { calendar: calendarDto(db, rowById(db, id)!) });
    });
  });

  mount(api, routes['admin.examCalendars.patch'], ({ auth, params, body }) => {
    const me = studentOf(auth).id;
    const actor = actorOf(me);
    return db.transaction(() => {
      const row = rowById(db, params.id);
      if (!row) throw new DomainError('NOT_FOUND');
      const changes = Object.fromEntries(DATE_FIELDS.filter((k) => body[k] !== undefined).map((k) => [k, body[k]])) as ExamCalendarPatch;
      if (row.fixed_at !== null) {
        // Fixed: only with a reason and four eyes (spec §4.13: after 2 December only with a founder decision and a log line).
        if (!body.reason) throw new DomainError('REASON_REQUIRED');
        if (Object.keys(changes).length === 0) {
          if (!row.pending_patch) throw new DomainError('CALENDAR_FIXED');
          if (row.pending_by === actor) throw new DomainError('FOUR_EYES_REQUIRED');
          const m = mergedOf(row, JSON.parse(row.pending_patch) as ExamCalendarPatch);
          check(db, m, row.id);
          write(db, row.id, m);
          services.audit.audit(db, { actor, action: 'exam_calendar_change_confirmed', objectType: 'exam_calendar', objectRef: row.id, reason: body.reason });
          return { calendar: calendarDto(db, rowById(db, row.id)!) };
        }
        check(db, mergedOf(row, changes), row.id);
        db.run('UPDATE exam_calendar SET pending_patch = ?, pending_by = ? WHERE id = ?', [JSON.stringify(changes), actor, row.id]);
        services.audit.audit(db, { actor, action: 'exam_calendar_change_proposed', objectType: 'exam_calendar', objectRef: row.id, reason: body.reason });
        return reply(202, { calendar: calendarDto(db, rowById(db, row.id)!) });
      }
      const m = mergedOf(row, changes);
      check(db, m, row.id);
      write(db, row.id, m);
      if (body.fix) db.run('UPDATE exam_calendar SET fixed_at = ? WHERE id = ?', [nowIso(deps), row.id]);
      services.audit.audit(db, { actor, action: body.fix ? 'exam_calendar_fixed' : 'exam_calendar_updated', objectType: 'exam_calendar', objectRef: row.id, ...(body.reason ? { reason: body.reason } : {}) });
      return { calendar: calendarDto(db, rowById(db, row.id)!) };
    });
  });

  mount(api, routes['admin.clubs.aprilMembers'], ({ auth, params, body }) => {
    const actor = actorOf(studentOf(auth).id);
    if (body.source_ref.trim() === '') throw new DomainError('SOURCE_REQUIRED');
    return db.transaction(() => {
      const club = db.get<{ id: string; april_members_at: string | null }>('SELECT id, april_members_at FROM club WHERE id = ?', [params.id]);
      if (!club) throw new DomainError('NOT_FOUND');
      // Fixed once the April challenge is announced: a challenge of type club_prize in A that is published.
      const at = nowIso(deps);
      db.run('UPDATE club SET april_members = ?, april_members_source_ref = ?, april_members_at = ? WHERE id = ?', [body.april_members, body.source_ref, at, club.id]);
      services.audit.audit(db, { actor, action: 'club_april_members_set', objectType: 'club', objectRef: club.id });
      return { club_id: club.id, april_members: body.april_members, source_ref: body.source_ref, recorded_at: at };
    });
  });
}
