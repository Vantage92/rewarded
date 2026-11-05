-- WP-5 social, challenges and prizes (architecture §3.4, §6.2–6.4; spec §4.4–4.9, §4.12, §4.13).
-- Times are ISO-8601 UTC text, focus days YYYY-MM-DD. user_id columns become NULL on deletion
-- (ON DELETE SET NULL) where the row must stay for an aggregate (club links in the denominator,
-- squad days); the privacy eraser of each module removes the personal rows (architecture §10.7).

-- First in the series so that club and squad can refer to it (architecture §12.3).
CREATE TABLE exam_calendar (
  id TEXT PRIMARY KEY,
  institution TEXT NOT NULL,
  faculty TEXT,
  t_day TEXT NOT NULL,
  n_start_day TEXT,
  n_end_day TEXT,
  a_start_day TEXT,
  a_end_day TEXT,
  exam_periods TEXT NOT NULL DEFAULT '[]' CHECK (json_valid(exam_periods)),
  source_ref TEXT NOT NULL,
  checked_at TEXT NOT NULL,
  club_confirmation_ref TEXT,
  fixed_at TEXT,
  created_at TEXT NOT NULL
) STRICT;

CREATE TABLE club (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  city TEXT NOT NULL,
  exam_calendar_id TEXT REFERENCES exam_calendar(id),
  declared_members INTEGER NOT NULL CHECK (declared_members >= 1),
  members_source_kind TEXT NOT NULL CHECK (members_source_kind IN ('institution', 'board_grant', 'faculty', 'self')),
  members_source_ref TEXT NOT NULL,
  members_fixed_at TEXT,
  prize_eligible INTEGER NOT NULL CHECK (prize_eligible IN (0, 1)),
  agreement_ref TEXT,
  help_resources TEXT NOT NULL DEFAULT '[]' CHECK (json_valid(help_resources)),
  pool TEXT NOT NULL CHECK (pool IN ('lt150', '150_500', 'gt500')),
  join_code TEXT UNIQUE,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'archived')),
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL,
  -- No code without a signed agreement (spec §4.10); a self-reported member count is never prize eligible.
  CHECK (join_code IS NULL OR agreement_ref IS NOT NULL),
  CHECK (members_source_kind <> 'self' OR prize_eligible = 0)
) STRICT;

