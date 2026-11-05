// ExperimentService implementation (architecture §3.5, §12.2; voorregistratie §9).
// Each factor is randomised independently in blocks of four per stratum:
//   arm = f(HMAC-SHA256(seed, factor ‖ stratum ‖ block)), a permutation of two A's and two B's.
// Assignments are locked; every change is an arm_switch row (and an arm_switched event).
// Personal exceptions (architecture §5.1, spec §4.10): 16_17 and opted-out users get bonus A and rest
// `continue`; opted-out users also get the early Belofte offer; after the arm B stop everybody gets A.
// Note: core/experiments (WP-1) does not exist yet; the rule lives here until it moves to core.
import { createHmac } from 'node:crypto';
import { DomainError, type ArmSwitchReason, type ExperimentFactor } from '@rewarded/contracts';
import { CURRENT_PARAMS, addDays, focusDayOf, isoWeekday, type FocusDay } from '@rewarded/core';
import type { AdminActor } from '../../services/flags.ts';
import type { Arms, ArmSwitch, Assignment, ExperimentService, ExperimentUnitRef, UserArmContext } from '../../services/experiments.ts';
import type { EventWriter } from '../../services/events.ts';
import type { Clock } from '../../platform/types.ts';
import type { Ids } from '../ids.ts';
import type { Db } from '../types.ts';

const ARMS: Record<ExperimentFactor, readonly [string, string]> = {
  bonus: ['A', 'B'],
  belofte: ['early', 'late'],
  rest: ['rest', 'continue'],
  prompt: ['strong', 'standard'],
};
const BLOCK_SIZE = CURRENT_PARAMS.experiments.block_size;
const SQUAD_FACTORS: readonly ExperimentFactor[] = ['bonus', 'belofte', 'rest'];
const SOLO_FACTORS: readonly ExperimentFactor[] = ['bonus', 'belofte', 'rest', 'prompt'];

/** The six orderings of AABB; index from the HMAC of the block. */
const PERMUTATIONS: readonly (readonly (0 | 1)[])[] = [
  [0, 0, 1, 1],
  [0, 1, 0, 1],
  [0, 1, 1, 0],
  [1, 0, 0, 1],
  [1, 0, 1, 0],
  [1, 1, 0, 0],
];

/**
 * Stratum of a unit (voorregistratie §9.1): `<club or none>|<channel>`. The squad prompt is
 * stratified by channel only, so it uses the part after the bar.
 */
export function stratumFor(factor: ExperimentFactor, stratum: string): string {
  if (factor !== 'prompt') return stratum;
  const bar = stratum.lastIndexOf('|');
  return bar >= 0 ? stratum.slice(bar + 1) : stratum;
}

/** Arm for position `pos` (0-based) in a stratum; pure and reproducible from the seed. */
export function armAt(seed: string, factor: ExperimentFactor, stratum: string, pos: number): { arm: string; block: string } {
  const blockNo = Math.floor(pos / BLOCK_SIZE);
  const mac = createHmac('sha256', seed).update(`${factor}\u0000${stratum}\u0000${blockNo}`).digest();
  // Rejection-free: 6 permutations from a 32-bit value; the bias is below 2^-29.
  const perm = PERMUTATIONS[mac.readUInt32BE(0) % PERMUTATIONS.length]!;
  return { arm: ARMS[factor][perm[pos % BLOCK_SIZE]!]!, block: `${factor}:${stratum}:${blockNo}` };
}

interface AssignmentRow {
  factor: ExperimentFactor;
  arm: string;
  stratum: string;
  block: string;
  seed_version: string;
}

export interface SqlExperimentServiceDeps {
  db: Db;
  clock: Clock;
  ids: Ids;
  seed: string;
  /** e.g. 'v1' for the registered seed, 'provisional' while it is missing, 'test' in tests. */
  seedVersion: string;
}

export class SqlExperimentService implements ExperimentService {
  private readonly db: Db;
  private readonly clock: Clock;
  private readonly ids: Ids;
  private readonly seed: string;
  private readonly seedVersion: string;
  private events: EventWriter | undefined;

  constructor(deps: SqlExperimentServiceDeps) {
    this.db = deps.db;
    this.clock = deps.clock;
    this.ids = deps.ids;
    this.seed = deps.seed;
    this.seedVersion = deps.seedVersion;
  }

  /** The event writer is bound after construction (it reads arms from this service). */
  bindEvents(events: EventWriter): void {
    this.events = events;
  }

  private today(): FocusDay {
    return focusDayOf(this.clock.now().getTime(), CURRENT_PARAMS);
  }

  private nextMonday(): FocusDay {
    const d = this.today();
    const iso = isoWeekday(d);
    return addDays(d, iso === 1 ? 7 : 8 - iso);
  }

