// Waitlist (architecture §3.1 toegangspoort, §8.2). Owner WP-3.
// Signing up is not an account: no age, no name. Friends who sign up through the group link are
// invited together in one invite with source `waitlist` and max_uses = group size, so they can form
// a squad, and the waitlist stays outside the K factor. Batches go by priority: groups, clubs,
// cards, the rest; within a class by created_at.
import { createHmac, timingSafeEqual } from 'node:crypto';
import { DomainError, routes, type AdminWaitlistOverview, type InviteBatchResponse, type WaitlistPriority } from '@rewarded/contracts';
import { adminActor } from '../../db/services/audit.ts';
import { idsFor, randomToken } from '../../db/ids.ts';
import { DEFAULT_HTTP_CONFIG } from '../../middleware/context.ts';
import { enforceRateLimit, RATE_LIMITS } from '../../middleware/rateLimit.ts';
import { mount, reply } from '../../middleware/route.ts';
import type { ApiModule } from '../../module.ts';
import { normalizeEmail } from '../../platform/email.ts';
import { confirmMail, inviteMail } from './mail.ts';

/** Invite validity for waitlist invites (architecture §3.1: 14 days, choice). */
export const WAITLIST_INVITE_DAYS = 14;
const PRIORITY_ORDER: readonly WaitlistPriority[] = ['group', 'club', 'card', 'none'];

interface EntryRow {
  id: string;
  email: string;
  locale: 'nl' | 'en';
  group_token: string;
  priority_reason: WaitlistPriority;
  created_at: string;
}

