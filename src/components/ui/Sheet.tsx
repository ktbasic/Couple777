import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import s from './Sheet.module.css';

export function Sheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <>
      <div className={s.scrim} onClick={onClose} aria-hidden />
      <div className={s.sheet} role="dialog" aria-modal="true" aria-label={title}>
        <div className={s.grip} aria-hidden />
        <div className={s.head}>
          <h2 className={s.title}>{title}</h2>
          <button type="button" className={s.close} onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>
        <div className={s.body}>{children}</div>
      </div>
    </>,
    document.body,
  );
}
