import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useNavigate } from 'react-router-dom';
import s from './Toast.module.css';

interface ToastItem {
  id: number;
  emoji?: string;
  message: string;
  actionLabel?: string;
  actionTo?: string;
}

interface ToastApi {
  show: (t: Omit<ToastItem, 'id'>) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const seq = useRef(0);
  const navigate = useNavigate();

  const show = useCallback((t: Omit<ToastItem, 'id'>) => {
    const id = ++seq.current;
    setItems((prev) => [...prev, { ...t, id }]);
    window.setTimeout(() => {
      setItems((prev) => prev.filter((i) => i.id !== id));
    }, 4200);
  }, []);

  const api = useMemo(() => ({ show }), [show]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      {items.length ? (
        <div className={s.host}>
          {items.map((t) => (
            <div key={t.id} className={s.toast} role="status">
              {t.emoji ? (
                <span className={s.emoji} aria-hidden>
                  {t.emoji}
                </span>
              ) : null}
              <span>{t.message}</span>
              {t.actionLabel && t.actionTo ? (
                <button
                  type="button"
                  className={s.action}
                  onClick={() => {
                    setItems((prev) => prev.filter((i) => i.id !== t.id));
                    navigate(t.actionTo!);
                  }}
                >
                  {t.actionLabel}
                </button>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}
    </ToastContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}
