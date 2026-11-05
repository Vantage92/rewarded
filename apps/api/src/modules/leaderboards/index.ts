// Club leaderboard (spec §4.6; architecture §6.2, §6.4, §8.2). Owner WP-5.
// Per pool: club, declared members with the kind of source, participation rate, intensity and rank.
// Source is challenge_score and club only; no column per member and never totals.
import { rankPools } from '@rewarded/core/challenges';
import { DomainError, routes } from '@rewarded/contracts';
import { mount } from '../../middleware/route.ts';
import type { ApiModule } from '../../module.ts';
import { clubById } from '../clubs/link.ts';
import { leaderboardRows, type ChallengeRow } from '../challenges/scores.ts';
import { P, nowIso, studentOf } from '../squads/lib/social.ts';

export const module: ApiModule = {
  name: 'leaderboards',
  owner: 'WP-5',
  register(api, deps) {
    const { db } = deps;
    mount(api, routes['leaderboards.get'], ({ auth, params }) => {
      studentOf(auth);
      const ch = db.get<ChallengeRow>("SELECT * FROM challenge WHERE id = ? AND type IN ('club_warmup', 'club_prize') AND status <> 'draft'", [params.challenge_id]);
      if (!ch) throw new DomainError('NOT_FOUND');
      const { rows, computedAt, isFinal } = leaderboardRows(db, ch);
      const pools = rankPools(rows, P.challenges).map((g) => ({
        pool: g.pool,
        rows: g.rows.map((r) => {
          const club = clubById(db, r.clubId)!;
          return {
            club_name: club.name,
            declared_members: club.declared_members,
            members_source_kind: club.members_source_kind,
            prize_eligible: club.prize_eligible === 1,
            participation_rate: Math.round(Math.min(1, r.participationRate) * 1000) / 1000,
            intensity_min: Math.round(r.intensityMin * 10) / 10,
            rank: r.rank,
          };
        }),
      }));
      return { pools, is_final: isFinal, computed_at: computedAt ?? nowIso(deps) };
    });
  },
};
