-- WP-3: the assignment is locked (architecture §3.5, voorregistratie §9.2). The arm-defining columns
-- of experiment_assignment and arm_switch cannot be changed; only the unit or user id may be
-- replaced by the privacy eraser on DELETE /me (§10.7). A change of arm is a new arm_switch row.

CREATE TRIGGER experiment_assignment_locked BEFORE UPDATE OF unit_type, factor, arm, stratum, block, seed_version, assigned_at ON experiment_assignment
BEGIN
  SELECT RAISE(ABORT, 'experiment_assignment is locked');
END;

CREATE TRIGGER arm_switch_append_only BEFORE UPDATE OF id, factor, "from", "to", reason, effective_from_day, at ON arm_switch
BEGIN
  SELECT RAISE(ABORT, 'arm_switch is append-only');
END;
