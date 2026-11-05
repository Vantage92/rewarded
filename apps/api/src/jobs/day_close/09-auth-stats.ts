// Day close step 9 (architecture §6.1, §10.1, §3.5). Owner WP-3.
// Login statistics without personal data in auth_daily_stat, then clean-up: magic-link rows older
// than 24 hours (after they were counted) and event_pending older than 24 hours.
// `requested`, `consumed_*` and `invalid` are counted live by the auth module; this step sets
// `expired` for D from the rows themselves, so running it twice gives the same numbers.
import type { DayCloseStep } from '../scheduler.ts';

const DAY_MS = 24 * 3600 * 1000;

export const step: DayCloseStep = {
  no: 9,
  name: 'auth-stats',
  owner: 'WP-3',
  run({ day, now, deps }) {
    const db = deps.db;
    const cutoff = new Date(now.getTime() - DAY_MS).toISOString();
    db.transaction(() => {
      const expired = db.get<{ n: number }>('SELECT count(*) AS n FROM auth_magic_link WHERE created_day = ? AND used_at IS NULL AND expires_at <= ?', [
        day,
        now.toISOString(),
      ])!.n;
      db.run(
        `INSERT INTO auth_daily_stat (day, expired) VALUES (?, ?)
         ON CONFLICT (day) DO UPDATE SET expired = max(auth_daily_stat.expired, excluded.expired)`,
        [day, expired],
      );
      // Every link of D has expired by 04:15 on D + 1, so all of them are counted above. Rows of D
      // younger than 24 hours go in the next close (created_day <= D + 1 then).
      db.run('DELETE FROM auth_magic_link WHERE created_at <= ? AND created_day <= ?', [cutoff, day]);
      db.run('DELETE FROM event_pending WHERE server_at <= ?', [cutoff]);
      // Expired sessions of our own table (also deleted lazily on lookup, middleware/auth.ts).
      db.run('DELETE FROM auth_session WHERE expires_at <= ?', [now.toISOString()]);
    });
  },
};
