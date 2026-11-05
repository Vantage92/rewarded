// Platform adapters (architecture §9.5). The session store only sees this interface, so component
// and store tests replace every browser API with a fake.
import type { UaClass } from '@rewarded/contracts/common';
import type { SessionEventsRequest } from '@rewarded/contracts/sessions';
import { sendSessionBeacon } from './beacon.ts';
import { systemClock, systemTimers, type MonoClock, type Timers } from './clock.ts';
import { isStandalone, isWebdriver, uaClass } from './device.ts';
import { createNetworkSource, type NetworkSource } from './network.ts';
import { createEndSignal, type EndSignal } from './signal.ts';
import { createIdbStore, type KvStore } from './storage.ts';
import { createTabLock, type TabLock } from './tabLock.ts';
import { installTestHooks, testModeEnabled } from './testHooks.ts';
import { createVisibilitySource, navigationType, type VisibilitySource } from './visibility.ts';
import { browserWakeLockApi, createWakeLock, type WakeLockController } from './wakelock.ts';

export * from './clock.ts';
export * from './device.ts';
export * from './network.ts';
export * from './outbox.ts';
export * from './signal.ts';
export * from './storage.ts';
export * from './tabLock.ts';
export * from './testHooks.ts';
export * from './transport.ts';
export * from './visibility.ts';
export * from './wakelock.ts';

export interface DeviceFacts {
  uaClass: UaClass;
  standalone: boolean;
  webdriver: boolean;
}

export interface Platform {
  clock: MonoClock;
  timers: Timers;
  visibility: VisibilitySource;
  wakeLock: WakeLockController;
  network: NetworkSource;
  tabLock: TabLock;
  kv: KvStore;
  signal: EndSignal;
  device: () => DeviceFacts;
  navigationType: () => 'navigate' | 'reload' | 'back_forward' | 'prerender';
  /** Delivers an event batch while the page goes away (sendBeacon). False when it could not. */
  beacon: ((sessionId: string, body: SessionEventsRequest) => boolean) | null;
  /** Adds or removes the beforeunload warning during a session (§4.4 Herladen). */
  guardUnload(on: boolean): void;
}

let browserPlatform: Platform | null = null;

/** The browser platform (one per page). Installs the test hooks first when test mode is on. */
export function browserPlatformOnce(apiBase = '/api/v1', useBeacon = true): Platform {
  if (browserPlatform) return browserPlatform;
  if (testModeEnabled()) installTestHooks();
  const visibility = createVisibilitySource(systemClock);
  const onBeforeUnload = (e: BeforeUnloadEvent) => {
    e.preventDefault();
    // Legacy browsers need a returnValue to show the dialog.
    e.returnValue = '';
  };
  let guarded = false;
  browserPlatform = {
    clock: systemClock,
    timers: systemTimers,
    visibility,
    wakeLock: createWakeLock({ api: browserWakeLockApi, isVisible: () => visibility.current() === 'visible', timers: systemTimers }),
    network: createNetworkSource(),
    tabLock: createTabLock(),
    kv: createIdbStore(),
    signal: createEndSignal(),
    device: () => ({ uaClass: uaClass(), standalone: isStandalone(), webdriver: isWebdriver() }),
    navigationType,
    beacon: useBeacon ? (id, body) => sendSessionBeacon(`${apiBase}/sessions/${encodeURIComponent(id)}/events`, body) : null,
    guardUnload(on) {
      if (on === guarded) return;
      guarded = on;
      if (on) window.addEventListener('beforeunload', onBeforeUnload);
      else window.removeEventListener('beforeunload', onBeforeUnload);
    },
  };
  return browserPlatform;
}
