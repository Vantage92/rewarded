// SQL PrizeService (spec §4.7; architecture §3.4, §12.2). Earned prizes only; draws are not built.
// Winner verification: no open or rejected flags in the period, an identity anchor, no IP, phone or
// device overlap with other winners, a human check, for 18+ prizes an age check (outcome, date and
// checker only), the mandatory sample of 20 for collective prizes, and delivery after 14 days.
import { DomainError, type AgeBand, type PrizeKind, type PrizeStatus } from '@rewarded/contracts';
import { CURRENT_PARAMS, addDays, monthKeyOf } from '@rewarded/core';
import { drawSimple, sampleRules } from '@rewarded/core/fraud';
import type { Db } from '../../../db/types.ts';
import type { ModuleDeps } from '../../../module.ts';
import type { AdminActor } from '../../../services/flags.ts';
import { prizeCeiling, type PrizeCandidate, type PrizeRecord, type PrizeService, type PrizeSpec } from '../../../services/prizes.ts';
import { sampleSeedOf } from './seed.ts';
import { eventFor, hasTables, idsOf, parseJson } from './util.ts';

export interface PrizeRow {
  id: string;
  /** `drawn` only exists as an empty place in the CHECK (architecture §7). */
  kind: PrizeKind | 'drawn';
  tier: 'main' | 'threshold' | null;
  reward_kind: 'in_kind' | 'service';
  challenge_id: string | null;
  sample_id: string | null;
  value_cents: number;
  partner_id: string | null;
  allocation_id: string | null;
  declaration_ref: string;
  min_age_band: AgeBand;
  winner_user_id: string | null;
  winner_club_id: string | null;
  status: PrizeStatus;
  verified_by: AdminActor | null;
  verified_at: string | null;
  age_checked_by: AdminActor | null;
  age_checked_at: string | null;
  age_check_outcome: 'ok' | 'failed' | null;
  verification_checks: string | null;
  delivery_contact_ref: string | null;
  deliver_after: string | null;
  delivered_at: string | null;
  month_key: string | null;
}

export function loadPrize(db: Db, id: string): PrizeRow | undefined {
  return db.get<PrizeRow>('SELECT * FROM prize WHERE id = ?', [id]);
}

function toRecord(r: PrizeRow): PrizeRecord {
  return {
    id: r.id,
    challengeId: r.challenge_id ?? '',
    kind: r.kind === 'drawn' ? 'earned_collective' : r.kind,
    ...(r.tier ? { tier: r.tier } : {}),
    rewardKind: r.reward_kind,
    valueCents: r.value_cents,
    partnerId: r.partner_id ?? '',
    allocationId: r.allocation_id ?? '',
    declarationRef: r.declaration_ref,
    minAgeBand: r.min_age_band,
    status: r.status,
    winnerUserId: r.winner_user_id,
    winnerClubId: r.winner_club_id,
    verifiedBy: r.verified_by,
    ageCheckOutcome: r.age_check_outcome,
    ageCheckedBy: r.age_checked_by,
  };
}

export interface VerificationChecks {
  no_open_or_rejected_flags: boolean;
  anchor: boolean;
  no_overlap_with_other_winners: boolean;
  sample_done: boolean;
  age_ok: boolean;
}

export class SqlPrizeService implements PrizeService {
  private readonly deps: ModuleDeps;
  constructor(deps: ModuleDeps) {
    this.deps = deps;
  }

  createForChallenge(tx: Db, challengeId: string, specs: readonly PrizeSpec[]): string[] {
    const lvl = CURRENT_PARAMS.levels['1'];
    for (const s of specs) {
      if (s.valueCents <= 0 || s.valueCents > prizeCeiling(s)) throw new DomainError('CEILING_EXCEEDED', { value_cents: s.valueCents, ceiling: prizeCeiling(s) });
      if (!(lvl.allowed_prize_kinds as readonly string[]).includes(s.rewardKind)) throw new DomainError('KIND_NOT_ALLOWED');
      if (!s.declarationRef) throw new DomainError('DECLARATION_REQUIRED');
    }
    const at = this.deps.platform.clock.now().toISOString();
    return specs.map((s) => {
      const id = idsOf(this.deps).ulid();
      tx.run(
        `INSERT INTO prize (id, kind, tier, reward_kind, challenge_id, value_cents, partner_id, allocation_id, declaration_ref, min_age_band, status, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'open', ?)`,
        [id, s.kind, s.kind === 'earned_collective' ? (s.tier ?? 'main') : null, s.rewardKind, challengeId, s.valueCents, s.partnerId, s.allocationId, s.declarationRef, s.minAgeBand, at],
      );
      return id;
    });
  }

