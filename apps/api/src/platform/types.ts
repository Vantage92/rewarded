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

export interface SmsSender {
  send(message: SmsMessage): Promise<void>;
}

/** Purposes match the separate peppers in architecture §10.9. */
export type HashPurpose = 'ip' | 'phone' | 'audit';

export interface Hasher {
  /** Keyed hash (HMAC-SHA256, hex) with the pepper for this purpose. */
  hash(purpose: HashPurpose, value: string): string;
}

export type Peppers = Record<`pepper_${HashPurpose}`, string>;

export interface Platform {
  clock: Clock;
  random: Random;
  mailer: Mailer;
  sms: SmsSender;
  hasher: Hasher;
}
