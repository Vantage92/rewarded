// Beacon (architecture §9.5 beacon.ts, §8.1): on `hidden` the client tries to deliver the event batch
// straight away with navigator.sendBeacon. A beacon sends no headers, so the CSRF token travels in
// the body. Fallback: fetch with keepalive.
import type { SessionEventsRequest } from '@rewarded/contracts/sessions';
import { readCsrfCookie } from '../lib/api/csrf.ts';

export type BeaconSender = (url: string, body: SessionEventsRequest) => boolean;

export function sendSessionBeacon(url: string, body: SessionEventsRequest): boolean {
  const csrf = readCsrfCookie();
  const payload = JSON.stringify(csrf && csrf.length >= 16 ? { ...body, csrf } : body);
  try {
    if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
      // application/json: same-origin, and the API parses JSON bodies only.
      if (navigator.sendBeacon(url, new Blob([payload], { type: 'application/json' }))) return true;
    }
  } catch {
    // Fall through to keepalive fetch.
  }
  try {
    void fetch(url, { method: 'POST', body: payload, keepalive: true, credentials: 'same-origin', headers: { 'Content-Type': 'application/json' } }).catch(() => undefined);
    return true;
  } catch {
    return false;
  }
}
