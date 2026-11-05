-- WP-3 audit log and event log (architecture §3.5, §8.1, §10.8).

CREATE TABLE audit_log (
  id TEXT PRIMARY KEY,
  actor_ref TEXT NOT NULL,
  action TEXT NOT NULL,
  object_type TEXT NOT NULL,
  object_ref TEXT NOT NULL,
  reason TEXT,
  at TEXT NOT NULL,
  net_class TEXT CHECK (net_class IN ('campus', 'mobile_cgnat', 'other'))
) STRICT;
CREATE INDEX audit_log_at ON audit_log (at);
CREATE INDEX audit_log_action ON audit_log (action, at);

-- Append-only: no update, no delete (§10.8). Retention (2 years, §10.6) needs a migration that
-- names its rule explicitly; there is no switch to turn these off.
CREATE TRIGGER audit_log_no_update BEFORE UPDATE ON audit_log
BEGIN
  SELECT RAISE(ABORT, 'audit_log is append-only');
END;
CREATE TRIGGER audit_log_no_delete BEFORE DELETE ON audit_log
BEGIN
  SELECT RAISE(ABORT, 'audit_log is append-only');
END;

CREATE TABLE event (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  pseudonym TEXT,
  server_at TEXT NOT NULL,
  props TEXT NOT NULL CHECK (json_valid(props)),
  release TEXT NOT NULL,
  arm_bonus TEXT CHECK (arm_bonus IN ('A', 'B')),
  arm_belofte TEXT CHECK (arm_belofte IN ('early', 'late')),
  arm_rest TEXT CHECK (arm_rest IN ('rest', 'continue')),
  arm_prompt TEXT CHECK (arm_prompt IN ('strong', 'standard', 'na')),
  channel TEXT,
  squad_id TEXT,
  calendar_id TEXT,
  cohort TEXT CHECK (cohort IN ('experiment', 'expansion'))
) STRICT;
CREATE INDEX event_name_at ON event (name, server_at);
CREATE INDEX event_pseudonym ON event (pseudonym);

CREATE TABLE event_pending (
  id TEXT PRIMARY KEY,
  pre_pseudonym TEXT NOT NULL,
  name TEXT NOT NULL,
  server_at TEXT NOT NULL,
  props TEXT NOT NULL CHECK (json_valid(props))
) STRICT;
CREATE INDEX event_pending_pre ON event_pending (pre_pseudonym);
CREATE INDEX event_pending_at ON event_pending (server_at);