CREATE TABLE club_board_member (
  user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  club_id TEXT NOT NULL REFERENCES club(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'board' CHECK (role IN ('board', 'contact')),
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY (user_id, club_id)
) STRICT;

-- One open link per user (assumption, architecture §3.4). Links above the code cap wait for the admin.
CREATE TABLE club_membership (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES user(id) ON DELETE SET NULL,
  club_id TEXT NOT NULL REFERENCES club(id),
  linked_at TEXT NOT NULL,
  linked_day TEXT NOT NULL,
  qr_source TEXT,
  left_at TEXT,
  left_day TEXT,
  pending_admin INTEGER NOT NULL DEFAULT 0 CHECK (pending_admin IN (0, 1)),
  decision TEXT CHECK (decision IN ('approve', 'reject')),
  decided_at TEXT,
  ip_hash TEXT,
  net_class TEXT CHECK (net_class IN ('campus', 'mobile_cgnat', 'other')),
  CHECK ((left_at IS NULL) = (left_day IS NULL))
) STRICT;
CREATE UNIQUE INDEX club_membership_one_open ON club_membership (user_id) WHERE left_at IS NULL AND user_id IS NOT NULL;
CREATE INDEX club_membership_club ON club_membership (club_id, linked_day);

CREATE TABLE squad (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  name_status TEXT NOT NULL DEFAULT 'ok' CHECK (name_status IN ('pending', 'ok', 'rejected', 'reported')),
  club_id TEXT REFERENCES club(id),
  calendar_id TEXT REFERENCES exam_calendar(id),
  cohort TEXT NOT NULL CHECK (cohort IN ('experiment', 'expansion')),
  admin_user_id TEXT REFERENCES user(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'building' CHECK (status IN ('building', 'active', 'archived')),
  arm_bonus TEXT CHECK (arm_bonus IN ('A', 'B')),
  arm_belofte TEXT CHECK (arm_belofte IN ('early', 'late')),
  arm_rest TEXT CHECK (arm_rest IN ('rest', 'continue')),
  assignment_block TEXT,
  streak INTEGER NOT NULL DEFAULT 0 CHECK (streak >= 0),
  streak_before_break INTEGER CHECK (streak_before_break IS NULL OR streak_before_break > 0),
  recovery_progress INTEGER NOT NULL DEFAULT 0 CHECK (recovery_progress >= 0),
  low_activity_since_day TEXT,
  regroup_offered_at TEXT,
  last_active_day TEXT,
  became_active_at TEXT,
  merged_into TEXT REFERENCES squad(id),
  created_at TEXT NOT NULL,
  created_day TEXT NOT NULL,
  -- An expansion squad has no arms (architecture §3.4).
  CHECK (cohort = 'experiment' OR (arm_bonus IS NULL AND arm_belofte IS NULL AND arm_rest IS NULL))
) STRICT;

CREATE TABLE squad_membership (
  id TEXT PRIMARY KEY,
  squad_id TEXT NOT NULL REFERENCES squad(id),
  user_id TEXT REFERENCES user(id) ON DELETE SET NULL,
  role TEXT NOT NULL CHECK (role IN ('maker', 'member')),
  joined_at TEXT NOT NULL,
  active_from_day TEXT NOT NULL,
  left_at TEXT,
  left_day TEXT,
  paused_since_day TEXT,
  invite_id TEXT REFERENCES invite(id) ON DELETE SET NULL,
  CHECK ((left_at IS NULL) = (left_day IS NULL))
) STRICT;
CREATE UNIQUE INDEX squad_membership_one_open ON squad_membership (user_id) WHERE left_at IS NULL AND user_id IS NOT NULL;
CREATE INDEX squad_membership_squad ON squad_membership (squad_id);

-- At most six open memberships per squad (spec §4.4 Omvang).
CREATE TRIGGER squad_membership_max_six BEFORE INSERT ON squad_membership
WHEN (SELECT count(*) FROM squad_membership WHERE squad_id = NEW.squad_id AND left_at IS NULL) >= 6
BEGIN
  SELECT RAISE(ABORT, 'squad is full');
END;

CREATE TABLE squad_day (
  squad_id TEXT NOT NULL REFERENCES squad(id),
  focus_day TEXT NOT NULL,
  active_members INTEGER NOT NULL CHECK (active_members >= 0),
  met INTEGER NOT NULL CHECK (met >= 0),
  jokers INTEGER NOT NULL CHECK (jokers >= 0),
  exam_days INTEGER NOT NULL CHECK (exam_days >= 0),
  result TEXT NOT NULL CHECK (result IN ('success', 'fail', 'frozen', 'vacation')),
  recovered INTEGER NOT NULL DEFAULT 0 CHECK (recovered IN (0, 1)),
  streak_after INTEGER NOT NULL CHECK (streak_after >= 0),
  computed_at TEXT NOT NULL,
  PRIMARY KEY (squad_id, focus_day)
) STRICT;

-- Rustdag-joker: one per member per week (spec §4.4). The first day used is kept, so a rerun of
-- the day close finds the same joker.
CREATE TABLE squad_joker (
  user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  week_start TEXT NOT NULL,
  used_day TEXT NOT NULL,
  PRIMARY KEY (user_id, week_start)
) STRICT;

CREATE TABLE squad_merge_request (
  id TEXT PRIMARY KEY,
  from_squad_id TEXT NOT NULL REFERENCES squad(id),
  to_squad_id TEXT NOT NULL REFERENCES squad(id),
  requested_by TEXT REFERENCES user(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'accepted', 'expired')),
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  accepted_at TEXT,
  CHECK (from_squad_id <> to_squad_id)
) STRICT;

-- Name reports (art. 16 DSA): one per reporter per squad; the report itself is a NAME_REPORT flag.
CREATE TABLE squad_name_report (
  squad_id TEXT NOT NULL REFERENCES squad(id),
  reporter_user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  flag_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY (squad_id, reporter_user_id)
) STRICT;

CREATE TABLE duel (
  id TEXT PRIMARY KEY,
  challenger_id TEXT REFERENCES user(id) ON DELETE SET NULL,
  opponent_id TEXT REFERENCES user(id) ON DELETE SET NULL,
  invite_id TEXT REFERENCES invite(id) ON DELETE SET NULL,
  in_squad INTEGER NOT NULL CHECK (in_squad IN (0, 1)),
  status TEXT NOT NULL CHECK (status IN ('open', 'expired', 'running', 'pending_review', 'finished')),
  start_day TEXT,
  end_day TEXT,
  result TEXT CHECK (result IN ('challenger', 'opponent', 'tie')),
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  accepted_at TEXT,
  finished_at TEXT,
  CHECK (result IS NULL OR status = 'finished')
) STRICT;
CREATE INDEX duel_challenger ON duel (challenger_id, status);
CREATE INDEX duel_opponent ON duel (opponent_id, status);

CREATE TABLE challenge (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('club_warmup', 'club_prize', 'performance')),
  title_nl TEXT NOT NULL,
  title_en TEXT NOT NULL,
  period_start_day TEXT NOT NULL,
  period_end_day TEXT NOT NULL,
  pool TEXT CHECK (pool IN ('lt150', '150_500', 'gt500')),
  rules TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(rules)),
  prizes TEXT NOT NULL DEFAULT '[]' CHECK (json_valid(prizes)),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'running', 'review', 'final')),
  created_by TEXT NOT NULL,
  published_by TEXT,
  proposed_by TEXT,
  proposal TEXT CHECK (proposal IS NULL OR json_valid(proposal)),
  final_by TEXT,
  final_confirmed_by TEXT,
  created_at TEXT NOT NULL,
  CHECK (period_start_day <= period_end_day),
  -- Four eyes on the final result (architecture §3.4).
  CHECK (final_confirmed_by IS NULL OR final_confirmed_by <> final_by)
) STRICT;

