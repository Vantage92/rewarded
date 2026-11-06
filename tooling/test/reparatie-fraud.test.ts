// Repair wave, fraud findings (docs/build/REPARATIE.md): H1 on a headless User-Agent (spec §6.3),
// restore keeps flags and needs an upheld appeal for appeal_upheld (spec §6.4, §6.5), and an admin
// never decides about his own account (architecture §10.8).
import { describe, expect, it } from 'vitest';
import { DEMO_ADMINS } from '../seed/admins.ts';
import { MIN, runAgenda, sessionTask } from '../seed/flows.ts';
import { world } from './world.ts';

const HEADLESS = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/131.0.0.0 Safari/537.36';

describe('spec §6.3 H1 en herstel (reparatie)', () => {
  it('§6.3 H1: a headless User-Agent marks the session, also without navigator.webdriver', async () => {
    const w = await world('2026-12-07');
    const s = await w.student({ ua: HEADLESS });
    expect(await w.session25(s)).toBe('completed');
    const row = w.db.get<{ flag_codes: string; review_status: string; ua_headless: number }>('SELECT flag_codes, review_status, ua_headless FROM focus_session WHERE user_id = ?', [s.id]);
    expect(row).toMatchObject({ ua_headless: 1, review_status: 'pending' });
    expect(JSON.parse(row!.flag_codes)).toContain('H1');
  }, 60_000);

  it('§6.4/§6.5 restore: appeal_upheld without an upheld appeal is refused; a restore after an outage keeps H1 pending', async () => {
    const w = await world('2026-12-07');
    const s = await w.student();
    let id = '';
    await runAgenda(w.ctx.world.clock, [
      sessionTask({ actor: s.a, deviceId: s.deviceId, start: w.ctx.world.clock.now() + 1_000, plannedMin: 25, webdriver: true, outcome: { kind: 'gap', atMin: 10 }, intervalS: 30, done: (r) => (id = r.sessionId) }, w.rng, w.ctx.world.clock),
    ]);
    await w.ctx.world.clock.set(w.ctx.world.clock.now() + 30 * MIN);
    await w.ctx.scheduler.tick();
    const r0 = w.db.get<{ status: string; abort_reason: string | null }>('SELECT status, abort_reason FROM focus_session WHERE id = ?', [id]);
    expect(r0).toMatchObject({ status: 'aborted', abort_reason: 'heartbeat_gap' });
    expect(await w.anna.codeOf(w.anna.api.call('admin.sessions.restore', { params: { id }, body: { reason_code: 'appeal_upheld', note: 'zonder beroep' } }))).toBe('SESSION_NOT_RESTORABLE');
    const start = w.db.get<{ s: number }>('SELECT server_start_at AS s FROM focus_session WHERE id = ?', [id])!.s;
    w.db.run("INSERT INTO outage (id, \"from\", \"to\", note, created_by, created_at) VALUES ('01JOUTAGE00000000000000001', ?, ?, 'test', 'admin:x', ?)", [new Date(start).toISOString(), new Date(start + 40 * MIN).toISOString(), new Date(start).toISOString()]);
    const res = await w.anna.api.call('admin.sessions.restore', { params: { id }, body: { reason_code: 'outage', note: 'storing' } });
    expect(res.flag_codes).toContain('H1');
    const r1 = w.db.get<{ status: string; review_status: string }>('SELECT status, review_status FROM focus_session WHERE id = ?', [id]);
    expect(r1).toMatchObject({ status: 'completed', review_status: 'pending' });
    expect(w.db.get<{ n: number }>("SELECT count(*) AS n FROM fraud_flag f JOIN fraud_flag_session l ON l.flag_id = f.id WHERE l.session_id = ? AND f.code = 'H1' AND f.status = 'open'", [id])?.n).toBe(1);
  }, 90_000);

  it('arch §10.8: an admin cannot decide a flag about his own account (SAME_REVIEWER)', async () => {
    const w = await world('2026-12-07');
    const annaId = w.db.get<{ id: string }>('SELECT id FROM user WHERE email = ?', [DEMO_ADMINS[0]!.email])!.id;
    const flagId = w.db.transaction(() => w.ctx.deps.services.flags.raise(w.db, { code: 'H2', subject: { type: 'account', id: annaId }, sessionIds: [], evidence: {} }));
    expect(await w.anna.codeOf(w.anna.api.call('admin.flags.decide', { params: { id: flagId }, body: { decision: 'release', reason_code: 'no_evidence', note: '' } }))).toBe('SAME_REVIEWER');
    expect((await w.bram.api.call('admin.flags.decide', { params: { id: flagId }, body: { decision: 'release', reason_code: 'no_evidence', note: '' } })).flag.status).toBe('released');
  }, 60_000);

  it('§6.3/§6.4 a week flag (H12) found again on a later day takes in the new sessions and puts them on pending', async () => {
    const { persistFindings } = await import('../../apps/api/src/modules/fraud/lib/batch.ts');
    const w = await world('2026-12-07');
    const s = await w.student();
    await w.session25(s);
    await w.at('2026-12-10', '10:00');
    await w.session25(s);
    const ids = w.db.all<{ id: string }>('SELECT id FROM focus_session WHERE user_id = ? ORDER BY server_start_at', [s.id]).map((r) => r.id);
    expect(ids).toHaveLength(2);
    const finding = (sessionIds: string[]) => ({ code: 'H12' as const, subject: { type: 'session' as const, id: sessionIds[0]! }, sessionIds, userIds: [s.id], evidence: {}, dedupKey: 'H12:2026-12-07:ip:ua' });
    const report = { raised: {}, skipped: {}, harm: { S1: 0, S2: 0, S3: 0, S4: 0 } };
    w.db.transaction(() => persistFindings(w.ctx.deps, w.db, { findings: [finding([ids[0]!])], skipped: [] } as never, report));
    w.db.transaction(() => persistFindings(w.ctx.deps, w.db, { findings: [finding(ids)], skipped: [] } as never, report));
    expect(w.db.get<{ n: number }>("SELECT count(*) AS n FROM fraud_flag WHERE code = 'H12'")?.n).toBe(1);
    expect(w.db.get<{ n: number }>('SELECT count(*) AS n FROM fraud_flag_session l JOIN fraud_flag f ON f.id = l.flag_id WHERE f.code = \'H12\' AND l.session_id IS NOT NULL')?.n).toBe(2);
    expect(w.db.get<{ r: string }>('SELECT review_status AS r FROM focus_session WHERE id = ?', [ids[1]!])?.r).toBe('pending');
  }, 90_000);
});
