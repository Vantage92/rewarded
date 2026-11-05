import { describe, expect, it } from 'vitest';
import { DEV_PEPPERS, DevClock, DevInbox, DevMailer, DevSmsSender, SeededRandom } from '../src/platform/dev.ts';
import { HmacHasher } from '../src/platform/system.ts';

describe('dev platform', () => {
  it('DevClock can be set and advanced', () => {
    const clock = new DevClock(new Date('2026-11-05T03:55:00Z'));
    clock.advance(90 * 60_000);
    expect(clock.now().toISOString()).toBe('2026-11-05T05:25:00.000Z');
  });

  it('SeededRandom is deterministic', () => {
    const a = new SeededRandom(42);
    const b = new SeededRandom(42);
    expect([a.int(100), a.int(100), a.int(100)]).toEqual([b.int(100), b.int(100), b.int(100)]);
    expect(a.bytes(4)).toHaveLength(4);
  });

  it('mail and sms land in the dev inbox', async () => {
    const inbox = new DevInbox(new DevClock(new Date('2026-11-05T09:00:00Z')));
    await new DevMailer(inbox, false).send({ to: 'a@example.test', subject: 'Inloggen', text: 'code 123456' });
    await new DevSmsSender(inbox, false).send({ to: '+31600000000', text: 'code 654321' });
    expect(inbox.list('a@example.test')).toEqual([
      { channel: 'email', at: '2026-11-05T09:00:00.000Z', to: 'a@example.test', subject: 'Inloggen', text: 'code 123456' },
    ]);
    expect(inbox.list()).toHaveLength(2);
    inbox.clear();
    expect(inbox.list()).toEqual([]);
  });

  it('HmacHasher separates purposes', () => {
    const h = new HmacHasher(DEV_PEPPERS);
    expect(h.hash('ip', '192.0.2.1')).toMatch(/^[0-9a-f]{64}$/);
    expect(h.hash('ip', '192.0.2.1')).not.toBe(h.hash('phone', '192.0.2.1'));
  });
});
