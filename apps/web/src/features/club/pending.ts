// A club code from a QR (/c/:code) that arrived before the account existed: kept in sessionStorage
// until the onboarding is done, then F1 opens V2 with it (UX §3.5, spec §3.7).
const KEY = 'rw_pending_club';

export interface PendingClubCode {
  code: string;
  bron: string | null;
}

export function setPendingClubCode(p: PendingClubCode): void {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    // Without storage the link works only for a visitor with an account.
  }
}

export function takePendingClubCode(): PendingClubCode | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    sessionStorage.removeItem(KEY);
    const p = JSON.parse(raw) as Partial<PendingClubCode>;
    return typeof p.code === 'string' && /^[A-Z0-9]{4,12}$/.test(p.code) ? { code: p.code, bron: typeof p.bron === 'string' ? p.bron : null } : null;
  } catch {
    return null;
  }
}
