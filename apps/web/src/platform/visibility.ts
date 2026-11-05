// Page Visibility adapter (architecture §9.5 visibility.ts, §4.2): reports visibility changes,
// pagehide/pageshow and window blur/focus with their monotonic time. The session store decides what
// aborts a session (spec §4.1: `hidden` or `pagehide` before the end).
import type { MonoClock } from './clock.ts';

export type Visibility = 'visible' | 'hidden';
export type PageSignalKind = 'visible' | 'hidden' | 'pagehide' | 'pageshow' | 'blur' | 'focus';

export interface PageSignal {
  kind: PageSignalKind;
  mono: number;
  wall: number;
  /** pagehide/pageshow `persisted` (bfcache). */
  persisted?: boolean;
}

export interface VisibilitySource {
  current(): Visibility;
  subscribe(listener: (signal: PageSignal) => void): () => void;
}

/** Navigation type of this page load (open question 2: how often students reload). */
export function navigationType(): 'navigate' | 'reload' | 'back_forward' | 'prerender' {
  try {
    const entry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
    const t: string | undefined = entry?.type;
    if (t === 'reload' || t === 'back_forward' || t === 'prerender') return t;
  } catch {
    // Older browsers: treat as a normal navigation.
  }
  return 'navigate';
}

export function createVisibilitySource(clock: MonoClock, doc: Document = document, win: Window = window): VisibilitySource {
  const listeners = new Set<(s: PageSignal) => void>();
  const emit = (kind: PageSignalKind, persisted?: boolean) => {
    const signal: PageSignal = { kind, mono: clock.monoNow(), wall: clock.wallNow(), ...(persisted === undefined ? {} : { persisted }) };
    for (const l of [...listeners]) l(signal);
  };
  const onVisibility = () => emit(doc.visibilityState === 'hidden' ? 'hidden' : 'visible');
  const onPageHide = (e: PageTransitionEvent) => emit('pagehide', e.persisted);
  const onPageShow = (e: PageTransitionEvent) => emit('pageshow', e.persisted);
  const onBlur = () => emit('blur');
  const onFocus = () => emit('focus');
  let attached = false;
  const attach = () => {
    doc.addEventListener('visibilitychange', onVisibility);
    win.addEventListener('pagehide', onPageHide);
    win.addEventListener('pageshow', onPageShow);
    win.addEventListener('blur', onBlur);
    win.addEventListener('focus', onFocus);
    attached = true;
  };
  const detach = () => {
    doc.removeEventListener('visibilitychange', onVisibility);
    win.removeEventListener('pagehide', onPageHide);
    win.removeEventListener('pageshow', onPageShow);
    win.removeEventListener('blur', onBlur);
    win.removeEventListener('focus', onFocus);
    attached = false;
  };
  return {
    current: () => (doc.visibilityState === 'hidden' ? 'hidden' : 'visible'),
    subscribe(listener) {
      listeners.add(listener);
      if (!attached) attach();
      return () => {
        listeners.delete(listener);
        if (listeners.size === 0 && attached) detach();
      };
    },
  };
}
