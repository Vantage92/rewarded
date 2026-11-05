// WP-6 core/fraud: heuristics H1–H12 with net classes (spec §6.3, architecture §4.5), harm signals and
// rules (spec §6.6, voorregistratie §8.3), reproducible samples (spec §6.7, architecture §6.5), the
// estimate (spec §7.2) and the review and retention rules (spec §6.4–6.5, architecture §10.6–10.8).
import { describe, expect, it } from 'vitest';
import { PARAMS_V1 } from '../src/params/index.ts';
import { fromLocal, MS_PER_MINUTE } from '../src/time/zone.ts';
import { focusDayOf } from '../src/time/focus.ts';
import {
  absoluteHarm,
  allocate,
  appealWindowOpen,
  drawSample,
  drawSimple,
  eligibleAppealReviewers,
  fraudReleaseBlockers,
  fraudRules,
  guardRuleRestArm,
  h1,
  h10,
  h11,
  h12,
  h2,
  h3,
  h4,
  h5,
  h6,
  h7,
  h9,
  harmRules,
  harmSignals,
  hmacSha256Hex,
  isValidFlagReason,
  judgementFromCriteria,
  mayJudgeSampleItem,
  overlapOfDay,
  reduceEvidence,
  retentionCutoffs,
  sha256Hex,
  stopRuleArmB,
  stratifiedEstimate,
  stratumOf,
  wilson,
  type ClubLinkFact,
  type SessionFact,
  type SquadFact,
} from '../src/fraud/index.ts';

const P = PARAMS_V1;
const RULES = fraudRules(P);
/** Thresholds a red-team day could produce; only used to show behaviour once they are set. */
const TEST_SHARED = fraudRules(P, { h2SharedThreshold: 25, h7SharedThreshold: 4, h10SharedThreshold: 40, h12SharedThreshold: 10 });

let seq = 0;
function session(o: Partial<SessionFact> & { userId: string; startAt: number }): SessionFact {
  const planned = o.plannedMin ?? 50;
  const status = o.status ?? 'completed';
  return {
    sessionId: o.sessionId ?? `s${String(++seq).padStart(5, '0')}`,
    status,
    isPractice: false,
    endAt: o.endAt === undefined ? o.startAt + planned * MS_PER_MINUTE : o.endAt,
    focusDay: o.focusDay ?? focusDayOf(o.startAt, P),
    plannedMin: planned,
    verifiedMin: status === 'completed' ? planned : 0,
    ipHash: 'ip_other',
    netClass: 'other',
    uaClass: 'android_chrome',
    webdriver: false,
    coveredGapS: 0,
    clockSkewMs: 0,
    claimDelayS: 5,
    lateStart: false,
    ...o,
  } as SessionFact;
}
const at = (day: string, hh: number, mm = 0): number => {
  const [y, m, d] = day.split('-').map(Number) as [number, number, number];
  return fromLocal(y, m, d, hh, mm);
};
const PHONES = ['ios_safari', 'android_chrome', 'ios_webview', 'android_webview'];

/** Twenty honest students behind one campus address, spread over the day (architecture §4.5). */
function ubNat(day: string, net: 'campus' | 'mobile_cgnat' = 'campus', ip = 'ip_ub'): SessionFact[] {
  const out: SessionFact[] = [];
  for (let i = 0; i < 20; i++) {
    const hour = 8 + Math.floor((i * 12) / 20);
    out.push(session({ userId: `ub_${i}`, startAt: at(day, hour, (i * 7) % 60), ipHash: ip, netClass: net, uaClass: PHONES[i % 4] as string, plannedMin: 90 }));
  }
  return out;
}

