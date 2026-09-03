import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/context/store';
import { notifications, type AppNotification } from '@/lib/selectors';
import s from './NotificationBell.module.css';

const REMOTE_EMOJI: Record<string, string> = {
  plan_invite: '💌',
  invite_accepted: '❤️',
  invite_declined: '🤍',
  invite_suggested: '🕐',
  partner_joined: '🎉',
  cycle_reminder: '⏳',
  memory_reminder: '📸',
};

/**
 * The relationship inbox.
 *
 * Two sources, on purpose. Most items are still *derived* from state — a
 * derived item is always a view of something that is true right now, and can
 * never outlive what it was announcing. The rows from Supabase are the ones
 * that cannot be derived, because they are about something the other person
 * did on their own phone: they invited you, or they said yes.
 */
export function NotificationBell() {
  const { state, dispatch, me, partner, space } = useStore();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const derived = notifications(state, me.id, partner.id);
  const remote: AppNotification[] = (space?.notifications ?? []).map((n) => ({
    id: n.id,
    kind: 'from-partner' as const,
    emoji: REMOTE_EMOJI[n.kind] ?? '💌',
    title: n.title,
    body: n.body ?? '',
    to: n.plan_id ? `/plan/${n.plan_id}` : '/',
    at: new Date(n.created_at).getTime(),
    read: Boolean(n.read_at) || state.readNotificationIds.includes(n.id),
  }));

  const items = [...remote, ...derived].sort((a, b) => b.at - a.at);
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
