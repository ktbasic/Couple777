import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { savePendingOnboarding } from '@/lib/pendingOnboarding';
import { AppIcon } from '@/components/ui/Logo777';
import { CosmicPair } from '@/components/ui/CosmicPair';
import { Button } from '@/components/ui/Button';
import type { CoupleVibe, Wish } from '@/lib/types';
import s from './Onboarding.module.css';

/*
 * Welcome, what you want out of this, your vibe, then the 777 rule — and then
 * the account.
 *
 * The couple's own details (their names, how long, how far apart) used to live
 * here too. They have moved to /couple, after sign-up, for two reasons: the
 * second partner arrives through an invite link and must never be asked to
 * re-enter what the first one already answered, and asking anybody to describe
 * their relationship before they know what the app is gets the app closed.
 */
const STEPS = 4;

const WISHES: { value: Wish; label: string; emoji: string }[] = [
  { value: 'romance', label: 'More romance', emoji: '🌹' },
  { value: 'conversation', label: 'Deeper conversations', emoji: '💬' },
  { value: 'fun', label: 'More fun', emoji: '🎲' },
  { value: 'adventure', label: 'More adventures', emoji: '🧭' },
  { value: 'quality-time', label: 'More quality time', emoji: '🕰' },
  { value: 'spontaneity', label: 'More spontaneity', emoji: '✨' },
];

const VIBES: { value: CoupleVibe; label: string; emoji: string }[] = [
  { value: 'cozy', label: 'Cozy & relaxed', emoji: '🕯️' },
  { value: 'romantic', label: 'Romantic', emoji: '🌹' },
  { value: 'playful', label: 'Playful', emoji: '🤸' },
  { value: 'creative', label: 'Creative', emoji: '🎨' },
  { value: 'adventurous', label: 'Adventurous', emoji: '⛰️' },
  { value: 'exploring', label: 'Always exploring', emoji: '🗺️' },
];