  assign(tx: Db, unit: ExperimentUnitRef, factors?: readonly ExperimentFactor[]): Assignment {
    const wanted = factors ?? (unit.type === 'squad' ? SQUAD_FACTORS : SOLO_FACTORS);
    const have = new Set(this.rows(tx, unit).map((r) => r.factor));
    const at = this.clock.now().toISOString();
    for (const factor of wanted) {
      if (have.has(factor)) continue;
      if (factor === 'prompt' && unit.type !== 'solo') throw new Error('The squad prompt is randomised for solo users only');
      const stratum = stratumFor(factor, unit.stratum);
      const pos = tx.get<{ n: number }>('SELECT count(*) AS n FROM experiment_assignment WHERE factor = ? AND stratum = ? AND seed_version = ?', [
        factor,
        stratum,
        this.seedVersion,
      ])!.n;
      const { arm, block } = armAt(this.seed, factor, stratum, pos);
      tx.run(
        'INSERT INTO experiment_assignment (unit_type, unit_id, factor, arm, stratum, block, seed_version, assigned_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [unit.type, unit.id, factor, arm, stratum, block, this.seedVersion, at],
      );
    }
    const a = this.read(tx, unit);
    if (!a) throw new Error('Assignment missing after assign');
    return a;
  }

  get(unit: ExperimentUnitRef): Assignment | undefined {
    return this.read(this.db, unit);
  }

  private rows(db: Db, unit: { type: string; id: string }): AssignmentRow[] {
    return db.all<AssignmentRow>('SELECT factor, arm, stratum, block, seed_version FROM experiment_assignment WHERE unit_type = ? AND unit_id = ?', [
      unit.type,
      unit.id,
    ]);
  }

  private read(db: Db, unit: ExperimentUnitRef): Assignment | undefined {
    const rows = this.rows(db, unit);
    if (rows.length === 0) return undefined;
    const by = new Map(rows.map((r) => [r.factor, r]));
    const arms: Arms = {
      bonus: (by.get('bonus')?.arm ?? 'A') as Arms['bonus'],
      belofte: (by.get('belofte')?.arm ?? 'late') as Arms['belofte'],
      rest: (by.get('rest')?.arm ?? 'continue') as Arms['rest'],
      prompt: (by.get('prompt')?.arm ?? 'na') as Arms['prompt'],
    };
    const first = rows[0]!;
    return { unit: { ...unit }, arms, block: (by.get('bonus') ?? first).block, seedVersion: first.seed_version };
  }

  armsFor(ctx: UserArmContext): Arms {
    const a = this.get(ctx.unit);
    if (!a) throw new DomainError('NOT_FOUND', { reason: 'unit_not_assigned' });
    const arms: Arms = { ...a.arms };
    const today = this.today();
    // Personal switches (join, merge, minor, opt_out) that are effective today, latest per factor.
    const switches = this.db.all<{ factor: string; to: string }>(
      `SELECT factor, "to" FROM arm_switch WHERE user_id = ? AND (effective_from_day IS NULL OR effective_from_day <= ?) ORDER BY at, id`,
      [ctx.userId, today],
    );
    for (const s of switches) {
      if (s.factor === 'bonus' || s.factor === 'belofte' || s.factor === 'rest' || s.factor === 'prompt') (arms as unknown as Record<string, string>)[s.factor] = s.to;
    }
    // The opt-out takes effect from the next focus day (spec §4.10); the switch rows carry that day.
    const optOut = this.db.get<{ effective_from_day: string | null }>("SELECT effective_from_day FROM arm_switch WHERE user_id = ? AND reason = 'opt_out' LIMIT 1", [ctx.userId]);
    const optedOut = optOut ? optOut.effective_from_day === null || optOut.effective_from_day <= today : ctx.optedOut;
    if (ctx.ageBand === '16_17' || optedOut) {
      arms.bonus = 'A';
      arms.rest = 'continue';
    }
    if (optedOut) arms.belofte = 'early';
    const stoppedFrom = this.armBStoppedFrom();
    if (stoppedFrom !== null && stoppedFrom <= today) arms.bonus = 'A';
    return arms;
  }

  /** First focus day without arm B, or null while arm B runs. */
  armBStoppedFrom(): FocusDay | null {
    return this.db.get<{ reason: string }>("SELECT reason FROM audit_log WHERE action = 'arm_b_stopped' ORDER BY at LIMIT 1")?.reason ?? null;
  }

