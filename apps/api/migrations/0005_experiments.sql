-- WP-3 experiment assignment and arm switches (architecture §3.5, voorregistratie §9).
-- Assignment is deterministic from the seed and locked: rows are never updated (except the id
-- replacement on DELETE /me, §10.7, which is done by the privacy eraser).

CREATE TABLE experiment_assignment (
  unit_type TEXT NOT NULL CHECK (unit_type IN ('squad', 'solo')),
  unit_id TEXT NOT NULL,
  factor TEXT NOT NULL CHECK (factor IN ('bonus', 'belofte', 'rest', 'prompt')),
  arm TEXT NOT NULL,
  stratum TEXT NOT NULL,
  block TEXT NOT NULL,
  seed_version TEXT NOT NULL,
  assigned_at TEXT NOT NULL,
  PRIMARY KEY (unit_type, unit_id, factor),
  CHECK (
    (factor = 'bonus' AND arm IN ('A', 'B')) OR
    (factor = 'belofte' AND arm IN ('early', 'late')) OR
    (factor = 'rest' AND arm IN ('rest', 'continue')) OR
    (factor = 'prompt' AND arm IN ('strong', 'standard'))
  )
) STRICT;
CREATE INDEX experiment_assignment_stratum ON experiment_assignment (factor, stratum, block);

CREATE TABLE arm_switch (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  factor TEXT NOT NULL CHECK (factor IN ('bonus', 'belofte', 'rest', 'prompt', 'calendar')),
  "from" TEXT NOT NULL,
  "to" TEXT NOT NULL,
  reason TEXT NOT NULL CHECK (reason IN ('join', 'merge', 'minor', 'opt_out', 'arm_b_stopped')),
  effective_from_day TEXT,
  at TEXT NOT NULL
) STRICT;
CREATE INDEX arm_switch_user ON arm_switch (user_id, factor, at);
