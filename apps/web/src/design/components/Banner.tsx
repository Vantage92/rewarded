import type { ReactNode } from 'react';
import { useT } from '../../i18n/index.tsx';

export interface BannerProps {
  tone?: 'pause' | 'offline' | 'info';
  children: ReactNode;
  action?: ReactNode;
  /** Closable except offline (UX §5.5). */
  onClose?: () => void;
}

/** Full-width banner below the header: aborted session, offline, holiday pause. */
export function Banner({ tone = 'info', children, action, onClose }: BannerProps) {
  const { t } = useT();
  return (
    <div className={`banner banner-${tone}`} role={tone === 'offline' ? 'status' : undefined}>
      <span className="banner-text">{children}</span>
      {action}
      {onClose && tone !== 'offline' ? (
        <button type="button" className="banner-close" onClick={onClose} aria-label={t('actions.close')}>
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">
            <path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
          </svg>
        </button>
      ) : null}
    </div>
  );
}
