// WP-8 platform adapters (architecture §9.5): transport with repeats, outbox, Wake Lock, test hooks.
import { ApiClientError } from '@rewarded/contracts/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { systemTimers } from '../src/platform/clock.ts';
import { uaClass } from '../src/platform/device.ts';
import { mergeItems, Outbox, type OutboxItem } from '../src/platform/outbox.ts';
import { createMemoryStore } from '../src/platform/storage.ts';
import { installTestHooks } from '../src/platform/testHooks.ts';
import { isNetworkError, retry, RetryCancelled, uuid } from '../src/platform/transport.ts';
import { createWakeLock } from '../src/platform/wakelock.ts';
import { FakeWakeLockApi } from './wp8-helpers.ts';

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date', 'performance'] });
});
afterEach(() => {
  vi.useRealTimers();
});

const ev = (n: number): OutboxItem => ({ type: 'visibility', ev_seq: n, kind: 'blur', mono_ms: n * 1000, client_ts: 1_700_000_000_000 + n });

describe('transport (architecture §4.7 "Wat de client doet")', () => {
  it('§4.7: repeats after 1, 2, 4, 8 s and then every 10 s; offline after three failures', async () => {
    const at: number[] = [];
    let offline = 0;
    const handle = retry(
      async () => {
        at.push(Date.now());
        if (at.length < 7) throw new TypeError('Failed to fetch');
        return 'ok';
      },
      systemTimers,
      { onOffline: () => offline++ },
    );
    await vi.advanceTimersByTimeAsync(60_000);
    expect(await handle.promise).toBe('ok');
    const gaps = at.slice(1).map((t, i) => t - at[i]!);
    expect(gaps).toEqual([1000, 2000, 4000, 8000, 10_000, 10_000]);
    expect(offline).toBe(1);
  });

  it('an API error is a definitive answer: no repeat', async () => {
    const attempt = vi.fn<() => Promise<never>>(async () => {
      throw new ApiClientError(409, { code: 'SESSION_CLOSED', message_key: 'errors.sessions.session_closed' });
    });
    const handle = retry(attempt, systemTimers);
    await expect(handle.promise).rejects.toBeInstanceOf(ApiClientError);
    await vi.advanceTimersByTimeAsync(30_000);
    expect(attempt).toHaveBeenCalledTimes(1);
  });

  it('RATE_LIMITED is repeated; kick() retries at once; cancel() stops', async () => {
    let n = 0;
    const handle = retry(async () => {
      n++;
      throw new ApiClientError(429, { code: 'RATE_LIMITED', message_key: 'errors.common.rate_limited' });
    }, systemTimers);
    await vi.advanceTimersByTimeAsync(0);
    expect(n).toBe(1);
    handle.kick();
    await vi.advanceTimersByTimeAsync(0);
    expect(n).toBe(2);
    handle.cancel();
    await expect(handle.promise).rejects.toBeInstanceOf(RetryCancelled);
    await vi.advanceTimersByTimeAsync(60_000);
    expect(n).toBe(2);
  });

  it('network errors are told apart from API errors; keys are UUIDs', () => {
    expect(isNetworkError(new TypeError('x'))).toBe(true);
    expect(isNetworkError(new ApiClientError(400, { code: 'VALIDATION_FAILED', message_key: 'x' }))).toBe(false);
    expect(uuid()).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });
});

describe('outbox (architecture §9.3)', () => {
  it('keeps items in order per session across a reload and removes exactly what was confirmed', async () => {
    const kv = createMemoryStore();
    const box = new Outbox(kv, 'S1');
    box.append(ev(1));
    box.append(ev(2));
    box.append({ type: 'heartbeat', seq: 1, mono_ms: 30_000, client_ts: 1, visibility: 'visible', wakelock: 'acquired', last_nonce: 'n'.repeat(16) });
    await box.flushed();
    const again = await Outbox.load(kv, 'S1');
    expect(again.pending().map((i) => i.type)).toEqual(['visibility', 'visibility', 'heartbeat']);
    again.ack([ev(1)]);
    await again.flushed();
    expect((await Outbox.load(kv, 'S1')).size).toBe(2);
    expect((await Outbox.load(kv, 'S2')).size).toBe(0);
    expect(mergeItems([ev(1), ev(2)], [ev(2), ev(3)]).map((i) => (i as { ev_seq: number }).ev_seq)).toEqual([1, 2, 3]);
  });
});

describe('Wake Lock (spec §4.1, architecture §9.5)', () => {
  it('reports acquired, released and denied; retries once per 10 s after a release while visible', async () => {
    const api = new FakeWakeLockApi();
    let visible = true;
    const wl = createWakeLock({ api: () => api, isVisible: () => visible, timers: systemTimers });
    const seen: string[] = [];
    wl.subscribe((s) => seen.push(s));
    await wl.request();
    api.sentinel!.fire();
    visible = false;
    await vi.advanceTimersByTimeAsync(10_000);
    expect(api.requests).toBe(1);
    visible = true;
    await vi.advanceTimersByTimeAsync(10_000);
    expect(api.requests).toBe(2);
    await wl.release();
    api.mode = 'deny';
    await wl.request();
    expect(seen).toEqual(['acquired', 'released', 'acquired', 'idle', 'denied']);
  });

  it('without the API the status is unsupported', async () => {
    const wl = createWakeLock({ api: () => undefined, isVisible: () => true, timers: systemTimers });
    expect(wl.supported).toBe(false);
    expect(await wl.request()).toBe('unsupported');
  });
});

describe('test hooks (architecture §11)', () => {
  it('setVisibility overrides document.visibilityState and fires a real visibilitychange; the fake Wake Lock obeys', async () => {
    const hooks = installTestHooks();
    const seen: string[] = [];
    const on = () => seen.push(document.visibilityState);
    document.addEventListener('visibilitychange', on);
    hooks.setVisibility('hidden');
    hooks.setVisibility('visible');
    document.removeEventListener('visibilitychange', on);
    expect(seen).toEqual(['hidden', 'visible']);
    const wl = (navigator as Navigator & { wakeLock: { request(t: 'screen'): Promise<{ released: boolean }> } }).wakeLock;
    const s = await wl.request('screen');
    expect(hooks.wakeLock.state()).toBe('held');
    hooks.wakeLock.release();
    expect(s.released).toBe(true);
    hooks.wakeLock.setMode('deny');
    await expect(wl.request('screen')).rejects.toBeTruthy();
  });
});

describe('device facts (architecture §4.2, §10.4)', () => {
  it('maps user agents to the contract classes', () => {
    expect(uaClass('Mozilla/5.0 (iPhone; CPU iPhone OS 18_4 like Mac OS X) AppleWebKit/605.1.15 Version/18.4 Mobile/15E148 Safari/604.1')).toBe('ios_safari');
    expect(uaClass('Mozilla/5.0 (iPhone; CPU iPhone OS 18_4 like Mac OS X) AppleWebKit/605.1.15 Instagram 300.0')).toBe('ios_webview');
    expect(uaClass('Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 Chrome/130.0 Mobile Safari/537.36')).toBe('android_chrome');
    expect(uaClass('Mozilla/5.0 (Linux; Android 14; wv) AppleWebKit/537.36 Chrome/130.0 Mobile Safari/537.36; wv)')).toBe('android_webview');
    expect(uaClass('Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/605.1.15 Safari/605.1.15')).toBe('desktop');
  });
});
