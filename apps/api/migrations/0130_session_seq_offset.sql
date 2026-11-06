-- Integration fix (architecture §4.7): a resume restarts the protocol seq at 1, while
-- session_heartbeat is keyed on (session_id, seq, kind). Rows are stored with seq + seq_offset, so
-- heartbeats after a resume no longer collide with (and silently drop on) the earlier ones.
ALTER TABLE focus_session ADD COLUMN seq_offset INTEGER NOT NULL DEFAULT 0 CHECK (seq_offset >= 0);
