// Device facts the session start reports (architecture §4.2): ua_class, standalone display mode,
// Wake Lock support and navigator.webdriver. Only coarse classes, no fingerprint (§10.4).
import type { UaClass } from '@rewarded/contracts/common';

export function uaClass(ua: string = typeof navigator === 'undefined' ? '' : navigator.userAgent): UaClass {
  const s = ua.toLowerCase();
  const ios = /iphone|ipad|ipod/.test(s);
  const android = s.includes('android');
  // In-app browsers (Instagram, WhatsApp, Facebook) and Android WebView markers.
  const webview = /; wv\)|fban|fbav|instagram|whatsapp|line\//.test(s);
  if (ios) return webview || !s.includes('safari') ? 'ios_webview' : 'ios_safari';
  if (android) return webview ? 'android_webview' : s.includes('chrome') ? 'android_chrome' : 'other';
  if (/windows|macintosh|linux|cros/.test(s)) return 'desktop';
  return 'other';
}

export function isStandalone(): boolean {
  try {
    if (typeof matchMedia === 'function' && matchMedia('(display-mode: standalone)').matches) return true;
  } catch {
    // ignore
  }
  return typeof navigator !== 'undefined' && (navigator as Navigator & { standalone?: boolean }).standalone === true;
}

export function isWebdriver(): boolean {
  return typeof navigator !== 'undefined' && navigator.webdriver === true;
}

export function isDesktop(cls: UaClass): boolean {
  return cls === 'desktop';
}
