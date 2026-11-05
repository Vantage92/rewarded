// User agent class (architecture §10.4): only the class is kept, never the raw string.
// Values follow the contracts enum UaClass.
import type { UaClass } from '@rewarded/contracts';

export function uaClassOf(userAgent: string | undefined | null): UaClass {
  const ua = userAgent ?? '';
  if (ua === '') return 'other';
  const ios = /iPhone|iPad|iPod/.test(ua);
  if (ios) {
    // In-app browsers and Home Screen web views lack the "Safari/" token.
    return /Safari\//.test(ua) && !/(FBAN|FBAV|Instagram|TikTok|musical_ly|Line\/)/.test(ua) ? 'ios_safari' : 'ios_webview';
  }
  if (/Android/.test(ua)) {
    if (/; wv\)|Instagram|FBAN|FBAV|TikTok|musical_ly/.test(ua)) return 'android_webview';
    return /Chrome\//.test(ua) ? 'android_chrome' : 'other';
  }
  if (/Windows NT|Macintosh|X11|Linux x86_64|CrOS/.test(ua)) return 'desktop';
  return 'other';
}
