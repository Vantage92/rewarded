// React binding of the session store (architecture §9.2: useSyncExternalStore, no global library).
// One store per page and API client; tests pass their own store with <SessionStoreProvider>.
import { createContext, useContext, useEffect, useState, useSyncExternalStore, type ReactNode } from 'react';
import { useApiContext, type WebApi } from '../../../lib/api/index.ts';
import { browserPlatformOnce } from '../../../platform/index.ts';
import { installTestHooks, testModeEnabled } from '../../../platform/testHooks.ts';
import { SessionStore, type SessionSnapshot } from './store.ts';

const StoreContext = createContext<SessionStore | null>(null);
const stores = new WeakMap<WebApi, SessionStore>();
let currentUser: string | null = null;

/** The user id once /me is known, so the device_id is cached per user (§4.2). */
export function setSessionUser(id: string | null): void {
  currentUser = id;
}

function storeFor(web: WebApi): SessionStore {
  let store = stores.get(web);
  if (!store) {
    // In mock mode a beacon cannot reach the mock; the store then resolves through the client.
    store = new SessionStore({ api: web.api, platform: browserPlatformOnce('/api/v1', web.mode === 'http'), userKey: () => currentUser });
    stores.set(web, store);
    if (testModeEnabled()) {
      const hooks = installTestHooks();
      const s = store;
      hooks.session = () => {
        const snap = s.getSnapshot();
        return { phase: snap.phase, state: snap.ctx.state, sessionId: snap.ctx.sessionId, result: snap.result, wakeLock: snap.wakeLock, remainingMs: s.remaining() };
      };
    }
  }
  return store;
}

export function SessionStoreProvider({ value, children }: { value: SessionStore; children: ReactNode }) {
  return <StoreContext value={value}>{children}</StoreContext>;
}

export function useSessionStore(): SessionStore {
  const injected = useContext(StoreContext);
  const web = useApiContext();
  const store = injected ?? storeFor(web);
  useEffect(() => {
    void store.init();
  }, [store]);
  return store;
}

export function useSession(): [SessionSnapshot, SessionStore] {
  const store = useSessionStore();
  const snap = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
  return [snap, store];
}

/** Re-renders every `ms` while `on` (the timer reads the monotonic clock through the store). */
export function useTick(on: boolean, ms = 1000): number {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!on) return;
    const id = setInterval(() => setN((x) => x + 1), ms);
    return () => clearInterval(id);
  }, [on, ms]);
  return n;
}
