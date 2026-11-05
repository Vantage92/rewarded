// What the onboarding collects before POST /onboarding (spec §3.1). Email, names and the invite
// token live in sessionStorage, so a reload or the magic link in the same tab keeps them. The date
// of birth stays in memory only: it is used for the age check and never stored (architecture §3.1).

export interface Draft {
  email: string;
  firstName: string;
  lastName: string;
  inviteToken: string | null;
  silentMode: boolean;
}

const KEY = 'rw_onboarding';
const EMPTY: Draft = { email: '', firstName: '', lastName: '', inviteToken: null, silentMode: true };

let memory: Draft | null = null;
let birthDate: string | null = null;

export function readDraft(): Draft {
  if (memory) return memory;
  try {
    const raw = sessionStorage.getItem(KEY);
    memory = raw ? { ...EMPTY, ...(JSON.parse(raw) as Partial<Draft>) } : { ...EMPTY };
  } catch {
    memory = { ...EMPTY };
  }
  return memory;
}

export function updateDraft(patch: Partial<Draft>): Draft {
  memory = { ...readDraft(), ...patch };
  try {
    sessionStorage.setItem(KEY, JSON.stringify(memory));
  } catch {
    // Without storage the draft lasts for this page only.
  }
  return memory;
}

export function clearDraft(): void {
  memory = { ...EMPTY };
  birthDate = null;
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}

/** Memory only (never storage). */
export function setBirthDate(date: string | null): void {
  birthDate = date;
}

export function getBirthDate(): string | null {
  return birthDate;
}
