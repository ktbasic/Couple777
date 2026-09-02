import type { HTMLAttributes, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import s from './Card.module.css';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  pad?: boolean;
  flat?: boolean;
  children: ReactNode;
}

export function Card({ pad = true, flat, children, className, ...rest }: CardProps) {
  return (
    <div
      className={[s.card, pad ? s.pad : '', flat ? s.flat : '', className ?? '']
        .filter(Boolean)
        .join(' ')}
      {...rest}
    >
      {children}
    </div>
  );
}

export function CardLink({
  to,
  pad = true,
  flat,
  children,
  className,
}: {
  to: string;
  pad?: boolean;
  flat?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Link
      to={to}
      className={[s.card, s.tappable, pad ? s.pad : '', flat ? s.flat : '', className ?? '']
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </Link>
  );
}

export function CardButton({
  onClick,
  pad = true,
  flat,
  children,
  className,
}: {
  onClick: () => void;
  pad?: boolean;
  flat?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[s.card, s.tappable, pad ? s.pad : '', flat ? s.flat : '', className ?? '']
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </button>
  );
}
