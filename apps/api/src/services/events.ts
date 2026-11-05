// EventWriter (architecture §8.1, §12.2; implementation WP-3). Server events are written in the same
// SQLite transaction as the domain change; names and properties come from the contracts taxonomy.
import { parseEventProps, type ActiveEventName, type EventProps, type ServerEventName } from '@rewarded/contracts';
import type { Db } from '../db/types.ts';

export interface EventContext {
  /** Pseudonym of the user; omitted only for events before registration (invite_link_opened). */
  pseudonym?: string;
  squadId?: string;
}

export interface EventWriter {
  /** Validates the props against spec §7.1 and writes the event in `tx`. Returns the event id. */
  event<N extends ServerEventName>(tx: Db, name: N, props: EventProps<N>, ctx?: EventContext): string;
  /** Client events accepted by POST /events (already validated by the route schema). */
  clientEvent<N extends ActiveEventName>(tx: Db, name: N, props: EventProps<N>, ctx: EventContext & { pre?: boolean }): string;
}

export interface FakeEventRow {
  id: string;
  name: ActiveEventName;
  props: unknown;
  pseudonym: string | null;
  squadId: string | null;
  pending: boolean;
}

/**
 * In-memory fake. It validates like the real writer; `mark` and `rollbackTo` let a test simulate a
 * rolled-back transaction (the real writer gets this from SQLite).
 */
export class FakeEventWriter implements EventWriter {
  private readonly rows: FakeEventRow[] = [];
  private seq = 0;
  private push(name: ActiveEventName, props: unknown, ctx: EventContext & { pre?: boolean }): string {
    const parsed = parseEventProps(name, props);
    const id = `event_${++this.seq}`;
    this.rows.push({ id, name, props: parsed, pseudonym: ctx.pseudonym ?? null, squadId: ctx.squadId ?? null, pending: ctx.pre === true });
    return id;
  }
  event<N extends ServerEventName>(_tx: Db, name: N, props: EventProps<N>, ctx: EventContext = {}): string {
    if (ctx.pseudonym === undefined && name !== 'invite_link_opened') throw new Error(`Event ${name} needs a pseudonym`);
    return this.push(name, props, ctx);
  }
  clientEvent<N extends ActiveEventName>(_tx: Db, name: N, props: EventProps<N>, ctx: EventContext & { pre?: boolean }): string {
    return this.push(name, props, ctx);
  }
  all(): readonly FakeEventRow[] {
    return this.rows.slice();
  }
  named(name: ActiveEventName): FakeEventRow[] {
    return this.rows.filter((r) => r.name === name);
  }
  /** Simulates a rolled-back transaction: removes rows written after `mark`. */
  mark(): number {
    return this.rows.length;
  }
  rollbackTo(mark: number): void {
    this.rows.length = mark;
  }
}