  switchArm(tx: Db, change: ArmSwitch): void {
    if (change.from === change.to) return;
    const effective = this.effectiveDay(change.reason);
    tx.run('INSERT INTO arm_switch (id, user_id, factor, "from", "to", reason, effective_from_day, at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [
      this.ids.ulid(),
      change.userId,
      change.factor,
      change.from,
      change.to,
      change.reason,
      effective,
      this.clock.now().toISOString(),
    ]);
    const pseudonym = tx.get<{ pseudonym: string }>('SELECT pseudonym FROM user WHERE id = ?', [change.userId])?.pseudonym;
    if (pseudonym && this.events) {
      this.events.event(tx, 'arm_switched', { factor: change.factor, van: change.from.slice(0, 16), naar: change.to.slice(0, 16), reden: change.reason }, { pseudonym });
    }
  }

  private effectiveDay(reason: ArmSwitchReason): FocusDay {
    // Join and merge take effect from the next Monday (voorregistratie §9.1); opt-out from the next
    // focus day (spec §4.10); the minor exception at once.
    switch (reason) {
      case 'join':
      case 'merge':
      case 'arm_b_stopped':
        return this.nextMonday();
      case 'opt_out':
        return addDays(this.today(), 1);
      case 'minor':
        return this.today();
    }
  }

  optOut(tx: Db, userId: string): void {
    const user = tx.get<{ research_opt_out_at: string | null }>('SELECT research_opt_out_at FROM user WHERE id = ?', [userId]);
    if (!user) throw new DomainError('NOT_FOUND');
    if (user.research_opt_out_at !== null || tx.get("SELECT 1 AS x FROM arm_switch WHERE user_id = ? AND reason = 'opt_out'", [userId])) {
      throw new DomainError('ALREADY_OPTED_OUT');
    }
    const unit = tx.get<{ unit_type: 'solo' | 'squad'; unit_id: string }>("SELECT unit_type, unit_id FROM experiment_assignment WHERE unit_type = 'solo' AND unit_id = ? LIMIT 1", [userId]);
    const current = unit ? this.read(tx, { type: unit.unit_type, id: unit.unit_id, stratum: '' })?.arms : undefined;
    const switches: ArmSwitch[] = [
      { userId, factor: 'bonus', from: current?.bonus ?? '*', to: 'A', reason: 'opt_out' },
      { userId, factor: 'rest', from: current?.rest ?? '*', to: 'continue', reason: 'opt_out' },
      { userId, factor: 'belofte', from: current?.belofte ?? '*', to: 'early', reason: 'opt_out' },
    ];
    // Always log the opt-out itself, even when the arms do not change.
    const at = this.clock.now().toISOString();
    const effective = this.effectiveDay('opt_out');
    for (const s of switches) {
      tx.run('INSERT INTO arm_switch (id, user_id, factor, "from", "to", reason, effective_from_day, at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [
        this.ids.ulid(),
        s.userId,
        s.factor,
        s.from,
        s.to,
        s.reason,
        effective,
        at,
      ]);
    }
    tx.run('UPDATE user SET research_opt_out_at = ? WHERE id = ? AND research_opt_out_at IS NULL', [at, userId]);
  }

  stopArmB(tx: Db, actor: AdminActor): { effective: boolean } {
    if (this.armBStoppedFromTx(tx) !== null) return { effective: true };
    const request = tx.get<{ actor_ref: string }>("SELECT actor_ref FROM audit_log WHERE action = 'arm_b_stop_requested' ORDER BY at DESC, id DESC LIMIT 1");
    const at = this.clock.now().toISOString();
    if (!request) {
      tx.run("INSERT INTO audit_log (id, actor_ref, action, object_type, object_ref, reason, at) VALUES (?, ?, 'arm_b_stop_requested', 'experiment', 'arm_b', NULL, ?)", [
        this.ids.ulid(),
        actor,
        at,
      ]);
      return { effective: false };
    }
    if (request.actor_ref === actor) throw new DomainError('FOUR_EYES_REQUIRED');
    const from = this.nextMonday();
    tx.run("INSERT INTO audit_log (id, actor_ref, action, object_type, object_ref, reason, at) VALUES (?, ?, 'arm_b_stopped', 'experiment', 'arm_b', ?, ?)", [
      this.ids.ulid(),
      actor,
      from,
      at,
    ]);
    // Log a switch for every solo unit on B; squad members are covered by armsFor's global rule.
    const solos = tx.all<{ unit_id: string }>("SELECT unit_id FROM experiment_assignment WHERE unit_type = 'solo' AND factor = 'bonus' AND arm = 'B'");
    for (const s of solos) this.switchArm(tx, { userId: s.unit_id, factor: 'bonus', from: 'B', to: 'A', reason: 'arm_b_stopped' });
    return { effective: true };
  }

  private armBStoppedFromTx(tx: Db): FocusDay | null {
    return tx.get<{ reason: string }>("SELECT reason FROM audit_log WHERE action = 'arm_b_stopped' LIMIT 1")?.reason ?? null;
  }

  switches(): readonly ArmSwitch[] {
    return this.db
      .all<{ user_id: string | null; factor: ExperimentFactor; from: string; to: string; reason: ArmSwitchReason }>(
        'SELECT user_id, factor, "from", "to", reason FROM arm_switch ORDER BY at, id',
      )
      .map((r) => ({ userId: r.user_id ?? '', factor: r.factor, from: r.from, to: r.to, reason: r.reason }));
  }
}
