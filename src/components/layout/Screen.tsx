import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import s from './Screen.module.css';

export function Screen({
  children,
  bleed,
  className,
}: {
  children: ReactNode;
  bleed?: boolean;
  className?: string;
}) {
  return (
    <div className={[s.screen, bleed ? s.bleed : '', className ?? ''].filter(Boolean).join(' ')}>
      {children}
    </div>
  );
}

export function ScreenHeader({
  eyebrow,
  title,
  sub,
}: {
  eyebrow?: string;
  title: string;
  sub?: string;
}) {
  return (
    <header className={s.header}>
      {eyebrow ? <p className={s.eyebrow}>{eyebrow}</p> : null}
      <h1 className={s.title}>{title}</h1>
      {sub ? <p className={s.sub}>{sub}</p> : null}
    </header>
  );
}

/** Sticky back bar for pushed detail screens. */
export function BackBar({
  title,
  actionLabel,
  onAction,
  fallbackTo = '/',
  bleed,
}: {
  title?: string;
  actionLabel?: string;
  onAction?: () => void;
  fallbackTo?: string;
  bleed?: boolean;
}) {
  const navigate = useNavigate();

  const goBack = () => {
    // A deep link opened directly has no history to pop.
    if (window.history.length > 1) navigate(-1);
    else navigate(fallbackTo);
  };

  return (
    <div className={[s.bar, bleed ? s.barBleed : ''].filter(Boolean).join(' ')}>
      <button type="button" className={s.back} onClick={goBack} aria-label="Back">
        <svg viewBox="0 0 24 24" width="17" height="17" aria-hidden>
          <path
            d="M15 5l-7 7 7 7"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      {title ? <span className={s.barTitle}>{title}</span> : null}
      {actionLabel && onAction ? (
        <button type="button" className={s.barAction} onClick={onAction}>
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}

export function Section({ children, className }: { children: ReactNode; className?: string }) {
  return <section className={[s.section, className ?? ''].filter(Boolean).join(' ')}>{children}</section>;
}
