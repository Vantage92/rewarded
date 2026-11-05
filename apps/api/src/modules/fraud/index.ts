// Fraud module (WP-6; architecture §4.5, §6.5, §8.2, §10.8; spec §6). Owner WP-6.
// Student routes: appeals and the institution anchor. Admin routes: the review queue with
// decisions, the four-eyes block, appeals, the first-redemption list and the weekly sample.
// Negative decisions only exist under /admin (architecture §10.8).
import { DomainError, routes } from '@rewarded/contracts';
import { isoWeekKey } from '@rewarded/core/catalog';
import { isValidFlagReason } from '@rewarded/core/fraud';
import { reply, mount } from '../../middleware/route.ts';
import type { ApiModule } from '../../module.ts';
import { decideAppeal, submitAppeal, type AppealRow } from './lib/appeals.ts';
import { confirmBlock, decideFlag } from './lib/decisions.ts';
import { flagDto, flagDtoById } from './lib/dto.ts';
import { loadFlag, type FlagRow } from './lib/flags.ts';
import { installWp6Services } from './lib/install.ts';
import { confirmInstitution, startInstitution } from './lib/institution.ts';
import { judgeItem, type SampleItemRow } from './lib/sample.ts';
import { actorOf, hasTables, parseJson, ref, studentOf } from './lib/util.ts';

