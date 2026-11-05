// Tab icons (UX §5.6): 24 px line icons, 1.75 px stroke, rounded ends; the active tab uses a
// filled variant. Decorative: the label is always shown next to the icon.
import type { ReactNode } from 'react';

export type TabIcon = 'focus' | 'squad' | 'club' | 'rewards' | 'me';

const PATHS: Record<TabIcon, { line: ReactNode; filled: ReactNode }> = {
  // A phone lying screen down.
  focus: {
    line: <rect x="4" y="9" width="16" height="7" rx="2" />,
    filled: <rect x="4" y="9" width="16" height="7" rx="2" fill="currentColor" />,
  },
  // Three heads.
  squad: {
    line: (
      <>
        <circle cx="12" cy="8" r="3" />
        <circle cx="5.5" cy="10" r="2.25" />
        <circle cx="18.5" cy="10" r="2.25" />
        <path d="M7 19c0-2.8 2.2-5 5-5s5 2.2 5 5M2 18c0-2 1.5-3.5 3.5-3.5M22 18c0-2-1.5-3.5-3.5-3.5" />
      </>
    ),
    filled: (
      <>
        <circle cx="12" cy="8" r="3" fill="currentColor" />
        <circle cx="5.5" cy="10" r="2.25" fill="currentColor" />
        <circle cx="18.5" cy="10" r="2.25" fill="currentColor" />
        <path d="M7 19c0-2.8 2.2-5 5-5s5 2.2 5 5z" fill="currentColor" />
        <path d="M2 18c0-2 1.5-3.5 3.5-3.5M22 18c0-2-1.5-3.5-3.5-3.5" />
      </>
    ),
  },
  // A flag.
  club: {
    line: <path d="M6 21V4M6 4h11l-2 4 2 4H6" />,
    filled: (
      <>
        <path d="M6 21V4" />
        <path d="M6 4h11l-2 4 2 4H6z" fill="currentColor" />
      </>
    ),
  },
  // A gift box without a bow animation.
  rewards: {
    line: (
      <>
        <rect x="4" y="10" width="16" height="10" rx="1.5" />
        <path d="M3 7h18v3H3zM12 7v13" />
      </>
    ),
    filled: (
      <>
        <rect x="4" y="10" width="16" height="10" rx="1.5" fill="currentColor" />
        <path d="M3 7h18v3H3z" fill="currentColor" />
      </>
    ),
  },
  // A circle with a person.
  me: {
    line: (
      <>
        <circle cx="12" cy="12" r="9" />
        <circle cx="12" cy="10" r="3" />
        <path d="M6.5 18.5c1.2-2.2 3.2-3.5 5.5-3.5s4.3 1.3 5.5 3.5" />
      </>
    ),
    filled: (
      <>
        <circle cx="12" cy="12" r="9" fill="currentColor" />
        <circle cx="12" cy="10" r="3" fill="var(--color-surface)" stroke="var(--color-surface)" />
        <path d="M6.5 18.5c1.2-2.2 3.2-3.5 5.5-3.5s4.3 1.3 5.5 3.5" stroke="var(--color-surface)" />
      </>
    ),
  },
};

export function Icon({ name, filled = false }: { name: TabIcon; filled?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      {filled ? PATHS[name].filled : PATHS[name].line}
    </svg>
  );
}
