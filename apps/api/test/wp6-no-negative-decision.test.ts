// Acceptance WP-6 (architecture §10.8, §12.1): no route outside /admin can book a negative decision
// (a reversal, a rejection, a block or a rejected prize), and no job or heuristic can either.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { buildPath, requestExamples, routes, type RouteId } from '@rewarded/contracts';
import { describe, expect, it } from 'vitest';
import { dayCloseJob } from '../src/jobs/day_close/index.ts';
import { job as hourly } from '../src/jobs/hourly.ts';
import { createScheduler } from '../src/jobs/scheduler.ts';
import { weekCloseJob } from '../src/jobs/week_close/index.ts';
import type { SqlFlagService } from '../src/modules/fraud/lib/flags.ts';
import { api, createAdmin, createUser, rawSession, realSession, wp6Harness, type Wp6Harness } from './wp6/harness.ts';

const SRC = join(import.meta.dirname, '..', 'src');

/** Everything that would be a negative decision (architecture §10.8). */
function negatives(h: Wp6Harness) {
  const q = (sql: string) => (h.db.get<{ n: number }>(sql)?.n ?? 0);
  return {
    decided_flags: q("SELECT count(*) AS n FROM fraud_flag WHERE decision IS NOT NULL OR status IN ('rejected', 'blocked', 'released')"),
    reversals: q("SELECT count(*) AS n FROM journal_entry WHERE type IN ('reverse', 'goal_bonus_reverse', 'goal_secure_reverse')"),
    rejected_sessions: q("SELECT count(*) AS n FROM focus_session WHERE review_status = 'rejected'"),
    blocked_users: q("SELECT count(*) AS n FROM user WHERE status = 'blocked'"),
    blocked_phones: q('SELECT count(*) AS n FROM blocked_phone_hash'),
    rejected_prizes: q("SELECT count(*) AS n FROM prize WHERE status = 'rejected'"),
    decided_appeals: q("SELECT count(*) AS n FROM appeal WHERE status = 'decided'"),
  };
}
const NONE = { decided_flags: 0, reversals: 0, rejected_sessions: 0, blocked_users: 0, blocked_phones: 0, rejected_prizes: 0, decided_appeals: 0 };

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? files(p) : p.endsWith('.ts') ? [p] : [];
  });
}

