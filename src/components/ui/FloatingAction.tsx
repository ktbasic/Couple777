import { Link } from 'react-router-dom';
import s from './FloatingAction.module.css';

export function FloatingAction({
  to,
  label,
  /** Screens without the tab bar sit lower. */
  bare,
}: {
  to: string;
  label: string;
  bare?: boolean;
}) {
  return (
    <div className={[s.host, bare ? s.hostBare : ''].filter(Boolean).join(' ')}>
      <Link to={to} className={s.button} aria-label={label} title={label}>
        <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden>
          <path
            d="M12 5v14M5 12h14"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinecap="round"
          />
        </svg>
      </Link>
    </div>
  );
}
