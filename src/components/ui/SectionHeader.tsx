import { Link } from 'react-router-dom';
import s from './SectionHeader.module.css';

export function SectionHeader({
  title,
  sub,
  actionLabel,
  actionTo,
  onAction,
}: {
  title: string;
  sub?: string;
  actionLabel?: string;
  actionTo?: string;
  onAction?: () => void;
}) {
  return (
    <div className={s.wrap}>
      <div className={s.titles}>
        <h2 className={s.title}>{title}</h2>
        {sub ? <p className={s.sub}>{sub}</p> : null}
      </div>
      {actionLabel && actionTo ? (
        <Link className={s.action} to={actionTo}>
          {actionLabel}
        </Link>
      ) : actionLabel && onAction ? (
        <button type="button" className={s.action} onClick={onAction}>
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}