  /** WP-5 proposes a winner; a collective prize gets its mandatory sample of 20 counted members. */
  proposeWinner(tx: Db, c: PrizeCandidate): PrizeRecord {
    const p = loadPrize(tx, c.prizeId);
    if (!p) throw new DomainError('NOT_FOUND');
    if (p.status !== 'open' && p.status !== 'candidate') throw new DomainError('NOT_FOUND', { reason: 'prize_closed' });
    if ((c.userId === undefined) === (c.clubId === undefined)) throw new Error('A candidate is either a user or a club');
    tx.run("UPDATE prize SET winner_user_id = ?, winner_club_id = ?, status = 'candidate' WHERE id = ?", [c.userId ?? null, c.clubId ?? null, p.id]);
    if (c.clubId && p.challenge_id) tx.run('UPDATE prize SET sample_id = ? WHERE id = ?', [drawPrizeSample(this.deps, tx, p.challenge_id, c.clubId), p.id]);
    return toRecord(loadPrize(tx, p.id) as PrizeRow);
  }

  candidates(challengeId: string): readonly PrizeRecord[] {
    return this.deps.db.all<PrizeRow>("SELECT * FROM prize WHERE challenge_id = ? AND status = 'candidate' ORDER BY id", [challengeId]).map(toRecord);
  }

  recordAgeCheck(tx: Db, prizeId: string, outcome: 'ok' | 'failed', actor: AdminActor): PrizeRecord {
    const p = loadPrize(tx, prizeId);
    if (!p) throw new DomainError('NOT_FOUND');
    if (p.status !== 'candidate') throw new DomainError('NOT_FOUND', { reason: 'not_candidate' });
    const at = this.deps.platform.clock.now().toISOString();
    tx.run('UPDATE prize SET age_check_outcome = ?, age_checked_by = ?, age_checked_at = ?, status = ? WHERE id = ?', [outcome, actor, at, outcome === 'failed' ? 'rejected' : p.status, prizeId]);
    return toRecord(loadPrize(tx, prizeId) as PrizeRow);
  }

  checks(tx: Db, p: PrizeRow): VerificationChecks {
    const sampleDone = p.kind !== 'earned_collective' || (p.sample_id !== null && tx.get<{ n: number }>('SELECT count(*) AS n FROM fraud_sample_item WHERE sample_id = ? AND judged_at IS NULL', [p.sample_id])?.n === 0);
    const out: VerificationChecks = { no_open_or_rejected_flags: true, anchor: true, no_overlap_with_other_winners: true, sample_done: sampleDone, age_ok: p.min_age_band !== '18_plus' || p.age_check_outcome === 'ok' };
    if (p.winner_user_id) {
      const u = tx.get<{ phone_verified_at: string | null; institution_verified_at: string | null; phone_hash: string | null }>(
        'SELECT phone_verified_at, institution_verified_at, phone_hash FROM user WHERE id = ?',
        [p.winner_user_id],
      );
      out.anchor = !!u && (u.phone_verified_at !== null || u.institution_verified_at !== null);
      out.no_open_or_rejected_flags =
        tx.get(
          `SELECT 1 AS x FROM fraud_flag f JOIN fraud_flag_session l ON l.flag_id = f.id
            WHERE l.user_id = ? AND f.status IN ('open', 'rejected', 'blocked') LIMIT 1`,
          [p.winner_user_id],
        ) === undefined;
      // Overlap with the other winning accounts of the same challenge: phone, device or IP hash.
      const others = tx.all<{ id: string }>("SELECT winner_user_id AS id FROM prize WHERE challenge_id = ? AND id <> ? AND winner_user_id IS NOT NULL AND status IN ('candidate', 'verified', 'delivered')", [
        p.challenge_id,
        p.id,
      ]);
      for (const o of others) {
        const shared =
          (u?.phone_hash && tx.get('SELECT 1 AS x FROM user WHERE id = ? AND phone_hash = ?', [o.id, u.phone_hash])) ||
          tx.get('SELECT 1 AS x FROM device a JOIN device b ON a.client_device_id = b.client_device_id WHERE a.user_id = ? AND b.user_id = ?', [p.winner_user_id, o.id]) ||
          (hasTables(tx, 'focus_session') &&
            tx.get('SELECT 1 AS x FROM focus_session a JOIN focus_session b ON a.ip_hash = b.ip_hash WHERE a.user_id = ? AND b.user_id = ? AND a.ip_hash IS NOT NULL LIMIT 1', [p.winner_user_id, o.id]));
        if (shared) out.no_overlap_with_other_winners = false;
      }
    }
    return out;
  }

