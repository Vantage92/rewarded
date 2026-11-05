import { useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useLatest } from './useLatest.ts';
import { useFocusTrap } from './useFocusTrap.ts';

export interface ModalAction {
  label: string;
  onClick: () => void;
  /** Destructive actions use the danger style (UX §5.5 Knop). */
  danger?: boolean;
}

export interface ModalProps {
  open: boolean;
  /** Title phrased as a question (UX §5.5). */
  title: string;
  onClose: () => void;
  /** The safe choice, shown as the primary button and focused first. */
  safe: ModalAction;
  /** The choice with consequences. */
  confirm: ModalAction;
  children?: ReactNode;
}

/** Confirmation with consequences (UX §2.2, §5.5): two buttons, Esc and backdrop close, focus trapped. */
export function Modal({ open, title, onClose, safe, confirm, children }: ModalProps) {
  const titleId = useId();
  const bodyId = useId();
  const ref = useRef<HTMLDivElement>(null);
  const safeRef = useRef<HTMLButtonElement>(null);
  const close = useLatest(onClose);
  useFocusTrap(ref, open, () => close.current(), safeRef);
  if (!open) return null;
  return createPortal(
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && close.current()}>
      <div ref={ref} className="modal" role="dialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={children ? bodyId : undefined} tabIndex={-1}>
        <h2 id={titleId} className="modal-title">
          {title}
        </h2>
        {children ? (
          <div id={bodyId} className="modal-body">
            {children}
          </div>
        ) : null}
        <div className="modal-actions">
          <button ref={safeRef} type="button" className="btn btn-primary btn-block" onClick={safe.onClick}>
            {safe.label}
          </button>
          <button type="button" className={`btn ${confirm.danger ? 'btn-danger' : 'btn-secondary'} btn-block`} onClick={confirm.onClick}>
            {confirm.label}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
