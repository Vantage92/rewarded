// Acceptance WP-6 (architecture §10.7): export and deletion. After DELETE /me no row in any table
// (a scan over every text column and JSON) holds the old user id, e-mail address or pseudonym, and
// in `event` not the old squad id; the journal still sums to zero; event props no longer join to any
// other table; H8 still knows the blocked phone number.
import { describe, expect, it } from 'vitest';
import type { SqlFlagService } from '../src/modules/fraud/lib/flags.ts';
import type { Db } from '../src/db/types.ts';
import { api, createAdmin, createUser, rawClub, rawLink, rawSquad, realSession, wp6Harness, type Wp6Harness } from './wp6/harness.ts';

function scan(db: Db, needles: string[]): string[] {
  const hits: string[] = [];
  const tables = db.all<{ name: string }>("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name");
  for (const { name } of tables) {
    const cols = db.all<{ name: string; type: string }>('SELECT name, type FROM pragma_table_xinfo(?)', [name]);
    for (const c of cols) {
      for (const n of needles) {
        const r = db.get<{ k: number }>(`SELECT count(*) AS k FROM "${name}" WHERE CAST("${c.name}" AS TEXT) LIKE ?`, [`%${n}%`]);
        if ((r?.k ?? 0) > 0) hits.push(`${name}.${c.name} ~ ${n}`);
      }
    }
  }
  return hits;
}

async function richUser(h: Wp6Harness) {
  const admin = createAdmin(h);
  const s = createUser(h);
  const friend = createUser(h);
  const u = h.db.get<{ email: string; pseudonym: string }>('SELECT email, pseudonym FROM user WHERE id = ?', [s.id]) as { email: string; pseudonym: string };
  const sid = await realSession(h, s, 25);
  const squad = rawSquad(h, [s.id, friend.id], h.clock.now().toISOString());
  const club = rawClub(h);
  rawLink(h, club, s.id, h.clock.now().toISOString(), 'ip_a', 'other');
  const at = h.clock.now().toISOString();
  // A flag with a decision and an appeal, a sample item, a harm signal, a support ticket, a prize.
  const flag = h.db.transaction(() => (h.services.flags as SqlFlagService).raise(h.db, { code: 'H5', subject: { type: 'session', id: sid }, sessionIds: [sid], evidence: { accounts: [s.id], threshold: 480 } }));
  h.db.transaction(() => h.services.sessions.setReviewStatus(h.db, [sid], 'pending'));
  await api(h, admin, 'POST', `/admin/flags/${flag}/decision`, { decision: 'reject', reason_code: 'implausible_pattern', note: `about ${u.email}` });
  expect((await api(h, s, 'POST', '/appeals', { object_type: 'flag', object_id: flag, text: `mijn naam en ${u.email}` })).status).toBe(201);
  h.db.run("INSERT INTO fraud_sample (id, kind, week_key, seed_version, size, drawn_at) VALUES ('01JSAMPLE0000000000000000A', 'weekly', '2026-11-30', 'test', 1, ?)", [at]);
  h.db.run("INSERT INTO fraud_sample_item (id, sample_id, user_id, stratum, score, checks) VALUES ('01JITEM000000000000000000A', '01JSAMPLE0000000000000000A', ?, 'no_club', 'abc', '{}')", [s.id]);
  h.db.run("INSERT INTO harm_signal (id, user_id, code, focus_day, week_key, created_at) VALUES ('01JHARM000000000000000000A', ?, 'S2', '2026-12-03', '2026-11-30', ?)", [s.id, at]);
  h.db.run("INSERT INTO support_ticket (id, user_id, kind, text, status, created_at) VALUES ('01JT1CKET00000000000000000', ?, 'other', ?, 'open', ?)", [s.id, `mail me at ${u.email}`, at]);
  h.db.run("INSERT INTO prize (id, kind, reward_kind, value_cents, declaration_ref, min_age_band, winner_user_id, status, created_at) VALUES ('01JPRIZE000000000000000000', 'earned_individual', 'in_kind', 800, 'decl', '16_17', ?, 'candidate', ?)", [s.id, at]);
  h.db.run("INSERT INTO prize_delivery_contact (id, prize_id, full_name, address, created_at) VALUES ('01JCONTACT0000000000000000', '01JPRIZE000000000000000000', 'Mila Test', 'Straat 1', ?)", [at]);
  h.db.run("INSERT INTO card (id, user_id, kind, ref_id, fields, snapshot, token, created_at) VALUES ('01JCARD0000000000000000000', ?, 'session', ?, '{}', '{}', 'tok_card_1', ?)", [s.id, sid, at]);
  h.db.run("INSERT INTO experiment_assignment (unit_type, unit_id, factor, arm, stratum, block, seed_version, assigned_at) VALUES ('solo', ?, 'bonus', 'A', 'other', 'b1', 'test', ?)", [s.id, at]);
  h.db.run("INSERT INTO arm_switch (id, user_id, factor, \"from\", \"to\", reason, at) VALUES ('01JSWITCH00000000000000000', ?, 'bonus', 'B', 'A', 'join', ?)", [s.id, at]);
  h.db.run("INSERT INTO idempotency_record (scope_ref, key, route, request_hash, status_code, response, created_at) VALUES (?, 'k1', 'POST /x', 'h', 200, ?, ?)", [s.id, JSON.stringify({ user: s.id }), at]);
  h.db.run("INSERT INTO waitlist_entry (id, email, email_hash, locale, source, group_token, priority_reason, consent_version, created_at) VALUES ('01JWAIT0000000000000000000', ?, 'wh', 'nl', 'landing', 'g', 'none', 'v1', ?)", [u.email, at]);
  h.db.run("UPDATE user SET phone_hash = 'ph_deleted_user', phone_line_type = 'mobile', phone_verified_at = ?, institution_email_hash = 'ih_deleted_user', institution_domain = 'uu.nl', institution_verified_at = ? WHERE id = ?", [at, at, s.id]);
  h.db.run("INSERT INTO blocked_phone_hash (phone_hash, blocked_at, expires_at) VALUES ('ph_deleted_user', ?, '2028-12-01T00:00:00.000Z')", [at]);
  // Events with the squad id in the column and in props.
  h.services.events.event(h.db, 'squad_became_active', { squad_id: squad } as never, { pseudonym: u.pseudonym, squadId: squad });
  return { admin, s, friend, u, sid, squad, flag };
}

