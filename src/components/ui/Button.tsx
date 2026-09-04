import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import s from './Button.module.css';

type Variant = 'primary' | 'accent' | 'secondary' | 'quiet' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

interface Common {
  variant?: Variant;
  size?: Size;
  block?: boolean;
  /** A slow aura under the button. For a screen's one main action only. */
  glow?: boolean;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}

function classes({ variant = 'primary', size = 'md', block, glow, className }: Common) {
  return [s.base, s[variant], s[size], block ? s.block : '', glow ? s.glow : '', className ?? '']
    .filter(Boolean)
    .join(' ');
}

export function Button({
  variant,
  size,
  block,
  glow,
  icon,
  children,
  className,
  ...rest
}: Common & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={classes({ variant, size, block, glow, children, className })}
      {...rest}
    >
      {icon ? <span className={s.icon}>{icon}</span> : null}
      {children}
    </button>
  );
}

export function ButtonLink({
  to,
  variant,
  size,
  block,
  glow,
  icon,
  children,
  className,
  state,
}: Common & { to: string; state?: unknown }) {
  return (
    <Link
      to={to}
      state={state}
      className={classes({ variant, size, block, glow, children, className })}
    >
      {icon ? <span className={s.icon}>{icon}</span> : null}
      {children}
    </Link>
  );
}