describe('core/fraud sha256 and HMAC (architecture §6.5 reproducible draw)', () => {
  it('matches FIPS 180-4 and RFC 4231 vectors', () => {
    expect(sha256Hex('')).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
    expect(sha256Hex('abc')).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
    expect(sha256Hex('a'.repeat(1000))).toBe('41edece42d63e8d9bf515a9ba6932e1c20cbc9f5a5d134645adb5db1b9737ea3');
    expect(hmacSha256Hex('Jefe', 'what do ya want for nothing?')).toBe('5bdcc146bf60754e6a042426089575c75a003f089d2739839dec58b964ec3843');
    expect(hmacSha256Hex('k'.repeat(131), 'Test Using Larger Than Block-Size Key - Hash Key First')).toHaveLength(64);
  });
  it('agrees with node:crypto on unicode input', async () => {
    const spec = 'node:crypto';
    const c = (await import(spec)) as { createHmac(a: string, k: string): { update(s: string): { digest(e: 'hex'): string } } };
    for (const [k, m] of [['seed', 'sample|2026-12-07|no_club|01J'], ['ëñ€😀', 'héllo wörld €'], ['x'.repeat(200), 'y'.repeat(300)]] as const)
      expect(hmacSha256Hex(k, m)).toBe(c.createHmac('sha256', k).update(m).digest('hex'));
  });
});

describe('spec §6.3 per-session heuristics H1, H3, H4, H11', () => {
  it('H1 webdriver or headless UA', () => {
    expect(h1({ webdriver: true, uaClass: 'android_chrome' }, RULES)).toBe(true);
    expect(h1({ webdriver: false, uaClass: 'headless' }, RULES)).toBe(true);
    expect(h1({ webdriver: false, uaClass: 'desktop' }, RULES)).toBe(false);
  });
  it('H3 gaps above 10% of the planned duration, H4 skew above 5 minutes', () => {
    expect(h3({ coveredGapS: 300, plannedMin: 50 }, RULES)).toBe(false);
    expect(h3({ coveredGapS: 301, plannedMin: 50 }, RULES)).toBe(true);
    expect(h4({ clockSkewMs: 300_000 }, RULES)).toBe(false);
    expect(h4({ clockSkewMs: -300_001 }, RULES)).toBe(true);
    expect(h4({ clockSkewMs: null }, RULES)).toBe(false);
  });
  it('H11 more than one account per device per week', () => {
    expect(h11(1, RULES)).toBe(false);
    expect(h11(2, RULES)).toBe(true);
  });
});

describe('spec §6.3 H2 with net classes (architecture §4.5 acceptance)', () => {
  const day = '2026-12-08';
  it('does not flag a simulated UB-NAT or a mobile address, with and without the red-team thresholds', () => {
    for (const rules of [RULES, TEST_SHARED]) {
      expect(h2(ubNat(day), [day], rules).findings).toEqual([]);
      expect(h2(ubNat(day, 'mobile_cgnat', 'ip_mob'), [day], rules).findings).toEqual([]);
    }
    // Without a threshold the shared-net group is reported, not silently skipped.
    expect(h2(ubNat(day), [day], RULES).skipped[0]).toMatchObject({ code: 'H2', reason: 'shared_threshold_missing', netClass: 'campus', count: 20 });
    expect(fraudReleaseBlockers(RULES)).toEqual(['h2_shared_threshold', 'h7_shared_threshold', 'h10_shared_threshold', 'h12_shared_threshold']);
    expect(fraudReleaseBlockers(TEST_SHARED)).toEqual([]);
  });
  it('flags four accounts behind one `other` address and not three', () => {
    const four = [0, 1, 2, 3].map((i) => session({ userId: `o${i}`, startAt: at(day, 10 + i) }));
    const r = h2(four, [day], RULES);
    expect(r.findings).toHaveLength(1);
    expect(r.findings[0]).toMatchObject({ code: 'H2', userIds: ['o0', 'o1', 'o2', 'o3'], evidence: { accounts: 4, threshold: 3 } });
    expect(h2(four.slice(0, 3), [day], RULES).findings).toEqual([]);
  });
  it('flags the red-team hotspot (ten accounts, one hour)', () => {
    const hot = Array.from({ length: 10 }, (_, i) => session({ userId: `rt${i}`, startAt: at(day, 14, i * 5), ipHash: 'ip_hot' }));
    expect(h2(hot, [day], RULES).findings[0]?.evidence).toMatchObject({ accounts: 10 });
  });
  it('a shared net counts with its higher threshold, not as infinity', () => {
    const many = Array.from({ length: 26 }, (_, i) => session({ userId: `c${i}`, startAt: at(day, 9, i), ipHash: 'ip_c', netClass: 'campus' }));
    expect(h2(many, [day], TEST_SHARED).findings[0]?.evidence).toMatchObject({ accounts: 26, threshold: 25, net_class: 'campus' });
  });
  it('is idempotent through its dedup key', () => {
    const four = [0, 1, 2, 3].map((i) => session({ userId: `o${i}`, startAt: at(day, 10 + i) }));
    expect(h2(four, [day], RULES).findings[0]?.dedupKey).toBe(h2([...four].reverse(), [day], RULES).findings[0]?.dedupKey);
  });
});

