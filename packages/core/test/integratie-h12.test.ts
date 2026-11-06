// Round-3 build point 3 (spec §6.3, architecture §4.5, §12.5): H12 measures the overlap of sessions
// over their whole duration, not equal start times.
import { describe, expect, it } from 'vitest';
import { PARAMS_V1, focusDayOf, fraudRules, fromLocal, h12, MS_PER_MINUTE, type SessionFact } from '../src/index.ts';

const RULES = fraudRules(PARAMS_V1);
let seq = 0;
const at = (day: string, hh: number, mm = 0) => {
  const [y, m, d] = day.split('-').map(Number) as [number, number, number];
  return fromLocal(y, m, d, hh, mm);
};
const s = (userId: string, startAt: number, min: number): SessionFact => ({
  sessionId: `h12_${++seq}`, userId, status: 'completed', isPractice: false, startAt, endAt: startAt + min * MS_PER_MINUTE,
  focusDay: focusDayOf(startAt, PARAMS_V1), plannedMin: min, verifiedMin: min, ipHash: 'ip_hotspot', netClass: 'other', uaClass: 'android_chrome',
  webdriver: false, coveredGapS: 0, clockSkewMs: 0, claimDelayS: 5, lateStart: false,
});

describe('spec §6.3 H12 op overlap over de hele duur (integratie)', () => {
  const week = '2026-12-07';
  const days = ['2026-12-08', '2026-12-09'];

  it('§6.3 starts 20 minutes apart but 50 minutes running together are flagged', () => {
    const list = days.flatMap((d) => ['u1', 'u2', 'u3'].map((u, i) => s(u, at(d, 14, i * 20), 90)));
    const r = h12(list, week, at('2026-12-14', 6), RULES);
    expect(r.findings).toHaveLength(1);
    expect(r.findings[0]?.evidence).toMatchObject({ days: 2, overlap_min: [50, 50] });
  });

  it('§6.3 equal start times alone do not flag: three 25-minute sessions overlap less than 40 minutes', () => {
    const list = days.flatMap((d) => ['u1', 'u2', 'u3'].map((u) => s(u, at(d, 14), 25)));
    expect(h12(list, week, at('2026-12-14', 6), RULES).findings).toEqual([]);
  });

  it('§6.3 back-to-back sessions of different accounts never overlap', () => {
    const list = days.flatMap((d) => ['u1', 'u2', 'u3'].map((u, i) => s(u, at(d, 9) + i * 90 * MS_PER_MINUTE, 90)));
    expect(h12(list, week, at('2026-12-14', 6), RULES).findings).toEqual([]);
  });
});
