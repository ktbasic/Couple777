import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/context/store';
import { notifications } from '@/lib/selectors';
import s from './NotificationBell.module.css';

/**
 * The relationship inbox. Everything in it is derived from state, so it is
 * always a view of things that are actually true right now — never a queue
 * that outlives what it was announcing.
 */
export function NotificationBell() {
  const { state, dispatch, me, partner } = useStore();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const items = notifications(state, me.id, partner.id);
  const unread = items.filter((n) => !n.read);

  const openItem = (id: string, to: string) => {
    dispatch({ type: 'markNotificationsRead', ids: [id] });
    setOpen(false);
    navigate(to);
  };

  return (
    <div className={s.wrap}>
      <button
        type="button"
        className={s.bell}
        aria-label={unread.length ? `${unread.length} new notifications` : 'Notifications'}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <svg viewBox="0 0 24 24" width="19" height="19" aria-hidden>
          <path
            d="M18 15.5V11a6 6 0 1 0-12 0v4.5L4.5 18h15zM10 20.5a2.2 2.2 0 0 0 4 0"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        {unread.length ? <span className={s.count}>{unread.length}</span> : null}
      </button>

      {open ? (
        <>
          <div className={s.scrim} onClick={() => setOpen(false)} aria-hidden />
          <div className={s.panel} role="dialog" aria-label="Notifications">
            <div className={s.head}>
              <span className={s.headTitle}>What's waiting</span>
              {unread.length ? (
                <button
                  type="button"
                  className={s.markAll}
                  onClick={() =>
                    dispatch({ type: 'markNotificationsRead', ids: unread.map((n) => n.id) })
                  }
                >
                  Mark all read
                </button>
              ) : null}
            </div>

            {items.length ? (
              items.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  className={[s.item, n.read ? '' : s.unread].filter(Boolean).join(' ')}
                  onClick={() => openItem(n.id, n.to)}
                >
                  <span className={s.itemEmoji} aria-hidden>
                    {n.emoji}
                  </span>
                  <span className={s.itemMain}>
                    <span className={s.itemTitle}>{n.title}</span>
                    <span className={s.itemBody}>{n.body}</span>
                  </span>
                  {!n.read ? <span className={s.dot} aria-hidden /> : null}
                </button>
              ))
            ) : (
              <p className={s.empty}>
                Nothing needs you right now.
                <br />
                That's allowed.
              </p>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}
