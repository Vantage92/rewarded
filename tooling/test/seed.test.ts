// Demo and empty seed (architecture §11 "Seeddata"): deterministic, idempotent, and with the
// contents the end-to-end tests and the demo rely on.
import { describe, expect, it } from 'vitest';
import { MIGRATIONS_DIR } from '../../apps/api/src/config.ts';
import { migrate } from '../../apps/api/src/db/migrate.ts';
import { openDb } from '../../apps/api/src/db/open.ts';
import type { Db } from '../../apps/api/src/db/types.ts';
import { resetDatabase } from '../../apps/api/src/modules/dev/index.ts';
import type { ModuleDeps } from '../../apps/api/src/module.ts';
import { DEV_PEPPERS, DevClock } from '../../apps/api/src/platform/dev.ts';
import { HmacHasher } from '../../apps/api/src/platform/system.ts';
import { DEMO_NOW, DEMO_SETUP_AT } from '../seed/demo.ts';
import { dumpHash } from '../seed/dump.ts';
import { seedDemoOn, seedEmpty } from '../seed/index.ts';

function freshDb(): { db: Db; clock: DevClock } {
  const clock = new DevClock(new Date(DEMO_SETUP_AT));
  const db = openDb({ path: ':memory:', driver: 'better-sqlite3' });
  migrate(db, { dir: MIGRATIONS_DIR, clock });
  return { db, clock };
}

const hasher = new HmacHasher(DEV_PEPPERS);
const n = (db: Db, sql: string, args: unknown[] = []) => Number(db.get<{ n: number }>(sql, args as never)!.n);

