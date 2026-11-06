-- The default calendar for units without a club (spec §4.13): one row with is_default = 1, so that
-- events, KPI queries and the admin see it like any other calendar. Its dates are the working
-- hypothesis (last ending pilot calendar, voorregistratie §3.1) and equal core defaultCalendar(params v1);
-- the founder fixes them before 2 December through PATCH /admin/exam-calendars/:id.
INSERT INTO exam_calendar (id, institution, faculty, is_default, t_day, n_start_day, n_end_day, a_start_day, a_end_day, a_resit_days, exam_periods,
  source_ref, checked_at, club_confirmation_ref, created_at)
SELECT '0000000000000000000000DEF0', 'Standaardkalender', NULL, 1, '2027-01-17', NULL, NULL, NULL, '2027-03-31', '[]', '[]',
  'werkhypothese voorregistratie §3.1', '2026-11-05', NULL, '2026-11-05T00:00:00.000Z'
WHERE NOT EXISTS (SELECT 1 FROM exam_calendar WHERE is_default = 1);