export default function OnboardingScreen() {
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [wishes, setWishes] = useState<Wish[]>([]);
  const [vibes, setVibes] = useState<CoupleVibe[]>([]);

  const next = () => setStep((n) => Math.min(STEPS - 1, n + 1));
  const back = () => setStep((n) => Math.max(0, n - 1));

  /*
   * The answers so far belong to a person who does not have an account yet, so
   * they wait in this browser and move to the profile the moment one exists.
   */
  const finish = () => {
    savePendingOnboarding({
      datePreferences: { wishes, vibes },
      coupleProfile: {
        wishes,
        status: 'unsaid',
        proximity: 'together',
        vibes,
      },
    });
    navigate('/account');
  };

  const canContinue = true;

  const primaryLabel = (() => {
    switch (step) {
      case 0: return 'Start';
      case STEPS - 1: return "Let's try 777";
      default: return 'Continue';
    }
  })();

  const onPrimary = () => {
    if (step === STEPS - 1) return finish();
    next();
  };

  return (
    <div className={s.frame}>
      <div className={s.app}>
        <div className={s.progress} aria-hidden>
          {Array.from({ length: STEPS }).map((_, i) => (
            <span key={i} className={[s.tick, i <= step ? s.tickOn : ''].filter(Boolean).join(' ')} />
          ))}
        </div>

        <div className={s.body}>
          {step === 0 ? <Welcome /> : null}
          {step === 1 ? <WishStep wishes={wishes} onChange={setWishes} /> : null}
          {step === 2 ? <VibeStep vibes={vibes} onChange={setVibes} /> : null}
          {step === 3 ? <Rule /> : null}
        </div>

        <div className={s.foot}>
          <Button
            variant="accent"
            size="lg"
            block
            disabled={!canContinue}
            onClick={onPrimary}
          >
            {primaryLabel}
          </Button>

          {step > 0 ? (
            <button type="button" className={s.back} onClick={back}>
              Back
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

/* --------------------------------- Steps --------------------------------- */

/*
 * The illustration is the hero here, so the step is a column that fills the
 * body: title and lede at the top, the pair in the middle taking whatever room
 * is left, and the warm line pushed down to sit just above the button as the
 * last thing read before tapping it.
 */
function Welcome() {
  return (
    <div className={[s.step, s.welcome].join(' ')}>
      <div className={s.mark}>
        <AppIcon tone="on-accent" className={s.markGlyph} />
        <span className={s.markWord}>Couple777</span>
      </div>
      <p className={s.eyebrow}>A private space for two</p>
      <h1 className={[s.title, s.titleWelcome].join(' ')}>
        In a huge universe, you found each other.
      </h1>
      <p className={s.lede}>
        Couple777 helps make sure the good stuff doesn't keep getting postponed.
      </p>

      <div className={s.hero}>
        <CosmicPair />
      </div>

      <p className={s.warmLine}>Starting is already a pretty good sign. ❤️</p>
    </div>
  );
}

/** Shared multi-select with a cap, used by both taste questions. */
function OptionGroup<T extends string>({
  options,
  selected,
  max,
  onChange,
}: {
  options: { value: T; label: string; emoji?: string }[];
  selected: T[];
  max: number;
  onChange: (next: T[]) => void;
}) {
  const toggle = (v: T) => {
    if (selected.includes(v)) onChange(selected.filter((x) => x !== v));
    // At the cap, the oldest choice makes room rather than the tap doing nothing.
    else if (selected.length >= max) onChange([...selected.slice(1), v]);
    else onChange([...selected, v]);
  };

  return (
    <div className={s.options}>
      {options.map((o) => {
        const on = selected.includes(o.value);
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={on}
            className={[s.option, on ? s.optionOn : ''].filter(Boolean).join(' ')}
            onClick={() => toggle(o.value)}
          >
            {o.emoji ? <span aria-hidden>{o.emoji}</span> : null}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function WishStep({ wishes, onChange }: { wishes: Wish[]; onChange: (w: Wish[]) => void }) {
  return (
    <div className={s.step}>
      <p className={s.eyebrow}>A little about you two</p>
      <h1 className={s.title}>What would you love more of together?</h1>
      <div className={s.question}>
        <p className={s.qLabel}>
          Pick what fits <span className={s.qHint}>Up to 2</span>
        </p>
        <OptionGroup options={WISHES} selected={wishes} max={2} onChange={onChange} />
      </div>
    </div>
  );
}

function VibeStep({ vibes, onChange }: { vibes: CoupleVibe[]; onChange: (v: CoupleVibe[]) => void }) {
  return (
    <div className={s.step}>
      <p className={s.eyebrow}>A little about you two</p>
      <h1 className={s.title}>What feels most like you two?</h1>
      <div className={s.question}>
        <p className={s.qLabel}>
          Pick what fits <span className={s.qHint}>Up to 3</span>
        </p>
        <OptionGroup options={VIBES} selected={vibes} max={3} onChange={onChange} />
      </div>
    </div>
  );
}

const RULE_PARTS = [
  {
    tier: 'day' as const,
    unit: '7 days',
    headline: 'Make time for each other.',
    body: 'A date, a quiet dinner, or two hours that are just yours.',
  },
  {
    tier: 'week' as const,
    unit: '7 weeks',
    headline: 'Go somewhere together.',
    body: 'A day trip, small getaway, or something outside your normal routine.',
  },
  {
    tier: 'month' as const,
    unit: '7 months',
    headline: 'Make a bigger memory.',
    body: "Travel somewhere new. Try something you'll still talk about years later.",
  },
];

function Rule() {
  // The three parts land one after another — this is the moment the product
  // is named for, so it is choreographed rather than just rendered.
  const [revealed, setRevealed] = useState(0);

  useEffect(() => {
    const timers = RULE_PARTS.map((_, i) =>
      window.setTimeout(() => setRevealed(i + 1), 260 + i * 520),
    );
    timers.push(window.setTimeout(() => setRevealed(RULE_PARTS.length + 1), 260 + RULE_PARTS.length * 520));
    return () => timers.forEach(window.clearTimeout);
  }, []);

  return (
    <div className={s.step}>
      <div className={s.ruleHead}>
        <span className={s.ruleBadge}>The 777 rule</span>
        <h1 className={s.ruleTitle}>Have you heard of the 777 Rule?</h1>
        <p className={s.ruleLede}>
          A simple rhythm for keeping your relationship from running on autopilot.
        </p>
      </div>

      <div className={s.rules}>
        {RULE_PARTS.map((part, i) => (
          <div
            key={part.tier}
            className={[s.rule, revealed > i ? s.ruleIn : ''].filter(Boolean).join(' ')}
            data-tier={part.tier}
          >
            <span className={s.ruleNum}>7</span>
            <div>
              <p className={s.ruleUnit}>{part.unit}</p>
              <p className={s.ruleHeadline}>{part.headline}</p>
              <p className={s.ruleBody}>{part.body}</p>
            </div>
          </div>
        ))}
      </div>

      <p
        className={[s.ruleClose, revealed > RULE_PARTS.length ? s.ruleCloseIn : '']
          .filter(Boolean)
          .join(' ')}
      >
        Small moments. Regular adventures. Big memories.
      </p>
    </div>
  );
}
