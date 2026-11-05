-- WP-4 sessions and signals (architecture §3.2, §4). Instants in this file are integer milliseconds
-- (server time, UTC); monotonic readings are REAL milliseconds from the client.

CREATE TABLE focus_session (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  device_id TEXT NOT NULL REFERENCES device(id),
  planned_min INTEGER NOT NULL CHECK (planned_min IN (1, 25, 50, 90)),
  is_practice INTEGER NOT NULL CHECK (is_practice IN (0, 1)),
  status TEXT NOT NULL CHECK (status IN ('active', 'completed', 'aborted')),
  server_start_at INTEGER NOT NULL,
  planned_end_at INTEGER NOT NULL,
  server_end_at INTEGER,
  end_received_at INTEGER,
  end_mono_ms REAL,
  end_client_ts INTEGER,
  abort_reason TEXT CHECK (abort_reason IN ('hidden', 'heartbeat_gap', 'user_stop', 'second_session', 'late_end')),
  abort_at INTEGER,
  verified_min INTEGER NOT NULL DEFAULT 0,
  counted_min INTEGER NOT NULL DEFAULT 0,
  focus_day TEXT NOT NULL,
  late_start INTEGER NOT NULL CHECK (late_start IN (0, 1)),
  review_status TEXT NOT NULL DEFAULT 'none' CHECK (review_status IN ('none', 'pending', 'released', 'rejected')),
  flag_codes TEXT NOT NULL DEFAULT '[]' CHECK (json_valid(flag_codes)),
  verification_level INTEGER NOT NULL DEFAULT 1 CHECK (verification_level = 1),
  nonce_hash TEXT NOT NULL,
  prev_nonce_hash TEXT,
  last_seq INTEGER NOT NULL DEFAULT 0,
  last_response TEXT CHECK (last_response IS NULL OR json_valid(last_response)),
  start_idempotency_key TEXT,
  mono_start_ms REAL NOT NULL,
  verdict TEXT CHECK (verdict IS NULL OR json_valid(verdict)),
  closed_by TEXT CHECK (closed_by IN ('end', 'stop', 'sweep', 'events', 'second_session', 'restore')),
  last_heartbeat_at INTEGER NOT NULL,
  covered_gap_s INTEGER NOT NULL DEFAULT 0,
  clock_skew_ms INTEGER,
  claim_delay_s INTEGER,
  webdriver INTEGER NOT NULL DEFAULT 0 CHECK (webdriver IN (0, 1)),
  standalone INTEGER NOT NULL DEFAULT 0 CHECK (standalone IN (0, 1)),
  ua_class TEXT NOT NULL,
  ip_hash TEXT,
  net_class TEXT CHECK (net_class IN ('campus', 'mobile_cgnat', 'other')),
  restored_by TEXT,
  restored_reason TEXT CHECK (restored_reason IN ('outage', 'late_log', 'appeal_upheld')),
  reported_at INTEGER,
  CHECK (is_practice = (planned_min = 1)),
  -- verified_min = planned_min only for completed non-practice sessions (architecture §3.2)
  CHECK ((status = 'completed' AND is_practice = 0 AND verified_min = planned_min) OR (NOT (status = 'completed' AND is_practice = 0) AND verified_min = 0)),
  CHECK (counted_min >= 0 AND counted_min <= verified_min),
  CHECK ((status = 'aborted') = (abort_reason IS NOT NULL)),
  CHECK (status = 'completed' OR review_status = 'none')
) STRICT;
-- At most one active session per user (spec §4.1 "Eén sessie tegelijk").
CREATE UNIQUE INDEX focus_session_one_active ON focus_session (user_id) WHERE status = 'active';
CREATE INDEX focus_session_user_day ON focus_session (user_id, focus_day);
CREATE INDEX focus_session_start ON focus_session (server_start_at);
CREATE INDEX focus_session_open ON focus_session (planned_end_at) WHERE status = 'active';

-- Daily cap (spec §4.2): Σ counted_min per user per focus day ≤ 300.
CREATE TRIGGER focus_session_daily_cap AFTER UPDATE OF counted_min ON focus_session
WHEN (SELECT SUM(counted_min) FROM focus_session WHERE user_id = NEW.user_id AND focus_day = NEW.focus_day) > 300
BEGIN
  SELECT RAISE(ABORT, 'daily cap of 300 counted minutes exceeded');
END;

CREATE TABLE session_heartbeat (
  session_id TEXT NOT NULL REFERENCES focus_session(id) ON DELETE CASCADE,
  seq INTEGER NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('online', 'buffered', 'resume')),
  server_recv_at INTEGER NOT NULL,
  client_ts INTEGER NOT NULL,
  mono_ms REAL NOT NULL,
  visibility TEXT NOT NULL CHECK (visibility IN ('visible', 'hidden')),
  wakelock TEXT NOT NULL CHECK (wakelock IN ('acquired', 'denied', 'released', 'unsupported')),
  nonce_ok INTEGER NOT NULL CHECK (nonce_ok IN (0, 1)),
  buffered INTEGER NOT NULL CHECK (buffered IN (0, 1)),
  PRIMARY KEY (session_id, seq, kind)
) STRICT;

CREATE TABLE visibility_event (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES focus_session(id) ON DELETE CASCADE,
  ev_seq INTEGER NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('visible', 'hidden', 'pagehide', 'pageshow', 'blur', 'focus', 'wakelock_acquired',
    'wakelock_denied', 'wakelock_released', 'online', 'offline', 'first_interaction_after_end')),
  mono_ms REAL NOT NULL,
  client_ts INTEGER NOT NULL,
  server_recv_at INTEGER NOT NULL,
  buffered INTEGER NOT NULL CHECK (buffered IN (0, 1)),
  persisted INTEGER CHECK (persisted IN (0, 1)),
  nav_type TEXT CHECK (nav_type IN ('navigate', 'reload', 'back_forward', 'prerender')),
  UNIQUE (session_id, ev_seq)
) STRICT;

-- Summary that outlives the raw rows (architecture §3.2, §10.6).
CREATE TABLE session_summary (
  session_id TEXT PRIMARY KEY REFERENCES focus_session(id) ON DELETE CASCADE,
  hidden_count INTEGER NOT NULL,
  max_gap_s INTEGER NOT NULL,
  covered_gap_s INTEGER NOT NULL,
  wakelock_states TEXT NOT NULL CHECK (json_valid(wakelock_states)),
  skew_ms INTEGER,
  claim_delay_s INTEGER
) STRICT;
