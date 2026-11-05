// Outbox (architecture §4.2, §9.3): visibility events and buffered heartbeats of the running session,
// in order, persisted in IndexedDB. It is flushed with every heartbeat, on `online` and at start-up;
// there is no dependency on Background Sync. The server deduplicates on (session_id, ev_seq) and on
// the buffered heartbeat's seq, so sending an item twice is harmless.
import type { OutboxItem } from '@rewarded/contracts/sessions';
import type { KvStore } from './storage.ts';

export type { OutboxItem };

/** Stable identity of an item, for removing exactly what a request carried. */
export function itemKey(item: OutboxItem): string {
  return item.type === 'visibility' ? `v${item.ev_seq}` : `h${item.seq}`;
}

const pad = (n: number) => String(n).padStart(8, '0');

export class Outbox {
  private items: { n: number; item: OutboxItem }[] = [];
  private counter = 0;
  private writes: Promise<unknown> = Promise.resolve();

  private readonly kv: KvStore;
  readonly sessionId: string;

  constructor(kv: KvStore, sessionId: string) {
    this.kv = kv;
    this.sessionId = sessionId;
  }

  /** Loads the persisted items of this session (after a reload). */
  static async load(kv: KvStore, sessionId: string): Promise<Outbox> {
    const box = new Outbox(kv, sessionId);
    const rows = await kv.list<OutboxItem>('outbox', `${sessionId}:`);
    for (const { key, value } of rows) {
      const n = Number(key.slice(sessionId.length + 1));
      box.items.push({ n, item: value });
      box.counter = Math.max(box.counter, n);
    }
    return box;
  }

  append(item: OutboxItem): void {
    const n = ++this.counter;
    this.items.push({ n, item });
    this.queue(() => this.kv.put('outbox', `${this.sessionId}:${pad(n)}`, item));
  }

  /** Pending items in order (a copy). */
  pending(): OutboxItem[] {
    return this.items.map((e) => e.item);
  }

  get size(): number {
    return this.items.length;
  }

  /** Removes the items a confirmed request carried. */
  ack(sent: readonly OutboxItem[]): void {
    const keys = new Set(sent.map(itemKey));
    const gone = this.items.filter((e) => keys.has(itemKey(e.item)));
    this.items = this.items.filter((e) => !keys.has(itemKey(e.item)));
    for (const e of gone) this.queue(() => this.kv.delete('outbox', `${this.sessionId}:${pad(e.n)}`));
  }

  clear(): void {
    const gone = this.items;
    this.items = [];
    for (const e of gone) this.queue(() => this.kv.delete('outbox', `${this.sessionId}:${pad(e.n)}`));
  }

  /** Resolves when every write so far reached storage. */
  flushed(): Promise<void> {
    return this.writes.then(() => undefined);
  }

  private queue(write: () => Promise<unknown>): void {
    this.writes = this.writes.then(write).catch(() => undefined);
  }
}

/** Merges item lists without duplicates, keeping the first occurrence and the order. */
export function mergeItems(...lists: readonly (readonly OutboxItem[])[]): OutboxItem[] {
  const seen = new Set<string>();
  const out: OutboxItem[] = [];
  for (const list of lists) {
    for (const item of list) {
      const k = itemKey(item);
      if (seen.has(k)) continue;
      seen.add(k);
      out.push(item);
    }
  }
  return out;
}