export const module: ApiModule = {
  name: 'waitlist',
  owner: 'WP-3',
  register(api, deps) {
    const { db, platform, services } = deps;
    const http = deps.http ?? DEFAULT_HTTP_CONFIG;
    const ids = idsFor(platform);

    // Unsubscribe token without an extra column: <entry id>.<HMAC of the id>.
    const unsubscribeToken = (id: string) => `${id}_${createHmac('sha256', platform.hasher.hash('audit', 'waitlist_unsubscribe')).update(id).digest('base64url').slice(0, 32)}`;

    api.get('/waitlist/health', (c) => c.json({ module: 'waitlist', status: 'ok' }));

    mount(
      api,
      routes['waitlist.join'],
      async ({ c, body }) => {
        const email = body.email.trim().toLowerCase();
        const emailHash = platform.hasher.hash('email', normalizeEmail(email));
        enforceRateLimit(c, RATE_LIMITS.waitlistEmail, `e:${emailHash}`);
        const now = platform.clock.now().toISOString();
        const sent = db.transaction(() => {
          if (db.get('SELECT 1 AS x FROM waitlist_entry WHERE email_hash = ?', [emailHash])) return undefined; // always 202
          // Joining a friend's group only works with a group token that exists.
          const group = body.group_token && db.get('SELECT 1 AS x FROM waitlist_entry WHERE group_token = ?', [body.group_token]) ? body.group_token : undefined;
          const groupToken = group ?? randomToken(platform.random, 16);
          const priority: WaitlistPriority = group ? 'group' : body.source === 'club_qr' || body.club_hint ? 'club' : body.source === 'card' ? 'card' : 'none';
          const id = ids.ulid();
          db.run(
            `INSERT INTO waitlist_entry (id, email, email_hash, locale, source, group_token, club_hint, priority_reason, consent_version, created_at, ip_hash, net_class)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [id, email, emailHash, body.locale, body.source, groupToken, body.club_hint?.slice(0, 80) ?? null, priority, body.consent_version, now, c.var.ipHash, c.var.netClass],
          );
          // The friend who shared the link is now in a group too.
          if (group) db.run("UPDATE waitlist_entry SET priority_reason = 'group' WHERE group_token = ? AND invited_at IS NULL", [group]);
          return { id, groupToken };
        });
        if (sent) await platform.mailer.send(confirmMail(body.locale, email, http.appOrigin, sent.groupToken, unsubscribeToken(sent.id)));
        return reply(202, {});
      },
      { rateLimits: [RATE_LIMITS.waitlistIp] },
    );

    mount(api, routes['waitlist.unsubscribe'], ({ body }) => {
      const [id, mac] = [body.token.slice(0, 26), body.token.slice(27)];
      const expected = unsubscribeToken(id).slice(27);
      if (mac.length !== expected.length || !timingSafeEqual(Buffer.from(mac), Buffer.from(expected))) throw new DomainError('LINK_INVALID');
      // Spec §10.6: unsubscribing deletes the entry at once.
      const r = db.run('DELETE FROM waitlist_entry WHERE id = ?', [id]);
      if (r.changes === 0) throw new DomainError('LINK_INVALID');
      return undefined;
    });

    mount(api, routes['admin.waitlist.overview'], (): AdminWaitlistOverview => {
      const rows = db.all<{ priority_reason: WaitlistPriority; waiting: number; groups: number; invited: number; oldest_at: string | null }>(
        `SELECT priority_reason,
                sum(invited_at IS NULL) AS waiting,
                count(DISTINCT CASE WHEN invited_at IS NULL THEN group_token END) AS groups,
                sum(invited_at IS NOT NULL) AS invited,
                min(CASE WHEN invited_at IS NULL THEN created_at END) AS oldest_at
           FROM waitlist_entry GROUP BY priority_reason`,
      );
      const by = new Map(rows.map((r) => [r.priority_reason, r]));
      const classes = PRIORITY_ORDER.map((p) => {
        const r = by.get(p);
        return { priority_reason: p, waiting: r?.waiting ?? 0, groups: r?.groups ?? 0, invited: r?.invited ?? 0, oldest_at: r?.oldest_at ?? null };
      });
      return { classes, total_waiting: classes.reduce((s, c) => s + c.waiting, 0) };
    });

    mount(api, routes['admin.waitlist.inviteBatch'], async ({ c, auth, body }): Promise<InviteBatchResponse> => {
      if (auth.kind !== 'user') throw new DomainError('AUTH_REQUIRED');
      const now = platform.clock.now();
      const waiting = db.all<EntryRow>('SELECT id, email, locale, group_token, priority_reason, created_at FROM waitlist_entry WHERE invited_at IS NULL');
      // One unit per group; its class is the best class of its members, its age the oldest member.
      const groups = new Map<string, EntryRow[]>();
      for (const e of waiting) groups.set(e.group_token, [...(groups.get(e.group_token) ?? []), e]);
      const units = [...groups.values()]
        .map((members) => ({
          members: members.sort((a, b) => a.created_at.localeCompare(b.created_at) || a.id.localeCompare(b.id)),
          priority: PRIORITY_ORDER[Math.min(...members.map((m) => PRIORITY_ORDER.indexOf(m.priority_reason)))]!,
        }))
        .sort((a, b) => PRIORITY_ORDER.indexOf(a.priority) - PRIORITY_ORDER.indexOf(b.priority) || a.members[0]!.created_at.localeCompare(b.members[0]!.created_at));
      // Groups are never split: a group that does not fit in the remaining count is skipped.
      const chosen: typeof units = [];
      let people = 0;
      for (const u of units) {
        if (people + u.members.length > body.count) continue;
        chosen.push(u);
        people += u.members.length;
      }
      if (body.dry_run) {
        return { dry_run: true, invites: chosen.map((u) => ({ invite_id: null, priority_reason: u.priority, group_size: u.members.length })), entries_invited: people };
      }
      const expires = new Date(now.getTime() + WAITLIST_INVITE_DAYS * 24 * 3600 * 1000).toISOString();
      const created = db.transaction(() =>
        chosen.map((u) => {
          const inviteId = ids.ulid();
          const token = randomToken(platform.random, 16);
          db.run(
            `INSERT INTO invite (id, token, source, waitlist_entry_id, max_uses, uses, expires_at, created_at) VALUES (?, ?, 'waitlist', ?, ?, 0, ?, ?)`,
            [inviteId, token, u.members[0]!.id, u.members.length, expires, now.toISOString()],
          );
          for (const m of u.members) db.run('UPDATE waitlist_entry SET invited_at = ?, invite_id = ? WHERE id = ?', [now.toISOString(), inviteId, m.id]);
          services.events.event(db, 'invite_created', { invite_id: inviteId, bron: 'waitlist', maker: null, max_uses: u.members.length, geldig_tot: expires }, { pseudonym: auth.user.pseudonym });
          return { inviteId, token, unit: u };
        }),
      );
      db.transaction(() =>
        services.audit.audit(db, {
          actor: adminActor(platform.hasher, auth.user.id),
          action: 'waitlist_batch_invited',
          objectType: 'waitlist',
          objectRef: `batch_${created.length}_${people}`,
          reason: `count=${body.count}`,
          netClass: c.var.netClass,
        }),
      );
      for (const inv of created) {
        for (const m of inv.unit.members) await platform.mailer.send(inviteMail(m.locale, m.email, http.appOrigin, inv.token, inv.unit.members.length));
      }
      return {
        dry_run: false,
        invites: created.map((i) => ({ invite_id: i.inviteId, priority_reason: i.unit.priority, group_size: i.unit.members.length })),
        entries_invited: people,
      };
    });
  },
};
