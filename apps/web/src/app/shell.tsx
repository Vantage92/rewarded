// Shell state shared with features: chrome mode (session hides the navigation, UX §2.2),
// no-points mode (UX §2.1), tab dots (UX §2.2 Badges) and the online state (UX §3.1).
import { createContext, useContext, useEffect, useMemo, useState, useSyncExternalStore, type ReactNode } from 'react';
import type { TabIcon } from './icons.tsx';

/**
 * full: header and navigation. immersive: a running session; no navigation, no toasts.
 * bare: public pages (landing, login, verification) without the student navigation.
 */
export type Chrome = 'full' | 'immersive' | 'bare';

/** Route handle that features can set: `{ path: 'x', handle: { chrome: 'bare' } }`. */
export interface ShellHandle {
  chrome?: Chrome;
}

export interface ShellValue {
  /** Chrome requested by a component (overrides the route handle), or null. */
  requested: Chrome | null;
  requestChrome(chrome: Chrome | null): void;
  noPointsMode: boolean;
  setNoPointsMode(on: boolean): void;
  dots: ReadonlySet<TabIcon>;
  setDot(tab: TabIcon, on: boolean): void;
}

const ShellContext = createContext<ShellValue>({
  requested: null,
  requestChrome: () => {},
  noPointsMode: false,
  setNoPointsMode: () => {},
  dots: new Set(),
  setDot: () => {},
});

export function ShellProvider({ children }: { children: ReactNode }) {
  const [requested, requestChrome] = useState<Chrome | null>(null);
  const [noPointsMode, setNoPointsMode] = useState(false);
  const [dots, setDots] = useState<ReadonlySet<TabIcon>>(new Set());
  const value = useMemo<ShellValue>(
    () => ({
      requested,
      requestChrome,
      noPointsMode,
      setNoPointsMode,
      dots,
      setDot(tab, on) {
        setDots((prev) => {
          if (prev.has(tab) === on) return prev;
          const next = new Set(prev);
          if (on) next.add(tab);
          else next.delete(tab);
          return next;
        });
      },
    }),
    [requested, noPointsMode, dots],
  );
  return <ShellContext value={value}>{children}</ShellContext>;
}

export function useShell(): ShellValue {
  return useContext(ShellContext);
}

/** Hides the navigation while `on` (the running session in WP-8 calls useImmersive(true)). */
export function useImmersive(on: boolean): void {
  const { requestChrome } = useShell();
  useEffect(() => {
    if (!on) return;
    requestChrome('immersive');
    return () => requestChrome(null);
  }, [on, requestChrome]);
}

const subscribeOnline = (cb: () => void) => {
  window.addEventListener('online', cb);
  window.addEventListener('offline', cb);
  return () => {
    window.removeEventListener('online', cb);
    window.removeEventListener('offline', cb);
  };
};

/** navigator.onLine as React state (UX §3.1 offline strip). */
export function useOnline(): boolean {
  return useSyncExternalStore(
    subscribeOnline,
    () => navigator.onLine,
    () => true,
  );
}
