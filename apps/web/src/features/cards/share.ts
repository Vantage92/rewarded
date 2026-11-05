// Web Share API with a copy fallback (UX §3.4 Q3, §4.8; architecture §9.5). WhatsApp is the first
// choice in the copy, not in the code: the system share sheet decides.

export type ShareOutcome = 'shared' | 'cancelled' | 'unsupported';

export interface ShareData {
  title?: string;
  text?: string;
  url?: string;
  files?: File[];
}

/** True when the browser can open the system share sheet for this data. */
export function canShare(data: ShareData = {}): boolean {
  const nav = typeof navigator === 'undefined' ? undefined : (navigator as Navigator & { canShare?: (d: ShareData) => boolean });
  if (!nav || typeof nav.share !== 'function') return false;
  if (data.files?.length) return typeof nav.canShare === 'function' && nav.canShare({ files: data.files });
  return true;
}

export async function share(data: ShareData): Promise<ShareOutcome> {
  if (!canShare(data)) return 'unsupported';
  try {
    await navigator.share(data);
    return 'shared';
  } catch (e) {
    // AbortError: the student closed the sheet. Anything else: treat as unsupported.
    return e instanceof DOMException && e.name === 'AbortError' ? 'cancelled' : 'unsupported';
  }
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/** Absolute URL for a path the API returns (invite and card links are relative). */
export function absoluteUrl(url: string): string {
  if (/^https?:\/\//.test(url)) return url;
  const origin = typeof location === 'undefined' ? '' : location.origin;
  return `${origin}${url.startsWith('/') ? '' : '/'}${url}`;
}
