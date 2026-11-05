// SocialService: what other packages may read from WP-5 (squad streak and joker for GET /me/today,
// squad and club for GET /me). Added to Services by module augmentation, like WP-4 does, so no
// frozen file changes; optional, so code that builds Services without WP-5 keeps compiling.
import { weekKey, type FocusDay } from '@rewarded/core';
import type { ModuleDeps } from '../../../module.ts';
import { P, clubOfUser, mySquad, today } from './social.ts';

export interface SocialService {
  /** Streak of the user's squad, or null without a squad (spec §4.4). */
  streak(userId: string): number | null;
  /** Whether the week's rest-day joker is still unused (spec §4.4; user_day.joker_used stays 0). */
  jokerAvailable(userId: string, day?: FocusDay): boolean;
  /** The user's squad and club ids for GET /me (architecture §8.2). */
  membership(userId: string): { squadId: string | null; squadName: string | null; clubId: string | null };
}

declare module '../../../services/index.ts' {
  interface Services {
    social?: SocialService;
  }
}

export function installSocialService(deps: ModuleDeps): SocialService {
  const existing = deps.services.social;
  if (existing) return existing;
  const { db } = deps;
  const svc: SocialService = {
    streak(userId) {
      try {
        return mySquad(db, userId).squad.streak;
      } catch {
        return null;
      }
    },
    jokerAvailable(userId, day = today(deps)) {
      const week = weekKey(day, P.time.week_start_iso_weekday);
      return db.get('SELECT 1 AS x FROM squad_joker WHERE user_id = ? AND week_start = ?', [userId, week]) === undefined;
    },
    membership(userId) {
      let squadId: string | null = null;
      let squadName: string | null = null;
      try {
        const s = mySquad(db, userId).squad;
        squadId = s.id;
        squadName = s.name;
      } catch {
        squadId = null;
      }
      return { squadId, squadName, clubId: clubOfUser(db, userId) };
    },
  };
  deps.services.social = svc;
  return svc;
}
