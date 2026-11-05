// Architecture §2.1: the WP-6 SQL (flags, decisions, retention, deletion, KPI queries) also runs on
// the node:sqlite fallback driver.
import { describe, expect, it } from 'vitest';
import type { SqlFlagService } from '../src/modules/fraud/lib/flags.ts';
import { runRetention } from '../src/modules/fraud/lib/retention.ts';
import { KPI_NAMES, runKpi } from '../src/modules/kpi/index.ts';
import { api, createAdmin, createUser, realSession, wp6Harness } from './wp6/harness.ts';

describe.each(['better-sqlite3', 'node:sqlite'] as const)('WP-6 on %s', (driver) => {
  it('decision, KPI queries, retention and deletion', async () => {
    const h = wp6Harness({ driver });
    const admin = createAdmin(h);
    const s = createUser(h);
    const sid = await realSession(h, s, 25);
    const f = h.db.transaction(() => (h.services.flags as SqlFlagService).raise(h.db, { code: 'H5', subject: { type: 'session', id: sid }, sessionIds: [sid], evidence: { threshold: 480 } }));
    h.db.transaction(() => h.services.sessions.setReviewStatus(h.db, [sid], 'pending'));
    expect((await api(h, admin, 'POST', `/admin/flags/${f}/decision`, { decision: 'reject', reason_code: 'implausible_pattern', note: '' })).status).toBe(200);
    for (const n of KPI_NAMES) expect(() => runKpi(h.db, `${n}_clean`, null, null)).not.toThrow();
    expect((await api(h, s, 'DELETE', '/me', { confirm: 'VERWIJDER' })).status).toBe(202);
    expect(h.db.get('SELECT count(*) AS n FROM user WHERE id = ?', [s.id])).toEqual({ n: 0 });
    expect(() => runRetention(h.deps, new Date('2029-01-01T05:45:00Z'))).not.toThrow();
  });
});