describe('architecture §10.7 deletion', () => {
  it('DELETE /me leaves no trace of the user, the journal still sums to zero and H8 still works', async () => {
    const h = wp6Harness();
    const { s, u, squad, sid } = await richUser(h);
    expect((await api(h, s, 'DELETE', '/me', { confirm: 'nee' })).body.error.code).toBe('CONFIRMATION_REQUIRED');
    const del = await api(h, s, 'DELETE', '/me', { confirm: 'VERWIJDER' });
    expect(del.status).toBe(202);
    expect(scan(h.db, [s.id, u.email, u.pseudonym, 'ih_deleted_user'])).toEqual([]);
    expect(h.db.get('SELECT count(*) AS n FROM event WHERE squad_id = ?', [squad])).toEqual({ n: 0 });
    expect(h.db.get<{ s: number }>('SELECT coalesce(sum(amount), 0) AS s FROM posting')?.s).toBe(0);
    // Event props join to nothing any more.
    expect(h.db.get("SELECT count(*) AS n FROM event e JOIN focus_session f ON f.id = json_extract(e.props, '$.session_id')")).toEqual({ n: 0 });
    expect(h.db.get('SELECT count(*) AS n FROM event WHERE props LIKE ?', [`%${sid}%`])).toEqual({ n: 0 });
    // H8: the number of a blocked account is still known; the flag row stays without the person.
    expect(h.db.get("SELECT count(*) AS n FROM blocked_phone_hash WHERE phone_hash = 'ph_deleted_user'")).toEqual({ n: 1 });
    expect(h.db.get('SELECT status, subject_id FROM fraud_flag')).toEqual({ status: 'rejected', subject_id: null });
    expect(h.db.get("SELECT status, user_id, text FROM appeal")).toEqual({ status: 'closed', user_id: null, text: null });
    expect(h.db.get("SELECT label, user_id, text FROM support_ticket")).toEqual({ label: null, user_id: null, text: null });
    expect(h.db.get('SELECT count(*) AS n FROM prize_delivery_contact')).toEqual({ n: 0 });
    expect(h.db.get("SELECT count(*) AS n FROM audit_log WHERE action = 'account_deleted'")).toEqual({ n: 1 });
    // The old session cookie no longer works.
    expect((await api(h, s, 'GET', '/me')).status).toBe(401);
  });

  it('GET /me/export has a section per module with the own data, without other people', async () => {
    const h = wp6Harness();
    const { s, friend, flag } = await richUser(h);
    const r = await api(h, s, 'GET', '/me/export');
    expect(r.status).toBe(200);
    expect(r.body.format).toBe('rewarded-export-v1');
    expect(Object.keys(r.body.modules)).toEqual(expect.arrayContaining(['fraud', 'support', 'privacy', 'points', 'sessions']));
    expect(r.body.modules.fraud.flags[0]).toMatchObject({ id: flag, status: 'rejected', reason_code: 'implausible_pattern' });
    expect(r.body.modules.fraud.appeals).toHaveLength(1);
    expect(JSON.stringify(r.body)).not.toContain(friend.id);
  });

  it('deletion by an admin needs a second admin (four eyes)', async () => {
    const h = wp6Harness();
    const a1 = createAdmin(h);
    const a2 = createAdmin(h);
    // Admin routes take a real ULID (the test helper's ids are not Crockford-valid).
    const s = { id: '01JWP6DE1ETE5SER0000000000' };
    h.db.run(
      `INSERT INTO user (id, email, email_norm_hash, first_name, locale, age_band, status, pseudonym, registration_source, daily_goal_min, cohort, registration_channel, terms_version, privacy_version, research_info_version, created_at)
       VALUES (?, 'del@example.test', 'h_del', 'Del', 'nl', '18_plus', 'active', 'pseudo_del', 'personal', 25, 'experiment', 'other', 'v1', 'v1', 'v1', ?)`,
      [s.id, h.clock.now().toISOString()],
    );
    const first = await api(h, a1, 'DELETE', `/admin/users/${s.id}`);
    expect(first.body.error.code).toBe('FOUR_EYES_REQUIRED');
    expect((await api(h, a1, 'DELETE', `/admin/users/${s.id}`)).body.error.code).toBe('FOUR_EYES_REQUIRED');
    expect(h.db.get('SELECT count(*) AS n FROM user WHERE id = ?', [s.id])).toEqual({ n: 1 });
    expect((await api(h, a2, 'DELETE', `/admin/users/${s.id}`)).status).toBe(202);
    expect(h.db.get('SELECT count(*) AS n FROM user WHERE id = ?', [s.id])).toEqual({ n: 0 });
  });
});
