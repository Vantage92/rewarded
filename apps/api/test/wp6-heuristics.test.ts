// Acceptance WP-6 (architecture §4.5, §12.1): on the seed with a simulated UB-NAT (twenty honest
// students behind one campus address, spread over the day) and a simulated mobile address, H2, H7,
// H10 and H12 do not flag; the red-team hotspot, four accounts behind one `other` address and six
// accounts in six browser profiles on one laptop on eduroam (together and staggered) do.
import { fraudRules } from '@rewarded/core/fraud';
import { CURRENT_PARAMS } from '@rewarded/core';
import { describe, expect, it } from 'vitest';
import { runDayBatch, runHourlyBatch, runWeekBatch } from '../src/modules/fraud/lib/batch.ts';
import { createUser, local, rawClub, rawLink, rawSession, rawSquad, setRegistration, wp6Harness, type Wp6Harness } from './wp6/harness.ts';

const PHONES = ['ios_safari', 'android_chrome', 'ios_webview', 'android_webview'];
const flags = (h: Wp6Harness) => h.db.all<{ code: string; subject_type: string; status: string }>('SELECT code, subject_type, status FROM fraud_flag ORDER BY code');
const DAYS = ['2026-12-07', '2026-12-08', '2026-12-09'];

/** Twenty students, five squads of four, one club, all on one campus (or mobile) address. */
function ubNat(h: Wp6Harness, ip: string, net: 'campus' | 'mobile_cgnat') {
  const club = rawClub(h, `UB ${ip}`);
  const users = Array.from({ length: 20 }, () => createUser(h).id);
  users.forEach((u, i) => {
    // Registered over two weeks, linked to the club over two days, from the shared address.
    setRegistration(h.db, u, new Date(local('2026-11-20', 9) + i * 13 * 3_600_000).toISOString(), ip, net);
    rawLink(h, club, u, new Date(local('2026-12-08', 8) + i * 2.2 * 3_600_000).toISOString(), ip, net);
  });
  for (let g = 0; g < 5; g++) rawSquad(h, users.slice(g * 4, g * 4 + 4), '2026-12-01T10:00:00.000Z');
  for (const day of DAYS)
    users.forEach((u, i) => rawSession(h, u, { start: local(day, 8 + Math.floor((i * 12) / 20), (i * 7) % 60), minutes: 90, ipHash: ip, netClass: net, uaClass: PHONES[i % 4] as string }));
  return users;
}

function runAll(h: Wp6Harness) {
  for (const d of DAYS) runDayBatch(h.deps, d, new Date(local(d, 5) + 86_400_000 + 45 * 60_000));
  runHourlyBatch(h.deps, new Date(local('2026-12-09', 20)));
  runWeekBatch(h.deps, '2026-12-07', new Date(local('2026-12-14', 6)));
}

describe('architecture §4.5 acceptance: UB-NAT and mobile address are not flagged', () => {
  it('without the red-team thresholds (null: shared nets reported, not flagged)', () => {
    const h = wp6Harness({ start: '2026-12-10T10:00:00Z' });
    ubNat(h, 'ip_ub', 'campus');
    ubNat(h, 'ip_mob', 'mobile_cgnat');
    runAll(h);
    expect(flags(h).filter((f) => ['H2', 'H7', 'H10', 'H12'].includes(f.code))).toEqual([]);
    expect(h.logger.lines.some((l) => l.msg === 'fraud_shared_threshold_missing')).toBe(true);
  });

  it('with thresholds a red-team day could set', () => {
    const h = wp6Harness({ start: '2026-12-10T10:00:00Z' });
    h.services.fraudRules = fraudRules(CURRENT_PARAMS, { h2SharedThreshold: 25, h7SharedThreshold: 5, h10SharedThreshold: 40, h12SharedThreshold: 10 });
    ubNat(h, 'ip_ub', 'campus');
    ubNat(h, 'ip_mob', 'mobile_cgnat');
    runAll(h);
    expect(flags(h).filter((f) => ['H2', 'H7', 'H10', 'H12'].includes(f.code))).toEqual([]);
  });
});

