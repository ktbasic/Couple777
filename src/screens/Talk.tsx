import { Link } from 'react-router-dom';
import { Screen, ScreenHeader, Section } from '@/components/layout/Screen';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { DailyCard } from '@/features/DailyCard';
import { useStore } from '@/context/store';
import { dailyStatus, unreadCount } from '@/lib/selectors';
import { ROOM_TOPICS } from '@/data/roomTopics';
import s from './Talk.module.css';

const CHEV = (
  <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden>
    <path
      d="M9 5l7 7-7 7"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default function TalkScreen() {
  const { state, me, partner } = useStore();
  const daily = dailyStatus(state, me.id, partner.id);
  const unread = unreadCount(state, me.id);
  const finished = state.roomSessions.filter((r) => r.completedAt);

  return (
    <Screen>
      <ScreenHeader
        eyebrow="Talk"
        title="The conversations worth having"
        sub="Small ones every day, bigger ones when you have the evening for it."
      />

      <DailyCard />

      <Section>
        <SectionHeader title="Go deeper" />
        <div className={s.rows}>
          <Link to="/talk/room" className={s.row}>
            <span className={s.rowEmoji} aria-hidden>
              🪞
            </span>
            <div className={s.rowMain}>
              <p className={s.rowTitle}>Relationship Room</p>
              <p className={s.rowBody}>
                {ROOM_TOPICS.length} guided conversations. Answer privately, reveal together, agree
                on one small thing.
              </p>
            </div>
            <span className={s.rowMeta}>{CHEV}</span>
          </Link>

          <Link to="/talk/notes" className={s.row}>
            <span className={s.rowEmoji} aria-hidden>
              💌
            </span>
            <div className={s.rowMain}>
              <p className={s.rowTitle}>Notes to {partner.name}</p>
              <p className={s.rowBody}>
                For the things that are easier written than said. Send now, or set them to arrive
                later.
              </p>
            </div>
            <span className={s.rowMeta}>
              {unread ? <span className={s.badge}>{unread}</span> : null}
              {CHEV}
            </span>
          </Link>

          <Link to="/talk/daily" className={s.row}>
            <span className={s.rowEmoji} aria-hidden>
              🌿
            </span>
            <div className={s.rowMain}>
              <p className={s.rowTitle}>Today's check-in</p>
              <p className={s.rowBody}>
                {daily.bothAnswered
                  ? "You've both answered today."
                  : daily.answeredByMe
                    ? `Waiting on ${partner.name}.`
                    : 'One question, whenever you have a minute.'}
              </p>
            </div>
            <span className={s.rowMeta}>{CHEV}</span>
          </Link>
        </div>
      </Section>

      {finished.length ? (
        <Section>
          <SectionHeader title="What you agreed" sub="From your last conversations." />
          <div className={s.recent}>
            {finished.slice(0, 4).map((session) => {
              const topic = ROOM_TOPICS.find((t) => t.id === session.topicId);
              return (
                <div key={session.id} className={s.session}>
                  <span aria-hidden>{topic?.emoji ?? '💬'}</span>
                  <div className={s.sessionMain}>
                    <p className={s.sessionTitle}>{topic?.label ?? 'Conversation'}</p>
                    {session.commitment ? (
                      <p className={s.sessionCommit}>“{session.commitment}”</p>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </Section>
      ) : null}

      <p className={s.disclaimer}>
        Couple777 helps you start conversations. It is not therapy, and it does not pretend to be —
        if something needs more than an evening, a professional is worth the call.
      </p>
    </Screen>
  );
}