describe('spec §6.3 H5, H6, H9', () => {
  it('H5: more than 480 verified minutes three days in a row flags the third day', () => {
    const days = ['2026-12-07', '2026-12-08', '2026-12-09'].map((d) => ({ userId: 'u', focusDay: d, verifiedMin: 481 }));
    const s = session({ userId: 'u', startAt: at('2026-12-09', 10) });
    expect(h5(days, [s], '2026-12-09', RULES).findings[0]).toMatchObject({ code: 'H5', sessionIds: [s.sessionId] });
    expect(h5([...days.slice(0, 2), { userId: 'u', focusDay: '2026-12-09', verifiedMin: 480 }], [s], '2026-12-09', RULES).findings).toEqual([]);
  });
  it('H6: nights covered 01:00–06:00 without a break on more than 2 nights a week', () => {
    const nights = ['2026-12-08', '2026-12-09', '2026-12-10'];
    const mk = (date: string, n: number) =>
      [0, 1, 2, 3].map((k) => session({ userId: 'n', startAt: at(date, 1, 0) + k * 91 * MS_PER_MINUTE - (k === 0 ? 2 * MS_PER_MINUTE : 0), plannedMin: 90, sessionId: `n${n}_${k}` }));
    const s = nights.flatMap((d, i) => mk(d, i));
    const r = h6(s, '2026-12-07', P, RULES);
    expect(r.findings[0]).toMatchObject({ code: 'H6', evidence: { nights: 3 } });
    expect(h6(s.filter((x) => !x.sessionId.startsWith('n2')), '2026-12-07', P, RULES).findings).toEqual([]);
    // A break of an hour is an interruption.
    const broken = s.filter((x) => x.sessionId !== 'n2_2');
    expect(h6(broken, '2026-12-07', P, RULES).findings).toEqual([]);
  });
  it('H9: more than 80% of the week with a claim delay above 15 minutes', () => {
    const s = [0, 1, 2, 3, 4].map((i) => session({ userId: 'c', startAt: at('2026-12-08', 9 + i), claimDelayS: i === 0 ? 10 : 16 * 60 }));
    expect(h9(s, '2026-12-07', RULES).findings).toEqual([]); // exactly 80%
    expect(h9(s.map((x) => ({ ...x, claimDelayS: 16 * 60 })), '2026-12-07', RULES).findings[0]?.evidence).toMatchObject({ share_pct: 100 });
  });
});

