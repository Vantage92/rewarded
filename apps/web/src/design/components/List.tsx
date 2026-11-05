import type { ReactNode } from 'react';

export interface ListProps {
  /** Accessible name of the list, e.g. "Squadleden". */
  label?: string;
  children: ReactNode;
}

export function List({ label, children }: ListProps) {
  return (
    <ul className="list" aria-label={label}>
      {children}
    </ul>
  );
}

/** Initials of a display name: first letter of the first and last word. */
export function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return '?';
  const first = words[0]!.charAt(0);
  const last = words.length > 1 ? words[words.length - 1]!.charAt(0) : '';
  return (first + last).toLocaleUpperCase();
}

/** Avatar with initials, never a photo in the pilot (UX §5.5). Decorative: the name is in the row. */
export function Avatar({ name }: { name: string }) {
  return (
    <span className="avatar" aria-hidden="true">
      {initials(name)}
    </span>
  );
}

export interface ListItemProps {
  title: ReactNode;
  /** Name for the avatar; omit for rows without one. */
  avatarName?: string;
  subtitle?: ReactNode;
  /** Status as a word plus an optional decorative icon (UX §5.5: never colour alone). */
  status?: { label: ReactNode; icon?: ReactNode; tone?: 'neutral' | 'live' | 'pause' | 'earned' };
  trailing?: ReactNode;
}

/** List row of at least 56 px (UX §5.5). */
export function ListItem({ title, avatarName, subtitle, status, trailing }: ListItemProps) {
  return (
    <li className="list-item">
      {avatarName !== undefined ? <Avatar name={avatarName} /> : null}
      <span className="list-text">
        <span className="list-title">{title}</span>
        {subtitle !== undefined ? <span className="list-subtitle">{subtitle}</span> : null}
      </span>
      {status ? (
        <span className={`list-status tone-${status.tone ?? 'neutral'}`}>
          {status.icon ? <span aria-hidden="true">{status.icon}</span> : null}
          {status.label}
        </span>
      ) : null}
      {trailing !== undefined ? <span className="list-trailing">{trailing}</span> : null}
    </li>
  );
}
