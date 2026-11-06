// Round-3 routes of the fraud module (architecture §6.5, §8.2), added in the integration wave:
// POST /me/institution-email/reconfirm (the HMAC must equal the stored anchor, else ADDRESS_MISMATCH)
// and POST /admin/samples/:id/items/:item/interest ("Ik heb een belang", jurist should-fix 6).
import { DomainError, routes } from '@rewarded/contracts';
import type { Hono } from 'hono';
import { adminActor } from '../../db/services/audit.ts';
import { mount, reply } from '../../middleware/route.ts';
import type { AppEnv, ModuleDeps } from '../../module.ts';
import { confirmInstitution, domainAllowed, domainOf, institutionHash, startInstitution } from './lib/institution.ts';
import { declareInterest, type SampleItemRow } from './lib/sample.ts';
import { eventFor } from './lib/util.ts';
import { actorOf, studentOf } from './lib/util.ts';

export function registerRound3Fraud(api: Hono<AppEnv>, deps: ModuleDeps): void {
  const { db } = deps;

  mount(
    api,
    routes['institution.reconfirm'],
    async ({ auth, body }) => {
      const user = studentOf(auth);
      if ('email' in body) {
        const stored = db.get<{ h: string | null; due: number }>('SELECT institution_email_hash AS h, institution_reconfirm_due AS due FROM user WHERE id = ?', [user.id]);
        if (!domainAllowed(db, domainOf(body.email))) throw new DomainError('DOMAIN_NOT_ALLOWED');
        // Only the HMAC is compared; the address itself is never stored (architecture §10.4).
        if (stored?.h && stored.h !== institutionHash(deps, body.email)) {
          db.transaction(() => eventFor(deps, db, user.id, 'institution_email_rejected', { domein: domainOf(body.email), reden: 'domain' }));
          throw new DomainError('ADDRESS_MISMATCH');
        }
        await startInstitution(deps, user.id, body.email);
        return reply(202, { status: 'code_sent' as const });
      }
      return db.transaction(() => {
        const before = db.get<{ h: string | null }>('SELECT institution_email_hash AS h FROM user WHERE id = ?', [user.id])?.h ?? null;
        confirmInstitution(deps, db, user.id, body.code);
        eventFor(deps, db, user.id, 'institution_email_reconfirmed', { aanleiding: before ? 'steekproef' : 'invoering_hmac' });
        return reply(200, { status: 'reconfirmed' as const });
      });
    },
    { rateLimits: [{ bucket: 'institution:start', limit: 5, windowSec: 3600, key: 'user' }] },
  );

  mount(api, routes['admin.samples.interest'], ({ auth, params }) => {
    const actor = actorOf(deps, auth);
    return db.transaction(() => {
      const item = db.get<SampleItemRow>('SELECT * FROM fraud_sample_item WHERE id = ? AND sample_id = ?', [params.item, params.id]);
      if (!item) throw new DomainError('NOT_FOUND');
      if (item.interest_declared_by) throw new DomainError('INTEREST_DECLARED');
      const admins = db.all<{ user_id: string }>('SELECT user_id FROM admin ORDER BY user_id').map((a) => adminActor(deps.platform.hasher, a.user_id));
      declareInterest(deps, db, item.id, actor, admins);
      if (item.user_id) eventFor(deps, db, item.user_id, 'sample_interest_declared', { sample_id: params.id });
      return { item_id: item.id, second_reviewer_required: true as const };
    });
  });
}
