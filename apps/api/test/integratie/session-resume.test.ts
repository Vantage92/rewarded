// Integration fix: heartbeats after a resume are stored (architecture §4.7, §4.3). Before the fix,
// last_seq = 0 on resume made seq 1…n collide with the primary key (session_id, seq, kind).
import { describe, expect, it } from 'vitest';
import { createUser, device, wp4Harness } from '../wp4/harness.ts';
import { FocusClient } from '../wp4/client.ts';

const MIN = 60_000;

describe('arch §4.7 Hervatting op hetzelfde toestel', () => {
  it('§4.7 heartbeats after a resume are stored as contacts and the session completes', async () => {
    const h = wp4Harness();
    const user = createUser(h);
    const dev = await device(h, user);
    const c = new FocusClient(h, user, dev);
    await c.start(25);
    await c.run(5 * MIN);
    const before = h.db.get<{ n: number }>("SELECT COUNT(*) AS n FROM session_heartbeat WHERE session_id = ? AND kind = 'online'", [c.sessionId])?.n ?? 0;
    expect(before).toBe(10);
    // Reload: the same device starts again and resumes; the client restarts seq at 1.
    const r = await c.start(25);
    expect(r.body).toMatchObject({ resumed: true });
    await c.run(20 * MIN);
    const after = h.db.get<{ n: number }>("SELECT COUNT(*) AS n FROM session_heartbeat WHERE session_id = ? AND kind = 'online'", [c.sessionId])?.n ?? 0;
    expect(after).toBe(50);
    const end = await c.end();
    expect(end.body).toMatchObject({ status: 'completed', flagged: false });
  });
});

describe('spec §6.3 H9 met een late beacon', () => {
  it('§6.3 a first_interaction_after_end that arrives by beacon after the end fills claim_delay_s', async () => {
    const h = wp4Harness();
    const user = createUser(h);
    const dev = await device(h, user);
    const c = new FocusClient(h, user, dev);
    await c.start(25);
    await c.run(25 * MIN);
    const end = await c.end();
    expect(end.body).toMatchObject({ status: 'completed' });
    const before = h.db.get<{ d: number | null }>('SELECT claim_delay_s AS d FROM focus_session WHERE id = ?', [c.sessionId])?.d;
    expect(before).toBeNull();
    c.advance(20 * MIN);
    const r = await c.beacon([c.visibility('first_interaction_after_end')]);
    expect(r.status).toBe(202);
    const after = h.db.get<{ d: number | null }>('SELECT claim_delay_s AS d FROM focus_session WHERE id = ?', [c.sessionId])?.d;
    expect(after).toBeGreaterThanOrEqual(20 * 60);
  });
});
