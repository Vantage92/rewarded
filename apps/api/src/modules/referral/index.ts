// Referral (spec §3.11, §4.9; architecture §8.2). Owner WP-5. Behind the flag `referral` and live
// from params.referral.starts_on. The inviter sees only "Joris: 2 van 3 sessies".
import { DomainError, routes } from '@rewarded/contracts';
import { mount } from '../../middleware/route.ts';
import type { ApiModule } from '../../module.ts';
import { DAY_MS, createInvite, inviteUrl, nowIso, studentOf, userById } from '../squads/lib/social.ts';
import { referralIsLive } from './logic.ts';

/** A personal link lives long and has many uses; vesting caps the reward, not the link (spec §4.9). */
const PERSONAL_MAX_USES = 50;
const PERSONAL_VALID_DAYS = 120;

export const module: ApiModule = {
  name: 'referral',
  owner: 'WP-5',
  register(api, deps) {
    const { db } = deps;
    mount(api, routes['referral.mine'], ({ auth }) => {
      const me = studentOf(auth);
      if (!referralIsLive(deps)) throw new DomainError('FEATURE_DISABLED', { flag: 'referral' });
      const token = db.transaction(() => {
        const existing = db.get<{ token: string }>("SELECT token FROM invite WHERE creator_user_id = ? AND source = 'personal' AND expires_at > ? AND uses < max_uses ORDER BY created_at DESC LIMIT 1", [
          me.id,
          nowIso(deps),
        ]);
        if (existing) return existing.token;
        return createInvite(db, deps, { source: 'personal', creator: me, maxUses: PERSONAL_MAX_USES, validMs: PERSONAL_VALID_DAYS * DAY_MS }).token;
      });
      const pending = db.all<{ invitee_id: string | null; qualifying_sessions: number; deadline_at: string }>(
        "SELECT invitee_id, qualifying_sessions, deadline_at FROM referral WHERE inviter_id = ? AND status IN ('pending', 'review') ORDER BY created_at",
        [me.id],
      );
      return {
        link: inviteUrl(deps, token),
        pending: pending
          .filter((r) => r.invitee_id !== null)
          .map((r) => ({ first_name: userById(db, r.invitee_id!)?.first_name ?? '—', sessions_done: r.qualifying_sessions, deadline: r.deadline_at })),
      };
    });
  },
};