describe('spec §6.3 H7 and H10 with net classes (architecture §4.5 acceptance)', () => {
  const t0 = at('2026-12-02', 12);
  const squad = (id: string, n: number, ip: string, net: 'campus' | 'mobile_cgnat' | 'other', spreadMin: number): SquadFact => ({
    squadId: id,
    members: Array.from({ length: n }, (_, i) => ({ userId: `${id}_${i}`, registeredAt: t0 + Math.round((i * spreadMin) / Math.max(1, n - 1)) * MS_PER_MINUTE, ipHash: ip, netClass: net })),
  });
  it('H7 flags a squad registered within 10 minutes from one `other` address', () => {
    expect(h7([squad('sq1', 3, 'ip_x', 'other', 9)], [], RULES).findings[0]).toMatchObject({ code: 'H7', subject: { type: 'squad', id: 'sq1' } });
    expect(h7([squad('sq1', 3, 'ip_x', 'other', 11)], [], RULES).findings).toEqual([]);
  });
  it('H7 does not flag UB-NAT squads of friends who registered over the day', () => {
    const ub = [squad('ub1', 5, 'ip_ub', 'campus', 300), squad('ub2', 4, 'ip_ub', 'campus', 180), squad('mob', 3, 'ip_mob', 'mobile_cgnat', 120)];
    for (const rules of [RULES, TEST_SHARED]) expect(h7(ub, [], rules).findings).toEqual([]);
  });
  it('H7 flags the red-team hotspot on a shared net once its threshold is set', () => {
    const hot = [squad('rt1', 5, 'ip_hot', 'mobile_cgnat', 6), squad('rt2', 5, 'ip_hot', 'mobile_cgnat', 8)];
    expect(h7(hot, [], RULES).findings).toEqual([]);
    expect(h7(hot, [], RULES).skipped).toHaveLength(2);
    expect(h7(hot, [], TEST_SHARED).findings.map((f) => f.subject.id)).toEqual(['rt1', 'rt2']);
  });
  const links = (club: string, n: number, ips: number, net: 'campus' | 'other', spanH: number): ClubLinkFact[] =>
    Array.from({ length: n }, (_, i) => ({ clubId: club, userId: `${club}_${i}`, linkedAt: t0 + Math.round((i * spanH * 60) / n) * MS_PER_MINUTE, ipHash: `ip_${i % ips}`, netClass: net }));
  it('H10: more than 20 new members in 48 hours, more than half on ≤ 3 IP hashes', () => {
    const now = t0 + 40 * 3_600_000;
    expect(h10(links('k1', 21, 2, 'other', 30), [], now, '2026-11-30', RULES).findings[0]).toMatchObject({ code: 'H10', subject: { type: 'club', id: 'k1' } });
    expect(h10(links('k1', 20, 2, 'other', 30), [], now, '2026-11-30', RULES).findings).toEqual([]);
    expect(h10(links('k1', 21, 21, 'other', 30), [], now, '2026-11-30', RULES).findings).toEqual([]);
  });
  it('H10 does not flag a UB-NAT club week', () => {
    const now = t0 + 47 * 3_600_000;
    const ub = links('ub', 20, 1, 'campus', 46);
    for (const rules of [RULES, TEST_SHARED]) expect(h10(ub, [], now, '2026-11-30', rules).findings).toEqual([]);
    const bigger = links('ub', 30, 1, 'campus', 46);
    expect(h10(bigger, [], now, '2026-11-30', TEST_SHARED).findings).toEqual([]);
    expect(h10(bigger, [], now, '2026-11-30', RULES).skipped[0]).toMatchObject({ code: 'H10', netClass: 'campus' });
  });
});

describe('spec §6.3 H12 on overlap over the whole session duration (round 3)', () => {
  const week = '2026-12-07';
  const laptop = (days: string[], staggerMin: number) =>
    days.flatMap((d) => Array.from({ length: 6 }, (_, i) => session({ userId: `p${i}`, startAt: at(d, 14) + i * staggerMin * MS_PER_MINUTE, plannedMin: 90, ipHash: 'ip_eduroam', netClass: 'campus', uaClass: 'desktop' })));
  it('six profiles on one laptop on eduroam are flagged, started together and staggered by three minutes', () => {
    for (const stagger of [0, 3]) {
      const r = h12(laptop(['2026-12-08', '2026-12-09'], stagger), week, at('2026-12-14', 6), RULES);
      expect(r.findings).toHaveLength(1);
      expect(r.findings[0]).toMatchObject({ code: 'H12', userIds: ['p0', 'p1', 'p2', 'p3', 'p4', 'p5'], evidence: { days: 2, ua_class: 'desktop' } });
      expect(r.findings[0]?.sessionIds).toHaveLength(12);
    }
  });
  it('needs two days and 40 minutes of overlap', () => {
    expect(h12(laptop(['2026-12-08'], 3), week, at('2026-12-14', 6), RULES).findings).toEqual([]);
    const short = laptop(['2026-12-08', '2026-12-09'], 0).map((s) => ({ ...s, plannedMin: 25, endAt: s.startAt + 25 * MS_PER_MINUTE }));
    expect(h12(short, week, at('2026-12-14', 6), RULES).findings).toEqual([]);
  });
  it('twenty students in the UB with different devices are not flagged', () => {
    const days = ['2026-12-08', '2026-12-09', '2026-12-10'];
    const s = days.flatMap((d) => [
      ...ubNat(d).map((x) => ({ ...x, startAt: at(d, 10) + (x.startAt % 3_600_000), endAt: at(d, 10) + (x.startAt % 3_600_000) + 90 * MS_PER_MINUTE })),
      session({ userId: 'lap1', startAt: at(d, 10), plannedMin: 90, ipHash: 'ip_ub', netClass: 'campus', uaClass: 'desktop' }),
      session({ userId: 'lap2', startAt: at(d, 10, 20), plannedMin: 90, ipHash: 'ip_ub', netClass: 'campus', uaClass: 'desktop' }),
    ]);
    for (const rules of [RULES, TEST_SHARED]) expect(h12(s, week, at('2026-12-14', 6), rules).findings).toEqual([]);
  });
  it('the sweep does not count touching sessions as overlap', () => {
    const a = session({ userId: 'a', startAt: 0, plannedMin: 25 });
    const b = session({ userId: 'b', startAt: 25 * MS_PER_MINUTE, plannedMin: 25 });
    expect(overlapOfDay([a, b], 2, 0).overlapMin).toBe(0);
    const c = session({ userId: 'c', startAt: 10 * MS_PER_MINUTE, plannedMin: 25 });
    expect(overlapOfDay([a, c], 2, 0).overlapMin).toBe(15);
  });
});

