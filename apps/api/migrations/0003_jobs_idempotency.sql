-- WP-3 job runs and idempotency records (architecture §3.5, §4.7, §5.4).

CREATE TABLE job_run (
  job TEXT NOT NULL,
  run_key TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('running', 'done', 'failed')),
  started_at TEXT NOT NULL,
  finished_at TEXT,
  attempts INTEGER NOT NULL DEFAULT 1,
  step_results TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(step_results)),
  PRIMARY KEY (job, run_key)
) STRICT;

CREATE TABLE idempotency_record (
  scope_ref TEXT NOT NULL, -- user id, or 'public:<ip hash>' for public routes
  key TEXT NOT NULL,
  route TEXT NOT NULL,
  request_hash TEXT NOT NULL,
  status_code INTEGER NOT NULL,
  response TEXT NOT NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY (scope_ref, key)
) STRICT;
CREATE INDEX idempotency_created ON idempotency_record (created_at);
