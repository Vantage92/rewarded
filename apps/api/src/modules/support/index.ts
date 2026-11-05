// Support module (WP-6; spec §7.3 Kwalitatief, §6.6 S4, §4.10; architecture §3.3, §10.5). Owner WP-6.
// Tickets from "Werkt niet" (WP-4 writes them) and external messages with only a label and a date.
// The label "welzijn" is a health datum: only the team member who answers (assigned_to) sees the
// label and the text; it raises harm signal S4 and is counted per arm, never shown per person.
import { DomainError, routes, type SupportLabel, type SupportTicket } from '@rewarded/contracts';
import { CURRENT_PARAMS, focusDayOf } from '@rewarded/core';
import { reply, mount } from '../../middleware/route.ts';
import type { ApiModule, ModuleDeps } from '../../module.ts';
import { storeHarmSignal } from '../fraud/lib/batch.ts';
import { installWp6Services } from '../fraud/lib/install.ts';
import { actorOf, eventFor, idsOf, ref } from '../fraud/lib/util.ts';

interface TicketRow {
  id: string;
  user_id: string | null;
  kind: SupportTicket['kind'];
  ref_id: string | null;
  text: string | null;
  label: SupportLabel | null;
  status: 'open' | 'resolved';
  assigned_to: string | null;
  created_at: string;
}

const ULID = /^[0-9A-HJKMNP-TV-Z]{26}$/;

export function ticketDto(deps: ModuleDeps, t: TicketRow, viewer: string): SupportTicket {
  const hidden = t.label === 'welzijn' && t.assigned_to !== viewer;
  return {
    id: t.id,
    user_ref: t.user_id ? ref(deps, t.user_id) : null,
    kind: t.kind,
    ref_id: t.ref_id && ULID.test(t.ref_id) ? t.ref_id : null,
    text: hidden ? null : t.text,
    label: hidden ? null : t.label,
    status: t.status,
    created_at: t.created_at,
  };
}

/** Sets a label; "welzijn" assigns the ticket to the labelling admin and raises S4 for the student. */
export function labelTicket(deps: ModuleDeps, t: TicketRow, label: SupportLabel, actor: string): void {
  const { db } = deps;
  const now = deps.platform.clock.now();
  db.run('UPDATE support_ticket SET label = ?, labeled_at = ?, assigned_to = CASE WHEN ? = \'welzijn\' THEN ? ELSE coalesce(assigned_to, ?) END WHERE id = ?', [label, now.toISOString(), label, actor, actor, t.id]);
  eventFor(deps, db, t.user_id, 'support_labeled', { label });
  if (label === 'welzijn' && t.user_id) storeHarmSignal(deps, db, t.user_id, 'S4', focusDayOf(now.getTime(), CURRENT_PARAMS), now);
}

export const module: ApiModule = {
  name: 'support',
  owner: 'WP-6',
  register(api, deps) {
    installWp6Services(deps);
    const { db } = deps;

    mount(api, routes['admin.support.list'], ({ auth }) => {
      const actor = actorOf(deps, auth);
      const rows = db.all<TicketRow>("SELECT id, user_id, kind, ref_id, text, label, status, assigned_to, created_at FROM support_ticket ORDER BY status = 'resolved', created_at DESC LIMIT 500");
      db.transaction(() => deps.services.audit.audit(db, { actor, action: 'support_viewed', objectType: 'support_ticket', objectRef: 'list', reason: `count:${rows.length}` }));
      return { items: rows.map((t) => ticketDto(deps, t, actor)) };
    });

    mount(api, routes['admin.support.create'], ({ auth, body }) => {
      const actor = actorOf(deps, auth);
      return db.transaction(() => {
        const id = idsOf(deps).ulid();
        // External messages keep only a label and a date (architecture §3.3).
        db.run("INSERT INTO support_ticket (id, user_id, kind, ref_id, text, status, received_on, created_at) VALUES (?, NULL, 'external', NULL, NULL, 'open', ?, ?)", [
          id,
          body.received_on,
          deps.platform.clock.now().toISOString(),
        ]);
        const t = db.get<TicketRow>('SELECT * FROM support_ticket WHERE id = ?', [id]) as TicketRow;
        labelTicket(deps, t, body.label, actor);
        deps.services.audit.audit(db, { actor, action: 'support_ticket_created', objectType: 'support_ticket', objectRef: id });
        return reply(201, { ticket: ticketDto(deps, db.get<TicketRow>('SELECT * FROM support_ticket WHERE id = ?', [id]) as TicketRow, actor) });
      });
    });

    mount(api, routes['admin.support.patch'], ({ auth, params, body }) => {
      const actor = actorOf(deps, auth);
      return db.transaction(() => {
        const t = db.get<TicketRow>('SELECT * FROM support_ticket WHERE id = ?', [params.id]);
        if (!t) throw new DomainError('NOT_FOUND');
        if (t.label === 'welzijn' && t.assigned_to !== actor) throw new DomainError('FORBIDDEN', { reason: 'assigned_to_other' });
        if (body.label && body.label !== t.label) labelTicket(deps, t, body.label, actor);
        if (body.status && body.status !== t.status) db.run('UPDATE support_ticket SET status = ?, resolved_at = ? WHERE id = ?', [body.status, body.status === 'resolved' ? deps.platform.clock.now().toISOString() : null, t.id]);
        deps.services.audit.audit(db, { actor, action: 'support_ticket_updated', objectType: 'support_ticket', objectRef: t.id, reason: body.status ?? 'label' });
        return { ticket: ticketDto(deps, db.get<TicketRow>('SELECT * FROM support_ticket WHERE id = ?', [t.id]) as TicketRow, actor) };
      });
    });
  },
};
