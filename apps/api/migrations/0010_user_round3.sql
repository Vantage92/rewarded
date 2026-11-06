-- Round 3 columns on user and the new arm_switch reasons (architecture §3.1, §3.5, §12.3, §12.5).
-- rest_arm_fixed: the rest arm belongs to the person from T − 6 of the unit's calendar (spec §3.16 step 2).
-- rest_exit_source: how the user left the rest period (button in a notice, profile, or a squad switch).
ALTER TABLE user ADD COLUMN rest_arm_fixed TEXT CHECK (rest_arm_fixed IN ('rest', 'continue'));
ALTER TABLE user ADD COLUMN rest_exit_source TEXT CHECK (rest_exit_source IN ('notice', 'april_notice', 'profile', 'squad_switch'));

-- arm_switch.reason gets rest_flag_off and squad_switch. SQLite cannot alter a CHECK, so the table
-- is rebuilt with the same rows; the append-only trigger of 0006 is recreated.
CREATE TABLE arm_switch_v2 (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  factor TEXT NOT NULL CHECK (factor IN ('bonus', 'belofte', 'rest', 'prompt', 'calendar')),
  "from" TEXT NOT NULL,
  "to" TEXT NOT NULL,
  reason TEXT NOT NULL CHECK (reason IN ('join', 'merge', 'minor', 'opt_out', 'arm_b_stopped', 'rest_flag_off', 'squad_switch')),
  effective_from_day TEXT,
  at TEXT NOT NULL
) STRICT;
INSERT INTO arm_switch_v2 (id, user_id, factor, "from", "to", reason, effective_from_day, at)
  SELECT id, user_id, factor, "from", "to", reason, effective_from_day, at FROM arm_switch;
DROP TABLE arm_switch;
ALTER TABLE arm_switch_v2 RENAME TO arm_switch;
CREATE INDEX arm_switch_user ON arm_switch (user_id, factor, at);
CREATE TRIGGER arm_switch_append_only BEFORE UPDATE OF id, factor, "from", "to", reason, effective_from_day, at ON arm_switch
BEGIN
  SELECT RAISE(ABORT, 'arm_switch is append-only');
END;
