// Auth, onboarding and profile (architecture §3.1, §8.2, §10.1; spec §3.1, §4.10). Owner WP-3.
// Magic link with the token in the URL fragment, confirmed by an explicit POST; a six-digit code as
// fallback for other browser contexts; the invite travels in the magic-link row. Under 16 nothing
// is kept. The answer to POST /auth/magic-link is always 202, so it shows no account exists.
import { DomainError, routes, type ExperimentAssignmentDto, type MeUser, type UserSettings } from '@rewarded/contracts';
import { CURRENT_PARAMS, addDays, focusDayOf } from '@rewarded/core';
import type { Context } from 'hono';
import { readFeatureFlags } from '../../db/flags.ts';
import { idsFor, randomToken, sha256, sixDigitCode } from '../../db/ids.ts';
import type { Db } from '../../db/types.ts';
import { clearSessionCookie, createSession, deleteUserSessions, setSessionCookie } from '../../middleware/auth.ts';
import { DEFAULT_HTTP_CONFIG, type AppEnv } from '../../middleware/context.ts';
import { enforceRateLimit, RATE_LIMITS } from '../../middleware/rateLimit.ts';
import { mount, reply } from '../../middleware/route.ts';
import type { ApiModule, ModuleDeps } from '../../module.ts';
import type { Arms, ExperimentUnitRef } from '../../services/experiments.ts';
import { checkAge, localDate } from './age.ts';
import { normalizeEmail } from '../../platform/email.ts';
import { legalVersions } from './legal.ts';
import { inviteNeededMail, loginMail } from './mail.ts';
import {
  CODE_ATTEMPTS,
  MAGIC_LINK_TTL_MS,
  bumpStat,
  channelOf,
  erasePreUser,
  movePendingEvents,
  usableInvite,
  userById,
  userByNormHash,
  type MagicLinkRow,
  type UserRow,
} from './repo.ts';

function settingsOf(u: UserRow): UserSettings {
  return {
    compare_opt_in: u.compare_opt_in === 1,
    silent_mode: u.silent_mode === 1,
    squad_name_on_cards: u.squad_name_on_cards === 1,
    no_points_mode: u.no_points_mode === 1,
    email_reminders: u.email_reminders === 1,
    locale: u.locale,
  };
}

function meUser(db: Db, u: UserRow): MeUser {
  return {
    id: u.id,
    first_name: u.first_name,
    last_name: u.last_name,
    email: u.email,
    locale: u.locale,
    is_team: u.is_team === 1,
    is_admin: db.get('SELECT 1 AS x FROM admin WHERE user_id = ?', [u.id]) !== undefined,
    daily_goal_min: u.daily_goal_min,
    phone_verified: u.phone_verified_at !== null,
    institution_domain: u.institution_domain,
    research_opted_out: u.research_opt_out_at !== null,
    created_at: u.created_at,
  };
}

function codeHash(deps: ModuleDeps, rowId: string, code: string): string {
  return deps.platform.hasher.hash('email', `login_code:${rowId}:${code}`);
}

/** Starts a user or pre session for a consumed magic-link row (link or code path). */
function login(c: Context<AppEnv>, deps: ModuleDeps, row: MagicLinkRow, via: 'link' | 'code'): { next: '/onboarding' | '/' } {
  const { db, platform } = deps;
  const now = platform.clock.now();
  const normHash = platform.hasher.hash('email', normalizeEmail(row.email));
  const result = db.transaction(() => {
    // Token and code are one-time together: whoever is first wins (§3.1 auth_magic_link).
    const used = db.run('UPDATE auth_magic_link SET used_at = ?, used_via = ? WHERE id = ? AND used_at IS NULL', [now.toISOString(), via, row.id]);
    if (used.changes === 0) throw new DomainError(via === 'link' ? 'LINK_INVALID' : 'CODE_INVALID');
    bumpStat(db, now, via === 'link' ? 'consumed_link' : 'consumed_code');
    const user = userByNormHash(db, normHash);
    if (user) {
      if (user.status !== 'active') throw new DomainError('ACCOUNT_BLOCKED');
      return { cookie: createSession(db, platform, { userId: user.id }, c.var.uaClass), next: '/' as const };
    }
    const cookie = createSession(db, platform, { pendingEmail: row.email, prePseudonym: randomToken(platform.random, 16), inviteToken: row.invite_token }, c.var.uaClass);
    return { cookie, next: '/onboarding' as const };
  });
  setSessionCookie(c, result.cookie);
  return { next: result.next };
}

