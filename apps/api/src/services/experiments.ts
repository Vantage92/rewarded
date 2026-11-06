// ExperimentService (architecture §12.2; implementation WP-3, assignment rules in core/experiments, WP-1).
// Assignment is deterministic from the seed and locked; every change writes an arm_switch row.
// Minors (16_17) and opted-out users personally get arm A and `continue` (architecture §5.1).
import { DomainError, type AgeBand, type ArmBelofte, type ArmBonus, type ArmPrompt, type ArmRest, type ArmSwitchReason, type ExperimentFactor, type ExperimentUnit } from '@rewarded/contracts';
import type { Db } from '../db/types.ts';
import type { AdminActor } from './flags.ts';

export interface Arms {
  bonus: ArmBonus;
  belofte: ArmBelofte;
  rest: ArmRest;
  prompt: ArmPrompt;
}
export interface ExperimentUnitRef {
  type: ExperimentUnit;
  id: string;
  stratum: string;
}
export interface Assignment {
  unit: ExperimentUnitRef;
  arms: Arms;
  block: string;
  seedVersion: string;
}
export interface ArmSwitch {
  userId: string;
  factor: ExperimentFactor;
  from: string;
  to: string;
  reason: ArmSwitchReason;
}
export interface UserArmContext {
  userId: string;
  ageBand: AgeBand;
  optedOut: boolean;
  unit: ExperimentUnitRef;
  /** Focus day the arms are asked for; switches are evaluated on this day. Default: today. */
  day?: string;
}

export interface ExperimentService {
  /** Idempotent: a unit keeps its first assignment. */
  assign(tx: Db, unit: ExperimentUnitRef, factors?: readonly ExperimentFactor[]): Assignment;
  get(unit: ExperimentUnitRef): Assignment | undefined;
  /** Personal arms after the minor and opt-out exceptions and the arm B stop. */
  armsFor(ctx: UserArmContext): Arms;
  switchArm(tx: Db, change: ArmSwitch): void;
  optOut(tx: Db, userId: string): void;
  /** Four eyes: the first call records the request, a second admin makes it effective. */
  stopArmB(tx: Db, actor: AdminActor): { effective: boolean };
  switches(): readonly ArmSwitch[];
}

/** Placeholder rule until core/experiments exists: deterministic from the unit id, not balanced. */
export type AssignFn = (unit: ExperimentUnitRef) => { arms: Arms; block: string };
export const defaultFakeAssign: AssignFn = (unit) => {
  let h = 0;
  for (const ch of unit.id) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return {
    arms: { bonus: h & 1 ? 'B' : 'A', belofte: h & 2 ? 'late' : 'early', rest: h & 4 ? 'rest' : 'continue', prompt: unit.type === 'solo' ? (h & 8 ? 'strong' : 'standard') : 'na' },
    block: `fake-${h % 100}`,
  };
};

export class FakeExperimentService implements ExperimentService {
  private readonly assignments = new Map<string, Assignment>();
  private readonly log: ArmSwitch[] = [];
  private readonly optedOut = new Set<string>();
  private armBStopRequestedBy: AdminActor | null = null;
  private armBStopped = false;
  private readonly assignFn: AssignFn;
  constructor(assignFn: AssignFn = defaultFakeAssign) {
    this.assignFn = assignFn;
  }

  assign(_tx: Db, unit: ExperimentUnitRef): Assignment {
    const key = `${unit.type}:${unit.id}`;
    const existing = this.assignments.get(key);
    if (existing) return existing;
    const { arms, block } = this.assignFn(unit);
    const a: Assignment = { unit: { ...unit }, arms, block, seedVersion: 'fake' };
    this.assignments.set(key, a);
    return a;
  }
  get(unit: ExperimentUnitRef): Assignment | undefined {
    return this.assignments.get(`${unit.type}:${unit.id}`);
  }
  armsFor(ctx: UserArmContext): Arms {
    const a = this.get(ctx.unit);
    if (!a) throw new DomainError('NOT_FOUND', { reason: 'unit_not_assigned' });
    const arms = { ...a.arms };
    if (ctx.ageBand === '16_17' || ctx.optedOut || this.optedOut.has(ctx.userId)) {
      arms.bonus = 'A';
      arms.rest = 'continue';
    }
    if (this.armBStopped) arms.bonus = 'A';
    return arms;
  }
  switchArm(_tx: Db, change: ArmSwitch): void {
    if (change.from === change.to) return;
    this.log.push({ ...change });
  }
  optOut(_tx: Db, userId: string): void {
    if (this.optedOut.has(userId)) throw new DomainError('ALREADY_OPTED_OUT');
    this.optedOut.add(userId);
    this.log.push({ userId, factor: 'bonus', from: '*', to: 'A', reason: 'opt_out' });
  }
  stopArmB(_tx: Db, actor: AdminActor): { effective: boolean } {
    if (this.armBStopped) return { effective: true };
    if (this.armBStopRequestedBy === null) {
      this.armBStopRequestedBy = actor;
      return { effective: false };
    }
    if (this.armBStopRequestedBy === actor) throw new DomainError('FOUR_EYES_REQUIRED');
    this.armBStopped = true;
    return { effective: true };
  }
  switches(): readonly ArmSwitch[] {
    return this.log.slice();
  }
}