describe('spec §6.6 harm signals S1–S3 and the cool-down', () => {
  const R = harmRules(P);
  const days = (spec: Record<string, { min?: number; late?: boolean; done?: boolean }>) =>
    Object.entries(spec).map(([focusDay, v]) => ({ focusDay, verifiedMin: v.min ?? 0, lateStart: v.late ?? false, completed: v.done ?? (v.min ?? 0) > 0 }));
  it('S1: late starts on ≥ 3 nights within 7 days; S2: > 360 minutes on ≥ 3 days', () => {
    const d = days({ '2026-12-02': { late: true, min: 50 }, '2026-12-05': { late: true, min: 400 }, '2026-12-08': { late: true, min: 361 }, '2026-12-07': { min: 361 } });
    expect(harmSignals({ userId: 'u', day: '2026-12-08', days: d }, R)).toEqual(['S1', 'S2']);
    expect(harmSignals({ userId: 'u', day: '2026-12-09', days: d }, R)).toEqual(['S2']);
    expect(harmSignals({ userId: 'u', day: '2026-12-08', days: d, lastRaised: { S1: '2026-11-30', S2: '2026-11-24' } }, R)).toEqual(['S2']);
  });
  it('S3: broken streak of ≥ 7 days, then 7 quiet days after ≥ 5 focus days', () => {
    const d = days({ '2026-12-01': { min: 50 }, '2026-12-02': { min: 50 }, '2026-12-03': { min: 50 }, '2026-12-05': { min: 50 }, '2026-12-06': { min: 50 } });
    const input = { userId: 'u', days: d, breaks: [{ breakDay: '2026-12-07', streakBefore: 7 }] };
    expect(harmSignals({ ...input, day: '2026-12-13' }, R)).toEqual(['S3']);
    expect(harmSignals({ ...input, day: '2026-12-12' }, R)).toEqual([]);
    expect(harmSignals({ ...input, day: '2026-12-13', breaks: [{ breakDay: '2026-12-07', streakBefore: 6 }] }, R)).toEqual([]);
  });
});

describe('spec §6.6 stop rule arm B, guard rule rest arm and the absolute harm threshold (voorregistratie §8.3)', () => {
  const R = harmRules(P);
  it('criterion 2: share in B more than twice that of A', () => {
    expect(stopRuleArmB({ harm: { A: { actives: 100, withSignal: 2 }, B: { actives: 100, withSignal: 5 } } }, R)).toMatchObject({ criterion2: true, triggered: true });
    expect(stopRuleArmB({ harm: { A: { actives: 100, withSignal: 2 }, B: { actives: 100, withSignal: 4 } } }, R).triggered).toBe(false);
  });
  it('criterion 1 only with ≥ 40 answers per arm, two weeks in a row', () => {
    const w = { meanA: 3, meanB: 3.6, sd: 1, answersA: 40, answersB: 41 };
    const harm = { A: { actives: 10, withSignal: 0 }, B: { actives: 10, withSignal: 0 } };
    expect(stopRuleArmB({ harm, wellbeing: [w, w] }, R)).toMatchObject({ criterion1: true, criterion1Tested: true, triggered: true });
    expect(stopRuleArmB({ harm, wellbeing: [w] }, R).criterion1).toBe(false);
    expect(stopRuleArmB({ harm, wellbeing: [w, { ...w, answersB: 39 }] }, R)).toMatchObject({ criterion1Tested: false, triggered: false });
  });
  it('guard rule and absolute threshold per code', () => {
    expect(guardRuleRestArm({ actives: 50, withSignal: 3 }, { actives: 50, withSignal: 1 }, R)).toBe(true);
    expect(guardRuleRestArm({ actives: 50, withSignal: 2 }, { actives: 50, withSignal: 1 }, R)).toBe(false);
    const a = absoluteHarm(200, 4, { S1: 2, S2: 1, S3: 0, S4: 1 }, R);
    expect(a).toMatchObject({ sharePct: 2, exceeded: true, perCode: { S1: { count: 2, sharePct: 1 }, S4: { count: 1 } } });
    expect(absoluteHarm(200, 3, { S1: 3, S2: 0, S3: 0, S4: 0 }, R).exceeded).toBe(false);
  });
});

