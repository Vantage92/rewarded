// Referral (spec §3.11, §4.9; architecture §3.4 referral). Behind the flag `referral`, live from
// 5 January 2027. Both parties get 150 points as `referral_unvested`; vesting after 3 sessions of
// ≥ 25 min in 7 × 24 h and the invitee's first-redeem hold; lapse without vesting.
import { addDays, compareDays, focusDayOf, monthKeyOf, type FocusDay } from '@rewarded/core';
import { evaluateVesting, partyVestDay, referralLive } from '@rewarded/core/referral';
import { transfer } from '@rewarded/core/ledger';
import { isFeatureEnabled } from '../../db/flags.ts';
import type { Db } from '../../db/types.ts';
import type { ModuleDeps } from '../../module.ts';
import type { LedgerService } from '../../services/ledger.ts';
import { HOUR_MS, P, calendarById, ids, nowIso, openMembership, squadById, today, userById, type InviteRow } from '../squads/lib/social.ts';

export interface ReferralRow {
  id: string;
  invite_id: string | null;
  inviter_id: string | null;
  invitee_id: string | null;
  status: 'pending' | 'review' | 'vested' | 'lapsed';
  created_at: string;
  deadline_at: string;
  qualifying_sessions: number;
  review_reason: string | null;
  vested_at: string | null;
  vested_month: string | null;
  inviter_vested_at: string | null;
  invitee_vested_at: string | null;
}

function ledgerOf(deps: ModuleDeps): LedgerService | undefined {
  return (deps.services as unknown as { ledger?: LedgerService }).ledger;
}

/** Sources that count as a referral once it is live (spec §3.11 step 1). */
const REFERRAL_SOURCES = new Set(['squad', 'duel', 'personal']);

export function referralIsLive(deps: ModuleDeps): boolean {
  return referralLive(today(deps), isFeatureEnabled(deps.db, 'referral'), P.referral);
}

/** Creates a pending referral with 150 unvested points per party, when the flag is on. */
export function createReferralIfLive(tx: Db, deps: ModuleDeps, inv: InviteRow, inviteeId: string): string | null {
  if (!REFERRAL_SOURCES.has(inv.source) || !inv.creator_user_id || inv.creator_user_id === inviteeId) return null;
  if (!referralIsLive(deps)) return null;
  if (tx.get('SELECT 1 AS x FROM referral WHERE invitee_id = ?', [inviteeId])) return null;
  const inviter = userById(tx, inv.creator_user_id);
  if (!inviter || inviter.is_team === 1) return null;
  const now = deps.platform.clock.now();
  const id = ids(deps).ulid();
  tx.run('INSERT INTO referral (id, invite_id, inviter_id, invitee_id, status, created_at, deadline_at) VALUES (?, ?, ?, ?, ?, ?, ?)', [
    id,
    inv.id,
    inviter.id,
    inviteeId,
    'pending',
    now.toISOString(),
    new Date(now.getTime() + P.referral.vest_window_h * HOUR_MS).toISOString(),
  ]);
  const ledger = ledgerOf(deps);
  for (const [role, userId] of [['inviter', inviter.id], ['invitee', inviteeId]] as const) {
    ledger?.post(tx, 'referral_pending', `referral_pending:${id}:${role}`, {
      userId,
      postings: transfer('system:issuance', 'user:referral_unvested', P.referral.points_per_party),
      refType: 'referral',
      refId: id,
      actor: 'system',
    });
  }
  const invitee = userById(tx, inviteeId);
  deps.services.events.event(tx, 'referral_pending_created', { invite_id: inv.id, sessies: 0 }, invitee ? { pseudonym: invitee.pseudonym } : {});
  return id;
}

interface SessionFact {
  server_start_at: number;
  verified_min: number;
  status: string;
  review_status: string;
  ip_hash: string | null;
}

/** Rest-period arm of a party on a day (spec §3.16, §4.9 Rustperiode), and when it may vest. */
function restInfo(db: Db, userId: string, day: FocusDay): { inRest: boolean; afterRestDay: FocusDay | null; afterExitDay: FocusDay | null } {
  const u = userById(db, userId);
  if (!u || u.age_band === '16_17' || u.research_opt_out_at !== null || !isFeatureEnabled(db, 'rest_period')) return { inRest: false, afterRestDay: null, afterExitDay: null };
  const m = openMembership(db, userId);
  const squad = m ? squadById(db, m.squad_id) : undefined;
  if (!squad || squad.arm_rest !== 'rest') return { inRest: false, afterRestDay: null, afterExitDay: null };
  const cal = calendarById(db, squad.calendar_id);
  const restFirst = addDays(cal.tDay, 1);
  const restLast = cal.aEndDay ?? P.rest_period.last_day;
  const afterExitDay = u.rest_exit_at ? addDays(focusDayOf(Date.parse(u.rest_exit_at), P), 1) : null;
  const inWindow = compareDays(day, restFirst) >= 0 && compareDays(day, restLast) <= 0;
  const exited = afterExitDay !== null && compareDays(day, afterExitDay) >= 0;
  return { inRest: inWindow && !exited, afterRestDay: addDays(restLast, 1), afterExitDay };
}

