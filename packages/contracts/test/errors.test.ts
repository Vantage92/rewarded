import { describe, expect, it } from 'vitest';
import { API_MODULES, ApiErrorBodySchema, ERROR_CODES, ERROR_CODE_LIST, errorBody, messageKey, routes, ROUTE_IDS, type ErrorCode } from '../src/index.ts';
import { SECTION_8_3_CODES } from './endpoints.ts';

describe('error codes (architecture §8.1, §8.3, §12.3)', () => {
  it('§8.3: the catalogue holds exactly the codes of the table', () => {
    const fromDoc = Object.values(SECTION_8_3_CODES).flat();
    expect(new Set(fromDoc).size).toBe(fromDoc.length);
    // CODE_INVALID is used in §8.2 (auth code, phone, institution mail, club code) but missing from §8.3.
    expect([...ERROR_CODE_LIST].sort()).toEqual([...fromDoc, 'CODE_INVALID'].sort());
  });

  it('§8.3: each code has the HTTP status of its row', () => {
    const allowed: Record<string, number[]> = { '400/422': [400, 422], '401': [401], '403': [403], '404': [404], '409': [409], '410': [410], '429': [429], '500/503': [500, 503] };
    for (const [row, codes] of Object.entries(SECTION_8_3_CODES))
      for (const code of codes) expect(allowed[row], code).toContain(ERROR_CODES[code as ErrorCode].http);
  });

  it('§12.3: every code has one owning module and a message key in that namespace', () => {
    for (const code of ERROR_CODE_LIST) {
      const mod = ERROR_CODES[code].module;
      expect(API_MODULES).toContain(mod);
      expect(messageKey(code)).toBe(`errors.${mod}.${code.toLowerCase()}`);
    }
    expect(messageKey('WEEKLY_CAP')).toBe('errors.redemptions.weekly_cap');
    expect(messageKey('INTERNAL')).toBe('errors.common.internal');
  });

  it('§12.3: the shared codes of WP-3 live in errors/common', () => {
    for (const code of ['VALIDATION_FAILED', 'RATE_LIMITED', 'AUTH_REQUIRED', 'INTERNAL'] as const) expect(ERROR_CODES[code].module).toBe('common');
  });

  it('§8.2: every code except the middleware ones is used by at least one route', () => {
    const used = new Set(ROUTE_IDS.flatMap((id) => routes[id].errors as readonly string[]));
    const middleware = ['AUTH_REQUIRED', 'FORBIDDEN', 'CSRF_INVALID', 'INTERNAL', 'MAINTENANCE', 'MFA_REQUIRED', 'ACCOUNT_BLOCKED'];
    const unused = ERROR_CODE_LIST.filter((c) => !used.has(c) && !middleware.includes(c));
    expect(unused).toEqual([]);
  });

  it('§8.1: the error body has one shape', () => {
    expect(ApiErrorBodySchema.safeParse(errorBody('WEEKLY_CAP', { next_redeem_from: '2026-12-07T03:00:00.000Z' })).success).toBe(true);
    expect(ApiErrorBodySchema.safeParse({ error: { code: 'X', message_key: 'free text' } }).success).toBe(false);
    expect(ApiErrorBodySchema.safeParse({ error: { code: 'WEEKLY_CAP', message_key: 'errors.redemptions.weekly_cap', extra: 1 } }).success).toBe(false);
  });
});