describe('spec §6.7 weekly sample: stratified and reproducible from the seed (architecture §6.5)', () => {
  const candidates = [
    ...Array.from({ length: 60 }, (_, i) => ({ userId: `a${i}`, stratum: 'club_a' })),
    ...Array.from({ length: 30 }, (_, i) => ({ userId: `b${i}`, stratum: 'club_b' })),
    ...Array.from({ length: 5 }, (_, i) => ({ userId: `c${i}`, stratum: 'club_c' })),
    ...Array.from({ length: 3 }, (_, i) => ({ userId: `d${i}`, stratum: 'club_d' })),
    ...Array.from({ length: 22 }, (_, i) => ({ userId: `n${i}`, stratum: 'no_club' })),
  ];
  const input = { seed: 'seed-for-tests', kind: 'weekly', key: '2026-12-07', candidates, size: 30, minPerStratum: 1, minStratumActives: 5 };
  it('allocates 30 proportionally with at least one per stratum with ≥ 5 actives', () => {
    const a = drawSample(input).allocation;
    expect(a.reduce((s, x) => s + x.size, 0)).toBe(30);
    expect(Object.fromEntries(a.map((x) => [x.stratum, x.size]))).toEqual({ club_a: 15, club_b: 8, club_c: 1, club_d: 1, no_club: 5 });
  });
  it('the same seed and week give the same items; another week or seed another draw', () => {
    const one = drawSample(input).items;
    expect(drawSample({ ...input, candidates: [...candidates].reverse() }).items).toEqual(one);
    expect(drawSample({ ...input, key: '2026-12-14' }).items).not.toEqual(one);
    expect(drawSample({ ...input, seed: 'other' }).items).not.toEqual(one);
    expect(new Set(one.map((i) => i.userId)).size).toBe(30);
  });
  it('test vector: first items of a fixed draw', () => {
    const items = drawSample({ ...input, candidates: candidates.filter((c) => c.stratum === 'club_c' || c.stratum === 'club_d') }).items;
    expect(items.map((i) => [i.stratum, i.userId, i.score.slice(0, 16)])).toMatchSnapshot();
  });
  it('a stratum below 5 actives can get zero; small populations are drawn whole', () => {
    expect(allocate(new Map([['x', 100], ['y', 2]]), 30, 1, 5)).toEqual([
      { stratum: 'x', actives: 100, size: 29 },
      { stratum: 'y', actives: 2, size: 1 },
    ]);
    expect(allocate(new Map([['x', 4]]), 30, 1, 5)).toEqual([{ stratum: 'x', actives: 4, size: 4 }]);
  });
  it('the expansion cohort is its own stratum after the launch decision', () => {
    expect(stratumOf({ clubId: 'k', cohort: 'expansion' }, true)).toBe('expansion');
    expect(stratumOf({ clubId: 'k', cohort: 'expansion' }, false)).toBe('k');
    expect(stratumOf({ clubId: null, cohort: 'experiment' }, true)).toBe('no_club');
  });
  it('prize sample of 20 and ambassador sample of 5 (spec §4.6, §4.9)', () => {
    const ids = Array.from({ length: 40 }, (_, i) => `m${i}`);
    expect(drawSimple('s', 'prize', 'ch:club', ids, 20)).toHaveLength(20);
    expect(drawSimple('s', 'ambassador', 'amb:2027-01', ids.slice(0, 3), 5)).toHaveLength(3);
    expect(drawSimple('s', 'prize', 'ch:club', ids, 20)).toEqual(drawSimple('s', 'prize', 'ch:club', [...ids].reverse(), 20));
  });
});

