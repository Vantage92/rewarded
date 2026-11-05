-- WP-6 fraud queue base (architecture §3.2, §10.8, §12.3): fraud_flag and appeal live in the base
-- series so later series can refer to them. Flags are raised by heuristics or reports and only
-- closed by a human; the one exception is `closed` with reason `account_deleted` (§10.7).

CREATE TABLE fraud_flag (
  id TEXT PRIMARY KEY,
  subject_type TEXT NOT NULL CHECK (subject_type IN ('session', 'account', 'squad', 'club')),
  -- session/user/squad/club id; NULL after DELETE /me of the subject account (§10.7)
  subject_id TEXT,
  code TEXT NOT NULL CHECK (code IN ('H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'H7', 'H8', 'H9', 'H10', 'H11', 'H12',
    'USER_REPORT', 'NAME_REPORT', 'SAMPLE', 'OUTAGE')),
  evidence TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(evidence)),
  evidence_reduced_at TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'released', 'rejected', 'blocked', 'closed')),
  -- A batch heuristic writes one flag per key, so reruns of a job are idempotent (§6.1).
  dedup_key TEXT UNIQUE,
  created_at TEXT NOT NULL,
  -- Decision by a human admin (`admin:<ref>`); a block waits for a second admin.
  decision TEXT CHECK (decision IN ('release', 'reject', 'block')),
  decided_by TEXT,
  decided_at TEXT,
  reason_code TEXT,
  note TEXT,
  block_confirmed_by TEXT,
  block_confirmed_at TEXT,
  CHECK (decided_by IS NULL OR decided_by LIKE 'admin:%'),
  CHECK (block_confirmed_by IS NULL OR block_confirmed_by LIKE 'admin:%'),
  -- No decision without a reason code (spec §4.11).
  CHECK ((decision IS NULL) = (decided_by IS NULL) AND (decision IS NULL OR reason_code IS NOT NULL)),
  -- Four eyes on a block (§3.2): blocked only with a different confirming admin.
  CHECK (status <> 'blocked' OR (decision = 'block' AND block_confirmed_by IS NOT NULL AND block_confirmed_by <> decided_by)),
  CHECK (status NOT IN ('released', 'rejected') OR decision IN ('release', 'reject')),
  CHECK (status <> 'closed' OR reason_code IS NOT NULL)
) STRICT;
CREATE INDEX fraud_flag_status ON fraud_flag (status, created_at);
CREATE INDEX fraud_flag_subject ON fraud_flag (subject_type, subject_id);

CREATE TABLE appeal (
  id TEXT PRIMARY KEY,
  object_type TEXT NOT NULL CHECK (object_type IN ('flag', 'redemption', 'block', 'prize')),
  object_id TEXT NOT NULL,
  user_id TEXT REFERENCES user(id) ON DELETE SET NULL,
  text TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'decided', 'closed')),
  submitted_at TEXT NOT NULL,
  due_day TEXT NOT NULL,
  waiting_for_third INTEGER NOT NULL DEFAULT 0 CHECK (waiting_for_third IN (0, 1)),
  decided_by TEXT,
  decided_at TEXT,
  outcome TEXT CHECK (outcome IN ('upheld', 'rejected')),
  motivation TEXT,
  closed_reason TEXT,
  CHECK (decided_by IS NULL OR decided_by LIKE 'admin:%'),
  CHECK ((status = 'decided') = (outcome IS NOT NULL AND decided_by IS NOT NULL AND motivation IS NOT NULL))
) STRICT;
-- One appeal per object (ALREADY_APPEALED).
CREATE UNIQUE INDEX appeal_one_per_object ON appeal (object_type, object_id);
CREATE INDEX appeal_status ON appeal (status, due_day);
