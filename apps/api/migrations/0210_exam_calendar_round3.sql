-- Round 3 (spec §4.13, architecture §3.4, §12.5): the exam calendar per club is the only source of
-- T, N and A. The default calendar for units without a club is a calendar like the others, with
-- is_default = 1 (at most one row). a_resit_days: days in A that are resits of an earlier period.
ALTER TABLE exam_calendar ADD COLUMN is_default INTEGER NOT NULL DEFAULT 0 CHECK (is_default IN (0, 1));
ALTER TABLE exam_calendar ADD COLUMN a_resit_days TEXT NOT NULL DEFAULT '[]' CHECK (json_valid(a_resit_days));
-- A change after fixed_at waits for a second admin (four eyes): the proposed patch and its author.
ALTER TABLE exam_calendar ADD COLUMN pending_patch TEXT CHECK (pending_patch IS NULL OR json_valid(pending_patch));
ALTER TABLE exam_calendar ADD COLUMN pending_by TEXT;
CREATE UNIQUE INDEX exam_calendar_one_default ON exam_calendar (is_default) WHERE is_default = 1;

-- April member count for the April challenge, requested by Rewarded itself (challenge terms A14.3).
ALTER TABLE club ADD COLUMN april_members INTEGER CHECK (april_members IS NULL OR april_members >= 1);
ALTER TABLE club ADD COLUMN april_members_source_ref TEXT;
ALTER TABLE club ADD COLUMN april_members_at TEXT;