describe('architecture §10.8: no negative decision outside /admin', () => {
  it('calling every non-admin route as the student and as a stranger books nothing negative', async () => {
    const h = wp6Harness();
    createAdmin(h);
    const s = createUser(h);
    const other = createUser(h);
    const sid = await realSession(h, s, 25);
    h.db.run("UPDATE user SET phone_hash = 'ph_x', phone_line_type = 'mobile', phone_verified_at = ? WHERE id = ?", [h.clock.now().toISOString(), s.id]);
    const flagId = h.db.transaction(() => {
      const id = (h.services.flags as SqlFlagService).raise(h.db, { code: 'H5', subject: { type: 'session', id: sid }, sessionIds: [sid], evidence: {} });
      h.services.sessions.setReviewStatus(h.db, [sid], 'pending');
      return id;
    });
    expect(negatives(h)).toEqual(NONE);

    const ids = [flagId, sid, s.id];
    const nonAdmin = (Object.keys(routes) as RouteId[]).filter((id) => !routes[id].path.startsWith('/admin'));
    expect(nonAdmin.length).toBeGreaterThan(60);
    let calls = 0;
    for (const id of nonAdmin) {
      const def = routes[id];
      const ex = (requestExamples as Record<string, { params?: Record<string, string>; body?: unknown; query?: Record<string, string> }>)[id] ?? {};
      for (const target of ids) {
        const params: Record<string, string> = { ...(ex.params ?? {}) };
        for (const m of def.path.matchAll(/:([a-z_]+)/g)) params[m[1] as string] = m[1] === 'id' || m[1] === 'session_id' ? target : (params[m[1] as string] ?? 'x');
        const path = buildPath(def.path, params);
        for (const who of [s, other, null]) {
          for (const body of def.method === 'GET' ? [undefined] : [ex.body ?? {}, { decision: 'reject', reason_code: 'automation', note: 'x', object_type: 'flag', object_id: flagId }]) {
            await api(h, who, def.method, path, body);
            calls += 1;
          }
        }
      }
    }
    expect(calls).toBeGreaterThan(300);
    expect(negatives(h)).toEqual(NONE);
    expect(h.db.get('SELECT status FROM fraud_flag WHERE id = ?', [flagId])).toEqual({ status: 'open' });
  });

  it('the day close, week close and hourly jobs only raise flags, never decide', async () => {
    const h = wp6Harness({ start: '2026-12-07T10:00:00Z' });
    // Four accounts behind one address (H2) and a clear H12 pattern: the batch raises flags.
    const users = [0, 1, 2, 3].map(() => createUser(h));
    for (const day of ['2026-12-07', '2026-12-08']) {
      const [y, m, d] = day.split('-').map(Number) as [number, number, number];
      for (const u of users) rawSession(h, u.id, { start: Date.UTC(y, m - 1, d, 13), minutes: 90, ipHash: 'ip_one', netClass: 'other', uaClass: 'desktop', claimDelayS: 3600 });
    }
    const sched = createScheduler({ clock: h.clock, moduleDeps: h.deps });
    sched.register(dayCloseJob());
    sched.register(weekCloseJob());
    sched.register(hourly);
    for (const k of ['day_close:2026-12-07', 'day_close:2026-12-08']) {
      h.clock.set(new Date('2026-12-14T06:00:00Z'));
      expect((await sched.runNow('day_close', k)).status).toBe('done');
    }
    expect((await sched.runNow('week_close', 'week_close:2026-12-14')).status).toBe('done');
    expect((await sched.runNow('hourly')).status).toBe('done');
    const raised = h.db.all<{ code: string; status: string }>('SELECT code, status FROM fraud_flag ORDER BY code');
    expect(raised.map((r) => r.code)).toEqual(expect.arrayContaining(['H2', 'H12', 'H9']));
    expect(raised.every((r) => r.status === 'open')).toBe(true);
    expect(negatives(h)).toEqual({ ...NONE });
  });

  it('decision code is only reachable from routes under /admin (static check)', () => {
    const callers = files(SRC)
      .filter((f) => /\b(decideFlag|confirmBlock|decideAppeal|liftBlock|recordAgeCheck)\(|flags\.decide\(|\.confirmBlock\(/.test(readFileSync(f, 'utf8')))
      .map((f) => relative(SRC, f).replaceAll('\\', '/'))
      .sort();
    expect(callers).toEqual([
      'modules/admin/index.ts',
      'modules/fraud/index.ts',
      'modules/fraud/lib/appeals.ts',
      'modules/fraud/lib/decisions.ts',
      'modules/fraud/lib/flags.ts',
      // definitions of the interface methods (FlagService, PrizeService) and their fakes
      'modules/fraud/lib/prizes.ts',
      'services/flags.ts',
      'services/prizes.ts',
    ]);
    // In the route files, every mount that reaches decision code is an /admin route.
    for (const f of ['modules/fraud/index.ts', 'modules/admin/index.ts']) {
      const text = readFileSync(join(SRC, f), 'utf8');
      const reaching = [...text.matchAll(/mount\(\s*api,\s*routes\['([^']+)'\][\s\S]*?\n {4}\}\);/g)].filter((m) => /decideFlag|confirmBlock\(|decideAppeal|recordAgeCheck/.test(m[0]));
      expect(reaching.length).toBeGreaterThan(0);
      expect(reaching.map((m) => routes[m[1] as RouteId].path).filter((path) => !path.startsWith('/admin'))).toEqual([]);
    }
    // No job imports decision code.
    for (const f of files(join(SRC, 'jobs'))) expect(readFileSync(f, 'utf8')).not.toMatch(/decisions\.ts|appeals\.ts|decideFlag|confirmBlock/);
  });
});
