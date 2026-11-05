-- WP-3 identity, access and waitlist (architecture §3.1). Timestamps are ISO-8601 UTC text,
-- focus days are YYYY-MM-DD. No birth date, raw IP or raw phone number is ever stored (§10.4).

CREATE TABLE user (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  email_norm_hash TEXT NOT NULL UNIQUE,
  first_name TEXT NOT NULL,
  last_name TEXT,
  locale TEXT NOT NULL CHECK (locale IN ('nl', 'en')),
  age_band TEXT NOT NULL CHECK (age_band IN ('16_17', '18_plus')),
  turns_18_on TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'blocked', 'deleted')),
  is_team INTEGER NOT NULL DEFAULT 0 CHECK (is_team IN (0, 1)),
  pseudonym TEXT NOT NULL UNIQUE,
  registration_source TEXT NOT NULL CHECK (registration_source IN ('squad', 'duel', 'club', 'personal', 'ambassador', 'waitlist', 'card')),
  registration_invite_id TEXT REFERENCES invite(id) ON DELETE SET NULL,
  registration_ip_hash TEXT,
  registration_net_class TEXT CHECK (registration_net_class IN ('campus', 'mobile_cgnat', 'other')),
  daily_goal_min INTEGER NOT NULL CHECK (daily_goal_min IN (25, 50, 90, 120)),
  daily_goal_next INTEGER CHECK (daily_goal_next IN (25, 50, 90, 120)),
  daily_goal_next_from TEXT,
  compare_opt_in INTEGER NOT NULL DEFAULT 0 CHECK (compare_opt_in IN (0, 1)),
  silent_mode INTEGER NOT NULL DEFAULT 0 CHECK (silent_mode IN (0, 1)),
  squad_name_on_cards INTEGER NOT NULL DEFAULT 0 CHECK (squad_name_on_cards IN (0, 1)),
  no_points_mode INTEGER NOT NULL DEFAULT 0 CHECK (no_points_mode IN (0, 1)),
  email_reminders INTEGER NOT NULL DEFAULT 1 CHECK (email_reminders IN (0, 1)),
  phone_hash TEXT,
  phone_line_type TEXT CHECK (phone_line_type IN ('mobile')),
  phone_verified_at TEXT,
  institution_domain TEXT,
  institution_verified_at TEXT,
  wellbeing_consent_at TEXT,
  earn_in_reached_at TEXT,
  first_redeem_after TEXT,
  research_opt_out_at TEXT,
  rest_exit_at TEXT,
  cohort TEXT NOT NULL CHECK (cohort IN ('experiment', 'expansion')),
  registration_channel TEXT NOT NULL CHECK (registration_channel IN ('club', 'squad_invite', 'ambassador', 'waitlist', 'other')),
  terms_version TEXT NOT NULL,
  privacy_version TEXT NOT NULL,
  research_info_version TEXT NOT NULL,
  created_at TEXT NOT NULL,
  -- turns_18_on only for 16_17 (architecture §3.1)
  CHECK (turns_18_on IS NULL OR age_band = '16_17'),
  CHECK (daily_goal_next IS NULL OR daily_goal_next_from IS NOT NULL)
) STRICT;
CREATE INDEX user_turns_18 ON user (turns_18_on) WHERE turns_18_on IS NOT NULL;

CREATE TABLE invite (
  id TEXT PRIMARY KEY,
  token TEXT NOT NULL UNIQUE,
  source TEXT NOT NULL CHECK (source IN ('squad', 'duel', 'club', 'personal', 'ambassador', 'waitlist', 'card')),
  creator_user_id TEXT REFERENCES user(id) ON DELETE SET NULL,
  -- squad, duel and club live in later series (0200); no foreign key may point upwards (§12.3).
  squad_id TEXT,
  duel_id TEXT,
  club_id TEXT,
  waitlist_entry_id TEXT,
  qr_source TEXT,
  max_uses INTEGER NOT NULL CHECK (max_uses >= 1),
  uses INTEGER NOT NULL DEFAULT 0 CHECK (uses >= 0),
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  CHECK (uses <= max_uses)
) STRICT;

