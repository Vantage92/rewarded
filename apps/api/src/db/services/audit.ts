// AuditWriter implementation (architecture §3.5, §10.8, §12.2). Rows are append-only: SQLite triggers
// refuse UPDATE and DELETE on audit_log (migration 0002). References to people are
// HMAC(user_id, pepper_audit), never the raw id (§10.7); `auditRef` makes them.
import type { AuditEntry, AuditWriter, StoredAuditEntry } from '../../services/audit.ts';
import type { Hasher } from '../../platform/types.ts';
import type { Db } from '../types.ts';
import type { Ids } from '../ids.ts';
import type { Clock } from '../../platform/types.ts';

const ACTION = /^[a-z][a-z0-9_]{1,63}$/;

/** Reference to a person for the audit log: `u_` + 32 hex chars of HMAC(id, pepper_audit). */
export function auditRef(hasher: Hasher, id: string): string {
  return `u_${hasher.hash('audit', id).slice(0, 32)}`;
}

/** `admin:<ref>` for an admin user id. */
export function adminActor(hasher: Hasher, userId: string): `admin:${string}` {
  return `admin:${auditRef(hasher, userId)}`;
}

export class SqlAuditWriter implements AuditWriter {
  private readonly clock: Clock;
  private readonly ids: Ids;
  constructor(deps: { clock: Clock; ids: Ids }) {
    this.clock = deps.clock;
    this.ids = deps.ids;
  }

  audit(tx: Db, entry: AuditEntry): string {
    if (!ACTION.test(entry.action)) throw new Error(`Invalid audit action ${entry.action}`);
    if (entry.actor !== 'system' && !/^admin:[A-Za-z0-9_:-]{4,80}$/.test(entry.actor)) throw new Error('Invalid audit actor');
    const id = this.ids.ulid();
    tx.run('INSERT INTO audit_log (id, actor_ref, action, object_type, object_ref, reason, at, net_class) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [
      id,
      entry.actor,
      entry.action,
      entry.objectType,
      entry.objectRef,
      entry.reason ?? null,
      this.clock.now().toISOString(),
      entry.netClass ?? null,
    ]);
    return id;
  }

  /** Read side for the admin audit view (WP-6) and tests. */
  list(db: Db, opts: { action?: string; limit?: number } = {}): StoredAuditEntry[] {
    const rows = db.all<{ id: string; actor_ref: string; action: string; object_type: string; object_ref: string; reason: string | null; at: string; net_class: string | null }>(
      `SELECT * FROM audit_log ${opts.action ? 'WHERE action = ?' : ''} ORDER BY at, id LIMIT ?`,
      opts.action ? [opts.action, opts.limit ?? 1000] : [opts.limit ?? 1000],
    );
    return rows.map((r) => {
      const e: StoredAuditEntry = {
        id: r.id,
        at: r.at,
        actor: r.actor_ref as StoredAuditEntry['actor'],
        action: r.action,
        objectType: r.object_type,
        objectRef: r.object_ref,
        ...(r.reason !== null ? { reason: r.reason } : {}),
        ...(r.net_class !== null ? { netClass: r.net_class as NonNullable<StoredAuditEntry['netClass']> } : {}),
      };
      return e;
    });
  }
}
