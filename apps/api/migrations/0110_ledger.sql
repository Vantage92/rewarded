-- WP-4 points ledger (architecture §3.3, §5.1): double-entry journal, derived balances, user_day.
-- The journal never names a user: users hang on accounts only through ledger_account_owner.

CREATE TABLE ledger_account (
  id TEXT PRIMARY KEY,
  owner_type TEXT NOT NULL CHECK (owner_type IN ('user', 'system')),
  kind TEXT NOT NULL,
  account_set TEXT,
  CHECK ((owner_type = 'system') = (account_set IS NULL)),
  CHECK ((owner_type = 'user' AND kind IN ('available_own', 'available_referral', 'pending_session', 'pending_goal_budget', 'referral_unvested'))
      OR (owner_type = 'system' AND kind IN ('issuance', 'redeemed', 'lapsed', 'reversed', 'expired')))
) STRICT;
CREATE UNIQUE INDEX ledger_account_system_kind ON ledger_account (kind) WHERE owner_type = 'system';
CREATE UNIQUE INDEX ledger_account_set_kind ON ledger_account (account_set, kind) WHERE owner_type = 'user';
INSERT INTO ledger_account (id, owner_type, kind, account_set) VALUES
  ('system:issuance', 'system', 'issuance', NULL),
  ('system:redeemed', 'system', 'redeemed', NULL),
  ('system:lapsed', 'system', 'lapsed', NULL),
  ('system:reversed', 'system', 'reversed', NULL),
  ('system:expired', 'system', 'expired', NULL);

CREATE TABLE ledger_account_owner (
  account_id TEXT PRIMARY KEY REFERENCES ledger_account(id),
  user_id TEXT NOT NULL REFERENCES user(id),
  kind TEXT NOT NULL,
  UNIQUE (user_id, kind)
) STRICT;

CREATE TABLE journal_entry (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('earn_session', 'earn_topup', 'release_flag', 'reverse', 'goal_bonus', 'goal_bonus_release',
    'goal_bonus_reverse', 'goal_budget_grant', 'goal_budget_secure', 'goal_budget_lapse', 'goal_secure_reverse', 'goal_lapse_reverse',
    'redeem', 'redeem_refund', 'adjust', 'referral_pending', 'referral_vest', 'referral_lapse', 'expire')),
  idempotency_key TEXT NOT NULL UNIQUE,
  account_set TEXT NOT NULL,
  ref_type TEXT NOT NULL CHECK (ref_type IN ('session', 'user_day', 'week', 'redemption', 'referral', 'appeal', 'admin_action', 'account')),
  ref_id TEXT NOT NULL,
  cause_type TEXT CHECK (cause_type IN ('flag', 'decision', 'appeal', 'restore')),
  cause_id TEXT,
  focus_day TEXT,
  reason_code TEXT,
  actor TEXT NOT NULL,
  arm TEXT CHECK (arm IN ('A', 'B')),
  param_version INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  -- Hash of type, account set, ref and postings: same key with other content is a KEY_CONFLICT.
  content_hash TEXT NOT NULL,
  CHECK ((type NOT IN ('adjust', 'expire')) OR reason_code IS NOT NULL)
) STRICT;
CREATE INDEX journal_entry_set_day ON journal_entry (account_set, focus_day);
CREATE INDEX journal_entry_ref ON journal_entry (ref_type, ref_id);

CREATE TABLE posting (
  id TEXT PRIMARY KEY,
  entry_id TEXT NOT NULL REFERENCES journal_entry(id),
  account_id TEXT NOT NULL REFERENCES ledger_account(id),
  amount INTEGER NOT NULL CHECK (amount <> 0)
) STRICT;
CREATE INDEX posting_entry ON posting (entry_id);
CREATE INDEX posting_account ON posting (account_id);

-- Append-only without exception (architecture §3.3): a correction is a new entry.
CREATE TRIGGER journal_entry_no_update BEFORE UPDATE ON journal_entry BEGIN SELECT RAISE(ABORT, 'journal_entry is append-only'); END;
CREATE TRIGGER journal_entry_no_delete BEFORE DELETE ON journal_entry BEGIN SELECT RAISE(ABORT, 'journal_entry is append-only'); END;
CREATE TRIGGER posting_no_update BEFORE UPDATE ON posting BEGIN SELECT RAISE(ABORT, 'posting is append-only'); END;
CREATE TRIGGER posting_no_delete BEFORE DELETE ON posting BEGIN SELECT RAISE(ABORT, 'posting is append-only'); END;

-- One row per user and focus day, written only through UserDayRepository (architecture §3.4, §6.1).
CREATE TABLE user_day (
  user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  focus_day TEXT NOT NULL,
  rev INTEGER NOT NULL CHECK (rev >= 1),
  verified_min INTEGER NOT NULL DEFAULT 0 CHECK (verified_min >= 0),
  counted_min INTEGER NOT NULL DEFAULT 0 CHECK (counted_min >= 0 AND counted_min <= 300),
  counted_min_final INTEGER NOT NULL DEFAULT 0 CHECK (counted_min_final >= 0),
  goal_min INTEGER NOT NULL CHECK (goal_min >= 0),
  goal_met INTEGER NOT NULL DEFAULT 0 CHECK (goal_met IN (0, 1)),
  goal_met_final INTEGER NOT NULL DEFAULT 0 CHECK (goal_met_final IN (0, 1)),
  goal_bonus_eligible INTEGER NOT NULL DEFAULT 0 CHECK (goal_bonus_eligible IN (0, 1)),
  exam_day INTEGER NOT NULL DEFAULT 0 CHECK (exam_day IN (0, 1)),
  goal_state TEXT NOT NULL DEFAULT 'none' CHECK (goal_state IN ('none', 'pending', 'available', 'secured', 'lapsed', 'postponed', 'exam')),
  joker_used INTEGER NOT NULL DEFAULT 0 CHECK (joker_used IN (0, 1)),
  vacation INTEGER NOT NULL DEFAULT 0 CHECK (vacation IN (0, 1)),
  closed_at TEXT,
  PRIMARY KEY (user_id, focus_day),
  CHECK (counted_min <= verified_min),
  CHECK (counted_min_final <= counted_min),
  CHECK (goal_met_final = 0 OR goal_met = 1),
  CHECK (goal_bonus_eligible = 0 OR goal_met = 1)
) STRICT;
CREATE INDEX user_day_day ON user_day (focus_day);

-- Findings of the nightly checks (architecture §5.5), shown in the admin overview.
CREATE TABLE ledger_alert (
  id TEXT PRIMARY KEY,
  check_name TEXT NOT NULL CHECK (check_name IN ('zero_sum', 'one_earn_per_session', 'session_points_counted')),
  day TEXT NOT NULL,
  ref TEXT NOT NULL,
  details TEXT NOT NULL CHECK (json_valid(details)),
  created_at TEXT NOT NULL,
  UNIQUE (check_name, day, ref)
) STRICT;
