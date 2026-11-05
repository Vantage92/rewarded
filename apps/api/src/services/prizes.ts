// PrizeService (architecture §12.2; implementation WP-6). Earned prizes only; draws are not built.
// Ceilings in euro cents (spec §4.3): individual ≤ 1,000; main prize ≤ 15,000; threshold prize ≤ 7,500.
import { DomainError, type AgeBand, type PrizeKind, type PrizeStatus } from '@rewarded/contracts';
import type { Db } from '../db/types.ts';
import type { AdminActor } from './flags.ts';

export const PRIZE_CEILING_CENTS = { individual: 1_000, main: 15_000, threshold: 7_500 } as const;

export interface PrizeSpec {
  kind: PrizeKind;
  /** For collective prizes: main (ranked) or threshold prize. */
  tier?: 'main' | 'threshold';
  rewardKind: 'in_kind' | 'service';
  valueCents: number;
  partnerId: string;
  allocationId: string;
  declarationRef: string;
  minAgeBand: AgeBand;
}

export interface PrizeRecord extends Readonly<PrizeSpec> {
  readonly id: string;
  readonly challengeId: string;
  status: PrizeStatus;
  winnerUserId: string | null;
  winnerClubId: string | null;
  verifiedBy: AdminActor | null;
  ageCheckOutcome: 'ok' | 'failed' | null;
  ageCheckedBy: AdminActor | null;
}

export interface PrizeCandidate {
  prizeId: string;
  userId?: string;
  clubId?: string;
}

export interface PrizeService {
  createForChallenge(tx: Db, challengeId: string, specs: readonly PrizeSpec[]): string[];
  /** WP-5 proposes winners from the challenge scores; the prize becomes `candidate`. */
  proposeWinner(tx: Db, candidate: PrizeCandidate): PrizeRecord;
  candidates(challengeId: string): readonly PrizeRecord[];
  recordAgeCheck(tx: Db, prizeId: string, outcome: 'ok' | 'failed', actor: AdminActor): PrizeRecord;
  /** Human verification; 18_plus prizes need a successful age check first (AGE_CHECK_REQUIRED). */
  verify(tx: Db, prizeId: string, actor: AdminActor): PrizeRecord;
}

export function prizeCeiling(spec: Pick<PrizeSpec, 'kind' | 'tier'>): number {
  if (spec.kind === 'earned_individual') return PRIZE_CEILING_CENTS.individual;
  return spec.tier === 'threshold' ? PRIZE_CEILING_CENTS.threshold : PRIZE_CEILING_CENTS.main;
}

export class FakePrizeService implements PrizeService {
  private readonly prizes = new Map<string, PrizeRecord>();
  private seq = 0;

  createForChallenge(_tx: Db, challengeId: string, specs: readonly PrizeSpec[]): string[] {
    for (const s of specs) {
      if (s.valueCents <= 0 || s.valueCents > prizeCeiling(s)) throw new DomainError('CEILING_EXCEEDED', { value_cents: s.valueCents, ceiling: prizeCeiling(s) });
      if (!s.declarationRef) throw new DomainError('DECLARATION_REQUIRED');
    }
    return specs.map((s) => {
      const id = `prize_${++this.seq}`;
      this.prizes.set(id, { ...s, id, challengeId, status: 'open', winnerUserId: null, winnerClubId: null, verifiedBy: null, ageCheckOutcome: null, ageCheckedBy: null });
      return id;
    });
  }

  proposeWinner(_tx: Db, c: PrizeCandidate): PrizeRecord {
    const p = this.require(c.prizeId);
    if (p.status !== 'open' && p.status !== 'candidate') throw new DomainError('NOT_FOUND', { reason: 'prize_closed' });
    if ((c.userId === undefined) === (c.clubId === undefined)) throw new Error('A candidate is either a user or a club');
    p.winnerUserId = c.userId ?? null;
    p.winnerClubId = c.clubId ?? null;
    p.status = 'candidate';
    return { ...p };
  }

  candidates(challengeId: string): readonly PrizeRecord[] {
    return [...this.prizes.values()].filter((p) => p.challengeId === challengeId && p.status === 'candidate').map((p) => ({ ...p }));
  }

  recordAgeCheck(_tx: Db, prizeId: string, outcome: 'ok' | 'failed', actor: AdminActor): PrizeRecord {
    const p = this.require(prizeId);
    p.ageCheckOutcome = outcome;
    p.ageCheckedBy = actor;
    if (outcome === 'failed') p.status = 'rejected';
    return { ...p };
  }

  verify(_tx: Db, prizeId: string, actor: AdminActor): PrizeRecord {
    const p = this.require(prizeId);
    if (p.status !== 'candidate') throw new DomainError('NOT_FOUND', { reason: 'not_candidate' });
    if (p.minAgeBand === '18_plus' && p.ageCheckOutcome !== 'ok') throw new DomainError('AGE_CHECK_REQUIRED');
    p.verifiedBy = actor;
    p.status = 'verified';
    return { ...p };
  }

  private require(id: string): PrizeRecord {
    const p = this.prizes.get(id);
    if (!p) throw new DomainError('NOT_FOUND');
    return p;
  }
}
