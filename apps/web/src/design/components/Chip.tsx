import type { ReactNode } from 'react';

export type ChipTone = 'earned' | 'pause' | 'neutral' | 'live';

/** Chip / label (UX §5.5): always text; colour family per UX §5.2. */
export function Chip({ tone = 'neutral', children }: { tone?: ChipTone; children: ReactNode }) {
  return <span className={`chip chip-${tone}`}>{children}</span>;
}