function noAssignment(): ExperimentAssignmentDto {
  return { unit: 'solo', arm_bonus: 'A', arm_belofte: 'late', arm_rest: 'continue', arm_prompt: 'na', block: 'outside' };
}

export const module: ApiModule = {
  name: 'auth',
  owner: 'WP-3',
  register(api, deps) {
    const { db, platform, services } = deps;
    const http = deps.http ?? DEFAULT_HTTP_CONFIG;
    const ids = idsFor(platform);
    const legal = legalVersions();

    api.get('/auth/health', (c) => c.json({ module: 'auth', status: 'ok' }));

    mount(
      api,
      routes['auth.magicLink'],
      async ({ c, body }) => {
        const email = body.email.trim().toLowerCase();
        const normHash = platform.hasher.hash('email', normalizeEmail(email));
        enforceRateLimit(c, RATE_LIMITS.magicLinkEmail, `e:${normHash}`);
        const now = platform.clock.now();
        // An invite token that admits nobody is refused, whatever the address (no enumeration).
        if (body.invite_token !== undefined && !usableInvite(db, body.invite_token, now)) throw new DomainError('INVITE_REQUIRED');
        const known = userByNormHash(db, normHash) !== undefined;
        if (!known && body.invite_token === undefined) {
          // Closed pilot: no account and no invite. Same 202, but the mail points to the waitlist.
          await platform.mailer.send(inviteNeededMail(body.locale, email, http.appOrigin));
          return reply(202, {});
        }
        const token = randomToken(platform.random, 32);
        const code = sixDigitCode(platform.random);
        const id = ids.ulid();
        db.transaction(() => {
          db.run(
            `INSERT INTO auth_magic_link (id, email, token_hash, code_hash, invite_token, locale, ip_hash, net_class, created_at, created_day, expires_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              id,
              email,
              sha256(token),
              codeHash(deps, id, code),
              body.invite_token ?? null,
              body.locale,
              c.var.ipHash,
              c.var.netClass,
              now.toISOString(),
              focusDayOf(now.getTime(), CURRENT_PARAMS),
              new Date(now.getTime() + MAGIC_LINK_TTL_MS).toISOString(),
            ],
          );
          bumpStat(db, now, 'requested');
        });
        await platform.mailer.send(loginMail(body.locale, email, http.appOrigin, token, code));
        return reply(202, {});
      },
      { rateLimits: [RATE_LIMITS.magicLinkIp] },
    );

    mount(api, routes['auth.confirm'], ({ c, body }) => {
      const now = platform.clock.now();
      const row = db.get<MagicLinkRow>('SELECT * FROM auth_magic_link WHERE token_hash = ?', [sha256(body.token)]);
      if (!row || row.used_at !== null) {
        bumpStat(db, now, 'invalid');
        throw new DomainError('LINK_INVALID');
      }
      if (row.expires_at <= now.toISOString()) throw new DomainError('LINK_EXPIRED');
      return login(c, deps, row, 'link');
    });

    mount(api, routes['auth.code'], ({ c, body }) => {
      const email = body.email.trim().toLowerCase();
      enforceRateLimit(c, RATE_LIMITS.loginCodeEmail, `e:${platform.hasher.hash('email', normalizeEmail(email))}`);
      const now = platform.clock.now();
      // The code belongs to the latest request for this address (five attempts per request, §10.2).
      const row = db.get<MagicLinkRow>('SELECT * FROM auth_magic_link WHERE email = ? AND used_at IS NULL ORDER BY created_at DESC, id DESC LIMIT 1', [email]);
      if (!row) {
        bumpStat(db, now, 'invalid');
        throw new DomainError('CODE_INVALID');
      }
      if (row.expires_at <= now.toISOString()) throw new DomainError('CODE_EXPIRED');
      if (row.attempts >= CODE_ATTEMPTS) throw new DomainError('TOO_MANY_ATTEMPTS');
      if (codeHash(deps, row.id, body.code) !== row.code_hash) {
        const attempts = db.transaction(() => {
          db.run('UPDATE auth_magic_link SET attempts = attempts + 1 WHERE id = ?', [row.id]);
          bumpStat(db, now, 'invalid');
          return row.attempts + 1;
        });
        throw new DomainError(attempts >= CODE_ATTEMPTS ? 'TOO_MANY_ATTEMPTS' : 'CODE_INVALID', { attempts_left: Math.max(0, CODE_ATTEMPTS - attempts) });
      }
      return login(c, deps, row, 'code');
    });

    mount(api, routes['auth.logout'], ({ c, auth }) => {
      db.transaction(() => {
        if (auth.kind === 'user') deleteUserSessions(db, auth.user.id);
        else if (auth.kind === 'pre') db.run('DELETE FROM auth_session WHERE id = ?', [auth.sessionId]);
      });
      clearSessionCookie(c);
      return undefined;
    });

    mount(api, routes['me.get'], ({ auth }) => {
      const flags = readFeatureFlags(db);
      if (auth.kind === 'pre') return { user: null, age_band: null, settings: null, flags, onboarding_complete: false };
      if (auth.kind !== 'user') throw new DomainError('AUTH_REQUIRED');
      const u = userById(db, auth.user.id);
      if (!u) throw new DomainError('AUTH_REQUIRED');
      // squad and club are added by their owners (WP-5) once their tables exist.
      return { user: meUser(db, u), age_band: u.age_band, settings: settingsOf(u), flags, onboarding_complete: true };
    });

    mount(api, routes['me.onboarding'], ({ c, auth, body }) => {
      if (auth.kind !== 'pre') throw new DomainError('FORBIDDEN');
      if (body.terms_version !== legal.terms || body.privacy_version !== legal.privacy || body.research_info_version !== legal.research_info) {
        throw new DomainError('TERMS_OUTDATED', { terms: legal.terms, privacy: legal.privacy, research_info: legal.research_info });
      }
      const now = platform.clock.now();
      const age = checkAge(body.birth_date, localDate(now));
      if (!age.ok && age.reason === 'implausible') throw new DomainError('VALIDATION_FAILED', { issues: [{ path: 'birth_date', code: 'implausible' }] });
      if (!age.ok) {
        // Spec §3.1 step 5: nothing of this person stays (pre session, magic-link rows, pending events).
        db.transaction(() => erasePreUser(db, auth));
        clearSessionCookie(c);
        throw new DomainError('AGE_BELOW_MINIMUM');
      }
      if (CURRENT_PARAMS.goals.confirm_min.includes(body.daily_goal_min) && body.confirm_overreach !== true) {
        throw new DomainError('OVERREACH_CONFIRM_REQUIRED', { minutes: body.daily_goal_min });
      }
      const invite = usableInvite(db, auth.inviteToken, now);
      if (!invite) throw new DomainError('INVITE_REQUIRED');
      const normHash = platform.hasher.hash('email', normalizeEmail(auth.email));
      if (userByNormHash(db, normHash)) throw new DomainError('VALIDATION_FAILED', { issues: [{ path: 'email', code: 'email_in_use' }] });

      const today = focusDayOf(now.getTime(), CURRENT_PARAMS);
      const cohort = today <= CURRENT_PARAMS.experiments.registration_last_day ? 'experiment' : 'expansion';
      const channel = channelOf(invite.source);
      const userId = ids.ulid();
      const pseudonym = randomToken(platform.random, 16);
      const silent = age.band === '16_17' ? body.silent_mode !== false : body.silent_mode === true;

      const result = db.transaction(() => {
        const taken = db.run('UPDATE invite SET uses = uses + 1 WHERE id = ? AND uses < max_uses AND expires_at > ?', [invite.id, now.toISOString()]);
        if (taken.changes === 0) throw new DomainError('INVITE_REQUIRED');
        db.run(
          `INSERT INTO user (id, email, email_norm_hash, first_name, last_name, locale, age_band, turns_18_on, pseudonym,
             registration_source, registration_invite_id, registration_ip_hash, registration_net_class, daily_goal_min, silent_mode,
             cohort, registration_channel, terms_version, privacy_version, research_info_version, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            userId,
            auth.email,
            normHash,
            body.first_name,
            body.last_name ?? null,
            (db.get<{ locale: 'nl' | 'en' }>('SELECT locale FROM auth_magic_link WHERE email = ? ORDER BY created_at DESC LIMIT 1', [auth.email])?.locale ?? 'nl'),
            age.band,
            age.turns18On,
            pseudonym,
            invite.source,
            invite.id,
            c.var.ipHash,
            c.var.netClass,
            body.daily_goal_min,
            silent ? 1 : 0,
            cohort,
            channel,
            body.terms_version,
            body.privacy_version,
            body.research_info_version,
            now.toISOString(),
          ],
        );
        db.run(
          'UPDATE auth_session SET user_id = ?, pending_email = NULL, pre_pseudonym = NULL, invite_token = NULL, expires_at = ?, last_seen_at = ? WHERE id = ?',
          [userId, new Date(now.getTime() + 30 * 24 * 3600 * 1000).toISOString(), now.toISOString(), auth.sessionId],
        );
        movePendingEvents(db, auth.prePseudonym, pseudonym, http.release, cohort, channel);

        let assignment = noAssignment();
        if (cohort === 'experiment') {
          // Squad invite: the squad's arms (assigned when the squad was created, WP-5); else a solo unit.
          const squadUnit: ExperimentUnitRef | undefined = invite.squad_id ? { type: 'squad', id: invite.squad_id, stratum: '' } : undefined;
          const unit: ExperimentUnitRef =
            squadUnit && services.experiments.get(squadUnit) ? squadUnit : { type: 'solo', id: userId, stratum: `${invite.club_id ?? 'none'}|${channel}` };
          const assigned =
            unit.type === 'solo'
              ? services.experiments.assign(db, unit, invite.source === 'squad' ? ['bonus', 'belofte', 'rest'] : ['bonus', 'belofte', 'rest', 'prompt'])
              : services.experiments.get(unit)!;
          if (age.band === '16_17') {
            // Minors personally get A and `continue` (architecture §5.1); logged as an arm switch.
            const minor: Partial<Arms> = { bonus: 'A', rest: 'continue' };
            for (const [factor, to] of Object.entries(minor) as [keyof Arms, string][]) {
              services.experiments.switchArm(db, { userId, factor, from: assigned.arms[factor], to, reason: 'minor' });
            }
          }
          const arms = services.experiments.armsFor({ userId, ageBand: age.band, optedOut: false, unit });
          assignment = { unit: unit.type, arm_bonus: arms.bonus, arm_belofte: arms.belofte, arm_rest: arms.rest, arm_prompt: arms.prompt, block: assigned.block.slice(0, 64) };
          services.events.event(
            db,
            'experiment_assigned',
            { arm_bonus: arms.bonus, arm_belofte: arms.belofte, arm_rest: arms.rest, arm_prompt: arms.prompt, eenheid: unit.type, blok: assignment.block, age_band: age.band },
            { pseudonym },
          );
        }
        services.events.event(
          db,
          'account_created',
          { bron: invite.source, invite_id: invite.id, vereniging_id: invite.club_id, qr_bron: invite.qr_source, age_band: age.band },
          { pseudonym },
        );
        services.events.event(db, 'daily_goal_set', { minuten: body.daily_goal_min, bron: 'onboarding', overmoed_bevestigd: body.confirm_overreach === true }, { pseudonym });
        db.run('DELETE FROM auth_magic_link WHERE email = ? AND used_at IS NULL', [auth.email]);
        return { user: meUser(db, userById(db, userId)!), assignment };
      });
      return reply(201, result);
    });

    mount(api, routes['me.settings'], ({ auth, body }) => {
      if (auth.kind !== 'user') throw new DomainError('AUTH_REQUIRED');
      const columns: [string, number | string][] = [];
      for (const key of ['compare_opt_in', 'silent_mode', 'squad_name_on_cards', 'no_points_mode', 'email_reminders'] as const) {
        const v = body[key];
        if (v !== undefined) columns.push([key, v ? 1 : 0]);
      }
      if (body.locale !== undefined) columns.push(['locale', body.locale]);
      db.run(`UPDATE user SET ${columns.map(([k]) => `${k} = ?`).join(', ')} WHERE id = ?`, [...columns.map(([, v]) => v), auth.user.id]);
      return { settings: settingsOf(userById(db, auth.user.id)!) };
    });

    mount(api, routes['me.researchOptOut'], ({ auth }) => {
      if (auth.kind !== 'user') throw new DomainError('AUTH_REQUIRED');
      const now = platform.clock.now();
      const effective = addDays(focusDayOf(now.getTime(), CURRENT_PARAMS), 1);
      db.transaction(() => {
        services.experiments.optOut(db, auth.user.id);
        db.run('UPDATE user SET research_opt_out_at = coalesce(research_opt_out_at, ?) WHERE id = ?', [now.toISOString(), auth.user.id]);
        services.events.event(db, 'research_opt_out', { dag: effective }, { pseudonym: auth.user.pseudonym });
      });
      const at = db.get<{ research_opt_out_at: string }>('SELECT research_opt_out_at FROM user WHERE id = ?', [auth.user.id])!.research_opt_out_at;
      return { opted_out_at: at, effective_from_day: effective };
    });
  },
};
