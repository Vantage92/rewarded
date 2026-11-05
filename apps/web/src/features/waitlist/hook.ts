// A/B hook of the waiting list (product plan §4 "Wachtlijsttest", rapport 04 §6): the focus hook
// (arm F) against an honest money hook (arm G), 50/50 per unique visitor at the first visit and
// fixed for repeat visits. Everything else on the page is the same in both arms.
//
// Recording: the contracts have no field for the arm on POST /waitlist and no event for the visit,
// so the counts per arm need WP-2/WP-3 (see docs/build/WP-8.md). Until then a reporter can be
// registered with setHookReporter(); the default does nothing.
import type { WaitlistSource } from '@rewarded/contracts/common';

export type HookArm = 'F' | 'G';

const STORAGE_KEY = 'rw_hook_arm';

export interface Utm {
  source?: string;
  medium?: string;
  campaign?: string;
}

export interface HookReporter {
  exposure(arm: HookArm, utm: Utm): void;
  signup(arm: HookArm, withFriends: boolean, utm: Utm): void;
}

let reporter: HookReporter = { exposure: () => undefined, signup: () => undefined };

export function setHookReporter(r: HookReporter): void {
  reporter = r;
}

export function hookReporter(): HookReporter {
  return reporter;
}

/** 50/50 draw; `random` is injectable for tests. */
export function drawArm(random: () => number = Math.random): HookArm {
  return random() < 0.5 ? 'F' : 'G';
}

/**
 * The visitor's arm: `?hook=F|G` (QA and tests), else the stored arm, else a fresh draw that is
 * stored for repeat visits. Storage can be unavailable; then the draw holds for this page only.
 */
export function assignHookArm(search: string, storage: Pick<Storage, 'getItem' | 'setItem'> | null = safeLocalStorage(), random?: () => number): HookArm {
  const forced = new URLSearchParams(search).get('hook')?.toUpperCase();
  if (forced === 'F' || forced === 'G') return forced;
  try {
    const stored = storage?.getItem(STORAGE_KEY);
    if (stored === 'F' || stored === 'G') return stored;
  } catch {
    // fall through to a draw
  }
  const arm = drawArm(random);
  try {
    storage?.setItem(STORAGE_KEY, arm);
  } catch {
    // ignore
  }
  return arm;
}

function safeLocalStorage(): Storage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}

export function utmFrom(search: string): Utm {
  const p = new URLSearchParams(search);
  const pick = (k: string) => {
    const v = p.get(k);
    return v ? v.slice(0, 64) : undefined;
  };
  const utm: Utm = {};
  const s = pick('utm_source');
  const m = pick('utm_medium');
  const c = pick('utm_campaign');
  if (s) utm.source = s;
  if (m) utm.medium = m;
  if (c) utm.campaign = c;
  return utm;
}

const SOURCES: readonly WaitlistSource[] = ['landing', 'card', 'club_qr', 'ambassador', 'creator', 'other'];

/** `?bron=` from a QR, card or ambassador link; landing by default. */
export function sourceFrom(search: string): WaitlistSource {
  const b = new URLSearchParams(search).get('bron');
  return SOURCES.includes(b as WaitlistSource) ? (b as WaitlistSource) : 'landing';
}