  verify(tx: Db, prizeId: string, actor: AdminActor): PrizeRecord {
    const p = loadPrize(tx, prizeId);
    if (!p) throw new DomainError('NOT_FOUND');
    if (p.status !== 'candidate') throw new DomainError('NOT_FOUND', { reason: 'not_candidate' });
    const c = this.checks(tx, p);
    if (!c.age_ok) throw new DomainError('AGE_CHECK_REQUIRED');
    if (!c.sample_done) throw new DomainError('SAMPLE_REQUIRED');
    // Age check and verification are done by two people (four eyes, spec §4.11 Challenges).
    if (p.age_checked_by !== null && p.age_checked_by === actor) throw new DomainError('FOUR_EYES_REQUIRED');
    const now = this.deps.platform.clock.now();
    const deliverAfter = new Date(now.getTime() + CURRENT_PARAMS.challenges.prize_delivery_after_days * 86_400_000).toISOString();
    tx.run("UPDATE prize SET status = 'verified', verified_by = ?, verified_at = ?, deliver_after = ?, month_key = ?, verification_checks = ? WHERE id = ?", [
      actor,
      now.toISOString(),
      deliverAfter,
      monthKeyOf(now.getTime()),
      JSON.stringify(c),
      prizeId,
    ]);
    eventFor(this.deps, tx, p.winner_user_id, 'prize_awarded', { prize_id: p.id, type: p.kind as 'earned_collective' | 'earned_individual', waarde_eur: p.value_cents / 100 });
    return toRecord(loadPrize(tx, prizeId) as PrizeRow);
  }
}

/** Counted members of a club for the prize sample: open approved links with an identity anchor. */
export function countedMembers(db: Db, clubId: string): string[] {
  if (!hasTables(db, 'club_membership')) return [];
  return db
    .all<{ user_id: string }>(
      `SELECT m.user_id FROM club_membership m JOIN user u ON u.id = m.user_id
        WHERE m.club_id = ? AND m.left_at IS NULL AND m.pending_admin = 0 AND u.status = 'active' AND u.is_team = 0
          AND (u.phone_verified_at IS NOT NULL OR u.institution_verified_at IS NOT NULL) ORDER BY m.user_id`,
      [clubId],
    )
    .map((r) => r.user_id);
}

/** Mandatory sample of 20 counted members (or all) for a collective prize (spec §4.6, voorregistratie §7.3). */
export function drawPrizeSample(deps: ModuleDeps, tx: Db, challengeId: string, clubId: string): string {
  const existing = tx.get<{ id: string }>("SELECT id FROM fraud_sample WHERE kind = 'prize' AND challenge_id = ? AND club_id = ?", [challengeId, clubId]);
  if (existing) return existing.id;
  const { seed, version } = sampleSeedOf(deps);
  const members = countedMembers(tx, clubId);
  const items = drawSimple(seed, 'prize', `${challengeId}:${clubId}`, members, sampleRules(CURRENT_PARAMS).prizeSize);
  const id = idsOf(deps).ulid();
  const now = deps.platform.clock.now().toISOString();
  tx.run("INSERT INTO fraud_sample (id, kind, week_key, challenge_id, club_id, seed_version, size, allocation, drawn_at) VALUES (?, 'prize', ?, ?, ?, ?, ?, ?, ?)", [
    id,
    now.slice(0, 10),
    challengeId,
    clubId,
    version,
    items.length,
    JSON.stringify([{ stratum: 'prize', actives: members.length, size: items.length }]),
    now,
  ]);
  for (const it of items)
    tx.run("INSERT INTO fraud_sample_item (id, sample_id, user_id, stratum, score, checks) VALUES (?, ?, ?, 'prize', ?, ?)", [
      idsOf(deps).ulid(),
      id,
      it.userId,
      it.score,
      JSON.stringify({ device_compare: null, practice_session: null }),
    ]);
  return id;
}

/** Marks delivery; never before deliver_after (14 days after verification, spec §4.7). */
export function markDelivered(deps: ModuleDeps, tx: Db, prizeId: string): PrizeRow {
  const p = loadPrize(tx, prizeId);
  if (!p) throw new DomainError('NOT_FOUND');
  const now = deps.platform.clock.now();
  if (p.status !== 'verified' || !p.deliver_after || now.toISOString() < p.deliver_after) throw new DomainError('PERIOD_LOCKED', { deliver_after: p.deliver_after });
  tx.run("UPDATE prize SET status = 'delivered', delivered_at = ? WHERE id = ?", [now.toISOString(), prizeId]);
  return loadPrize(tx, prizeId) as PrizeRow;
}

export function prizeChecks(row: PrizeRow): Record<string, unknown> {
  return parseJson(row.verification_checks, {});
}

/** For tests and the admin: last day a prize may be delivered at the earliest. */
export function deliveryDay(row: PrizeRow): string | null {
  return row.deliver_after ? addDays(row.deliver_after.slice(0, 10), 0) : null;
}
