import type { ReactNode } from 'react';
import s from './ProgressRing.module.css';

export function ProgressRing({
  progress,
  size = 46,
  stroke = 3,
  children,
  className,
}: {
  /** 0 → 1 */
  progress: number;
  size?: number;
  stroke?: number;
  children?: ReactNode;
  className?: string;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.min(1, Math.max(0, progress));

  return (
    <span className={[s.wrap, className ?? ''].filter(Boolean).join(' ')} style={{ width: size, height: size }}>
      <svg className={s.svg} width={size} height={size} aria-hidden>
        <circle className={s.track} cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} />
        <circle
          className={s.value}
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeDasharray={c}
          strokeDashoffset={c * (1 - clamped)}
        />
      </svg>
      {children ? <span className={s.center}>{children}</span> : null}
    </span>
  );
}