describe('architecture §4.5 acceptance: the red-team scenarios are flagged', () => {
  it('ten accounts behind a hotspot, registered within an hour, in one club (H2, H7)', () => {
    const h = wp6Harness({ start: '2026-12-10T10:00:00Z' });
    const club = rawClub(h);
    const users = Array.from({ length: 10 }, () => createUser(h).id);
    users.forEach((u, i) => {
      setRegistration(h.db, u, new Date(local('2026-12-07', 9) + i * 2 * 60_000).toISOString(), 'ip_hot', 'other');
      rawLink(h, club, u, new Date(local('2026-12-07', 10) + i * 60_000).toISOString(), 'ip_hot', 'other');
      rawSession(h, u, { start: local('2026-12-08', 13, i * 3), minutes: 50, ipHash: 'ip_hot', netClass: 'other' });
    });
    rawSquad(h, users.slice(0, 5), '2026-12-07T10:00:00.000Z');
    rawSquad(h, users.slice(5), '2026-12-07T10:00:00.000Z');
    runDayBatch(h.deps, '2026-12-08', new Date(local('2026-12-09', 5, 45)));
    const codes = flags(h).map((f) => f.code);
    expect(codes.filter((c) => c === 'H2')).toHaveLength(1);
    expect(codes.filter((c) => c === 'H7')).toHaveLength(2);
    // The flagged sessions wait for a human, nothing is booked.
    expect(h.db.get("SELECT count(*) AS n FROM focus_session WHERE review_status = 'pending'")).toEqual({ n: 10 });
    expect(h.db.get("SELECT count(*) AS n FROM fraud_flag WHERE status <> 'open'")).toEqual({ n: 0 });
    // Rerunning the step is idempotent.
    runDayBatch(h.deps, '2026-12-08', new Date(local('2026-12-09', 5, 45)));
    expect(flags(h)).toHaveLength(3);
  });

  it('four accounts behind one `other` address (H2)', () => {
    const h = wp6Harness({ start: '2026-12-10T10:00:00Z' });
    for (let i = 0; i < 4; i++) rawSession(h, createUser(h).id, { start: local('2026-12-08', 9 + i * 3), ipHash: 'ip_flat', netClass: 'other' });
    runDayBatch(h.deps, '2026-12-08', new Date(local('2026-12-09', 5, 45)));
    expect(flags(h).map((f) => f.code)).toEqual(['H2']);
  });

  it('H10: more than 20 new members in 48 hours on few addresses (hourly job)', () => {
    const h = wp6Harness({ start: '2026-12-10T10:00:00Z' });
    const club = rawClub(h);
    for (let i = 0; i < 21; i++) rawLink(h, club, createUser(h).id, new Date(local('2026-12-09', 8) + i * 30 * 60_000).toISOString(), `ip_${i % 2}`, 'other');
    runHourlyBatch(h.deps, new Date(local('2026-12-09', 20)));
    expect(flags(h)).toEqual([{ code: 'H10', subject_type: 'club', status: 'open' }]);
  });

  for (const stagger of [0, 3]) {
    it(`six accounts in six browser profiles on one laptop on eduroam (H12, staggered ${stagger} min)`, () => {
      const h = wp6Harness({ start: '2026-12-14T10:00:00Z' });
      const users = Array.from({ length: 6 }, () => createUser(h).id);
      for (const day of ['2026-12-08', '2026-12-10'])
        users.forEach((u, i) => rawSession(h, u, { start: local(day, 14) + i * stagger * 60_000, minutes: 90, ipHash: 'ip_eduroam', netClass: 'campus', uaClass: 'desktop' }));
      runDayBatch(h.deps, '2026-12-10', new Date(local('2026-12-11', 5, 45)));
      const f = flags(h).filter((x) => x.code === 'H12');
      expect(f).toHaveLength(1);
      const n = h.db.get<{ n: number }>("SELECT count(*) AS n FROM fraud_flag_session l JOIN fraud_flag f ON f.id = l.flag_id WHERE f.code = 'H12' AND l.session_id IS NOT NULL");
      expect(n?.n).toBe(12);
      // The week close sees the same key: no second flag.
      runWeekBatch(h.deps, '2026-12-07', new Date(local('2026-12-14', 6)));
      expect(flags(h).filter((x) => x.code === 'H12')).toHaveLength(1);
    });
  }
});
