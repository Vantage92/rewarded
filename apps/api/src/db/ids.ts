// Identifiers made by the server (architecture §3): ULIDs from the platform Clock and Random,
// and URL-safe random tokens. Never Math.random() or Date.now() directly.
import { createHash } from 'node:crypto';
import type { Clock, Random } from '../platform/types.ts';

const CROCKFORD = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

/** ULID (26 chars, Crockford base32): 48-bit time + 80 random bits. */
export function ulid(clock: Clock, random: Random): string {
  let time = clock.now().getTime();
  let out = '';
  for (let i = 0; i < 10; i++) {
    out = CROCKFORD[time % 32] + out;
    time = Math.floor(time / 32);
  }
  const bytes = random.bytes(10);
  let bits = 0;
  let value = 0;
  for (const b of bytes) {
    value = (value << 8) | b;
    bits += 8;
    while (bits >= 5) {
      out += CROCKFORD[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  return out;
}

/** Random token, base64url (`bytes` random bytes; 16 bytes = 128 bits). */
export function randomToken(random: Random, bytes = 32): string {
  return Buffer.from(random.bytes(bytes)).toString('base64url');
}

/** Six-digit code with a uniform distribution. */
export function sixDigitCode(random: Random): string {
  return String(random.int(1_000_000)).padStart(6, '0');
}

/** Plain SHA-256 (hex) for values that are already high-entropy (tokens, cookie values). */
export function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

/** Factory bound to a platform, so callers write `ids.ulid()`. */
export interface Ids {
  ulid(): string;
  token(bytes?: number): string;
}
export function idsFor(platform: { clock: Clock; random: Random }): Ids {
  return {
    ulid: () => ulid(platform.clock, platform.random),
    token: (bytes) => randomToken(platform.random, bytes),
  };
}
