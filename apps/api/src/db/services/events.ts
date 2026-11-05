// EventWriter implementation (architecture §3.5, §8.1, §12.2). Server events are written with `tx`,
// so they commit or roll back with the domain change. Names and properties come only from the
// contracts taxonomy (parseEventProps rejects unknown or retired names and extra fields).
// Arms, channel and cohort are added from the user's assignment; client events of pre users go to
// event_pending under the pre pseudonym (moved or deleted by the auth module).
import { isEventName, parseEventProps, type ActiveEventName, type EventProps, type ServerEventName } from '@rewarded/contracts';
import type { EventContext, EventWriter } from '../../services/events.ts';
import type { Arms, ExperimentService } from '../../services/experiments.ts';
import type { Clock } from '../../platform/types.ts';
import type { Ids } from '../ids.ts';
import type { Db } from '../types.ts';

interface UserRow {
  id: string;
  age_band: '16_17' | '18_plus';
  research_opt_out_at: string | null;
  registration_channel: string;
  cohort: 'experiment' | 'expansion';
}

export interface SqlEventWriterDeps {
  clock: Clock;
  ids: Ids;
  experiments: ExperimentService;
  /** Release tag on every event (spec §7.1). */
  release: string;
}

export class SqlEventWriter implements EventWriter {
  private readonly deps: SqlEventWriterDeps;
  constructor(deps: SqlEventWriterDeps) {
    this.deps = deps;
  }

  event<N extends ServerEventName>(tx: Db, name: N, props: EventProps<N>, ctx: EventContext = {}): string {
    if (ctx.pseudonym === undefined && name !== 'invite_link_opened') throw new Error(`Event ${name} needs a pseudonym`);
    return this.write(tx, name, props, ctx);
  }

  clientEvent<N extends ActiveEventName>(tx: Db, name: N, props: EventProps<N>, ctx: EventContext & { pre?: boolean }): string {
    if (ctx.pre) {
      const parsed = this.validate(name, props);
      const id = this.deps.ids.ulid();
      if (!ctx.pseudonym) throw new Error('Pending events need the pre pseudonym');
      tx.run('INSERT INTO event_pending (id, pre_pseudonym, name, server_at, props) VALUES (?, ?, ?, ?, ?)', [
        id,
        ctx.pseudonym,
        name,
        this.deps.clock.now().toISOString(),
        JSON.stringify(parsed),
      ]);
      return id;
    }
    return this.write(tx, name, props, ctx);
  }

  private validate(name: string, props: unknown): unknown {
    if (!isEventName(name)) throw new Error(`Unknown event ${name}`);
    return parseEventProps(name as ActiveEventName, props);
  }

  private write(tx: Db, name: ActiveEventName, props: unknown, ctx: EventContext): string {
    const parsed = this.validate(name, props);
    const id = this.deps.ids.ulid();
    const meta = ctx.pseudonym ? this.meta(tx, ctx.pseudonym, ctx.squadId) : undefined;
    tx.run(
      `INSERT INTO event (id, name, pseudonym, server_at, props, release, arm_bonus, arm_belofte, arm_rest, arm_prompt, channel, squad_id, calendar_id, cohort)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?)`,
      [
        id,
        name,
        ctx.pseudonym ?? null,
        this.deps.clock.now().toISOString(),
        JSON.stringify(parsed),
        this.deps.release,
        meta?.arms?.bonus ?? null,
        meta?.arms?.belofte ?? null,
        meta?.arms?.rest ?? null,
        meta?.arms?.prompt ?? null,
        meta?.channel ?? null,
        ctx.squadId ?? null,
        meta?.cohort ?? null,
      ],
    );
    return id;
  }

  /** Arms on the event are the personal arms of the day (after exceptions), as KPI queries need. */
  private meta(tx: Db, pseudonym: string, squadId: string | undefined): { arms: Arms | undefined; channel: string; cohort: string } | undefined {
    const u = tx.get<UserRow>('SELECT id, age_band, research_opt_out_at, registration_channel, cohort FROM user WHERE pseudonym = ?', [pseudonym]);
    if (!u) return undefined;
    const units = [
      ...(squadId ? [{ type: 'squad' as const, id: squadId, stratum: '' }] : []),
      { type: 'solo' as const, id: u.id, stratum: '' },
    ];
    let arms: Arms | undefined;
    for (const unit of units) {
      if (!this.deps.experiments.get(unit)) continue;
      arms = this.deps.experiments.armsFor({ userId: u.id, ageBand: u.age_band, optedOut: u.research_opt_out_at !== null, unit });
      break;
    }
    return { arms, channel: u.registration_channel, cohort: u.cohort };
  }
}