describe('architecture §11 Seeddata', () => {
  const first = freshDb();
  const ready = seedDemoOn({ db: first.db, clock: first.clock, hasher });

  it('seed demo is deterministic: two runs give the same database (§11 Seeddata)', async () => {
    await ready;
    const second = freshDb();
    await seedDemoOn({ db: second.db, clock: second.clock, hasher });
    expect(dumpHash(second.db)).toBe(dumpHash(first.db));
    expect(first.clock.now().getTime()).toBe(DEMO_NOW);
  }, 180_000);

  it('seed demo is idempotent: reset and seed again on the same database (§11 Seeddata, /dev/reset)', async () => {
    const { db, clock } = freshDb();
    await seedDemoOn({ db, clock, hasher });
    const once = dumpHash(db);
    resetDatabase({ db } as ModuleDeps);
    clock.set(new Date(DEMO_SETUP_AT));
    await seedDemoOn({ db, clock, hasher });
    expect(dumpHash(db)).toBe(once);
  }, 180_000);

  it('demo contents: Demostad, three clubs in one pool, 45 students, nine squads (§11 Seeddata)', async () => {
    await ready;
    const db = first.db;
    const students = "FROM user u WHERE u.is_team = 0 AND u.email LIKE '%@student.demostad.test'";
    expect(n(db, `SELECT count(*) AS n ${students}`)).toBe(45);
    expect(n(db, "SELECT count(*) AS n FROM club WHERE city = 'Demostad' AND status = 'active'")).toBe(3);
    expect(n(db, 'SELECT count(DISTINCT pool) AS n FROM club')).toBe(1);
    expect(n(db, 'SELECT count(*) AS n FROM club WHERE prize_eligible = 0')).toBe(1);
    const squads = db.all<{ size: number }>(
      `SELECT count(*) AS size FROM squad_membership m JOIN user u ON u.id = m.user_id WHERE u.email LIKE '%@student.demostad.test' GROUP BY m.squad_id`,
    );
    expect(squads.length).toBe(9);
    expect(squads.reduce((s, r) => s + r.size, 0)).toBe(36);
    expect(Math.min(...squads.map((r) => r.size))).toBeGreaterThanOrEqual(3);
    expect(Math.max(...squads.map((r) => r.size))).toBeLessThanOrEqual(5);
    expect(n(db, `SELECT count(*) AS n ${students} AND u.age_band = '16_17'`)).toBe(2);
    expect(n(db, `SELECT count(*) AS n ${students} AND u.research_opt_out_at IS NOT NULL`)).toBe(1);
    expect(n(db, 'SELECT count(*) AS n FROM club_board_member')).toBe(3);
  });

  it('demo contents: both arms of every factor (§11 Seeddata, voorregistratie §9)', async () => {
    await ready;
    const arms = first.db.all<{ factor: string; arms: number }>('SELECT factor, count(DISTINCT arm) AS arms FROM experiment_assignment GROUP BY factor');
    expect(arms.map((a) => a.factor).sort()).toEqual(['belofte', 'bonus', 'prompt', 'rest']);
    for (const a of arms) expect(a.arms).toBe(2);
  });

  it('demo contents: 14 days of sessions with every abort code and flagged sessions in the queue (§11 Seeddata, spec §4.1)', async () => {
    await ready;
    const db = first.db;
    const days = n(db, "SELECT count(DISTINCT focus_day) AS n FROM focus_session WHERE is_practice = 0 AND focus_day BETWEEN '2026-12-02' AND '2026-12-15'");
    expect(days).toBe(14);
    const reasons = db.all<{ r: string }>("SELECT DISTINCT abort_reason AS r FROM focus_session WHERE status = 'aborted'").map((x) => x.r).sort();
    expect(reasons).toEqual(['heartbeat_gap', 'hidden', 'late_end', 'second_session', 'user_stop']);
    const flags = db.all<{ code: string }>("SELECT DISTINCT code FROM fraud_flag WHERE status = 'open'").map((x) => x.code);
    for (const code of ['H1', 'H3', 'H4', 'H9', 'H5']) expect(flags).toContain(code);
    expect(n(db, "SELECT count(*) AS n FROM job_run WHERE status <> 'done'")).toBe(0);
    expect(n(db, "SELECT count(*) AS n FROM job_run WHERE job = 'day_close' AND run_key = 'day_close:2026-12-15' AND status = 'done'")).toBe(1);
  });

  it('demo contents: campus NAT and CGNAT do not mark, the hotspot red team does (§11 Seeddata, spec §6.3)', async () => {
    await ready;
    const db = first.db;
    expect(n(db, "SELECT count(DISTINCT user_id) AS n FROM focus_session WHERE net_class = 'campus'")).toBeGreaterThanOrEqual(20);
    expect(n(db, "SELECT count(DISTINCT user_id) AS n FROM focus_session WHERE net_class = 'mobile_cgnat'")).toBeGreaterThanOrEqual(3);
    // Every H2/H7/H12 flag concerns hotspot accounts only.
    const flagged = db.all<{ code: string; email: string }>(
      `SELECT DISTINCT f.code, u.email FROM fraud_flag f JOIN fraud_flag_session fs ON fs.flag_id = f.id LEFT JOIN focus_session s ON s.id = fs.session_id
         JOIN user u ON u.id = coalesce(fs.user_id, s.user_id) WHERE f.code IN ('H2', 'H7', 'H10', 'H12')`,
    );
    expect(flagged.length).toBeGreaterThan(0);
    for (const f of flagged) expect(f.email).toMatch(/@hotspot-mail\.test$/);
    expect(new Set(flagged.map((f) => f.code))).toEqual(new Set(['H2', 'H7', 'H12']));
  });

  it('demo contents: catalogue, challenges, duel, waitlist, admins (§11 Seeddata)', async () => {
    await ready;
    const db = first.db;
    expect(n(db, 'SELECT count(*) AS n FROM partner')).toBe(1);
    expect(n(db, "SELECT count(*) AS n FROM partner_budget WHERE document_ref <> ''")).toBe(1);
    expect(n(db, "SELECT count(*) AS n FROM reward WHERE status = 'published' AND declaration_ref IS NOT NULL")).toBe(3);
    expect(n(db, 'SELECT count(*) AS n FROM reward_voucher')).toBeGreaterThan(0);
    expect(n(db, "SELECT count(*) AS n FROM challenge WHERE type = 'club_warmup'")).toBe(1);
    expect(n(db, "SELECT count(*) AS n FROM challenge WHERE type = 'performance'")).toBe(1);
    expect(n(db, 'SELECT count(*) AS n FROM duel')).toBe(1);
    const waiting = db.all<{ p: string; n: number }>('SELECT priority_reason AS p, count(*) AS n FROM waitlist_entry WHERE invited_at IS NULL GROUP BY p');
    expect(waiting.reduce((s, r) => s + r.n, 0)).toBe(20);
    expect(waiting.map((w) => w.p).sort()).toEqual(['card', 'club', 'group', 'none']);
    expect(n(db, 'SELECT count(*) AS n FROM admin a JOIN admin_mfa m ON m.user_id = a.user_id WHERE m.enrolled_at IS NOT NULL')).toBe(3);
    expect(n(db, 'SELECT count(*) AS n FROM redemption')).toBeGreaterThanOrEqual(1);
  });

  it('demo has two club calendars with a different T plus the default calendar (§11 Seeddata, §12.5, founder G-MF3)', async () => {
    await ready;
    const db = first.db;
    const cals = db.all<{ t: string; d: number; clubs: number }>('SELECT t_day AS t, is_default AS d, (SELECT count(*) FROM club c WHERE c.exam_calendar_id = k.id) AS clubs FROM exam_calendar k ORDER BY t_day');
    expect(cals.filter((c) => c.d === 1)).toHaveLength(1);
    const used = cals.filter((c) => c.clubs > 0);
    expect(new Set(used.map((c) => c.t)).size).toBe(2);
    expect(n(db, 'SELECT count(*) AS n FROM club WHERE join_code IS NOT NULL AND exam_calendar_id IS NULL')).toBe(0);
    // Squads of a club follow its calendar (spec §4.13).
    expect(n(db, 'SELECT count(*) AS n FROM squad s JOIN club c ON c.id = s.club_id WHERE s.calendar_id IS NOT c.exam_calendar_id')).toBe(0);
  });

  it('seed empty: only the three admins (§11 Seeddata)', () => {
    const { db, clock } = freshDb();
    seedEmpty({ db, clock, hasher });
    expect(n(db, 'SELECT count(*) AS n FROM user')).toBe(3);
    expect(n(db, 'SELECT count(*) AS n FROM admin')).toBe(3);
    expect(n(db, 'SELECT count(*) AS n FROM squad')).toBe(0);
    expect(n(db, "SELECT count(*) AS n FROM ledger_account WHERE owner_type = 'system'")).toBe(5);
  });
});
