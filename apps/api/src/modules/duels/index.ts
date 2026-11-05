// Duels (spec §3.6, §4.5; architecture §6.3, §6.4, §8.2). Owner WP-5. Behind the flag `duels`.
// The duel partner sees per day goal met or not and the number of met days; never minutes.
import { addDays } from '@rewarded/core';
import { DomainError, routes } from '@rewarded/contracts';
import { requireFeature } from '../../middleware/feature.ts';
import { mount, reply } from '../../middleware/route.ts';
import type { ApiModule } from '../../module.ts';
import { HOUR_MS, P, createInvite, ids, inviteDto, memberRef, openMembers, openMembership, studentOf, today } from '../squads/lib/social.ts';
import { activeDuelOf, duelDays, duelDto, expireOpenDuels, type DuelRow } from './logic.ts';

export const module: ApiModule = {
  name: 'duels',
  owner: 'WP-5',
  register(api, deps) {
    const { db, services } = deps;
    api.use('/duels', requireFeature('duels'));
    api.use('/duels/*', requireFeature('duels'));

    mount(api, routes['duels.create'], ({ auth, body }) => {
      const me = studentOf(auth);
      expireOpenDuels(db, deps);
      if (activeDuelOf(db, me.id)) throw new DomainError('DUEL_ACTIVE');
      let opponentId: string | null = null;
      if (body.opponent_member_ref) {
        const m = openMembership(db, me.id);
        const match = m ? openMembers(db, m.squad_id).find((x) => x.user_id !== null && x.user_id !== me.id && memberRef(deps, m.squad_id, x.user_id) === body.opponent_member_ref) : undefined;
        if (!match?.user_id) throw new DomainError('VALIDATION_FAILED', { issues: [{ path: 'opponent_member_ref', code: 'not_a_member' }] });
        if (activeDuelOf(db, match.user_id)) throw new DomainError('DUEL_ACTIVE');
        opponentId = match.user_id;
      } else if (me.ageBand !== '18_plus') {
        // A 16- or 17-year-old only challenges a squad member (spec §3.6 step 1).
        throw new DomainError('AGE_RESTRICTED');
      }
      const result = db.transaction(() => {
        const id = ids(deps).ulid();
        const now = deps.platform.clock.now();
        const validMs = P.duels.invite_valid_h * HOUR_MS;
        db.run(
          `INSERT INTO duel (id, challenger_id, opponent_id, in_squad, status, created_at, expires_at) VALUES (?, ?, ?, ?, 'open', ?, ?)`,
          [id, me.id, opponentId, opponentId ? 1 : 0, now.toISOString(), new Date(now.getTime() + validMs).toISOString()],
        );
        const invite = createInvite(db, deps, { source: 'duel', creator: me, duelId: id, maxUses: P.duels.invite_max_uses, validMs });
        db.run('UPDATE duel SET invite_id = ? WHERE id = ?', [invite.id, id]);
        services.events.event(db, 'duel_created', { duel_id: id, invite_id: invite.id }, { pseudonym: me.pseudonym });
        const row = db.get<DuelRow>('SELECT * FROM duel WHERE id = ?', [id])!;
        return { duel: duelDto(db, row, me.id), invite: inviteDto(deps, invite) };
      });
      return reply(201, result);
    });

    mount(api, routes['duels.current'], ({ auth }) => {
      const me = studentOf(auth);
      expireOpenDuels(db, deps);
      const d = db.get<DuelRow>(
        `SELECT * FROM duel WHERE (challenger_id = ? OR opponent_id = ?) AND (status IN ('open', 'running', 'pending_review') OR (status = 'finished' AND end_day >= ?))
          ORDER BY created_at DESC LIMIT 1`,
        [me.id, me.id, addDays(today(deps), -7)],
      );
      if (!d) throw new DomainError('NOT_FOUND');
      const isChallenger = d.challenger_id === me.id;
      // Only closed days: today's goal is not final yet.
      const days = duelDays(deps, d, addDays(today(deps), -1)).map((x) => ({
        day: x.day,
        me_met: isChallenger ? x.challenger : x.opponent,
        opponent_met: isChallenger ? x.opponent : x.challenger,
      }));
      const res = {
        duel: duelDto(db, d, me.id),
        days,
        me_total: days.filter((x) => x.me_met).length,
        opponent_total: days.filter((x) => x.opponent_met).length,
      };
      if (d.status === 'finished' && d.result) {
        const mine = isChallenger ? 'challenger' : 'opponent';
        return { ...res, result: d.result === 'tie' ? ('tie' as const) : d.result === mine ? ('won' as const) : ('lost' as const) };
      }
      return res;
    });
  },
};
