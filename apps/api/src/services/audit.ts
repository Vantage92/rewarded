// AuditWriter (architecture §12.2; owner of the implementation: WP-3). Append-only audit log
// (§10.8): every admin decision and every view of session data writes one entry in the same transaction.
import type { NetClass } from '@rewarded/contracts';
import type { Db } from '../db/types.ts';

/** `system` or `admin:<ref>`; refs to people are HMAC(user_id, pepper_audit), never raw ids. */
export type ActorRef = 'system' | `admin:${string}`;

export interface AuditEntry {
  actor: ActorRef;
  /** Verb in snake_case, e.g. flag_decided, user_viewed, session_restored. */
  action: string;
  objectType: string;
  /** Hashed reference to the object or person. */
  objectRef: string;
  reason?: string;
  netClass?: NetClass;
}

export interface StoredAuditEntry extends Readonly<AuditEntry> {
  readonly id: string;
  readonly at: string;
}

export interface AuditWriter {
  audit(tx: Db, entry: AuditEntry): string;
}

/** In-memory fake: append-only (entries are frozen; there is no update or delete). */
export class FakeAuditWriter implements AuditWriter {
  private readonly rows: StoredAuditEntry[] = [];
  private seq = 0;
  private readonly now: () => Date;
  constructor(now: () => Date = () => new Date(0)) {
    this.now = now;
  }
  audit(_tx: Db, entry: AuditEntry): string {
    if (!/^[a-z][a-z0-9_]{1,63}$/.test(entry.action)) throw new Error(`Invalid audit action ${entry.action}`);
    const id = `audit_${++this.seq}`;
    this.rows.push(Object.freeze({ ...entry, id, at: this.now().toISOString() }));
    return id;
  }
  entries(): readonly StoredAuditEntry[] {
    return this.rows.slice();
  }
}
