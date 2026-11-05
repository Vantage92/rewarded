// Dev and test implementations. Never imported by server.prod.ts.
import type { Clock, MailMessage, Mailer, Peppers, Random, SmsMessage, SmsSender } from './types.ts';

/** Settable clock for dev and tests (POST /dev/clock arrives in WP-3). */
export class DevClock implements Clock {
  private offsetMs = 0;
  private fixed: Date | null;
  constructor(start?: Date) {
    this.fixed = start ? new Date(start) : null;
  }
  now(): Date {
    return this.fixed ? new Date(this.fixed) : new Date(Date.now() + this.offsetMs);
  }
  set(at: Date): void {
    this.fixed = new Date(at);
  }
  advance(ms: number): void {
    if (this.fixed) this.fixed = new Date(this.fixed.getTime() + ms);
    else this.offsetMs += ms;
  }
}

/** Deterministic PRNG (mulberry32) for tests and seeds. Not for secrets. */
export class SeededRandom implements Random {
  private state: number;
  constructor(seed: number) {
    this.state = seed >>> 0;
  }
  private next(): number {
    let t = (this.state = (this.state + 0x6d2b79f5) >>> 0);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  bytes(length: number): Uint8Array {
    return Uint8Array.from({ length }, () => Math.floor(this.next() * 256));
  }
  int(maxExclusive: number): number {
    return Math.floor(this.next() * maxExclusive);
  }
}

export type DevInboxMessage =
  | ({ channel: 'email'; at: string } & MailMessage)
  | ({ channel: 'sms'; at: string } & SmsMessage);

/** In-memory inbox for magic links, login codes and SMS codes (GET /dev/inbox arrives in WP-3). */
export class DevInbox {
  private messages: DevInboxMessage[] = [];
  private readonly clock: Clock;
  constructor(clock: Clock) {
    this.clock = clock;
  }
  push(message: MailMessage | SmsMessage, channel: 'email' | 'sms'): void {
    const at = this.clock.now().toISOString();
    this.messages.push(channel === 'email' ? { channel, at, ...(message as MailMessage) } : { channel, at, ...(message as SmsMessage) });
  }
  list(to?: string): DevInboxMessage[] {
    return this.messages.filter((m) => to === undefined || m.to === to);
  }
  clear(): void {
    this.messages = [];
  }
}

export class DevMailer implements Mailer {
  private readonly inbox: DevInbox;
  private readonly echo: boolean;
  constructor(inbox: DevInbox, echo = true) {
    this.inbox = inbox;
    this.echo = echo;
  }
  async send(message: MailMessage): Promise<void> {
    this.inbox.push(message, 'email');
    if (this.echo) console.info(`[dev-mail] to=${message.to} subject=${message.subject}\n${message.text}`);
  }
}

export class DevSmsSender implements SmsSender {
  private readonly inbox: DevInbox;
  private readonly echo: boolean;
  constructor(inbox: DevInbox, echo = true) {
    this.inbox = inbox;
    this.echo = echo;
  }
  async send(message: SmsMessage): Promise<void> {
    this.inbox.push(message, 'sms');
    if (this.echo) console.info(`[dev-sms] to=${message.to}\n${message.text}`);
  }
}

/** Fixed peppers for tests and for dev when no secrets file exists. Never valid in production. */
export const DEV_PEPPERS: Peppers = {
  pepper_ip: 'dev-pepper-ip-not-secret-000000000000',
  pepper_phone: 'dev-pepper-phone-not-secret-0000000000',
  pepper_audit: 'dev-pepper-audit-not-secret-0000000000',
};
