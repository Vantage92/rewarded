-- Repair wave after the independent review (docs/build/REPARATIE.md). Own range 0400–0499.

-- Goal history (spec §4.4 Dagdoel): every change with the focus day it applies from, so a day that
-- is closed later still uses the goal that applied on that day (goalForDay in core/goals).
CREATE TABLE user_goal_change (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  goal_min INTEGER NOT NULL CHECK (goal_min IN (25, 50, 90, 120)),
  effective_from TEXT NOT NULL,
  at TEXT NOT NULL
) STRICT;
CREATE INDEX user_goal_change_user ON user_goal_change (user_id, effective_from, at);

-- Failed TOTP attempts and a lock that survives a restart (architecture §10.2: 5 per 15 minutes).
ALTER TABLE admin_mfa ADD COLUMN failed_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE admin_mfa ADD COLUMN failed_window_start TEXT;
ALTER TABLE admin_mfa ADD COLUMN locked_until TEXT;

-- Reminder mails are opt-in (P5): nobody gets them without choosing. SQLite cannot change a column
-- default without rebuilding `user`, so a trigger turns an unchosen 1 into 0 on insert, and the
-- existing non-choosers go to 0. Time and days per user; a random unsubscribe token (no user id).
ALTER TABLE user ADD COLUMN reminders_chosen_at TEXT;
ALTER TABLE user ADD COLUMN reminder_time TEXT NOT NULL DEFAULT '19:30' CHECK (length(reminder_time) = 5);
ALTER TABLE user ADD COLUMN reminder_days TEXT NOT NULL DEFAULT '1234567';
ALTER TABLE user ADD COLUMN reminder_unsub_token TEXT;
CREATE UNIQUE INDEX user_reminder_unsub_token ON user (reminder_unsub_token) WHERE reminder_unsub_token IS NOT NULL;
UPDATE user SET email_reminders = 0 WHERE reminders_chosen_at IS NULL;
CREATE TRIGGER user_email_reminders_opt_in AFTER INSERT ON user
WHEN NEW.email_reminders = 1 AND NEW.reminders_chosen_at IS NULL
BEGIN
  UPDATE user SET email_reminders = 0 WHERE id = NEW.id;
END;

-- Headless user agent at session start (spec §6.3 H1), from the raw User-Agent on the server.
ALTER TABLE focus_session ADD COLUMN ua_headless INTEGER NOT NULL DEFAULT 0 CHECK (ua_headless IN (0, 1));
