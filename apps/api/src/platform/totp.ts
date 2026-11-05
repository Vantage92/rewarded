// TOTP for admins (architecture §10.8): RFC 6238 with HMAC-SHA1, six digits, 30-second steps,
// built on node:crypto and testable offline with a fake Clock. Secrets are stored encrypted
// (AES-256-GCM) with a key from the secrets directory (§10.9), never in plain text.
import { createCipheriv, createDecipheriv, createHash, createHmac, timingSafeEqual } from 'node:crypto';
import type { Random } from './types.ts';

export const TOTP_STEP_S = 30;
export const TOTP_DIGITS = 6;
/** Accepted clock drift in steps on either side. */
export const TOTP_WINDOW = 1;

const B32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

export function base32Encode(bytes: Uint8Array): string {
  let bits = 0;
  let value = 0;
  let out = '';
  for (const b of bytes) {
    value = (value << 8) | b;
    bits += 8;
    while (bits >= 5) {
      out += B32[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) out += B32[(value << (5 - bits)) & 31];
  return out;
}

export function base32Decode(text: string): Uint8Array {
  const clean = text.replace(/=+$/, '').toUpperCase();
  const out: number[] = [];
  let bits = 0;
  let value = 0;
  for (const ch of clean) {
    const idx = B32.indexOf(ch);
    if (idx < 0) throw new Error('Invalid base32');
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Uint8Array.from(out);
}

/** HOTP value (RFC 4226) for a counter. */
export function hotp(secret: Uint8Array, counter: number): string {
  const msg = Buffer.alloc(8);
  msg.writeBigUInt64BE(BigInt(counter));
  const mac = createHmac('sha1', secret).update(msg).digest();
  const offset = mac[mac.length - 1]! & 0x0f;
  const bin = ((mac[offset]! & 0x7f) << 24) | (mac[offset + 1]! << 16) | (mac[offset + 2]! << 8) | mac[offset + 3]!;
  return String(bin % 10 ** TOTP_DIGITS).padStart(TOTP_DIGITS, '0');
}

export function totpStep(now: Date): number {
  return Math.floor(now.getTime() / 1000 / TOTP_STEP_S);
}

export function totpAt(secret: Uint8Array, now: Date): string {
  return hotp(secret, totpStep(now));
}

/**
 * Verifies a code within the drift window. Returns the matched step, or null. A step at or below
 * `lastUsedStep` is refused, so the same code cannot be used twice (admin_mfa.last_used_step).
 */
export function verifyTotp(secret: Uint8Array, code: string, now: Date, lastUsedStep: number | null): number | null {
  if (!/^\d{6}$/.test(code)) return null;
  const current = totpStep(now);
  for (let d = -TOTP_WINDOW; d <= TOTP_WINDOW; d++) {
    const step = current + d;
    if (lastUsedStep !== null && step <= lastUsedStep) continue;
    const expected = Buffer.from(hotp(secret, step));
    if (timingSafeEqual(expected, Buffer.from(code))) return step;
  }
  return null;
}

/** 20 random bytes, as RFC 4226 recommends. */
export function newTotpSecret(random: Random): Uint8Array {
  return random.bytes(20);
}

/** otpauth URI for the QR code of the authenticator app. */
export function otpauthUri(secret: Uint8Array, account: string, issuer = 'Rewarded'): string {
  const label = encodeURIComponent(`${issuer}:${account}`);
  return `otpauth://totp/${label}?secret=${base32Encode(secret)}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=${TOTP_DIGITS}&period=${TOTP_STEP_S}`;
}

function keyBytes(key: string): Buffer {
  return createHash('sha256').update(key).digest();
}

/** Encrypts a TOTP secret as `v1.<iv>.<tag>.<ciphertext>` (base64url). */
export function encryptSecret(secret: Uint8Array, key: string, random: Random): string {
  const iv = Buffer.from(random.bytes(12));
  const cipher = createCipheriv('aes-256-gcm', keyBytes(key), iv);
  const ct = Buffer.concat([cipher.update(secret), cipher.final()]);
  return ['v1', iv.toString('base64url'), cipher.getAuthTag().toString('base64url'), ct.toString('base64url')].join('.');
}

export function decryptSecret(enc: string, key: string): Uint8Array {
  const [v, iv, tag, ct] = enc.split('.');
  if (v !== 'v1' || !iv || !tag || !ct) throw new Error('Unknown secret format');
  const decipher = createDecipheriv('aes-256-gcm', keyBytes(key), Buffer.from(iv, 'base64url'));
  decipher.setAuthTag(Buffer.from(tag, 'base64url'));
  return new Uint8Array(Buffer.concat([decipher.update(Buffer.from(ct, 'base64url')), decipher.final()]));
}
