// Small helpers shared by the WP-6 modules (fraud, admin, privacy, support, kpi) and their jobs.
import { DomainError } from '@rewarded/contracts';
import { auditRef, adminActor } from '../../../db/services/audit.ts';
import { idsFor, type Ids } from '../../../db/ids.ts';
import type { Db } from '../../../db/types.ts';
import type { AuthState } from '../../../middleware/context.ts';
import type { ModuleDeps } from '../../../module.ts';
import type { AdminActor } from '../../../services/flags.ts';

const tableCache = new WeakMap<Db, Map<string, boolean>>();

/** Whether all tables exist (harnesses of other packages migrate only their own series). */
export function hasTables(db: Db, ...names: string[]): boolean {
  let m = tableCache.get(db);
  if (!m) tableCache.set(db, (m = new Map()));
  return names.every((n) => {
    if (m.get(n) === true) return true;
    const ok = db.get("SELECT 1 AS x FROM sqlite_master WHERE type IN ('table', 'view') AND name = ?", [n]) !== undefined;
    if (ok) m.set(n, true);
    return ok;
  });
}

export function hasColumn(db: Db, table: string, column: string): boolean {
  return db.all<{ name: string }>(`SELECT name FROM pragma_table_info(?)`, [table]).some((c) => c.name === column);
}

export function ref(deps: ModuleDeps, userId: string): string {
  return auditRef(deps.platform.hasher, userId);
}

/** The admin actor of a request; every /admin route is mounted with auth ['admin']. */
export function actorOf(deps: ModuleDeps, auth: AuthState): AdminActor {
  if (auth.kind !== 'user' || auth.user.adminRole === null) throw new DomainError('FORBIDDEN');
  return adminActor(deps.platform.hasher, auth.user.id);
}

export function studentOf(auth: AuthState) {
  if (auth.kind !== 'user') throw new DomainError('AUTH_REQUIRED');
  return auth.user;
}

export function nowOf(deps: ModuleDeps): Date {
  return deps.platform.clock.now();
}

export function idsOf(deps: ModuleDeps): Ids {
  return idsFor(deps.platform);
}

export function pseudonymOf(db: Db, userId: string): string | undefined {
  return db.get<{ pseudonym: string }>('SELECT pseudonym FROM user WHERE id = ?', [userId])?.pseudonym;
}

/** Writes a server event only when the user still exists (events need a pseudonym). */
export function eventFor<N extends Parameters<ModuleDeps['services']['events']['event']>[1]>(
  deps: ModuleDeps,
  tx: Db,
  userId: string | null | undefined,
  name: N,
  props: Parameters<ModuleDeps['services']['events']['event']>[2] & object,
): void {
  if (!userId) return;
  const pseudonym = pseudonymOf(tx, userId);
  if (!pseudonym) return;
  deps.services.events.event(tx, name, props as never, { pseudonym });
}

/** Every admin (user ids), for the appeal reviewer rule. */
export function adminActors(deps: ModuleDeps, db: Db): AdminActor[] {
  return db.all<{ user_id: string }>('SELECT user_id FROM admin ORDER BY user_id').map((r) => adminActor(deps.platform.hasher, r.user_id));
}

export function parseJson<T>(text: string | null | undefined, fallback: T): T {
  if (!text) return fallback;
  try {
    return JSON.parse(text) as T;
  } catch {
    return fallback;
  }
}

/**
 * Conflict of interest (architecture §10.8): an admin never decides about his own sessions, account,
 * appeal or prize. SAME_REVIEWER when one of the subject's users is the acting admin.
 */
export function assertNotOwnSubject(deps: ModuleDeps, actor: AdminActor, userIds: readonly (string | null | undefined)[]): void {
  for (const u of userIds) if (u && adminActor(deps.platform.hasher, u) === actor) throw new DomainError('SAME_REVIEWER', { reason: 'own_subject' });
}
