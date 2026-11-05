// Log test of architecture §10.9: onboarding with a birth date, a phone number and an e-mail address,
// also with forced errors; no log line may contain them in any form, nor the raw IP.
import { describe, expect, it } from 'vitest';
import type { ApiModule } from '../../src/module.ts';
import { DRIVERS, Client, ONBOARDING, WP3_MODULES, lastLogin, seedInvite, wp3App } from './helpers.ts';

// Stand-in for POST /me/phone/start (WP-4): reads the number and fails, like a broken handler would.
const phoneProbe: ApiModule = {
  name: 'phone_probe',
  owner: 'test',
  register(api) {
    api.post('/me/phone/start', async (c) => {
      const { phone } = (await c.req.json()) as { phone: string };
      throw new Error(`could not send to ${phone}`);
    });
  },
};

describe.each(DRIVERS)('logging on %s (arch §10.9)', (driver) => {
  it('no birth date, phone number, e-mail address or IP in any log line', async () => {
    const t = wp3App(driver, { modules: [...WP3_MODULES, phoneProbe] });
    const ip = '203.0.113.77';
    const c = new Client(t, ip);
    const email = 'privacy.test+tag@example.nl';
    await c.post('/auth/magic-link', { email, locale: 'nl', invite_token: seedInvite(t) });
    await c.post('/auth/confirm', { token: lastLogin(t, email).token });
    // Forced errors first: malformed onboarding and under-16, then the real one.
    await c.post('/onboarding', { ...ONBOARDING, birth_date: '2004-02-29', unknown: email });
    await c.post('/onboarding', { ...ONBOARDING, birth_date: '2004-13-45' });
    await c.post('/onboarding', { ...ONBOARDING, birth_date: '2004-02-29' });
    await c.post('/me/phone/start', { phone: '+31612345678' });
    await c.post('/auth/code', { email, code: '123456' });
    // An unknown path carrying an address is logged as unmatched, never as the path itself.
    await c.get(`/nothing-here/${encodeURIComponent(email)}`);

    const text = t.logger.text();
    expect(t.logger.lines.length).toBeGreaterThan(5);
    for (const needle of ['2004-02-29', '29-02-2004', '20040229', '2004-13-45', '+31612345678', '0612345678', '612345678', email, 'privacy.test', ip, t.deps.platform.hasher.hash('ip', ip)]) {
      expect.soft(text.includes(needle) ? needle : '').toBe('');
    }
    // Only allowlisted fields reach a line.
    const allowed = new Set(['ts', 'level', 'msg', 'route', 'status', 'duration_ms', 'request_id', 'error_code', 'net_class', 'user_ref', 'stack']);
    for (const line of t.logger.lines) for (const k of Object.keys(line)) expect(allowed.has(k) ? '' : k).toBe('');
    // The forced error is logged as a stack without its message; routes are patterns.
    const err = t.logger.lines.find((l) => l.msg === 'unhandled_error');
    expect(err?.stack).toMatch(/^at /);
    expect(t.logger.lines.some((l) => l.route === 'POST /api/v1/auth/confirm' && l.status === 200)).toBe(true);
    expect(t.logger.lines.every((l) => !l.route || !l.route.includes('?'))).toBe(true);
    expect(t.logger.lines.some((l) => l.error_code === 'VALIDATION_FAILED')).toBe(true);
    expect(t.logger.lines.some((l) => l.route === 'GET /unmatched' && l.status === 404)).toBe(true);
  });
});
