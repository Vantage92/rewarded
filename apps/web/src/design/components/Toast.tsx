import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useT } from '../../i18n/index.tsx';
import { useLatest } from './useLatest.ts';

/** UX §5.5: a toast stays 4 s. */
export const TOAST_MS = 4000;

export interface ToastApi {
  /** Shows an informative message. Never for an error that needs action (UX §5.5). */
  show(message: string): void;
}

const ToastContext = createContext<ToastApi>({ show: () => {} });

export function useToast(): ToastApi {
  return useContext(ToastContext);
}

interface Item {
  id: number;
  message: string;
}

/**
 * Toast region above the tab bar with role="status". While `suppressed` (a running session),
 * nothing is shown and messages are dropped (UX §5.5: never during a session).
 */
export function ToastProvider({ children, suppressed = false }: { children: ReactNode; suppressed?: boolean }) {
  const { t } = useT();
  const [items, setItems] = useState<Item[]>([]);
  const nextId = useRef(1);
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());
  const suppressedRef = useLatest(suppressed);

  const dismiss = useCallback((id: number) => {
    setItems((list) => list.filter((i) => i.id !== id));
    clearTimeout(timers.current.get(id));
    timers.current.delete(id);
  }, []);

  const show = useCallback(
    (message: string) => {
      if (suppressedRef.current) return;
      const id = nextId.current++;
      setItems((list) => [...list, { id, message }]);
      timers.current.set(
        id,
        setTimeout(() => dismiss(id), TOAST_MS),
      );
    },
    [dismiss, suppressedRef],
  );

  useEffect(() => {
    const map = timers.current;
    return () => {
      for (const timer of map.values()) clearTimeout(timer);
    };
  }, []);

  const api = useMemo(() => ({ show }), [show]);
  return (
    <ToastContext value={api}>
      {children}
      <div className="toast-region" role="status" aria-live="polite" aria-label={t('toast.region')}>
        {(suppressed ? [] : items).map((item) => (
          <div key={item.id} className="toast">
            {item.message}
          </div>
        ))}
      </div>
    </ToastContext>
  );
}
