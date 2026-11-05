// Phone verification at the first redemption (spec §3.4 step 4, §4.3, §5; architecture §5.2). Owner WP-4.
// The SMS processor checks the line type: only mobile numbers are accepted, VoIP and virtual numbers
// are refused. Only an HMAC of the number is stored (architecture §10.4); H8 compares it with the
// blocked numbers of WP-6 and raises a flag (a human decides, spec §6.3).
import { CURRENT_PARAMS } from '@rewarded/core';
import { DomainError, routes } from '@rewarded/contracts';
import { sha256, sixDigitCode } from '../../db/ids.ts';
import type { Db } from '../../db/types.ts';
import type { AuthState } from '../../middleware/context.ts';
import { enforceRateLimit, RATE_LIMITS } from '../../middleware/rateLimit.ts';
import { mount, reply } from '../../middleware/route.ts';
import type { ApiModule } from '../../module.ts';
import { installWp4Services } from '../points/services.ts';

const P = CURRENT_PARAMS;
/** Validity of the SMS code; the documents fix none, so it follows the login code (15 min, architecture §3.1). */
export const PHONE_CODE_TTL_MS = 15 * 60_000;

function userOf(auth: AuthState): { id: string; pseudonym: string; locale: 'nl' | 'en' } {
  if (auth.kind !== 'user') throw new DomainError('AUTH_REQUIRED');
  return { id: auth.user.id, pseudonym: auth.user.pseudonym, locale: auth.user.locale };
}

const codeHash = (userId: string, code: string) => sha256(`phone:${userId}:${code}`);

/** Another account holds this verified number (spec §5: one mobile number per account). */
function phoneInUse(db: Db, userId: string, phoneHash: string): boolean {
  return db.get('SELECT 1 AS x FROM user WHERE phone_hash = ? AND phone_verified_at IS NOT NULL AND id <> ?', [phoneHash, userId]) !== undefined;
}

/** H8 (spec §6.3): the number belongs to a confirmed block; the table is WP-6's (0300 series). */
function isBlockedPhone(db: Db, phoneHash: string, nowIso: string): boolean {
  try {
    return db.get('SELECT 1 AS x FROM blocked_phone_hash WHERE phone_hash = ? AND (expires_at IS NULL OR expires_at > ?)', [phoneHash, nowIso]) !== undefined;
  } catch {
    return false;
  }
}

const SMS_TEXT = {
  nl: (code: string) => `Je Rewarded-code is ${code}. Hij werkt 15 minuten.`,
  en: (code: string) => `Your Rewarded code is ${code}. It works for 15 minutes.`,
};

export const module: ApiModule = {
  name: 'phone',
  owner: 'WP-4',
  register(api, deps) {
    installWp4Services(deps);
    const { db } = deps;
    const now = () => deps.platform.clock.now();

    mount(
      api,
      routes['phone.start'],
      async ({ c, auth, body }) => {
        const user = userOf(auth);
        enforceRateLimit(c, RATE_LIMITS.phoneStart);
        const lineType = deps.platform.sms.lookupLineType ? await deps.platform.sms.lookupLineType(body.phone) : 'unknown';
        if (!(P.phone.allowed_line_types as readonly string[]).includes(lineType)) throw new DomainError('PHONE_TYPE_NOT_ALLOWED');
        const phoneHash = deps.platform.hasher.hash('phone', body.phone);
        const code = sixDigitCode(deps.platform.random);
        const expiresAt = new Date(now().getTime() + PHONE_CODE_TTL_MS).toISOString();
        db.transaction(() => {
          if (phoneInUse(db, user.id, phoneHash)) throw new DomainError('PHONE_IN_USE');
          db.run(
            `INSERT INTO phone_verification (user_id, phone_hash, code_hash, expires_at, attempts) VALUES (?, ?, ?, ?, 0)
             ON CONFLICT (user_id) DO UPDATE SET phone_hash = excluded.phone_hash, code_hash = excluded.code_hash, expires_at = excluded.expires_at, attempts = 0`,
            [user.id, phoneHash, codeHash(user.id, code), expiresAt],
          );
        });
        // The raw number lives only in memory for this message (architecture §10.4).
        await deps.platform.sms.send({ to: body.phone, text: SMS_TEXT[user.locale](code) });
        return reply(202, { expires_at: expiresAt });
      },
      { noDefaultRateLimit: true },
    );

    mount(api, routes['phone.confirm'], ({ auth, body }) => {
      const user = userOf(auth);
      const at = now();
      const row = db.get<{ phone_hash: string; code_hash: string; expires_at: string; attempts: number }>('SELECT * FROM phone_verification WHERE user_id = ?', [user.id]);
      if (!row) throw new DomainError('CODE_INVALID');
      if (Date.parse(row.expires_at) <= at.getTime()) throw new DomainError('CODE_EXPIRED');
      if (row.attempts >= P.phone.code_attempts) throw new DomainError('TOO_MANY_ATTEMPTS');
      if (row.code_hash !== codeHash(user.id, body.code)) {
        // Counted outside any rolled-back transaction, so five wrong codes really end the code.
        db.run('UPDATE phone_verification SET attempts = attempts + 1 WHERE user_id = ?', [user.id]);
        throw new DomainError(row.attempts + 1 >= P.phone.code_attempts ? 'TOO_MANY_ATTEMPTS' : 'CODE_INVALID');
      }
      return db.transaction(() => {
        if (phoneInUse(db, user.id, row.phone_hash)) throw new DomainError('PHONE_IN_USE');
        db.run("UPDATE user SET phone_hash = ?, phone_line_type = 'mobile', phone_verified_at = ? WHERE id = ?", [row.phone_hash, at.toISOString(), user.id]);
        db.run('DELETE FROM phone_verification WHERE user_id = ?', [user.id]);
        if (isBlockedPhone(db, row.phone_hash, at.toISOString())) {
          deps.services.flags.raise(db, { code: 'H8', subject: { type: 'account', id: user.id }, sessionIds: [], evidence: { blocked_phone: true } });
        }
        return { verified: true as const };
      });
    });
  },
};