export const module: ApiModule = {
  name: 'fraud',
  owner: 'WP-6',
  register(api, deps) {
    installWp6Services(deps);
    const { db } = deps;

    // --- student ---------------------------------------------------------------------------
    mount(api, routes['appeals.create'], ({ auth, body }) => {
      const user = studentOf(auth);
      return db.transaction(() => reply(201, { appeal_id: submitAppeal(deps, db, user.id, body.object_type, body.object_id, body.text) }));
    });

    mount(
      api,
      routes['institution.start'],
      async ({ auth, body }) => {
        const user = studentOf(auth);
        await startInstitution(deps, user.id, body.email);
        return reply(202, {});
      },
      { rateLimits: [{ bucket: 'institution:start', limit: 5, windowSec: 3600, key: 'user' }] },
    );

    mount(api, routes['institution.confirm'], ({ auth, body }) => {
      const user = studentOf(auth);
      // The attempt counter must survive a wrong code, so the failure is committed first.
      let result: { domain: string } | undefined;
      let failure: unknown;
      db.transaction(() => {
        try {
          result = confirmInstitution(deps, db, user.id, body.code);
        } catch (err) {
          if (!(err instanceof DomainError) || err.code !== 'CODE_INVALID') throw err;
          failure = err;
        }
      });
      if (failure) throw failure;
      return { domain: (result as { domain: string }).domain, verified: true as const };
    });

    // --- admin: review queue -----------------------------------------------------------------
    mount(api, routes['admin.flags.list'], ({ auth, query }) => {
      const actor = actorOf(deps, auth);
      const status = query.status ?? 'open';
      const rows = db.all<FlagRow>('SELECT * FROM fraud_flag WHERE status = ? AND (? IS NULL OR id > ?) ORDER BY id LIMIT 51', [status, query.cursor ?? null, query.cursor ?? null]);
      const page = rows.slice(0, 50);
      // Every view of session data writes an audit line before the answer (architecture §10.8).
      db.transaction(() => deps.services.audit.audit(db, { actor, action: 'flags_viewed', objectType: 'fraud_flag', objectRef: status, reason: `count:${page.length}` }));
      return { items: page.map((f) => flagDto(deps, db, f)), next_cursor: rows.length > 50 ? (page[page.length - 1] as FlagRow).id : null };
    });

    mount(api, routes['admin.flags.decide'], ({ auth, params, body }) => {
      const actor = actorOf(deps, auth);
      if (!isValidFlagReason(body.decision, body.reason_code)) throw new DomainError('REASON_REQUIRED', { reason: 'unknown_reason_code' });
      return db.transaction(() => {
        if (!loadFlag(db, params.id)) throw new DomainError('NOT_FOUND');
        const r = decideFlag(deps, db, params.id, body.decision, actor, body.reason_code, body.note);
        return { flag: flagDtoById(deps, db, params.id), postings: r.postings, block_pending_confirmation: r.blockPending };
      });
    });

    mount(api, routes['admin.blocks.confirm'], ({ auth, params, body }) => {
      const actor = actorOf(deps, auth);
      return db.transaction(() => {
        if (!loadFlag(db, params.id)) throw new DomainError('NOT_FOUND');
        const r = confirmBlock(deps, db, params.id, actor, body.note);
        return { flag: flagDtoById(deps, db, params.id), phone_hash_blocked: r.phoneHashBlocked };
      });
    });

    // --- admin: appeals ----------------------------------------------------------------------
    const appealDto = (a: AppealRow) => ({
      id: a.id,
      object_type: a.object_type,
      object_id: a.object_id,
      user_ref: a.user_id ? ref(deps, a.user_id) : null,
      text: a.text,
      status: a.status === 'decided' ? ('decided' as const) : ('open' as const),
      submitted_at: a.submitted_at,
      due_at: `${a.due_day}T23:59:59.000Z`,
      waiting_for_third: a.waiting_for_third === 1,
      outcome: a.outcome,
      motivation: a.motivation,
    });

    mount(api, routes['admin.appeals.list'], ({ auth }) => {
      const actor = actorOf(deps, auth);
      const rows = db.all<AppealRow>("SELECT * FROM appeal WHERE status IN ('open', 'decided') ORDER BY status = 'decided', due_day, id LIMIT 200");
      db.transaction(() => deps.services.audit.audit(db, { actor, action: 'appeals_viewed', objectType: 'appeal', objectRef: 'list' }));
      return { items: rows.map(appealDto) };
    });

    mount(api, routes['admin.appeals.decide'], ({ auth, params, body }) => {
      const actor = actorOf(deps, auth);
      return db.transaction(() => ({ appeal: appealDto(decideAppeal(deps, db, params.id, body.outcome, body.motivation, actor)) }));
    });

    // --- admin: first redemptions ------------------------------------------------------------
    mount(api, routes['admin.firstRedemptions'], ({ auth }) => {
      const actor = actorOf(deps, auth);
      const now = deps.platform.clock.now();
      const users = db.all<{ id: string; first_redeem_after: string; phone_line_type: string | null; phone_verified_at: string | null; institution_verified_at: string | null }>(
        `SELECT id, first_redeem_after, phone_line_type, phone_verified_at, institution_verified_at FROM user
          WHERE first_redeem_after IS NOT NULL AND first_redeem_after > ? AND status = 'active' AND is_team = 0 ORDER BY first_redeem_after LIMIT 500`,
        [now.toISOString()],
      );
      const since = now.getTime() - 7 * 86_400_000;
      const items = users.map((u) => {
        const s = hasTables(db, 'focus_session')
          ? (db.get<{ n: number; night: number; delay: number | null; devices: number; ua: number }>(
              `SELECT count(*) AS n, SUM(late_start) AS night, AVG(claim_delay_s) AS delay, count(DISTINCT device_id) AS devices, count(DISTINCT ua_class) AS ua
                 FROM focus_session WHERE user_id = ? AND status = 'completed' AND is_practice = 0 AND server_start_at >= ?`,
              [u.id, since],
            ) ?? { n: 0, night: 0, delay: null, devices: 0, ua: 0 })
          : { n: 0, night: 0, delay: null, devices: 0, ua: 0 };
        const h11 = db.get("SELECT 1 AS x FROM fraud_flag WHERE code = 'H11' AND subject_type = 'account' AND subject_id = ? AND status = 'open'", [u.id]) !== undefined;
        const anchor = u.institution_verified_at && u.phone_verified_at ? 'both' : u.institution_verified_at ? 'institution' : u.phone_verified_at ? 'phone' : 'none';
        return {
          user_ref: ref(deps, u.id),
          first_redeem_after: u.first_redeem_after,
          sessions_7d: s.n,
          pattern: { night_sessions: s.night ?? 0, avg_claim_delay_s: Math.round(s.delay ?? 0), devices: s.devices, ua_classes: s.ua },
          anchor: anchor as 'none' | 'institution' | 'phone' | 'both',
          phone_line_type: u.phone_line_type === 'mobile' ? ('mobile' as const) : ('none' as const),
          h11,
        };
      });
      db.transaction(() => deps.services.audit.audit(db, { actor, action: 'first_redemptions_viewed', objectType: 'user', objectRef: 'list', reason: `count:${items.length}` }));
      return { items };
    });

    // --- admin: weekly sample ----------------------------------------------------------------
    const itemDto = (i: SampleItemRow) => ({
      id: i.id,
      user_ref: i.user_id ? ref(deps, i.user_id) : 'u_deleted0',
      stratum: i.stratum.slice(0, 32),
      checks: { ...parseJson<Record<string, unknown>>(i.checks, {}), contact_channel: i.contact_channel, contact_confirmed: i.contact_confirmed_at !== null, address_mismatch: i.address_mismatch === 1, interest_declared: i.interest_declared_by !== null },
      judgement: i.judgement,
      reason_code: i.reason_code,
      judged_at: i.judged_at,
    });

    mount(api, routes['admin.samples.current'], ({ auth }) => {
      const actor = actorOf(deps, auth);
      const s = db.get<{ id: string; week_key: string; seed_version: string; drawn_at: string }>("SELECT id, week_key, seed_version, drawn_at FROM fraud_sample WHERE kind = 'weekly' ORDER BY week_key DESC LIMIT 1");
      if (!s) return { sample: null };
      const items = db.all<SampleItemRow>('SELECT * FROM fraud_sample_item WHERE sample_id = ? ORDER BY stratum, score', [s.id]);
      db.transaction(() => deps.services.audit.audit(db, { actor, action: 'sample_viewed', objectType: 'fraud_sample', objectRef: s.id }));
      return { sample: { id: s.id, week_key: isoWeek(s.week_key), kind: 'weekly' as const, seed_version: s.seed_version.slice(0, 32), drawn_at: s.drawn_at, items: items.map(itemDto) } };
    });

    mount(api, routes['admin.samples.judge'], ({ auth, params, body }) => {
      const actor = actorOf(deps, auth);
      return db.transaction(() => {
        const r = judgeItem(deps, db, params.id, params.item, body, actor);
        return { item: itemDto(r.item), flag_id: r.flagId };
      });
    });
  },
};

function isoWeek(monday: string): string {
  return isoWeekKey(monday);
}
