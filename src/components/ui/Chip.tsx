import type { ReactNode } from 'react';
import s from './Chip.module.css';

export function Chip({
  selected,
  onClick,
  emoji,
  children,
}: {
  selected?: boolean;
  onClick?: () => void;
  emoji?: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={[s.chip, selected ? s.on : ''].filter(Boolean).join(' ')}
    >
      {emoji ? <span className={s.emoji}>{emoji}</span> : null}
      {children}
    </button>
  );
}

/** Horizontally scrolling row that bleeds to the screen edges. */
export function ChipRow({ children }: { children: ReactNode }) {
  return (
    <div className={`${s.row} no-scrollbar`}>
      {children}
    </div>
  );
}

export function ChipWrap({ children }: { children: ReactNode }) {
  return <div className={s.wrapRow}>{children}</div>;
}
