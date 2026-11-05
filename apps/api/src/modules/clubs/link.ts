// Linking a member to a club (spec §3.7 step 3, §4.6 Codeplafond; architecture §3.4 club_membership).
// Above floor(1.1 × declared members) a link waits for the admin (pending_admin) and code_cap_reached
// is written. One open link per user.
import { codeCap } from '@rewarded/core/challenges';
import { DomainError, type ClubDto } from '@rewarded/contracts';
import type { Db } from '../../db/types.ts';
import type { ModuleDeps } from '../../module.ts';
import { P, ids, nowIso, today } from '../squads/lib/social.ts';

export interface ClubRow {
  id: string;
  name: string;
  city: string;
  exam_calendar_id: string | null;
  declared_members: number;
  members_source_kind: 'institution' | 'board_grant' | 'faculty' | 'self';
  members_source_ref: string;
  members_fixed_at: string | null;
  prize_eligible: number;
  agreement_ref: string | null;
  help_resources: string;
  pool: 'lt150' | '150_500' | 'gt500';
  join_code: string | null;
  status: 'draft' | 'active' | 'archived';
  created_by: string;
  created_at: string;
}

export function clubById(db: Db, id: string): ClubRow | undefined {
  return db.get<ClubRow>('SELECT * FROM club WHERE id = ?', [id]);
}

export function clubDto(c: ClubRow): ClubDto {
  return {
    id: c.id,
    name: c.name,
    city: c.city,
    declared_members: c.declared_members,
    members_source_kind: c.members_source_kind,
    prize_eligible: c.prize_eligible === 1,
    pool: c.pool,
  };
}

/** Open links that count against the code cap (approved or automatic). */
export function linkedCount(db: Db, clubId: string): number {
  return db.get<{ n: number }>('SELECT count(*) AS n FROM club_membership WHERE club_id = ? AND left_at IS NULL AND pending_admin = 0', [clubId])!.n;
}

export function linkClub(
  tx: Db,
  deps: ModuleDeps,
  o: { userId: string; pseudonym: string; clubId: string; qrSource: string | null; ipHash?: string | null; netClass?: 'campus' | 'mobile_cgnat' | 'other' | null },
): { club: ClubDto; status: 'linked' | 'pending_admin' } {
  const club = clubById(tx, o.clubId);
  if (!club || club.status !== 'active' || club.agreement_ref === null) throw new DomainError('CODE_INVALID');
  if (tx.get('SELECT 1 AS x FROM club_membership WHERE user_id = ? AND left_at IS NULL', [o.userId])) throw new DomainError('ALREADY_LINKED');
  const pending = linkedCount(tx, club.id) >= codeCap(club.declared_members, P.challenges);
  tx.run(
    `INSERT INTO club_membership (id, user_id, club_id, linked_at, linked_day, qr_source, pending_admin, ip_hash, net_class) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [ids(deps).ulid(), o.userId, club.id, nowIso(deps), today(deps), o.qrSource, pending ? 1 : 0, o.ipHash ?? null, o.netClass ?? null],
  );
  if (pending) deps.services.events.event(tx, 'code_cap_reached', { vereniging_id: club.id }, { pseudonym: o.pseudonym });
  else deps.services.events.event(tx, 'vereniging_joined', { vereniging_id: club.id, qr_bron: o.qrSource }, { pseudonym: o.pseudonym });
  return { club: clubDto(club), status: pending ? 'pending_admin' : 'linked' };
}
