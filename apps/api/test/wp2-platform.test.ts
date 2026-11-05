// WP-2: Logger allowlist (arch §10.9), NetClassifier (arch §4.5) and the dev Beacon.
import { describe, expect, it } from 'vitest';
import { CidrNetClassifier, DevBeacon, DevNetClassifier, MemoryLogger, parseIp } from '../src/platform/ports.ts';

describe('Logger allowlist (arch §10.9)', () => {
  it('drops every field outside the allowlist, including birth date, phone and e-mail', () => {
    const log = new MemoryLogger();
    log.log('error', 'request_failed', {
      route: 'POST /onboarding',
      status: 422,
      duration_ms: 12.6,
      error_code: 'VALIDATION_FAILED',
      net_class: 'campus',
      body: { birth_date: '2008-03-14', phone: '+31612345678' },
      email: 'mila@example.org',
      ip: '192.0.2.1',
      user_ref: 'mila@example.org',
      stack: 'Error: bad +31612345678\n    at handler (app.ts:1:2)',
    });
    const text = log.text();
    for (const secret of ['2008-03-14', '+31612345678', 'mila@example.org', '192.0.2.1']) expect(text).not.toContain(secret);
    expect(log.lines[0]).toMatchObject({ level: 'error', msg: 'request_failed', route: 'POST /onboarding', status: 422, duration_ms: 13, net_class: 'campus' });
    expect(log.lines[0]?.stack).toBe('at handler (app.ts:1:2)');
  });

  it('refuses free-text messages and concrete paths with tokens or query strings', () => {
    const log = new MemoryLogger();
    log.log('info', 'Login for mila@example.org', { route: '/auth/confirm?token=abc' });
    expect(log.lines[0]?.msg).toBe('redacted_message');
    expect(log.lines[0]?.route).toBeUndefined();
  });
});

describe('NetClassifier (arch §4.5)', () => {
  it('parses IPv4 and IPv6', () => {
    expect(parseIp('192.0.2.1')).toEqual({ value: 0xc0000201n, bits: 32 });
    expect(parseIp('::ffff:192.0.2.1')).toEqual({ value: 0xc0000201n, bits: 32 });
    expect(parseIp('2001:db8::1')?.bits).toBe(128);
    expect(parseIp('::')?.value).toBe(0n);
    expect(parseIp('256.1.1.1')).toBeUndefined();
    expect(parseIp('1::2::3')).toBeUndefined();
    expect(parseIp('nonsense')).toBeUndefined();
  });

  it('classifies by longest prefix and falls back to other', () => {
    const c = new CidrNetClassifier([
      { cidr: '10.0.0.0/8', class: 'mobile_cgnat', source: 't', checked_at: '2026-11-05' },
      { cidr: '10.1.0.0/16', class: 'campus', source: 't', checked_at: '2026-11-05' },
    ]);
    expect(c.classify('10.1.2.3')).toBe('campus');
    expect(c.classify('10.2.2.3')).toBe('mobile_cgnat');
    expect(c.classify('11.0.0.1')).toBe('other');
    expect(c.classify('garbage')).toBe('other');
    expect(new DevNetClassifier().classify('2001:db8:ca::5')).toBe('campus');
    expect(new DevNetClassifier().classify('100.64.1.1')).toBe('mobile_cgnat');
    expect(() => new CidrNetClassifier([{ cidr: '10.0.0.0/33', class: 'campus', source: 't', checked_at: 'x' }])).toThrow(/Invalid CIDR/);
  });
});

describe('DevBeacon', () => {
  it('is deterministic per seed and round', async () => {
    const a = await new DevBeacon('s').roundAt(new Date('2026-12-01T00:00:30Z'));
    const b = await new DevBeacon('s').roundAt(new Date('2026-12-01T00:00:45Z'));
    expect(a).toEqual(b);
    expect(a.value).toMatch(/^[a-f0-9]{64}$/);
  });
});
