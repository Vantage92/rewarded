import { useId, useRef, type PointerEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useT } from '../../i18n/index.tsx';
import { useFocusTrap } from './useFocusTrap.ts';
import { useLatest } from './useLatest.ts';

export interface BottomSheetProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}

/** Drag distance in px after which a downward drag closes the sheet. */
const DRAG_CLOSE_PX = 80;

/**
 * Bottom sheet (UX §5.5): drag handle, close button, at most 90% high; a centred 480 px panel on
 * the laptop (CSS). Dragging is a shortcut only; the close button and Esc do the same (WCAG 2.5.7).
 */
export function BottomSheet({ open, title, onClose, children }: BottomSheetProps) {
  const { t } = useT();
  const titleId = useId();
  const ref = useRef<HTMLDivElement>(null);
  const dragStart = useRef<number | null>(null);
  const close = useLatest(onClose);
  useFocusTrap(ref, open, () => close.current());
  if (!open) return null;

  const onPointerDown = (e: PointerEvent) => {
    dragStart.current = e.clientY;
  };
  const onPointerUp = (e: PointerEvent) => {
    if (dragStart.current !== null && e.clientY - dragStart.current > DRAG_CLOSE_PX) close.current();
    dragStart.current = null;
  };

  return createPortal(
    <div className="overlay overlay-sheet" onMouseDown={(e) => e.target === e.currentTarget && close.current()}>
      <div ref={ref} className="sheet" role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1}>
        <div className="sheet-handle" title={t('sheet.handle')} onPointerDown={onPointerDown} onPointerUp={onPointerUp} aria-hidden="true" />
        <div className="sheet-head">
          <h2 id={titleId} className="sheet-title">
            {title}
          </h2>
          <button type="button" className="sheet-close" onClick={() => close.current()} aria-label={t('sheet.close')}>
            <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" focusable="false">
              <path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <div className="sheet-body">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
