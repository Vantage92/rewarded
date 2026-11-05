// Shareable proof card (spec §3.10, §4.8; architecture §8.2, §10.3). Owner WP-5. Behind the flag
// `cards`. Never points, amounts, rewards or ranking positions; the squad name only when every
// member allows it; no card for a session under review; the verification page says what it does
// not prove. Sharing earns nothing.
import { focusDayOf } from '@rewarded/core';
import { DomainError, routes, type CardFields } from '@rewarded/contracts';
import { randomToken } from '../../db/ids.ts';
import type { Db } from '../../db/types.ts';
import { requireFeature } from '../../middleware/feature.ts';
import { mount, reply } from '../../middleware/route.ts';
import type { ApiModule, ModuleDeps } from '../../module.ts';
import { P, ids, mySquad, nowIso, openMembers, studentOf, userById } from '../squads/lib/social.ts';
import { SVG_HEADERS, renderCardSvg, type CardFormat } from './svg.ts';

interface SessionRow {
  id: string;
  user_id: string;
  status: string;
  review_status: 'none' | 'pending' | 'released' | 'rejected';
  verified_min: number;
  server_start_at: number;
  server_end_at: number | null;
  focus_day: string;
  is_practice: number;
}

interface CardRow {
  id: string;
  user_id: string;
  kind: 'session' | 'streak' | 'week' | 'belofte';
  ref_id: string;
  fields: string;
  snapshot: string;
  token: string;
  created_at: string;
  revoked_at: string | null;
}

interface Snapshot {
  first_name: string | null;
  squad_name: string | null;
  duration_min: number;
  streak: number | null;
  from: string;
  to: string;
  locale: 'nl' | 'en';
}

const TEXT = {
  nl: {
    headline: { session: 'Focussessie voltooid', streak: 'Squadstreak', week: 'Mijn focusweek', belofte: 'Mijn Belofte' },
    minutes: (n: number) => `${n} minuten focus`,
    streak: (n: number) => `Streak: ${n} ${n === 1 ? 'dag' : 'dagen'}`,
    footer: 'Rewarded zichtbaar op het scherm van één browser',
  },
  en: {
    headline: { session: 'Focus session completed', streak: 'Squad streak', week: 'My focus week', belofte: 'My promise' },
    minutes: (n: number) => `${n} minutes of focus`,
    streak: (n: number) => `Streak: ${n} ${n === 1 ? 'day' : 'days'}`,
    footer: 'Rewarded visible on the screen of one browser',
  },
} as const;

function sessionOf(db: Db, id: string): SessionRow | undefined {
  return db.get<SessionRow>('SELECT id, user_id, status, review_status, verified_min, server_start_at, server_end_at, focus_day, is_practice FROM focus_session WHERE id = ?', [id]);
}

function ownCard(db: Db, id: string, userId: string): CardRow {
  const c = db.get<CardRow>('SELECT * FROM card WHERE id = ?', [id]);
  if (!c || c.user_id !== userId) throw new DomainError('NOT_FOUND');
  return c;
}

/** A card of a session disappears when the session is rejected; none while it is under review. */
function sessionStillValid(deps: ModuleDeps, c: CardRow): boolean {
  if (c.kind !== 'session') return true;
  const s = sessionOf(deps.db, c.ref_id);
  if (!s || s.status !== 'completed' || s.review_status === 'rejected' || s.review_status === 'pending') return false;
  return ![...deps.services.flags.openForSessions([s.id]).values()].some((f) => f.length > 0);
}

function velden(fields: CardFields): ('first_name' | 'squad_name' | 'streak' | 'duration')[] {
  return (['first_name', 'squad_name', 'streak', 'duration'] as const).filter((k) => fields[k] === true);
}

