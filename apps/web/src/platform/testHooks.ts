// Test hooks (architecture §11): in test mode the app installs `window.__rwTest`, so Playwright can
// simulate visibility and Wake Lock without bypassing the production code paths:
//   __rwTest.setVisibility('hidden' | 'visible')  overrides document.visibilityState and fires a
//                                                  real visibilitychange event
//   __rwTest.wakeLock.setMode('grant' | 'deny' | 'unsupported')
//   __rwTest.wakeLock.release()                    fires `release` on the held sentinel
//   __rwTest.wakeLock.state()                      'held' | 'released' | 'none'
// Test mode needs a dev or test build (never the production bundle) and the flag
// `window.__RW_TEST__ = true`, set by an init script before the app loads.
import type { WakeLockApi, WakeLockSentinelLike } from './wakelock.ts';

export type FakeWakeLockMode = 'grant' | 'deny' | 'unsupported';

export interface RwTestApi {
  setVisibility(v: 'visible' | 'hidden'): void;
  wakeLock: {
    setMode(mode: FakeWakeLockMode): void;
    release(): void;
    state(): 'held' | 'released' | 'none';
    requests(): number;
  };
  /** Snapshot of the session store, set by the focus feature. */
  session?: () => unknown;
}

declare global {
  interface Window {
    __rwTest?: RwTestApi;
    __RW_TEST__?: boolean;
  }
}

/** Whether this build and page run in test mode. */
export function testModeEnabled(): boolean {
  const buildAllows = import.meta.env.DEV || import.meta.env.VITE_TEST_HOOKS === '1';
  if (!buildAllows || typeof window === 'undefined') return false;
  return window.__RW_TEST__ === true;
}

class FakeSentinel implements WakeLockSentinelLike {
  released = false;
  private listeners: (() => void)[] = [];
  addEventListener(_type: 'release', listener: () => void): void {
    this.listeners.push(listener);
  }
  async release(): Promise<void> {
    this.fire();
  }
  fire(): void {
    if (this.released) return;
    this.released = true;
    for (const l of this.listeners) l();
  }
}

/** Installs the hooks once; returns the API (also on window.__rwTest). */
export function installTestHooks(win: Window = window, doc: Document = document): RwTestApi {
  if (win.__rwTest) return win.__rwTest;
  let visibility: 'visible' | 'hidden' = doc.visibilityState === 'hidden' ? 'hidden' : 'visible';
  Object.defineProperty(doc, 'visibilityState', { configurable: true, get: () => visibility });
  Object.defineProperty(doc, 'hidden', { configurable: true, get: () => visibility === 'hidden' });

  let mode: FakeWakeLockMode = 'grant';
  let sentinel: FakeSentinel | null = null;
  let requests = 0;
  const fake: WakeLockApi = {
    async request() {
      requests++;
      if (mode !== 'grant') throw new DOMException('denied', 'NotAllowedError');
      if (visibility === 'hidden') throw new DOMException('hidden', 'NotAllowedError');
      sentinel = new FakeSentinel();
      return sentinel;
    },
  };
  const defineWakeLock = () =>
    Object.defineProperty(win.navigator, 'wakeLock', { configurable: true, get: () => (mode === 'unsupported' ? undefined : fake) });
  defineWakeLock();

  const api: RwTestApi = {
    setVisibility(v) {
      if (v === visibility) return;
      visibility = v;
      // The browser releases a screen lock when the page is hidden.
      if (v === 'hidden') sentinel?.fire();
      doc.dispatchEvent(new Event('visibilitychange'));
    },
    wakeLock: {
      setMode(m) {
        mode = m;
        defineWakeLock();
      },
      release() {
        sentinel?.fire();
      },
      state: () => (sentinel === null ? 'none' : sentinel.released ? 'released' : 'held'),
      requests: () => requests,
    },
  };
  win.__rwTest = api;
  return api;
}
