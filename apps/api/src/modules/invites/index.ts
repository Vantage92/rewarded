// Invites (spec §3.5, §3.6, §4.4, §4.5; architecture §3.1 invite, §8.2). Owner WP-5.
// The preview never mentions points or prizes. Accepting joins a squad, accepts a duel or links a
// club; an invite the user registered with was already counted by the onboarding (WP-3).
import { addDays } from '@rewarded/core';
import { DomainError, routes } from '@rewarded/contracts';
import type { Db } from '../../db/types.ts';
import { mount } from '../../middleware/route.ts';
import type { ApiModule, ModuleDeps } from '../../module.ts';
import { linkClub } from '../clubs/link.ts';
import { acceptDuel } from '../duels/logic.ts';
import { createReferralIfLive } from '../referral/logic.ts';
import { addMember } from '../squads/lib/membership.ts';
import { nowIso, openMembership, squadById, studentOf, today, userById, type InviteRow } from '../squads/lib/social.ts';

function inviteByToken(db: Db, token: string): InviteRow | undefined {
  return db.get<InviteRow>('SELECT * FROM invite WHERE token = ?', [token]);
}

/** INVITE_INVALID / INVITE_EXPIRED / INVITE_EXHAUSTED (architecture §8.3, 410). */
function checkUsable(deps: ModuleDeps, inv: InviteRow | undefined, registeredWith: boolean): InviteRow {
  if (!inv) throw new DomainError('INVITE_INVALID');
  if (inv.expires_at <= nowIso(deps) && !registeredWith) throw new DomainError('INVITE_EXPIRED');
  if (inv.uses >= inv.max_uses && !registeredWith) throw new DomainError('INVITE_EXHAUSTED');
  return inv;
}

export const module: ApiModule = {
  name: 'invites',
  owner: 'WP-5',
  register(api, deps) {
    const { db, services } = deps;

    mount(api, routes['invites.preview'], ({ auth, params }) => {
      const inv = inviteByToken(db, params.token);
      if (!inv) throw new DomainError('INVITE_INVALID');
      // Written before registration, without a pseudonym (architecture §8.1).
      db.transaction(() => services.events.event(db, 'invite_link_opened', { invite_id: inv.id, nieuwe_bezoeker: auth.kind === 'none' }));
      checkUsable(deps, inv, false);
      const inviter = inv.creator_user_id ? userById(db, inv.creator_user_id) : undefined;
      const squad = inv.squad_id ? squadById(db, inv.squad_id) : undefined;
      return {
        source: inv.source,
        ...(inviter ? { inviter_first_name: inviter.first_name } : {}),
        ...(squad && squad.name_status === 'ok' ? { squad_name: squad.name } : {}),
        valid: true,
      };
    });

    mount(api, routes['invites.accept'], ({ auth, params }) => {
      const me = studentOf(auth);
      const user = userById(db, me.id);
      if (!user) throw new DomainError('AUTH_REQUIRED');
      const raw = inviteByToken(db, params.token);
      const registeredWith = raw !== undefined && db.get('SELECT 1 AS x FROM user WHERE id = ? AND registration_invite_id = ?', [me.id, raw.id]) !== undefined;
      const inv = checkUsable(deps, raw, registeredWith);
      return db.transaction(() => {
        const take = () => {
          if (registeredWith) return;
          const r = db.run('UPDATE invite SET uses = uses + 1 WHERE id = ? AND uses < max_uses', [inv.id]);
          if (r.changes === 0) throw new DomainError('INVITE_EXHAUSTED');
        };
        if (inv.source === 'squad' && inv.squad_id) {
          const squad = squadById(db, inv.squad_id);
          if (!squad || squad.status === 'archived') throw new DomainError('INVITE_INVALID');
          const open = openMembership(db, me.id);
          if (open?.squad_id === squad.id) return { squad: { id: squad.id, name: squad.name } };
          if (open) throw new DomainError('ALREADY_IN_SQUAD');
          take();
          addMember(db, deps, squad, me, { role: 'member', inviteId: inv.id, event: 'squad_joined', switchReason: 'join' });
          if (registeredWith) createReferralIfLive(db, deps, inv, me.id);
          return { squad: { id: squad.id, name: squad.name } };
        }
        if (inv.source === 'duel' && inv.duel_id) {
          const duel = acceptDuel(db, deps, inv, me);
          take();
          if (registeredWith) createReferralIfLive(db, deps, inv, me.id);
          return { duel: { id: duel.id, start_day: duel.start_day ?? addDays(today(deps), 1), end_day: duel.end_day ?? addDays(today(deps), 7) } };
        }
        if (inv.source === 'club' && inv.club_id) {
          take();
          linkClub(db, deps, { userId: me.id, pseudonym: me.pseudonym, clubId: inv.club_id, qrSource: inv.qr_source });
          return {};
        }
        if (inv.source === 'personal') {
          take();
          if (registeredWith) createReferralIfLive(db, deps, inv, me.id);
          return {};
        }
        take();
        return {};
      });
    });

    api.get('/invites/health', (c) => c.json({ module: 'invites', status: 'ok' }));
  },
};
