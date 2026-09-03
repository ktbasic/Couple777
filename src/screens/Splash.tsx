import { useEffect, useState } from 'react';
import { Logo777 } from '../components/ui/Logo777';
import s from './Splash.module.css';

/**
 * The opening moment. The mark assembles — 7, 77, 777, the two rings drawing
 * themselves around it, then the heart — and the wordmark settles underneath.
 *
 * Timings here are the *handoff* only; the choreography inside the mark lives
 * in Logo777.module.css. LEAVE_AT is when the splash starts lifting away and
 * the app underneath begins fading up, so the two overlap into one move rather
 * than cutting. It plays once per browser session, not on every route change.
 */
const LEAVE_AT = 2380;
const HANDOFF = 460;

export function Splash({ onLeave, onDone }: { onLeave?: () => void; onDone: () => void }) {
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const timers = [
      window.setTimeout(() => {
        setLeaving(true);
        onLeave?.();
      }, LEAVE_AT),
      window.setTimeout(onDone, LEAVE_AT + HANDOFF),
    ];
    return () => timers.forEach(window.clearTimeout);
  }, [onDone, onLeave]);

  return (
    <div
      className={[s.frame, leaving ? s.leaving : ''].filter(Boolean).join(' ')}
      aria-hidden={leaving}
    >
      <div className={s.glow} />
      <div className={s.inner}>
        <Logo777 animated className={s.mark} />
        <p className={s.wordmark}>Couple777</p>
        <p className={s.tag}>Make time for us.</p>
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
