import { useNavigate } from 'react-router-dom';
import { useStore } from '@/context/store';
import { Button } from '@/components/ui/Button';
import {
  IconPrivate,
  IconReveal,
  IconShared,
  IconSurprise,
} from '@/components/ui/PrivacyIcons';
import s from './Onboarding.module.css';

/**
 * The last screen before the app itself, shown once to each person after they
 * have a space. It comes after couple setup on purpose: the promises only mean
 * something once there is a second person for them to be about.
 *
 * Every line here is enforced in supabase/migrations/0001_init.sql rather than
 * in the UI, which is the only way a promise like this is worth making.
 */
const PRIVACY_CARDS = [
  {
    tone: 'shared' as const,
    Icon: IconShared,
    title: 'Shared',
    body: 'Plans, trips, memories, and the conversations you finish together.',
  },
  {
    tone: 'private' as const,
    Icon: IconPrivate,
    title: 'Just yours',
    body: 'Private notes, and the private line on any memory. Never shared.',
  },
  {
    tone: 'surprise' as const,
    Icon: IconSurprise,
    title: 'Surprise',
    body: 'They see that something is planned. Not what it is.',
  },
  {
    tone: 'reveal' as const,
    Icon: IconReveal,
    title: 'Revealed together',
    body: 'Daily answers stay sealed until you have both written one.',
  },
];

const SEEN_KEY = 'couple777:privacy-seen';

export function markPrivacySeen(userId: string) {
  try {
    window.localStorage.setItem(`${SEEN_KEY}:${userId}`, '1');
  } catch {
    /* ignore */
  }
}

export function hasSeenPrivacy(userId: string): boolean {
  try {
    return window.localStorage.getItem(`${SEEN_KEY}:${userId}`) === '1';
  } catch {
    return true;
  }
}

export default function PrivacyScreen() {
  const navigate = useNavigate();
  const { state } = useStore();
  return (
    <div className={s.frame}>
      <div className={s.app}>
        <div className={s.body}>
          <div className={s.step}>
            <p className={s.eyebrow}>Before you start</p>
            <h1 className={s.title}>Some things are ours. Some are just yours.</h1>
            <p className={s.lede}>A shared space only works if there is a private one too.</p>

            <div className={s.privacyGrid}>
              {PRIVACY_CARDS.map((card, i) => (
                <div
                  key={card.tone}
                  className={s.privacyCard}
                  data-tone={card.tone}
                  style={{ animationDelay: `${i * 90}ms` }}
                >
                  <card.Icon size={34} />
                  <p className={s.privacyTitle}>{card.title}</p>
                  <p className={s.privacyBody}>{card.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className={s.foot}>
          <Button
            variant="accent"
            size="lg"
            block
            onClick={() => {
              markPrivacySeen(state.couple.currentPersonId);
              navigate('/', { replace: true });
            }}
          >
            Open our space
          </Button>
        </div>
      </div>
    </div>
  );
}
