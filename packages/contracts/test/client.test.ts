import { describe, expect, expectTypeOf, it } from 'vitest';
import { ApiClientError, createApiClient, createMockApiClient, exampleId, mockError, type FetchLike } from '../src/index.ts';

type Seen = { url: string; init: Parameters<FetchLike>[1] };
function fakeFetch(status: number, body: unknown, seen: Seen[]): FetchLike {
  return async (url, init) => {
    seen.push({ url, init });
    return { status, ok: status < 400, text: async () => (body === undefined ? '' : typeof body === 'string' ? body : JSON.stringify(body)) };
  };
}

describe('typed API client (architecture §8.1)', () => {
  it('builds the URL, sends CSRF and Idempotency-Key, and validates the response', async () => {
    const seen: Seen[] = [];
    const res = { session_id: exampleId(30), nonce: 'n0nce-AAAAAAAAAAAAAAAA', server_start_at: '2026-12-02T09:00:00.000Z', planned_end_at: '2026-12-02T09:25:00.000Z', heartbeat_s: 30 };
    const api = createApiClient({ fetch: fakeFetch(201, res, seen), csrfToken: () => 'csrf-1' });
    const out = await api.call('sessions.start', {
      body: { planned_min: 25, device_id: exampleId(40), practice: false, client_ts: 1, mono_ms: 1, webdriver: false, standalone: true },
      idempotencyKey: 'k1',
    });
    expectTypeOf(out.heartbeat_s).toEqualTypeOf<30>();
    expect(out.session_id).toBe(exampleId(30));
    expect(seen[0]?.url).toBe('/api/v1/sessions');
    expect(seen[0]?.init.headers).toMatchObject({ 'X-CSRF-Token': 'csrf-1', 'Idempotency-Key': 'k1', 'Content-Type': 'application/json' });
  });

  it('substitutes path params and query strings; GET carries no CSRF header', async () => {
    const seen: Seen[] = [];
    const api = createApiClient({ fetch: fakeFetch(200, { items: [], next_cursor: null }, seen), csrfToken: () => 'csrf-1' });
    await api.call('sessions.list', { query: { from: '2026-12-01', limit: 10 } });
    expect(seen[0]?.url).toBe('/api/v1/sessions?from=2026-12-01&limit=10');
    expect(seen[0]?.init.headers['X-CSRF-Token']).toBeUndefined();
  });

  it('turns an error body into ApiClientError with code and message key', async () => {
    const api = createApiClient({ fetch: fakeFetch(409, { error: { code: 'WEEKLY_CAP', message_key: 'errors.redemptions.weekly_cap' } }, []) });
    const err = await api.call('redemptions.create', { body: { reward_id: exampleId(60) }, idempotencyKey: 'r1' }).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ApiClientError);
    expect((err as ApiClientError).is('WEEKLY_CAP')).toBe(true);
    expect((err as ApiClientError).messageKey).toBe('errors.redemptions.weekly_cap');
  });

  it('refuses a response with unknown fields', async () => {
    const api = createApiClient({ fetch: fakeFetch(200, { available: 1, pending: 0, referral_unvested: 0, earn_in_min: 0, earn_in_required: 300, secret: 1 }, []) });
    await expect(api.call('points.balance')).rejects.toThrow();
  });

  it('returns undefined for 204 routes', async () => {
    const api = createApiClient({ fetch: fakeFetch(204, undefined, []) });
    await expect(api.call('auth.logout')).resolves.toBeUndefined();
  });

  it('is typed per route (compile-time checks)', () => {
    const api = createMockApiClient();
    // @ts-expect-error body is required for sessions.start
    void api.call('sessions.start', { idempotencyKey: 'x' }).catch(() => undefined);
    // @ts-expect-error unknown route id
    void api.call('sessions.nope').catch(() => undefined);
    expect(true).toBe(true);
  });
});

describe('mock API client', () => {
  it('answers from the examples and validates requests', async () => {
    const api = createMockApiClient();
    const me = await api.call('me.get');
    expect(me.flags.draws).toBe(false);
    const bad = await api.call('me.settings', { body: { compare_opt_in: true, hacker: 1 } as never }).catch((e: unknown) => e);
    expect((bad as ApiClientError).code).toBe('VALIDATION_FAILED');
    expect(api.calls.map((c) => c.id)).toEqual(['me.get', 'me.settings']);
  });

  it('uses handlers, maps mockError to the contract error and checks responses', async () => {
    const api = createMockApiClient({ 'redemptions.create': () => { throw mockError('OUT_OF_STOCK'); } });
    const err = await api.call('redemptions.create', { body: { reward_id: exampleId(60) }, idempotencyKey: 'k' }).catch((e: unknown) => e);
    expect(err).toMatchObject({ status: 409, code: 'OUT_OF_STOCK', messageKey: 'errors.redemptions.out_of_stock' });
    api.on('points.balance', () => ({ available: -5, pending: 0, referral_unvested: 0, earn_in_min: 0, earn_in_required: 300 }));
    expect((await api.call('points.balance')).available).toBe(-5);
    const missingKey = await api.call('redemptions.create', { body: { reward_id: exampleId(60) } } as never).catch((e: unknown) => e);
    expect((missingKey as ApiClientError).code).toBe('VALIDATION_FAILED');
    await expect(api.call('admin.audit')).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });
});