describe('spec §7.2 fraud estimate with 95% interval (voorregistratie §7.1, §7.7)', () => {
  it('Wilson interval and the go/no-go on the upper bound', () => {
    const w = wilson(0, 30);
    expect(w.lower).toBe(0);
    expect(w.upper).toBeCloseTo(0.1135, 3);
    const e = stratifiedEstimate([{ stratum: 'a', population: 200, judged: 30, positive: 0 }], 5);
    expect(e).toMatchObject({ estimate: 0, belowLimit: false, isLowerBound: true });
    const many = stratifiedEstimate(Array.from({ length: 10 }, (_, i) => ({ stratum: `w${i}`, population: 300, judged: 30, positive: 0 })), 5);
    expect(many.upper).toBeLessThan(0.05);
    expect(many.belowLimit).toBe(true);
  });
  it('weights the strata', () => {
    const e = stratifiedEstimate([
      { stratum: 'big', population: 900, judged: 10, positive: 1 },
      { stratum: 'small', population: 100, judged: 10, positive: 5 },
    ], 5);
    expect(e.estimate).toBeCloseTo(0.9 * 0.1 + 0.1 * 0.5, 10);
    expect(e.lower).toBeLessThan(e.estimate);
    expect(e.upper).toBeGreaterThan(e.estimate);
  });
});

describe('spec §6.4–6.5 review rules and architecture §10.8', () => {
  it('reason codes come from a fixed list per decision', () => {
    expect(isValidFlagReason('reject', 'multiple_accounts')).toBe(true);
    expect(isValidFlagReason('release', 'multiple_accounts')).toBe(false);
  });
  it('appeal within 14 days, decided by someone not involved, else a third person', () => {
    const d = Date.parse('2026-12-01T10:00:00Z');
    expect(appealWindowOpen(d, d + 14 * 86_400_000, 14)).toBe(true);
    expect(appealWindowOpen(d, d + 14 * 86_400_000 + 1, 14)).toBe(false);
    expect(eligibleAppealReviewers(['admin:a', 'admin:b', 'admin:c'], ['admin:a', null])).toEqual(['admin:b', 'admin:c']);
    expect(eligibleAppealReviewers(['admin:a', 'admin:b'], ['admin:a', 'admin:b'])).toEqual([]);
  });
  it('an interest moves a sample item to the second reviewer (jurist should-fix 6)', () => {
    expect(mayJudgeSampleItem({ interestDeclaredBy: 'admin:a', reassignedTo: 'admin:b' }, 'admin:a')).toBe(false);
    expect(mayJudgeSampleItem({ interestDeclaredBy: 'admin:a', reassignedTo: 'admin:b' }, 'admin:b')).toBe(true);
    expect(mayJudgeSampleItem({ interestDeclaredBy: null, reassignedTo: null }, 'admin:a')).toBe(true);
  });
  it('voorregistratie §7.2: fraud needs two criteria or a confirmed block', () => {
    expect(judgementFromCriteria({ fraudCriteria: ['shared_phone'], blockConfirmed: false, suspectCriteria: [] })).toBe('suspect');
    expect(judgementFromCriteria({ fraudCriteria: ['shared_phone', 'device_mismatch'], blockConfirmed: false, suspectCriteria: [] })).toBe('fraud');
    expect(judgementFromCriteria({ fraudCriteria: [], blockConfirmed: false, suspectCriteria: [] })).toBe('none');
  });
});

describe('architecture §10.6 retention table', () => {
  it('computes the cut-offs and reduces evidence to codes and thresholds', () => {
    const now = Date.parse('2027-03-01T05:45:00Z');
    const c = retentionCutoffs(now);
    expect(new Date(c.network).toISOString()).toBe('2027-01-30T05:45:00.000Z');
    expect(new Date(c.flagRow).toISOString()).toBe('2025-03-01T05:45:00.000Z');
    expect(c.rawEventsExpired).toBe(false);
    expect(retentionCutoffs(Date.parse('2027-06-16T04:00:00Z')).rawEventsExpired).toBe(true);
    expect(reduceEvidence({ accounts: 4, threshold: 3, net_class: 'other', window_from: 123, users: ['x'] })).toEqual({ threshold: 3, net_class: 'other' });
  });
});
