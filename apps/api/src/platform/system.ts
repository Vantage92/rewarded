import { createHmac, randomBytes, randomInt } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { JsonLineLogger, type Logger } from './log.ts';
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

/** Derives a secret from another one with a fixed label (for secrets files written before WP-3). */
export function deriveSecret(base: string, label: string): string {
  return createHmac('sha256', base).update(`rewarded:${label}:v1`).digest('base64url');
}

export class HmacHasher implements Hasher {
  private readonly peppers: Required<Peppers>;
  constructor(peppers: Peppers) {
    // pepper_email is separate (§10.9); older secrets files lack it, so it is derived from pepper_audit.
    this.peppers = {
      ...peppers,
      pepper_email: peppers.pepper_email ?? deriveSecret(peppers.pepper_audit, 'pepper_email'),
      // The institution anchor has its own pepper (§10.9); derived like pepper_email for older files.
      pepper_inst: peppers.pepper_inst ?? deriveSecret(peppers.pepper_audit, 'pepper_inst'),
    };
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

/** All secrets from the secrets directory (architecture §10.9). */
export interface Secrets {
  peppers: Peppers;
  /** Key (32 bytes, base64url) for the TOTP secrets in admin_mfa. */
  totpKey: string;
  /** Experiment seed (voorregistratie §9.2); null until the founder has placed it. */
  experimentSeed: string | null;
}

/**
 * Reads peppers.json plus the optional `totp_key` and `experiment_seed` fields. The TOTP key falls
 * back to a key derived from pepper_audit; a missing seed stays null (assignment is then provisional).
 */
export function loadSecrets(secretsDir: string): Secrets {
  const peppers = loadPeppers(secretsDir);
  const raw = JSON.parse(readFileSync(join(secretsDir, 'peppers.json'), 'utf8')) as Record<string, unknown>;
  const totpKey = typeof raw.totp_key === 'string' && raw.totp_key.length >= 32 ? raw.totp_key : deriveSecret(peppers.pepper_audit, 'totp_key');
  const experimentSeed = typeof raw.experiment_seed === 'string' && raw.experiment_seed.length >= 32 ? raw.experiment_seed : null;
  return { peppers, totpKey, experimentSeed };
}

/** Reads peppers written by tooling/scripts/peppers.ts. */
export function loadPeppers(secretsDir: string): Peppers {
  const data = JSON.parse(readFileSync(join(secretsDir, 'peppers.json'), 'utf8')) as Partial<Peppers>;
  for (const key of ['pepper_ip', 'pepper_phone', 'pepper_audit'] as const) {
    if (typeof data[key] !== 'string' || data[key].length < 32) throw new Error(`Missing or short ${key} in peppers.json`);
  }
  const out: Peppers = { pepper_ip: data.pepper_ip as string, pepper_phone: data.pepper_phone as string, pepper_audit: data.pepper_audit as string };
  if (typeof data.pepper_email === 'string' && data.pepper_email.length >= 32) out.pepper_email = data.pepper_email;
  if (typeof data.pepper_inst === 'string' && data.pepper_inst.length >= 32) out.pepper_inst = data.pepper_inst;
  return out;
}

/** Production logger: JSON lines on stdout with the field allowlist (architecture §10.9). */
export function stdoutLogger(clock: Clock): Logger {
  return new JsonLineLogger((line) => process.stdout.write(line + '\n'), () => clock.now());
}
