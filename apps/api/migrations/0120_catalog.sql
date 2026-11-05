-- WP-4 catalog, budget coverage and redemptions (architecture §3.3, §5.2, §5.3).
-- Money and freely spendable credit do not exist as a kind: the CHECK on reward.kind has no value for them.

CREATE TABLE partner (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('vereniging', 'faculteit', 'sponsor', 'werkgever', 'rewarded')),
  contact_ref TEXT,
  created_at TEXT NOT NULL
) STRICT;

CREATE TABLE partner_budget (
  id TEXT PRIMARY KEY,
  partner_id TEXT NOT NULL REFERENCES partner(id),
  kind TEXT NOT NULL CHECK (kind IN ('direct_reward', 'revenue', 'own_budget')),
  pool TEXT NOT NULL CHECK (pool IN ('pilot', 'research', 'expansion')),
  booked_cents INTEGER NOT NULL CHECK (booked_cents > 0),
  reward_pct INTEGER NOT NULL CHECK (reward_pct IN (20, 30, 100)),
  document_ref TEXT NOT NULL CHECK (length(trim(document_ref)) > 0),
  booked_at TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'booked' CHECK (status IN ('booked', 'cancelled')),
  cancelled_cents INTEGER NOT NULL DEFAULT 0 CHECK (cancelled_cents >= 0 AND cancelled_cents <= booked_cents),
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL,
  CHECK (kind = 'revenue' OR reward_pct = 100)
) STRICT;

CREATE TABLE budget_allocation (
  id TEXT PRIMARY KEY,
  budget_id TEXT NOT NULL REFERENCES partner_budget(id),
  target_type TEXT NOT NULL CHECK (target_type IN ('reward_stock', 'prize')),
  target_id TEXT NOT NULL,
  amount_cents INTEGER NOT NULL CHECK (amount_cents <> 0),
  reverses_id TEXT REFERENCES budget_allocation(id),
  reason_code TEXT NOT NULL,
  created_at TEXT NOT NULL,
  created_by TEXT NOT NULL
) STRICT;
CREATE INDEX budget_allocation_budget ON budget_allocation (budget_id);
CREATE TRIGGER budget_allocation_no_update BEFORE UPDATE ON budget_allocation BEGIN SELECT RAISE(ABORT, 'budget_allocation is append-only'); END;
CREATE TRIGGER budget_allocation_no_delete BEFORE DELETE ON budget_allocation BEGIN SELECT RAISE(ABORT, 'budget_allocation is append-only'); END;

CREATE TABLE reward (
  id TEXT PRIMARY KEY,
  partner_id TEXT NOT NULL REFERENCES partner(id),
  budget_id TEXT NOT NULL REFERENCES partner_budget(id),
  kind TEXT NOT NULL CHECK (kind IN ('in_kind', 'service', 'partner_discount')),
  title_nl TEXT NOT NULL,
  title_en TEXT NOT NULL,
  terms_nl TEXT NOT NULL,
  terms_en TEXT NOT NULL,
  cost_cents INTEGER NOT NULL CHECK (cost_cents BETWEEN 1 AND 500),
  points_price INTEGER NOT NULL CHECK (points_price >= 50 AND points_price % 50 = 0),
  min_age_band TEXT NOT NULL CHECK (min_age_band IN ('16_17', '18_plus')),
  declaration_ref TEXT,
  collective INTEGER NOT NULL CHECK (collective IN (0, 1)),
  stock INTEGER NOT NULL CHECK (stock >= 1),
  cash_check_by TEXT,
  cash_check_at TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'offline')),
  published_at TEXT,
  published_by TEXT,
  created_at TEXT NOT NULL,
  CHECK (status = 'draft' OR (declaration_ref IS NOT NULL AND cash_check_by IS NOT NULL))
) STRICT;
-- The points price is fixed once published (architecture §3.3).
CREATE TRIGGER reward_price_immutable BEFORE UPDATE OF points_price, cost_cents ON reward
WHEN OLD.status <> 'draft' AND (NEW.points_price <> OLD.points_price OR NEW.cost_cents <> OLD.cost_cents)
BEGIN
  SELECT RAISE(ABORT, 'points_price is immutable after publication');
END;

CREATE TABLE reward_voucher (
  id TEXT PRIMARY KEY,
  reward_id TEXT NOT NULL REFERENCES reward(id),
  code TEXT NOT NULL,
  pool TEXT NOT NULL CHECK (pool IN ('pilot', 'research', 'expansion')),
  release_week TEXT,
  release_day TEXT,
  anchor_only INTEGER NOT NULL DEFAULT 0 CHECK (anchor_only IN (0, 1)),
  status TEXT NOT NULL DEFAULT 'unreleased' CHECK (status IN ('unreleased', 'available', 'reserved', 'delivered', 'broken', 'void')),
  redemption_id TEXT,
  replaces_voucher_id TEXT REFERENCES reward_voucher(id),
  created_at TEXT NOT NULL,
  UNIQUE (reward_id, code),
  CHECK ((release_week IS NULL) = (release_day IS NULL)),
  CHECK (status NOT IN ('reserved', 'delivered') OR redemption_id IS NOT NULL)
) STRICT;
CREATE INDEX reward_voucher_free ON reward_voucher (reward_id, pool, release_day) WHERE status IN ('unreleased', 'available') AND redemption_id IS NULL;

CREATE TABLE redemption (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES user(id) ON DELETE SET NULL,
  reward_id TEXT NOT NULL REFERENCES reward(id),
  voucher_id TEXT NOT NULL REFERENCES reward_voucher(id),
  points INTEGER NOT NULL CHECK (points > 0),
  points_from_referral INTEGER NOT NULL DEFAULT 0 CHECK (points_from_referral >= 0),
  cost_cents INTEGER NOT NULL CHECK (cost_cents > 0),
  week_key TEXT NOT NULL,
  month_key TEXT NOT NULL,
  entry_id TEXT NOT NULL REFERENCES journal_entry(id),
  status TEXT NOT NULL CHECK (status IN ('reserved', 'delivered', 'replaced', 'refunded')),
  broken_reported_at TEXT,
  created_at TEXT NOT NULL,
  CHECK (points_from_referral <= points / 2)
) STRICT;
-- One redemption per user per week, also under concurrency; a refunded one frees the week (§5.2).
CREATE UNIQUE INDEX redemption_one_per_week ON redemption (user_id, week_key)
  WHERE status IN ('reserved', 'delivered', 'replaced') AND user_id IS NOT NULL;
CREATE INDEX redemption_user_month ON redemption (user_id, month_key);

-- Phone verification at the first redemption (spec §4.3); only the hash of the number is stored.
CREATE TABLE phone_verification (
  user_id TEXT PRIMARY KEY REFERENCES user(id) ON DELETE CASCADE,
  phone_hash TEXT NOT NULL,
  code_hash TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0 CHECK (attempts >= 0)
) STRICT;

-- Weekly coverage alarm (spec §4.3 "dekkingsalarm"), shown in the admin overview.
CREATE TABLE coverage_alert (
  week TEXT NOT NULL,
  pool TEXT NOT NULL CHECK (pool IN ('pilot', 'research', 'expansion')),
  eligible_users INTEGER NOT NULL,
  released_next_week INTEGER NOT NULL,
  shortfall INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY (week, pool)
) STRICT;
