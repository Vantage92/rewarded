// Test harness for WP-8: a fake platform (visibility, network, Wake Lock, tab lock, memory storage)
// and a mock API client backed by the protocol fake in e2e/focus/fake-api.ts. Time runs with Vitest's
// fake timers (setTimeout, Date and performance.now); `advance()` moves server and browser together.
import { createMockApiClient, mockError, type MockApiClient, type MockHandlers } from '@rewarded/contracts/mock';
import { ROUTE_IDS, type RouteId } from '@rewarded/contracts/routes';
import { vi } from 'vitest';
import { FakeApi, FakeApiError, type FakeApiOptions } from '../../../e2e/focus/fake-api.ts';
import type { Platform } from '../src/platform/index.ts';
import { systemClock, systemTimers } from '../src/platform/clock.ts';
import { createMemoryStore, type KvStore } from '../src/platform/storage.ts';
import type { TabLock, TabMessage } from '../src/platform/tabLock.ts';
import type { PageSignal, PageSignalKind, Visibility } from '../src/platform/visibility.ts';
import { createWakeLock, type WakeLockApi, type WakeLockSentinelLike } from '../src/platform/wakelock.ts';
import { SessionStore } from '../src/features/focus/session/store.ts';

export class FakeVisibility {
  state: Visibility = 'visible';
  private listeners = new Set<(s: PageSignal) => void>();
  current = () => this.state;
  subscribe = (l: (s: PageSignal) => void) => {
    this.listeners.add(l);
    return () => this.listeners.delete(l);
  };
  emit(kind: PageSignalKind, persisted?: boolean): void {
    if (kind === 'hidden' || kind === 'visible') this.state = kind;
    const s: PageSignal = { kind, mono: performance.now(), wall: Date.now(), ...(persisted === undefined ? {} : { persisted }) };
    for (const l of [...this.listeners]) l(s);
  }
}

export class FakeNetwork {
  up = true;
  private listeners = new Set<(online: boolean) => void>();
  online = () => this.up;
  subscribe = (l: (online: boolean) => void) => {
    this.listeners.add(l);
    return () => this.listeners.delete(l);
  };
  set(online: boolean): void {
    this.up = online;
    for (const l of [...this.listeners]) l(online);
  }
}

export class FakeTabLock implements TabLock {
  heldByOther = false;
  private mine = false;
  private listeners = new Set<(m: TabMessage) => void>();
  acquire = async () => {
    if (this.heldByOther) return false;
    this.mine = true;
    return true;
  };
  release = () => {
    this.mine = false;
  };
  owned = () => this.mine;
  heldElsewhere = async () => this.heldByOther;
  subscribe = (l: (m: TabMessage) => void) => {
    this.listeners.add(l);
    return () => this.listeners.delete(l);
  };
  broadcast(m: TabMessage): void {
    for (const l of [...this.listeners]) l(m);
  }
}

export class FakeWakeLockApi implements WakeLockApi {
  mode: 'grant' | 'deny' = 'grant';
  requests = 0;
  sentinel: (WakeLockSentinelLike & { fire(): void }) | null = null;
  async request(): Promise<WakeLockSentinelLike> {
    this.requests++;
    if (this.mode === 'deny') throw new Error('denied');
    const listeners: (() => void)[] = [];
    const s = {
      released: false,
      async release() {
        s.fire();
      },
      addEventListener(_t: 'release', l: () => void) {
        listeners.push(l);
      },
      fire() {
        if (s.released) return;
        s.released = true;
        for (const l of listeners) l();
      },
    };
    this.sentinel = s;
    return s;
  }
}

export interface Harness {
  fake: FakeApi;
  api: MockApiClient;
  platform: Platform;
  visibility: FakeVisibility;
  network: FakeNetwork;
  tabLock: FakeTabLock;
  wakeApi: FakeWakeLockApi;
  kv: KvStore;
  beacons: { id: string; body: unknown }[];
  store: SessionStore;
  /** Drop the answer of the next n calls to a route after the server processed them (§4.7 E2E). */
  dropNext(id: RouteId, n?: number): void;
  /** Moves browser and server time together, in steps of `step` ms. */
  advance(ms: number, step?: number): Promise<void>;
  newStore(): SessionStore;
}

export function makeHarness(opts: FakeApiOptions & { kv?: KvStore; fake?: FakeApi } = {}): Harness {
  const fake = opts.fake ?? new FakeApi(opts);
  const drops = new Map<RouteId, number>();
  const visibility = new FakeVisibility();
  const network = new FakeNetwork();
  const tabLock = new FakeTabLock();
  const wakeApi = new FakeWakeLockApi();
  const kv = opts.kv ?? createMemoryStore();
  const beacons: { id: string; body: unknown }[] = [];
  const handlers: MockHandlers = {};
  for (const id of ROUTE_IDS) {
    (handlers as Record<string, unknown>)[id] = (input: { params: Record<string, unknown>; query: Record<string, unknown>; body: unknown; idempotencyKey: string | undefined }) => {
      // Offline: the request never reaches the server.
      if (!network.up) throw new TypeError('Failed to fetch');
      let out: unknown;
      try {
        out = fake.handle(id, { params: input.params as Record<string, string>, query: input.query, body: input.body, idempotencyKey: input.idempotencyKey });
      } catch (e) {
        if (e instanceof FakeApiError) throw mockError(e.code, e.details);
        throw e;
      }
      const left = drops.get(id) ?? 0;
      if (left > 0) {
        drops.set(id, left - 1);
        throw new TypeError('connection reset');
      }
      return out;
    };
  }
  const api = createMockApiClient(handlers, { useExamples: false });
  const platform: Platform = {
    clock: systemClock,
    timers: systemTimers,
    visibility,
    wakeLock: createWakeLock({ api: () => wakeApi, isVisible: () => visibility.state === 'visible', timers: systemTimers }),
    network,
    tabLock,
    kv,
    signal: { unlock: () => undefined, play: async () => ({ played: true, vibrated: false }) },
    device: () => ({ uaClass: 'android_chrome', standalone: false, webdriver: false }),
    navigationType: () => 'reload',
    beacon: (id, body) => {
      beacons.push({ id, body });
      return true;
    },
    guardUnload: () => undefined,
  };
  const newStore = () => new SessionStore({ api, platform });
  const h: Harness = {
    fake,
    api,
    platform,
    visibility,
    network,
    tabLock,
    wakeApi,
    kv,
    beacons,
    store: newStore(),
    dropNext(id, n = 1) {
      drops.set(id, n);
    },
    async advance(ms, step = 1000) {
      let left = ms;
      while (left > 0) {
        const d = Math.min(step, left);
        fake.advance(d);
        await vi.advanceTimersByTimeAsync(d);
        left -= d;
      }
    },
    newStore,
  };
  return h;
}

export function useFakeTime(start = Date.parse('2026-12-02T09:00:00.000Z')): void {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'Date', 'performance'], now: start });
}

/** Lets pending promises settle without moving time. */
export async function flush(): Promise<void> {
  await vi.advanceTimersByTimeAsync(0);
  for (let i = 0; i < 5; i++) await Promise.resolve();
}
