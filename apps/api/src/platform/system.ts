import { createHmac, randomBytes, randomInt } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Clock, Hasher, HashPurpose, Mailer, Peppers, Random, SmsSender } from './types.ts';

/** Production clock: no setter, by design (architecture §10.3). */
export class SystemClock implements Clock {
  now(): Date {
    return new Date();
  }
}

export class CryptoRandom implements Random {
  bytes(length: number): Uint8Array {
    return new Uint8Array(randomBytes(length));
  }
  int(maxExclusive: number): number {
    return randomInt(maxExclusive);
  }
}

export class HmacHasher implements Hasher {
  private readonly peppers: Peppers;
  constructor(peppers: Peppers) {
    this.peppers = peppers;
  }
  hash(purpose: HashPurpose, value: string): string {
    return createHmac('sha256', this.peppers[`pepper_${purpose}`]).update(value).digest('hex');
  }
}

/** Placeholder until a mail provider is chosen (open question 1); fails loudly instead of logging addresses. */
export class UnconfiguredMailer implements Mailer {
  async send(): Promise<void> {
    throw new Error('No production mailer configured');
  }
}

export class UnconfiguredSmsSender implements SmsSender {
  async send(): Promise<void> {
    throw new Error('No production SMS sender configured');
  }
}

/** Reads peppers written by tooling/scripts/peppers.ts. */
export function loadPeppers(secretsDir: string): Peppers {
  const data = JSON.parse(readFileSync(join(secretsDir, 'peppers.json'), 'utf8')) as Partial<Peppers>;
  for (const key of ['pepper_ip', 'pepper_phone', 'pepper_audit'] as const) {
    if (typeof data[key] !== 'string' || data[key].length < 32) throw new Error(`Missing or short ${key} in peppers.json`);
  }
  return data as Peppers;
}
