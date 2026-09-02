import type { ReactNode } from 'react';
import s from './Pill.module.css';

export type PillTone = 'neutral' | 'day' | 'week' | 'month' | 'gold' | 'solid';

export function Pill({ tone = 'neutral', children }: { tone?: PillTone; children: ReactNode }) {
  return <span className={[s.pill, s[tone] ?? ''].filter(Boolean).join(' ')}>{children}</span>;
}
