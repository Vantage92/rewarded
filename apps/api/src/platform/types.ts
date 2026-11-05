import type { Logger } from './log.ts';
import type { NetClassifier } from './net.ts';

// Platform interfaces (architecture §12.2). Production implementations live in system.ts,
// dev/test implementations in dev.ts, which only server.dev.ts and tests import.

export interface Clock {
  /** Server wall-clock time. Never use Date.now() directly in API code. */
  now(): Date;
}

export interface Random {
  bytes(length: number): Uint8Array;
  /** Uniform integer in [0, maxExclusive). */
  int(maxExclusive: number): number;
}

export interface MailMessage {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export interface Mailer {
  send(message: MailMessage): Promise<void>;
}

export interface SmsMessage {
  to: string;
  text: string;
}

/** Line type of a phone number (architecture §10.4: only mobile numbers are accepted). */
export type PhoneLineType = 'mobile' | 'landline' | 'voip' | 'unknown';

export interface SmsSender {
  send(message: SmsMessage): Promise<void>;
  /** Number type check of the SMS processor (architecture §12.2); optional for older fakes. */
  lookupLineType?(e164: string): Promise<PhoneLineType>;
}

/** Purposes match the separate peppers in architecture §10.9 (`email` for email_norm_hash, §10.4). */
export type HashPurpose = 'ip' | 'phone' | 'audit' | 'email';

export interface Hasher {
  /** Keyed hash (HMAC-SHA256, hex) with the pepper for this purpose. */
  hash(purpose: HashPurpose, value: string): string;
}

/** `pepper_email` is optional for secrets files written before WP-3; see HmacHasher. */
export type Peppers = Record<'pepper_ip' | 'pepper_phone' | 'pepper_audit', string> & { pepper_email?: string };

export interface Platform {
  clock: Clock;
  random: Random;
  mailer: Mailer;
  sms: SmsSender;
  hasher: Hasher;
  /** Allowlist logger (architecture §10.9); createApp falls back to a stdout JSON logger. */
  logger?: Logger;
  /** Net class from the raw IP, in memory only (architecture §4.5); falls back to `other`. */
  net?: NetClassifier;
}