CREATE TABLE challenge_enrollment (
  id TEXT PRIMARY KEY,
  challenge_id TEXT NOT NULL REFERENCES challenge(id),
  user_id TEXT REFERENCES user(id) ON DELETE SET NULL,
  club_id TEXT REFERENCES club(id),
  seat_no INTEGER CHECK (seat_no IS NULL OR seat_no >= 1),
  enrolled_at TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'enrolled' CHECK (status IN ('enrolled', 'achieved', 'failed', 'verified', 'rejected', 'withdrawn'))
) STRICT;
CREATE UNIQUE INDEX challenge_enrollment_user ON challenge_enrollment (challenge_id, user_id) WHERE user_id IS NOT NULL;
CREATE UNIQUE INDEX challenge_enrollment_seat ON challenge_enrollment (challenge_id, seat_no) WHERE seat_no IS NOT NULL;

-- Club level only, no column per member (architecture §6.2, §6.4).
CREATE TABLE challenge_score (
  challenge_id TEXT NOT NULL REFERENCES challenge(id),
  club_id TEXT NOT NULL REFERENCES club(id),
  week_start TEXT NOT NULL,
  pool TEXT NOT NULL CHECK (pool IN ('lt150', '150_500', 'gt500')),
  participation_rate REAL NOT NULL CHECK (participation_rate >= 0 AND participation_rate <= 1),
  intensity_min REAL NOT NULL CHECK (intensity_min >= 0),
  numerator INTEGER NOT NULL CHECK (numerator >= 0),
  denominator INTEGER NOT NULL CHECK (denominator >= 0),
  linked_members INTEGER NOT NULL CHECK (linked_members >= 0),
  active_members INTEGER NOT NULL CHECK (active_members >= 0),
  anchored_members INTEGER NOT NULL DEFAULT 0 CHECK (anchored_members >= 0),
  rank INTEGER CHECK (rank IS NULL OR rank >= 1),
  is_final INTEGER NOT NULL DEFAULT 0 CHECK (is_final IN (0, 1)),
  computed_at TEXT NOT NULL,
  PRIMARY KEY (challenge_id, club_id, week_start)
) STRICT;

-- Weekly board snapshot per club (architecture §6.4): written by day close step 8 for the week of
-- the closed day, so a finished week never changes afterwards (difference attacks, deletions).
CREATE TABLE club_week_stat (
  club_id TEXT NOT NULL REFERENCES club(id),
  week_start TEXT NOT NULL,
  linked INTEGER NOT NULL CHECK (linked >= 0),
  pending INTEGER NOT NULL CHECK (pending >= 0),
  anchored INTEGER NOT NULL CHECK (anchored >= 0),
  active INTEGER NOT NULL CHECK (active >= 0),
  sessions INTEGER NOT NULL CHECK (sessions >= 0),
  flagged INTEGER NOT NULL CHECK (flagged >= 0),
  by_qr_source TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(by_qr_source)),
  computed_at TEXT NOT NULL,
  PRIMARY KEY (club_id, week_start)
) STRICT;

CREATE TABLE belofte_offer (
  user_id TEXT PRIMARY KEY REFERENCES user(id) ON DELETE CASCADE,
  arm TEXT CHECK (arm IN ('early', 'late')),
  trigger TEXT NOT NULL CHECK (trigger IN ('early', 'late', 'outside')),
  due_day TEXT NOT NULL,
  offered_at TEXT,
  renewal_offered_at TEXT,
  renewal_used_at TEXT
) STRICT;

