import type { ReactNode } from 'react';
import s from './EmptyState.module.css';

export function EmptyState({
  emoji,
  title,
  body,
  action,
}: {
  emoji: string;
  title: string;
  body?: string;
  action?: ReactNode;
}) {
  return (
    <div className={s.wrap}>
      <div className={s.emoji} aria-hidden>
        {emoji}
      </div>
      <p className={s.title}>{title}</p>
      {body ? <p className={s.body}>{body}</p> : null}
      {action ? <div className={s.action}>{action}</div> : null}
    </div>
  );
}
