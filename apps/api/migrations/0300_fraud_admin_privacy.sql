-- WP-6 fraud, review, prizes, samples, harm signals, ambassadors and support (architecture §3.2,
-- §3.4, §3.5, §6.5, §10.6–10.8). The draw_* tables of architecture v1.1 are not built (§7).

-- Sessions and accounts a flag touches (one row per touched session; account flags without session).
CREATE TABLE fraud_flag_session (
  flag_id TEXT NOT NULL REFERENCES fraud_flag(id) ON DELETE CASCADE,
  session_id TEXT REFERENCES focus_session(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES user(id) ON DELETE CASCADE,
  CHECK (session_id IS NOT NULL OR user_id IS NOT NULL)
) STRICT;
CREATE UNIQUE INDEX fraud_flag_session_pair ON fraud_flag_session (flag_id, session_id) WHERE session_id IS NOT NULL;
CREATE INDEX fraud_flag_session_session ON fraud_flag_session (session_id);
CREATE INDEX fraud_flag_session_user ON fraud_flag_session (user_id);

-- No user_id: survives DELETE /me so H8 still works (architecture §3.2, §10.7); 2 years (§10.6).
CREATE TABLE blocked_phone_hash (
  phone_hash TEXT PRIMARY KEY,
  blocked_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  flag_id TEXT REFERENCES fraud_flag(id) ON DELETE SET NULL
) STRICT;

-- Same for the institution address after a confirmed block (architecture §10.6, round 3).
CREATE TABLE blocked_institution_hash (
  institution_email_hash TEXT PRIMARY KEY,
  blocked_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  flag_id TEXT REFERENCES fraud_flag(id) ON DELETE SET NULL
) STRICT;

-- Institution anchor unique per address (spec §4.10; architecture §10.4). The address itself is
-- never stored; HMAC with a unique index.
ALTER TABLE user ADD COLUMN institution_email_hash TEXT;
ALTER TABLE user ADD COLUMN institution_reconfirm_due INTEGER NOT NULL DEFAULT 0 CHECK (institution_reconfirm_due IN (0, 1));
CREATE UNIQUE INDEX user_institution_email_hash ON user (institution_email_hash) WHERE institution_email_hash IS NOT NULL;

-- Domain list of the pilot institutions (spec §4.6 "domeinlijst"); filled by the team.
CREATE TABLE institution_domain (
  domain TEXT PRIMARY KEY CHECK (domain = lower(domain)),
  institution TEXT NOT NULL,
  added_by TEXT NOT NULL,
  added_at TEXT NOT NULL
) STRICT;

-- Pending code for the institution address: anchor, reconfirmation or sample contact (§6.5).
CREATE TABLE institution_verification (
  user_id TEXT PRIMARY KEY REFERENCES user(id) ON DELETE CASCADE,
  purpose TEXT NOT NULL CHECK (purpose IN ('anchor', 'reconfirm', 'sample')),
  email_hash TEXT NOT NULL,
  domain TEXT NOT NULL,
  code_hash TEXT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL
) STRICT;

CREATE TABLE fraud_sample (
  id TEXT PRIMARY KEY,
  kind TEXT NOT NULL CHECK (kind IN ('weekly', 'prize', 'ambassador')),
  week_key TEXT NOT NULL,
  month_key TEXT,
  challenge_id TEXT REFERENCES challenge(id),
  club_id TEXT REFERENCES club(id),
  ambassador_id TEXT,
  seed_version TEXT NOT NULL,
  size INTEGER NOT NULL CHECK (size >= 0),
  allocation TEXT NOT NULL DEFAULT '[]' CHECK (json_valid(allocation)),
  drawn_at TEXT NOT NULL
) STRICT;
CREATE UNIQUE INDEX fraud_sample_weekly ON fraud_sample (week_key) WHERE kind = 'weekly';
CREATE UNIQUE INDEX fraud_sample_prize ON fraud_sample (challenge_id, club_id) WHERE kind = 'prize';
CREATE UNIQUE INDEX fraud_sample_ambassador ON fraud_sample (ambassador_id, month_key) WHERE kind = 'ambassador';

CREATE TABLE fraud_sample_item (
  id TEXT PRIMARY KEY,
  sample_id TEXT NOT NULL REFERENCES fraud_sample(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES user(id) ON DELETE SET NULL,
  stratum TEXT NOT NULL,
  score TEXT NOT NULL,
  checks TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(checks)),
  judgement TEXT NOT NULL DEFAULT 'none' CHECK (judgement IN ('none', 'suspect', 'fraud')),
  reason_code TEXT,
  judged_by TEXT,
  judged_at TEXT,
  interest_declared_by TEXT,
  reassigned_to TEXT,
  contact_requested_at TEXT,
  contact_confirmed_at TEXT,
  contact_channel TEXT CHECK (contact_channel IN ('institution', 'account')),
  address_mismatch INTEGER NOT NULL DEFAULT 0 CHECK (address_mismatch IN (0, 1)),
  practice_session_id TEXT,
  flag_id TEXT REFERENCES fraud_flag(id) ON DELETE SET NULL,
  CHECK ((judged_at IS NULL) = (judged_by IS NULL)),
  CHECK (judged_at IS NULL OR reason_code IS NOT NULL),
  -- Whoever declared an interest cannot judge the item (jurist should-fix 6).
  CHECK (interest_declared_by IS NULL OR judged_by IS NULL OR judged_by <> interest_declared_by),
  CHECK (reassigned_to IS NULL OR reassigned_to <> interest_declared_by)
) STRICT;
CREATE INDEX fraud_sample_item_sample ON fraud_sample_item (sample_id);
CREATE INDEX fraud_sample_item_user ON fraud_sample_item (user_id);

-- Earned prizes only (spec §4.7). `drawn` stays in the CHECK as an empty place without a route (§7).
CREATE TABLE prize (
  id TEXT PRIMARY KEY,
  kind TEXT NOT NULL CHECK (kind IN ('earned_collective', 'earned_individual', 'drawn')),
  tier TEXT CHECK (tier IN ('main', 'threshold')),
  reward_kind TEXT NOT NULL CHECK (reward_kind IN ('in_kind', 'service')),
  challenge_id TEXT REFERENCES challenge(id),
  sample_id TEXT REFERENCES fraud_sample(id),
  description_nl TEXT,
  description_en TEXT,
  value_cents INTEGER NOT NULL CHECK (value_cents > 0),
  partner_id TEXT,
  allocation_id TEXT,
  declaration_ref TEXT NOT NULL,
  min_age_band TEXT NOT NULL CHECK (min_age_band IN ('16_17', '18_plus')),
  winner_user_id TEXT REFERENCES user(id) ON DELETE SET NULL,
  winner_club_id TEXT REFERENCES club(id),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'candidate', 'verified', 'delivered', 'rejected')),
  verified_by TEXT,
  verified_at TEXT,
  age_checked_by TEXT,
  age_checked_at TEXT,
  age_check_outcome TEXT CHECK (age_check_outcome IN ('ok', 'failed')),
  -- Outcome, date and checker only; never a copy or the kind of the identity document (spec §4.7).
  verification_checks TEXT CHECK (verification_checks IS NULL OR json_valid(verification_checks)),
  delivery_contact_ref TEXT,
  deliver_after TEXT,
  delivered_at TEXT,
  month_key TEXT,
  created_at TEXT NOT NULL,
  -- WP-4 counts prizes in the monthly ceiling as `prize.user_id` (redemptions module).
  user_id TEXT GENERATED ALWAYS AS (winner_user_id) VIRTUAL,
  -- Ceilings in cents (spec §4.3): individual ≤ 1,000; main ≤ 15,000; threshold ≤ 7,500.
  CHECK (kind <> 'earned_individual' OR value_cents <= 1000),
  CHECK (kind <> 'earned_collective' OR (tier = 'threshold' AND value_cents <= 7500) OR (tier = 'main' AND value_cents <= 15000)),
  -- An 18+ prize is never verified without a successful age check (architecture §3.4).
  CHECK (status NOT IN ('verified', 'delivered') OR min_age_band <> '18_plus' OR age_check_outcome = 'ok'),
  CHECK (status NOT IN ('verified', 'delivered') OR (verified_by IS NOT NULL AND deliver_after IS NOT NULL)),
  CHECK (delivered_at IS NULL OR delivered_at >= deliver_after)
) STRICT;
CREATE INDEX prize_challenge ON prize (challenge_id, status);
CREATE INDEX prize_winner_month ON prize (winner_user_id, month_key);