-- No ledger entry hangs on a Belofte (spec §4.12).
CREATE TABLE belofte (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  days_per_week INTEGER NOT NULL CHECK (days_per_week BETWEEN 3 AND 7),
  min_per_day INTEGER NOT NULL CHECK (min_per_day IN (25, 50, 90, 120)),
  witnesses TEXT NOT NULL CHECK (witnesses IN ('squad', 'none')),
  start_day TEXT NOT NULL,
  end_day TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'stopped')),
  stopped_day TEXT,
  reflection_action TEXT CHECK (reflection_action IN ('extend', 'adjust', 'stop')),
  stake_interest TEXT CHECK (stake_interest IN ('yes', 'no', 'unsure')),
  renewal_of TEXT REFERENCES belofte(id),
  created_at TEXT NOT NULL,
  CHECK (start_day <= end_day)
) STRICT;
CREATE UNIQUE INDEX belofte_one_active ON belofte (user_id) WHERE status = 'active';

CREATE TABLE belofte_day (
  belofte_id TEXT NOT NULL REFERENCES belofte(id) ON DELETE CASCADE,
  focus_day TEXT NOT NULL,
  minutes INTEGER NOT NULL CHECK (minutes >= 0),
  met INTEGER NOT NULL CHECK (met IN (0, 1)),
  computed_at TEXT NOT NULL,
  PRIMARY KEY (belofte_id, focus_day)
) STRICT;

-- Shareable card (spec §4.8): the snapshot holds only the fields the student switched on.
CREATE TABLE card (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('session', 'streak', 'week', 'belofte')),
  ref_id TEXT NOT NULL,
  fields TEXT NOT NULL CHECK (json_valid(fields)),
  snapshot TEXT NOT NULL CHECK (json_valid(snapshot)),
  token TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL,
  revoked_at TEXT
) STRICT;
CREATE INDEX card_ref ON card (kind, ref_id);

CREATE TABLE referral (
  id TEXT PRIMARY KEY,
  invite_id TEXT REFERENCES invite(id) ON DELETE SET NULL,
  inviter_id TEXT REFERENCES user(id) ON DELETE SET NULL,
  invitee_id TEXT REFERENCES user(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'review', 'vested', 'lapsed')),
  created_at TEXT NOT NULL,
  deadline_at TEXT NOT NULL,
  qualifying_sessions INTEGER NOT NULL DEFAULT 0 CHECK (qualifying_sessions >= 0),
  review_reason TEXT,
  vested_at TEXT,
  vested_month TEXT,
  inviter_vested_at TEXT,
  invitee_vested_at TEXT
) STRICT;
CREATE UNIQUE INDEX referral_invitee ON referral (invitee_id) WHERE invitee_id IS NOT NULL;
CREATE INDEX referral_inviter ON referral (inviter_id, status);

-- At most one reminder per user per focus day (architecture §3.4 reminder_log).
CREATE TABLE reminder_log (
  user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  focus_day TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('goal_at_risk', 'streak_at_risk')),
  sent_at TEXT NOT NULL,
  PRIMARY KEY (user_id, focus_day)
) STRICT;

-- Privacy views (architecture §6.4): the compare and witness endpoints read only these.
-- Minutes per member only when both the viewer and the member opted in, inside one open squad.
CREATE VIEW squad_compare_v AS
SELECT v.user_id AS viewer_id, m.user_id AS member_id, m.squad_id AS squad_id, u.first_name AS first_name
  FROM squad_membership v
  JOIN user uv ON uv.id = v.user_id
  JOIN squad_membership m ON m.squad_id = v.squad_id AND m.left_at IS NULL
  JOIN user u ON u.id = m.user_id
 WHERE v.left_at IS NULL AND uv.compare_opt_in = 1 AND u.compare_opt_in = 1;

-- Beloftes of squad members who chose the squad as witness.
CREATE VIEW squad_belofte_v AS
SELECT v.user_id AS viewer_id, b.id AS belofte_id, u.first_name AS first_name, b.days_per_week, b.min_per_day,
       b.start_day, b.end_day, b.status
  FROM squad_membership v
  JOIN squad_membership m ON m.squad_id = v.squad_id AND m.left_at IS NULL
  JOIN user u ON u.id = m.user_id
  JOIN belofte b ON b.user_id = m.user_id AND b.witnesses = 'squad'
 WHERE v.left_at IS NULL;
