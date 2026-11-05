// Service worker registration with a safe update (architecture §9.4): a new version waits and is
// activated with SKIP_WAITING only while no session runs. WP-8 reports the session state.
export interface SwController {
  /** True when a new version is installed and waiting. */
  readonly updateWaiting: boolean;
  /** Activates a waiting version if `canActivate()` allows it; returns whether it did. */
  applyUpdate(): boolean;
}

export interface RegisterOptions {
  url?: string;
  /** Returns false while a session runs (state machine not in 'idle'). */
  canActivate?: () => boolean;
  onUpdateWaiting?: () => void;
  container?: ServiceWorkerContainer;
}

export async function registerServiceWorker({ url = '/sw.js', canActivate = () => true, onUpdateWaiting, container = navigator.serviceWorker }: RegisterOptions = {}): Promise<SwController> {
  const reg = await container.register(url);
  const notify = () => {
    if (reg.waiting && container.controller) onUpdateWaiting?.();
  };
  reg.addEventListener('updatefound', () => {
    reg.installing?.addEventListener('statechange', notify);
  });
  notify();
  let reloading = false;
  container.addEventListener('controllerchange', () => {
    if (reloading) return;
    reloading = true;
    location.reload();
  });
  return {
    get updateWaiting() {
      return Boolean(reg.waiting);
    },
    applyUpdate() {
      if (!reg.waiting || !canActivate()) return false;
      reg.waiting.postMessage({ type: 'SKIP_WAITING' });
      return true;
    },
  };
}