CREATE TABLE waitlist_entry (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  email_hash TEXT NOT NULL UNIQUE,
  locale TEXT NOT NULL CHECK (locale IN ('nl', 'en')),
  source TEXT NOT NULL CHECK (source IN ('landing', 'card', 'club_qr', 'ambassador', 'creator', 'other')),
  group_token TEXT NOT NULL,
  club_hint TEXT,
  priority_reason TEXT NOT NULL CHECK (priority_reason IN ('group', 'club', 'card', 'none')),
  consent_version TEXT NOT NULL,
  created_at TEXT NOT NULL,
  invited_at TEXT,
  invite_id TEXT REFERENCES invite(id) ON DELETE SET NULL,
  ip_hash TEXT,
  net_class TEXT CHECK (net_class IN ('campus', 'mobile_cgnat', 'other'))
) STRICT;
CREATE INDEX waitlist_group ON waitlist_entry (group_token);
CREATE INDEX waitlist_waiting ON waitlist_entry (priority_reason, created_at) WHERE invited_at IS NULL;

CREATE TABLE auth_magic_link (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  code_hash TEXT NOT NULL,
  invite_token TEXT,
  locale TEXT NOT NULL CHECK (locale IN ('nl', 'en')),
  ip_hash TEXT,
  net_class TEXT CHECK (net_class IN ('campus', 'mobile_cgnat', 'other')),
  created_at TEXT NOT NULL,
  created_day TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  used_at TEXT,
  used_via TEXT CHECK (used_via IN ('link', 'code')),
  CHECK ((used_at IS NULL) = (used_via IS NULL))
) STRICT;
CREATE INDEX auth_magic_link_email ON auth_magic_link (email, created_at);
CREATE INDEX auth_magic_link_day ON auth_magic_link (created_day);

-- No personal data: KPI of the login flow (§10.1).
CREATE TABLE auth_daily_stat (
  day TEXT PRIMARY KEY,
  requested INTEGER NOT NULL DEFAULT 0,
  consumed_link INTEGER NOT NULL DEFAULT 0,
  consumed_code INTEGER NOT NULL DEFAULT 0,
  expired INTEGER NOT NULL DEFAULT 0,
  invalid INTEGER NOT NULL DEFAULT 0
) STRICT;

CREATE TABLE auth_session (
  id TEXT PRIMARY KEY, -- SHA-256 of the cookie value
  user_id TEXT REFERENCES user(id) ON DELETE CASCADE,
  pending_email TEXT,
  pre_pseudonym TEXT,
  invite_token TEXT,
  csrf_hash TEXT,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  last_seen_at TEXT NOT NULL,
  ua_class TEXT NOT NULL,
  mfa_at TEXT,
  -- user_id or pending_email, never both (§3.1)
  CHECK ((user_id IS NULL) <> (pending_email IS NULL)),
  CHECK (pending_email IS NULL OR pre_pseudonym IS NOT NULL)
) STRICT;
CREATE INDEX auth_session_user ON auth_session (user_id);
CREATE INDEX auth_session_pending ON auth_session (pending_email);

CREATE TABLE admin (
  user_id TEXT PRIMARY KEY REFERENCES user(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('reviewer', 'admin')),
  created_at TEXT NOT NULL,
  created_by TEXT NOT NULL
) STRICT;

CREATE TABLE admin_mfa (
  user_id TEXT PRIMARY KEY REFERENCES user(id) ON DELETE CASCADE,
  totp_secret_enc TEXT NOT NULL,
  enrolled_at TEXT,
  last_used_step INTEGER
) STRICT;

CREATE TABLE device (
  id TEXT PRIMARY KEY,
  client_device_id TEXT NOT NULL,
  user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  ua_class TEXT NOT NULL,
  standalone INTEGER NOT NULL DEFAULT 0 CHECK (standalone IN (0, 1)),
  wakelock_supported INTEGER NOT NULL DEFAULT 0 CHECK (wakelock_supported IN (0, 1)),
  first_seen_at TEXT NOT NULL,
  last_seen_at TEXT NOT NULL,
  max_verification_level INTEGER NOT NULL DEFAULT 1 CHECK (max_verification_level = 1),
  attestation_kind TEXT,
  attestation_ref TEXT,
  UNIQUE (client_device_id, user_id)
) STRICT;