export const module: ApiModule = {
  name: 'cards',
  owner: 'WP-5',
  register(api, deps) {
    const { db, services } = deps;
    api.use('/cards', requireFeature('cards'));
    api.use('/cards/*', requireFeature('cards'));
    api.use('/verify/*', requireFeature('cards'));

    mount(api, routes['cards.create'], ({ auth, body }) => {
      const me = studentOf(auth);
      const user = userById(db, me.id);
      if (!user) throw new DomainError('AUTH_REQUIRED');
      let durationMin = 0;
      let from = focusDayOf(deps.platform.clock.now().getTime(), P);
      let to = from;
      let streak: number | null = null;
      let squadName: string | null = null;
      const squad = (() => {
        try {
          return mySquad(db, me.id).squad;
        } catch {
          return undefined;
        }
      })();
      if (body.kind === 'session') {
        const s = sessionOf(db, body.ref_id);
        if (!s || s.user_id !== me.id || s.status !== 'completed' || s.is_practice === 1 || s.review_status === 'rejected') throw new DomainError('NOT_FOUND');
        const open = [...services.flags.openForSessions([s.id]).values()].some((f) => f.length > 0);
        if (s.review_status === 'pending' || open) throw new DomainError('SESSION_UNDER_REVIEW');
        durationMin = s.verified_min;
        from = s.focus_day;
        to = s.focus_day;
      } else if (body.kind === 'streak') {
        if (!squad || squad.id !== body.ref_id) throw new DomainError('NOT_FOUND');
      } else if (body.kind === 'belofte') {
        const b = db.get<{ user_id: string; start_day: string; end_day: string }>('SELECT user_id, start_day, end_day FROM belofte WHERE id = ?', [body.ref_id]);
        if (!b || b.user_id !== me.id) throw new DomainError('NOT_FOUND');
        from = b.start_day;
        to = b.end_day;
      } else {
        const s = sessionOf(db, body.ref_id);
        if (!s || s.user_id !== me.id) throw new DomainError('NOT_FOUND');
        from = s.focus_day;
        to = s.focus_day;
      }
      if (body.fields.streak && squad) streak = squad.streak;
      if (body.fields.squad_name && squad && squad.name_status === 'ok') {
        // Only when every member allows the squad name on cards (spec §4.8).
        const all = openMembers(db, squad.id).every((m) => m.user_id === null || userById(db, m.user_id)?.squad_name_on_cards === 1);
        if (all) squadName = squad.name;
      }
      const snapshot: Snapshot = {
        first_name: body.fields.first_name ? user.first_name : null,
        squad_name: squadName,
        duration_min: body.fields.duration === false ? 0 : durationMin,
        streak,
        from,
        to,
        locale: user.locale,
      };
      const id = ids(deps).ulid();
      const token = randomToken(deps.platform.random, 16);
      db.transaction(() => {
        db.run('INSERT INTO card (id, user_id, kind, ref_id, fields, snapshot, token, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [
          id,
          me.id,
          body.kind,
          body.ref_id,
          JSON.stringify(body.fields),
          JSON.stringify(snapshot),
          token,
          nowIso(deps),
        ]);
        services.events.event(db, 'card_created', { card_id: id, aanleiding: body.kind, velden_aan: velden(body.fields) }, { pseudonym: me.pseudonym });
      });
      return reply(201, { card_id: id, token, image_url: `/api/v1/cards/${id}/image` });
    });

    mount(api, routes['cards.image'], ({ auth, params, query }) => {
      const me = studentOf(auth);
      const c = ownCard(db, params.id, me.id);
      if (c.revoked_at || !sessionStillValid(deps, c)) throw new DomainError('NOT_FOUND');
      const snap = JSON.parse(c.snapshot) as Snapshot;
      const t = TEXT[snap.locale];
      const svg = renderCardSvg(
        {
          headline: t.headline[c.kind],
          firstName: snap.first_name,
          squadName: snap.squad_name,
          durationLabel: snap.duration_min > 0 ? t.minutes(snap.duration_min) : null,
          streakLabel: snap.streak !== null ? t.streak(snap.streak) : null,
          footer: t.footer,
          verifyUrl: `${deps.http?.appOrigin ?? ''}/v/${c.token}`,
        },
        (query.format ?? '9x16') as CardFormat,
      );
      return new Response(svg, { status: 200, headers: { ...SVG_HEADERS } });
    });

    mount(api, routes['cards.delete'], ({ auth, params }) => {
      const me = studentOf(auth);
      const c = ownCard(db, params.id, me.id);
      if (!c.revoked_at) db.run('UPDATE card SET revoked_at = ? WHERE id = ?', [nowIso(deps), c.id]);
      return undefined;
    });

    mount(api, routes['verify.get'], ({ params, c: ctx }) => {
      ctx.header('X-Robots-Tag', 'noindex, nofollow');
      ctx.header('Cache-Control', 'no-store');
      const c = db.get<CardRow>('SELECT * FROM card WHERE token = ?', [params.token]);
      if (!c || c.revoked_at || !sessionStillValid(deps, c)) throw new DomainError('CARD_UNAVAILABLE');
      const snap = JSON.parse(c.snapshot) as Snapshot;
      const owner = userById(db, c.user_id);
      const fields = JSON.parse(c.fields) as CardFields;
      db.transaction(() => services.events.event(db, 'verify_page_viewed', { card_id: c.id, aanleiding: c.kind, velden_aan: velden(fields) }, owner ? { pseudonym: owner.pseudonym } : {}));
      return {
        first_name: snap.first_name ?? '–',
        duration_min: snap.duration_min,
        from: snap.from,
        to: snap.to,
        ...(snap.streak !== null ? { streak: snap.streak } : {}),
        statement_key: `cards.verify.statement_${c.kind}`,
        // In the pilot "Focus ook" leads to the waitlist with priority (spec §3.10 step 3).
        focus_ook_url: `${deps.http?.appOrigin ?? ''}/welkom?bron=card`,
      };
    });
  },
};
