import { Link } from 'react-router-dom';
import { BackBar, Screen, ScreenHeader } from '@/components/layout/Screen';
import { ROOM_TOPICS } from '@/data/roomTopics';
import s from './Room.module.css';

const DEPTH_LABEL = {
  gentle: 'Gentle',
  open: 'Open',
  deep: 'Goes deep',
} as const;

export default function RoomScreen() {
  return (
    <>
      <BackBar title="Relationship Room" fallbackTo="/talk" />
      <Screen>
        <ScreenHeader
          eyebrow="Talk together"
          title="Pick something to talk about"
          sub="Twelve conversations most couples mean to have and never quite start."
        />

        <div className={s.intro}>
          <p className={s.introTitle}>How it works</p>
          <div className={s.steps}>
            {[
              'You each answer privately, on your own phone.',
              'Both answers unlock at once. Nobody reads first.',
              'You respond to what you actually read, not what you assumed.',
              'You finish with one small thing you both agree to try.',
            ].map((step, i) => (
              <p key={step} className={s.step}>
                <span className={s.stepNum}>{i + 1}</span>
                <span>{step}</span>
              </p>
            ))}
          </div>
        </div>

        <div className={s.grid}>
          {ROOM_TOPICS.map((topic, i) => (
            <Link
              key={topic.id}
              to={`/talk/room/${topic.id}`}
              className={s.topic}
              style={{ animationDelay: `${i * 45}ms` }}
            >
              <span className={s.topicEmoji} aria-hidden>
                {topic.emoji}
              </span>
              <div className={s.topicMain}>
                <p className={s.topicTitle}>{topic.label}</p>
                <p className={s.topicBlurb}>{topic.blurb}</p>
                <div className={s.topicMeta}>
                  <span className={s.tag}>~{topic.minutes} min</span>
                  <span className={s.tag} data-depth={topic.depth}>
                    {DEPTH_LABEL[topic.depth]}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </Screen>
    </>
  );
}