-- Name and address for delivery (spec §4.7 step 5); deleted 30 days after delivery (§10.6).
CREATE TABLE prize_delivery_contact (
  id TEXT PRIMARY KEY,
  prize_id TEXT NOT NULL UNIQUE REFERENCES prize(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  address TEXT NOT NULL,
  created_at TEXT NOT NULL
) STRICT;

-- Harm signals (spec §6.6): no fraud consequence; at most one per code per 14 days; the team only
-- sees counts per arm. The arm columns are a snapshot so counts survive a later arm switch.
CREATE TABLE harm_signal (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES user(id) ON DELETE CASCADE,
  code TEXT NOT NULL CHECK (code IN ('S1', 'S2', 'S3', 'S4')),
  focus_day TEXT NOT NULL,
  week_key TEXT NOT NULL,
  arm_bonus TEXT CHECK (arm_bonus IN ('A', 'B')),
  arm_rest TEXT CHECK (arm_rest IN ('rest', 'continue')),
  created_at TEXT NOT NULL,
  card_shown_at TEXT,
  help_opened_at TEXT
) STRICT;
CREATE UNIQUE INDEX harm_signal_day ON harm_signal (user_id, code, focus_day);
CREATE INDEX harm_signal_week ON harm_signal (week_key, code);

-- Weekly outcome of the stop rule, guard rule and absolute harm threshold (architecture §6.1).
CREATE TABLE harm_week (
  week_key TEXT PRIMARY KEY,
  actives INTEGER NOT NULL,
  with_signal INTEGER NOT NULL,
  per_code TEXT NOT NULL CHECK (json_valid(per_code)),
  per_arm TEXT NOT NULL CHECK (json_valid(per_arm)),
  absolute_exceeded INTEGER NOT NULL CHECK (absolute_exceeded IN (0, 1)),
  stop_rule TEXT NOT NULL CHECK (json_valid(stop_rule)),
  guard_rule TEXT NOT NULL CHECK (json_valid(guard_rule)),
  computed_at TEXT NOT NULL
) STRICT;

CREATE TABLE ambassador (
  id TEXT PRIMARY KEY,
  code_invite_id TEXT NOT NULL UNIQUE REFERENCES invite(id),
  name_ref TEXT NOT NULL,
  -- Must be empty for a participating club (spec §4.9); the route checks it.
  is_board_member_of TEXT REFERENCES club(id),
  cap_users INTEGER NOT NULL CHECK (cap_users >= 1),
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL
) STRICT;

CREATE TABLE ambassador_payout (
  id TEXT PRIMARY KEY,
  ambassador_id TEXT NOT NULL REFERENCES ambassador(id),
  month_key TEXT NOT NULL,
  sample_id TEXT REFERENCES fraud_sample(id),
  counted_users INTEGER,
  status TEXT NOT NULL CHECK (status IN ('sampled', 'proposed', 'recorded')),
  proposed_by TEXT,
  recorded_by TEXT,
  created_at TEXT NOT NULL,
  recorded_at TEXT,
  CHECK (recorded_by IS NULL OR recorded_by <> proposed_by),
  UNIQUE (ambassador_id, month_key)
) STRICT;

-- Support tickets with a label (spec §7.3). The label "welzijn" is a health datum (spec §4.10): only
-- the assigned team member sees it; text goes 90 days after resolution (§10.6).
CREATE TABLE support_ticket (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES user(id) ON DELETE SET NULL,
  kind TEXT NOT NULL CHECK (kind IN ('redemption_broken', 'session', 'other', 'external')),
  ref_id TEXT,
  text TEXT,
  label TEXT CHECK (label IN ('uitbetalen', 'focus', 'vrienden', 'techniek', 'welzijn')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved')),
  assigned_to TEXT,
  received_on TEXT,
  created_at TEXT NOT NULL,
  labeled_at TEXT,
  resolved_at TEXT,
  text_cleared_at TEXT
) STRICT;
CREATE INDEX support_ticket_status ON support_ticket (status, created_at);

-- Weekly aggregate of raw events after 15 June 2027 (architecture §10.6, founder JS5).
CREATE TABLE event_week_aggregate (
  week_key TEXT NOT NULL,
  name TEXT NOT NULL,
  arm_bonus TEXT NOT NULL DEFAULT '',
  arm_rest TEXT NOT NULL DEFAULT '',
  channel TEXT NOT NULL DEFAULT '',
  release TEXT NOT NULL,
  n INTEGER NOT NULL,
  PRIMARY KEY (week_key, name, arm_bonus, arm_rest, channel, release)
) STRICT;

-- Aggregate of survey answers and harm signals per arm and moment after the same date (§10.6).
CREATE TABLE research_aggregate (
  kind TEXT NOT NULL CHECK (kind IN ('survey', 'harm')),
  week_key TEXT NOT NULL,
  key TEXT NOT NULL,
  arm TEXT NOT NULL DEFAULT '',
  n INTEGER NOT NULL,
  PRIMARY KEY (kind, week_key, key, arm)
) STRICT;

-- Audit log retention (§10.6: 2 years). The append-only triggers of 0002 stay; this named rule
-- lets the retention step delete rows older than a cut-off it sets, and nothing else.
CREATE TABLE audit_retention (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  cutoff TEXT NOT NULL
) STRICT;
DROP TRIGGER audit_log_no_delete;
CREATE TRIGGER audit_log_no_delete BEFORE DELETE ON audit_log
WHEN OLD.at >= coalesce((SELECT cutoff FROM audit_retention WHERE id = 1), '')
BEGIN
  SELECT RAISE(ABORT, 'audit_log is append-only');
END;
