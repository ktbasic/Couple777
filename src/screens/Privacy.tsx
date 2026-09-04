import { useState } from 'react';
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
    body: 'Plans, trips, memories, and conversations you did together.',
  },
  {
    tone: 'private' as const,
    Icon: IconPrivate,
    title: 'Private',
    body: 'Notes and reflections only you can see.',
  },
  {
    tone: 'surprise' as const,
    Icon: IconSurprise,
    title: 'Surprise',
    body: 'Your partner knows something is planned, except the details.',
  },
  {
    tone: 'reveal' as const,
    Icon: IconReveal,
    title: 'Reveal together',
    body: 'Daily answers stay hidden until both of you respond.',
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
  /* Each card keeps its own state. Closing one because another was opened
     takes the choice away from the person reading: four short explanations
     are worth comparing side by side, and a card that shuts itself while you
     are looking at the next one is a card you have to go back for. */
  const [open, setOpen] = useState<ReadonlySet<string>>(() => new Set());

  const toggle = (tone: string) =>
    setOpen((current) => {
      const next = new Set(current);
      if (!next.delete(tone)) next.add(tone);
      return next;
    });

  return (
    <div className={s.frame}>
      <div className={s.app}>
        <div className={s.body}>
          <div className={s.step}>
            <h1 className={s.title}>How your space works</h1>
            <p className={s.lede}>
              Some things are shared, some stay private, and some only reveal when
              you&rsquo;re both ready.
            </p>

            <p className={s.privacyHint}>Tap each card to see how it works</p>

            <div className={s.privacyGrid}>
              {PRIVACY_CARDS.map((card, i) => (
                <button
                  key={card.tone}
                  type="button"
                  className={s.privacyCard}
                  data-tone={card.tone}
                  aria-pressed={open.has(card.tone)}
                  onClick={() => toggle(card.tone)}
                  style={{
                    animationDelay: `${i * 90}ms`,
                    // Staggered so the four never catch the light together.
                    ['--sheen-delay' as string]: `${i * 800}ms`,
                  }}
                >
                  <span className={s.privacyInner}>
                    <span className={[s.privacyFace, s.privacyFront].join(' ')}>
                      <card.Icon size={34} />
                      <span className={s.privacyTitle}>{card.title}</span>
                    </span>
                    {/* Present in the DOM either way, so a screen reader gets
                        the explanation without having to flip anything. */}
                    <span className={[s.privacyFace, s.privacyBack].join(' ')}>
                      <span className={s.privacyBody}>{card.body}</span>
                    </span>
                  </span>
                </button>
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
