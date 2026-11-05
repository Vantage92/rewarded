// /api/v1/leaderboards (architecture §6.2; spec §4.6).
import { z } from 'zod';
import { ClubPool, Instant, MembersSourceKind, NonNegInt, PosInt, ShortText, Ulid } from './common.ts';
import { defineRoutes } from './route.ts';

export const LeaderboardRow = z.strictObject({
  club_name: ShortText,
  declared_members: NonNegInt,
  members_source_kind: MembersSourceKind,
  prize_eligible: z.boolean(),
  participation_rate: z.number().min(0).max(1),
  intensity_min: z.number().nonnegative(),
  rank: PosInt,
});
export const LeaderboardResponse = z.strictObject({
  pools: z.array(z.strictObject({ pool: ClubPool, rows: z.array(LeaderboardRow) })),
  is_final: z.boolean(),
  computed_at: Instant,
});

export const leaderboardRoutes = defineRoutes({
  'leaderboards.get': {
    module: 'leaderboards', method: 'GET', path: '/leaderboards/:challenge_id', auth: ['student'],
    params: z.strictObject({ challenge_id: Ulid }), response: LeaderboardResponse, responseKind: 'json', status: [200], errors: ['NOT_FOUND'], spec: 'arch §8.2, §6.2',
  },
});

// Inferred types (output side) for every schema above.
export type LeaderboardRow = z.output<typeof LeaderboardRow>;
export type LeaderboardResponse = z.output<typeof LeaderboardResponse>;
