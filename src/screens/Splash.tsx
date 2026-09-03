import { useEffect, useState } from 'react';
import s from './Splash.module.css';

const SEVENS = ['7', '7', '7'];

/**
 * The opening moment: 7 → 77 → 777, then out. Total is about 2.2s, which is
 * long enough to land and short enough not to be in the way on the second run
 * — so it plays once per browser session, not on every route change.
 */
export function Splash({ onDone }: { onDone: () => void }) {
  const [shown, setShown] = useState(1);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const timers = [
      window.setTimeout(() => setShown(2), 430),
      window.setTimeout(() => setShown(3), 860),
      window.setTimeout(() => setLeaving(true), 1900),
      window.setTimeout(onDone, 2320),
    ];
    return () => timers.forEach(window.clearTimeout);
  }, [onDone]);

  return (
    <div className={[s.frame, leaving ? s.leaving : ''].filter(Boolean).join(' ')}>
      <div className={s.inner}>
        <p className={s.digits} aria-label="777">
          {SEVENS.slice(0, shown).map((d, i) => (
            <span key={i} className={s.digit}>
              {d}
            </span>
          ))}
        </p>
        <p className={s.mark}>Couple777</p>
        <p className={s.tag}>A private space for two</p>
      </div>
    </div>
  );
}

const KEY = 'couple777:splash-seen';

/** True once per browser session. */
export function useSplash(): [boolean, () => void] {
  const [open, setOpen] = useState(() => {
    try {
      return window.sessionStorage.getItem(KEY) !== '1';
    } catch {
      return true;
    }
  });
  const dismiss = () => {
    try {
      window.sessionStorage.setItem(KEY, '1');
    } catch {
      /* private mode — it simply replays next time */
    }
    setOpen(false);
  };
  return [open, dismiss];
}