/** Evaluates every pending referral (day close step 8); vests or lapses with ledger postings. */
export function evaluateReferrals(tx: Db, deps: ModuleDeps): { vested: number; lapsed: number; review: number } {
  const out = { vested: 0, lapsed: 0, review: 0 };
  const now = deps.platform.clock.now().getTime();
  const day = today(deps);
  const ledger = ledgerOf(deps);
  const pending = tx.all<ReferralRow>("SELECT * FROM referral WHERE status IN ('pending', 'vested') ORDER BY created_at");
  for (const r of pending) {
    if (!r.inviter_id || !r.invitee_id) continue;
    if (r.status === 'vested') {
      vestParties(tx, deps, ledger, r, day);
      continue;
    }
    const sessions = tx.all<SessionFact>(
      "SELECT server_start_at, verified_min, status, review_status, ip_hash FROM focus_session WHERE user_id = ? AND is_practice = 0 AND server_start_at >= ?",
      [r.invitee_id, Date.parse(r.created_at)],
    );
    const inviter = userById(tx, r.inviter_id);
    const invitee = userById(tx, r.invitee_id);
    if (!inviter || !invitee) continue;
    const sameDevice =
      tx.get('SELECT 1 AS x FROM device a JOIN device b ON a.client_device_id = b.client_device_id WHERE a.user_id = ? AND b.user_id = ?', [r.inviter_id, r.invitee_id]) !== undefined;
    const inviterIps = tx.all<{ ip_hash: string; server_start_at: number }>('SELECT ip_hash, server_start_at FROM focus_session WHERE user_id = ? AND ip_hash IS NOT NULL', [r.inviter_id]);
    const sameIp = sessions.some((s) => s.ip_hash !== null && inviterIps.some((i) => i.ip_hash === s.ip_hash && Math.abs(i.server_start_at - s.server_start_at) < 24 * HOUR_MS));
    const samePhone = inviter.phone_hash !== null && inviter.phone_hash === invitee.phone_hash;
    const month = monthKeyOf(now);
    const vestedThisMonth = tx.get<{ n: number }>("SELECT count(*) AS n FROM referral WHERE inviter_id = ? AND status = 'vested' AND vested_month = ?", [r.inviter_id, month])!.n;
    const decision = evaluateVesting(
      {
        createdAt: Date.parse(r.created_at),
        now,
        sessions: sessions.map((s) => ({ startAt: s.server_start_at, verifiedMin: s.verified_min, completed: s.status === 'completed', rejected: s.review_status === 'rejected' })),
        inviteeFirstRedeemAfter: invitee.first_redeem_after ? Date.parse(invitee.first_redeem_after) : null,
        sameDevice,
        sameIpWithin24h: sameIp,
        samePhone,
        inviterVestedThisMonth: vestedThisMonth,
      },
      P.referral,
    );
    tx.run('UPDATE referral SET qualifying_sessions = ? WHERE id = ?', [decision.qualifyingSessions, r.id]);
    if (decision.status === 'pending') continue;
    if (decision.status === 'review') {
      tx.run("UPDATE referral SET status = 'review', review_reason = ? WHERE id = ?", [decision.reason ?? null, r.id]);
      out.review += 1;
      continue;
    }
    if (decision.status === 'lapsed') {
      tx.run("UPDATE referral SET status = 'lapsed' WHERE id = ?", [r.id]);
      // Lapsing is silent (spec §3.11 step 3): the unvested points go to system:lapsed.
      for (const [role, userId] of [['inviter', r.inviter_id], ['invitee', r.invitee_id]] as const) {
        ledger?.post(tx, 'referral_lapse', `referral_lapse:${r.id}:${role}`, {
          userId,
          postings: transfer('user:referral_unvested', 'system:lapsed', P.referral.points_per_party),
          refType: 'referral',
          refId: r.id,
          actor: 'system',
        });
      }
      deps.services.events.event(tx, 'referral_lapsed', { invite_id: r.invite_id ?? r.id, sessies: decision.qualifyingSessions }, { pseudonym: invitee.pseudonym });
      out.lapsed += 1;
      continue;
    }
    tx.run("UPDATE referral SET status = 'vested', vested_at = ?, vested_month = ? WHERE id = ?", [nowIso(deps), month, r.id]);
    deps.services.events.event(tx, 'referral_vested', { invite_id: r.invite_id ?? r.id, sessies: decision.qualifyingSessions }, { pseudonym: invitee.pseudonym });
    vestParties(tx, deps, ledger, { ...r, status: 'vested' }, day);
    out.vested += 1;
  }
  return out;
}

/** Books referral_vest per party on its own vesting day (later for a party in the rest period). */
function vestParties(tx: Db, deps: ModuleDeps, ledger: LedgerService | undefined, r: ReferralRow, day: FocusDay): void {
  const vestDay = r.vested_at ? focusDayOf(Date.parse(r.vested_at), P) : day;
  for (const [role, userId, done] of [['inviter', r.inviter_id, r.inviter_vested_at], ['invitee', r.invitee_id, r.invitee_vested_at]] as const) {
    if (!userId || done) continue;
    const due = partyVestDay(vestDay, restInfo(tx, userId, vestDay));
    if (compareDays(day, due) < 0) continue;
    ledger?.post(tx, 'referral_vest', `referral_vest:${r.id}:${role}`, {
      userId,
      postings: transfer('user:referral_unvested', 'user:available_referral', P.referral.points_per_party),
      refType: 'referral',
      refId: r.id,
      actor: 'system',
    });
    tx.run(`UPDATE referral SET ${role === 'inviter' ? 'inviter_vested_at' : 'invitee_vested_at'} = ? WHERE id = ?`, [nowIso(deps), r.id]);
  }
}
