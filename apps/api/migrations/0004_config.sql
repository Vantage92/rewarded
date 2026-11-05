-- WP-3 feature flags, parameter sets, vacation pause and outages (architecture §3.2, §3.5).
-- Every change writes an audit line (done by the owning route).

CREATE TABLE feature_flag (
  key TEXT PRIMARY KEY CHECK (key IN ('referral', 'cards', 'duels', 'belofte', 'arm_b', 'rest_period', 'squad_prompt',
    'no_points_mode', 'competence_feedback', 'plus_door', 'reminders', 'expansion', 'draws')),
  enabled INTEGER NOT NULL DEFAULT 0 CHECK (enabled IN (0, 1)),
  updated_at TEXT NOT NULL,
  updated_by TEXT NOT NULL,
  -- draws is an empty placeholder and can never be enabled (product plan §0.3)
  CHECK (key <> 'draws' OR enabled = 0)
) STRICT;

CREATE TABLE param_set (
  version INTEGER PRIMARY KEY,
  params TEXT NOT NULL CHECK (json_valid(params)),
  effective_from TEXT NOT NULL,
  created_at TEXT NOT NULL,
  created_by TEXT NOT NULL
) STRICT;

CREATE TABLE vacation_pause (
  id TEXT PRIMARY KEY,
  first_day TEXT NOT NULL,
  last_day TEXT NOT NULL,
  created_at TEXT NOT NULL,
  created_by TEXT NOT NULL,
  CHECK (first_day <= last_day)
) STRICT;

CREATE TABLE outage (
  id TEXT PRIMARY KEY,
  "from" TEXT NOT NULL,
  "to" TEXT NOT NULL,
  note TEXT,
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL,
  CHECK ("from" < "to")
) STRICT;
