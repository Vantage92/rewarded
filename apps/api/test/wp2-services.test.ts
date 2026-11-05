// WP-2: service interfaces and fakes (architecture §12.2). Each fake enforces the invariants of its owner.
import { describe, expect, it } from 'vitest';
import { DomainError } from '@rewarded/contracts';
import { openDb } from '../src/db/open.ts';
import { createFakeServices, createServices, FakeEventWriter, FakeFlagService, FakePrizeService, FakePrivacyService, FakeExperimentService, FakeAuditWriter } from '../src/services/index.ts';

const tx = openDb({ path: ':memory:', driver: 'better-sqlite3' });
const SID = '01JC0000000000000000000030';

function code(fn: () => unknown): string | undefined {
  try {
    fn();
  } catch (e) {
    return e instanceof DomainError ? e.code : (e as Error).message;
  }
  return undefined;
}

describe('Services object (arch §12.2)', () => {
  it('createServices() returns a fake for every base service and accepts overrides', () => {
    const s = createServices();
    expect(Object.keys(s).sort()).toEqual(['audit', 'events', 'experiments', 'flags', 'privacy', 'prizes']);
    const flags = new FakeFlagService();
    expect(createServices({ flags }).flags).toBe(flags);
    expect(createFakeServices().events).toBeInstanceOf(FakeEventWriter);
  });
});

describe('FlagService fake (arch §10.8, spec §6.4)', () => {
  it('raises, lists open flags per session and releases after a human decision', () => {
    const f = new FakeFlagService();
    const id = f.raise(tx, { code: 'H3', subject: { type: 'session', id: SID }, sessionIds: [SID], evidence: { covered_gap_s: 200 } });
    expect(f.openForSessions([SID]).get(SID)?.map((x) => x.id)).toEqual([id]);
    const res = f.decide(tx, id, 'release', 'admin:a1', 'evidence_ok');
    expect(res.flag.status).toBe('released');
    expect(res.affectedSessionIds).toEqual([SID]);
    expect(f.openForSessions([SID]).get(SID)).toEqual([]);
  });

  it('block needs a second admin (FOUR_EYES / SAME_REVIEWER) and a reason', () => {
    const f = new FakeFlagService();
    const id = f.raise(tx, { code: 'H8', subject: { type: 'account', id: 'u1' }, sessionIds: [], evidence: {} });
    expect(code(() => f.decide(tx, id, 'block', 'admin:a1', ''))).toBe('REASON_REQUIRED');
    f.decide(tx, id, 'block', 'admin:a1', 'shared_phone');
    expect(f.get(id)?.status).toBe('open');
    expect(code(() => f.confirmBlock(tx, id, 'admin:a1'))).toBe('SAME_REVIEWER');
    expect(f.confirmBlock(tx, id, 'admin:a2').status).toBe('blocked');
  });

  it('a non-admin actor can never decide (no automated negative decision)', () => {
    const f = new FakeFlagService();
    const id = f.raise(tx, { code: 'H1', subject: { type: 'session', id: SID }, sessionIds: [SID], evidence: {} });
    expect(code(() => f.decide(tx, id, 'reject', 'system' as never, 'auto'))).toMatch(/Only an admin/);
  });
});

describe('PrizeService fake (spec §4.7, §4.3 ceilings)', () => {
  const spec = { kind: 'earned_individual' as const, rewardKind: 'in_kind' as const, valueCents: 1000, partnerId: 'p', allocationId: 'a', declarationRef: 'd', minAgeBand: '18_plus' as const };
  it('refuses prizes above the ceiling', () => {
    const p = new FakePrizeService();
    expect(code(() => p.createForChallenge(tx, 'c1', [{ ...spec, valueCents: 1001 }]))).toBe('CEILING_EXCEEDED');
    expect(code(() => p.createForChallenge(tx, 'c1', [{ ...spec, kind: 'earned_collective', tier: 'threshold', valueCents: 7501 }]))).toBe('CEILING_EXCEEDED');
  });
  it('an 18_plus prize is only verified after a successful age check', () => {
    const p = new FakePrizeService();
    const [id] = p.createForChallenge(tx, 'c1', [spec]);
    p.proposeWinner(tx, { prizeId: id!, userId: 'u1' });
    expect(p.candidates('c1')).toHaveLength(1);
    expect(code(() => p.verify(tx, id!, 'admin:a1'))).toBe('AGE_CHECK_REQUIRED');
    p.recordAgeCheck(tx, id!, 'ok', 'admin:a2');
    expect(p.verify(tx, id!, 'admin:a1').status).toBe('verified');
  });
});

describe('PrivacyService fake (arch §10.7)', () => {
  it('runs every registered eraser and exporter once', () => {
    const p = new FakePrivacyService();
    const erased: string[] = [];
    p.registerEraser('sessions', (_t, u) => erased.push(`sessions:${u}`));
    p.registerEraser('squads', (_t, u) => erased.push(`squads:${u}`));
    p.registerExporter('sessions', (u) => ({ user: u, sessions: 2 }));
    expect(() => p.registerEraser('sessions', () => undefined)).toThrow(/already registered/);
    expect(p.eraseUser(tx, 'u1')).toEqual(['sessions', 'squads']);
    expect(erased).toEqual(['sessions:u1', 'squads:u1']);
    expect(p.exportUser('u1')).toEqual({ sessions: { user: 'u1', sessions: 2 } });
  });
});

describe('EventWriter fake (spec §7.1, arch §8.1)', () => {
  it('validates names and properties against the taxonomy', () => {
    const e = new FakeEventWriter();
    e.event(tx, 'session_completed', { session_id: SID, minuten: 25, punten: 25, flagged: false, flag_codes: [], claim_delay_s: 4 }, { pseudonym: 'pseudo-0001' });
    expect(e.named('session_completed')).toHaveLength(1);
    expect(() => e.event(tx, 'session_completed', { session_id: SID } as never, { pseudonym: 'pseudo-0001' })).toThrow(/minuten|Invalid/);
    expect(() => e.event(tx, 'squad_created', { squad_id: SID, invite_id: null, ledental_na: 1 })).toThrow(/pseudonym/);
    e.event(tx, 'invite_link_opened', { invite_id: SID, nieuwe_bezoeker: true });
  });
  it('a rolled-back transaction leaves no event', () => {
    const e = new FakeEventWriter();
    const m = e.mark();
    e.event(tx, 'plus_interest', {}, { pseudonym: 'pseudo-0001' });
    e.rollbackTo(m);
    expect(e.all()).toEqual([]);
  });
});

describe('ExperimentService fake (spec §7.3, arch §5.1)', () => {
  it('assignment is locked per unit; minors and opt-outs get A and continue', () => {
    const x = new FakeExperimentService(() => ({ arms: { bonus: 'B', belofte: 'late', rest: 'rest', prompt: 'na' }, block: 'b1' }));
    const unit = { type: 'squad' as const, id: 's1', stratum: 'x' };
    const a1 = x.assign(tx, unit);
    expect(x.assign(tx, unit)).toBe(a1);
    expect(x.armsFor({ userId: 'u1', ageBand: '18_plus', optedOut: false, unit }).bonus).toBe('B');
    expect(x.armsFor({ userId: 'u2', ageBand: '16_17', optedOut: false, unit })).toMatchObject({ bonus: 'A', rest: 'continue', belofte: 'late' });
    x.optOut(tx, 'u3');
    expect(code(() => x.optOut(tx, 'u3'))).toBe('ALREADY_OPTED_OUT');
    expect(x.armsFor({ userId: 'u3', ageBand: '18_plus', optedOut: false, unit }).bonus).toBe('A');
  });
  it('stopping arm B needs two admins', () => {
    const x = new FakeExperimentService();
    expect(x.stopArmB(tx, 'admin:a1')).toEqual({ effective: false });
    expect(code(() => x.stopArmB(tx, 'admin:a1'))).toBe('FOUR_EYES_REQUIRED');
    expect(x.stopArmB(tx, 'admin:a2')).toEqual({ effective: true });
  });
});

describe('AuditWriter fake (arch §10.8)', () => {
  it('is append-only', () => {
    const a = new FakeAuditWriter();
    a.audit(tx, { actor: 'admin:a1', action: 'flag_decided', objectType: 'flag', objectRef: 'f1', reason: 'evidence_ok' });
    const [row] = a.entries();
    expect(Object.isFrozen(row)).toBe(true);
    expect(() => a.audit(tx, { actor: 'system', action: 'Bad Action', objectType: 'x', objectRef: 'y' })).toThrow(/Invalid audit action/);
  });
});
