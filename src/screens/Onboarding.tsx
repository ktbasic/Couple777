import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppIcon } from '@/components/ui/Logo777';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Field';
import { useToast } from '@/components/ui/Toast';
import {
  IconPrivate,
  IconReveal,
  IconShared,
  IconSurprise,
} from '@/components/ui/PrivacyIcons';
import { useStore } from '@/context/store';
import type {
  CoupleVibe,
  Proximity,
  RelationshipStatus,
  SeeFrequency,
  Wish,
} from '@/lib/types';
import s from './Onboarding.module.css';

const STEPS = 8;

const WISHES: { value: Wish; label: string; emoji: string }[] = [
  { value: 'romance', label: 'More romance', emoji: '🌹' },
  { value: 'conversation', label: 'Deeper conversations', emoji: '💬' },
  { value: 'fun', label: 'More fun', emoji: '🎲' },
  { value: 'adventure', label: 'More adventures', emoji: '🧭' },
  { value: 'quality-time', label: 'More quality time', emoji: '🕰' },
  { value: 'spontaneity', label: 'More spontaneity', emoji: '✨' },
];

const STATUSES: { value: RelationshipStatus; label: string }[] = [
  { value: 'dating', label: 'Dating' },
  { value: 'engaged', label: 'Engaged' },
  { value: 'married', label: 'Married' },
  { value: 'unsaid', label: 'Prefer not to say' },
];

const PROXIMITIES: { value: Proximity; label: string }[] = [
  { value: 'together', label: 'Live together' },
  { value: 'same-area', label: 'Same area' },
  { value: 'different-cities', label: 'Different cities' },
  { value: 'long-distance', label: 'Long-distance' },
];

const SEE_FREQUENCIES: { value: SeeFrequency; label: string }[] = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'few-months', label: 'Every few months' },
  { value: 'varies', label: 'It varies' },
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
  const { state, dispatch } = useStore();
  const navigate = useNavigate();
  const toast = useToast();

  const [step, setStep] = useState(0);
  const [wishes, setWishes] = useState<Wish[]>([]);
  const [status, setStatus] = useState<RelationshipStatus | null>(null);
  const [proximity, setProximity] = useState<Proximity | null>(null);
  const [seeFrequency, setSeeFrequency] = useState<SeeFrequency | null>(null);
  const [vibes, setVibes] = useState<CoupleVibe[]>([]);
  const [nameA, setNameA] = useState('');
  const [nameB, setNameB] = useState('');
  const [since, setSince] = useState(state.couple.togetherSince);
  const [city, setCity] = useState('');
  const [joined, setJoined] = useState(false);

  const next = () => setStep((n) => Math.min(STEPS - 1, n + 1));
  const back = () => setStep((n) => Math.max(0, n - 1));

  const partnerLabel = nameB.trim() || 'your partner';

  const finish = () => {
    dispatch({
      type: 'completeOnboarding',
      nameA: nameA.trim() || 'Katy',
      nameB: nameB.trim() || 'Marian',
      since,
      city: city.trim() || 'Munich',
      partnerJoined: joined,
      profile: {
        wishes,
        status: status ?? 'unsaid',
        proximity: proximity ?? 'together',
        seeFrequency: proximity === 'long-distance' ? (seeFrequency ?? undefined) : undefined,
        vibes,
      },
    });
    navigate('/', { replace: true });
  };

  /* Only the details step blocks — everything else can be skipped past. */
  const canContinue = step !== 5 || nameA.trim().length > 0;

  const primaryLabel = (() => {
    switch (step) {
      case 0: return 'Start';
      case 4: return "Let's try 777";
      case 6: return joined ? 'Continue' : 'Share invite';
      case STEPS - 1: return 'Open our space';
      default: return 'Continue';
    }
  })();

  const onPrimary = () => {
    if (step === STEPS - 1) return finish();
    if (step === 6 && !joined) {
      // No backend to invite through, so the prototype simulates acceptance
      // rather than pretending someone joined the moment you tapped share.
      toast.show({ emoji: '🔗', message: 'Invite link copied' });
      window.setTimeout(() => setJoined(true), 1400);
      return;
    }
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
          {step === 2 ? (
            <ShapeStep
              status={status}
              proximity={proximity}
              onStatus={setStatus}
              onProximity={setProximity}
            />
          ) : null}
          {step === 3 ? <VibeStep vibes={vibes} onChange={setVibes} /> : null}
          {step === 4 ? <Rule /> : null}
          {step === 5 ? (
            <Details
              nameA={nameA} nameB={nameB} since={since} city={city}
              status={status} proximity={proximity} seeFrequency={seeFrequency}
              onA={setNameA} onB={setNameB} onSince={setSince} onCity={setCity}
              onStatus={setStatus} onProximity={setProximity} onSee={setSeeFrequency}
            />
          ) : null}
          {step === 6 ? (
            <Invite code={state.couple.inviteCode} partner={partnerLabel} joined={joined} />
          ) : null}
          {step === 7 ? <Privacy /> : null}
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

          {step === 6 && !joined ? (
            <button type="button" className={s.secondary} onClick={next}>
              I'll do this later
            </button>
          ) : null}

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

function Welcome() {
  return (
    <div className={s.step}>
      <div className={s.mark}>
        <AppIcon tone="on-accent" className={s.markGlyph} />
        <span className={s.markWord}>Couple777</span>
      </div>
      <p className={s.eyebrow}>A private space for two</p>
      <h1 className={s.title}>Love is great. Life is busy.</h1>
      <p className={s.lede}>
        Couple777 helps make sure the good stuff doesn't keep getting postponed.
      </p>
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

function ShapeStep({
  status,
  proximity,
  onStatus,
  onProximity,
}: {
  status: RelationshipStatus | null;
  proximity: Proximity | null;
  onStatus: (v: RelationshipStatus) => void;
  onProximity: (v: Proximity) => void;
}) {
  return (
    <div className={s.step}>
      <p className={s.eyebrow}>A little about you two</p>
      <h1 className={s.title}>What does your relationship look like?</h1>

      <div className={s.question}>
        <p className={s.qLabel}>Relationship</p>
        <div className={s.options}>
          {STATUSES.map((o) => (
            <button
              key={o.value}
              type="button"
              aria-pressed={status === o.value}
              className={[s.option, status === o.value ? s.optionOn : ''].filter(Boolean).join(' ')}
              onClick={() => onStatus(o.value)}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      <div className={s.question}>
        <p className={s.qLabel}>Distance</p>
        <div className={s.options}>
          {PROXIMITIES.map((o) => (
            <button
              key={o.value}
              type="button"
              aria-pressed={proximity === o.value}
              className={[s.option, proximity === o.value ? s.optionOn : ''].filter(Boolean).join(' ')}
              onClick={() => onProximity(o.value)}
            >
              {o.label}
            </button>
          ))}
        </div>
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

function Details({
  nameA, nameB, since, city, status, proximity, seeFrequency,
  onA, onB, onSince, onCity, onStatus, onProximity, onSee,
}: {
  nameA: string; nameB: string; since: string; city: string;
  status: RelationshipStatus | null;
  proximity: Proximity | null;
  seeFrequency: SeeFrequency | null;
  onA: (v: string) => void; onB: (v: string) => void;
  onSince: (v: string) => void; onCity: (v: string) => void;
  onStatus: (v: RelationshipStatus) => void;
  onProximity: (v: Proximity) => void;
  onSee: (v: SeeFrequency) => void;
}) {
  return (
    <div className={s.step}>
      <p className={s.eyebrow}>Just the basics</p>
      <h1 className={s.title}>Who are the two of you?</h1>

      <div className={s.fields}>
        <div className={s.pair}>
          <Input label="Your name" placeholder="Katy" value={nameA} autoFocus onChange={(e) => onA(e.target.value)} />
          <Input label="Their name" placeholder="Marian" value={nameB} onChange={(e) => onB(e.target.value)} />
        </div>
        <Input
          label="Together since"
          type="date"
          value={since}
          onChange={(e) => onSince(e.target.value)}
          hint="Only used to count the time, and to remember the anniversaries."
        />
        <Input
          label="Home base"
          placeholder="Munich"
          value={city}
          onChange={(e) => onCity(e.target.value)}
          hint="So mini adventures suggest places you can actually get to."
        />
      </div>

      {/* Already answered a moment ago — shown here to confirm, not to re-ask. */}
      <div className={s.question}>
        <p className={s.qLabel}>Relationship</p>
        <div className={s.options}>
          {STATUSES.map((o) => (
            <button
              key={o.value}
              type="button"
              aria-pressed={status === o.value}
              className={[s.option, status === o.value ? s.optionOn : ''].filter(Boolean).join(' ')}
              onClick={() => onStatus(o.value)}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      <div className={s.question}>
        <p className={s.qLabel}>Distance</p>
        <div className={s.options}>
          {PROXIMITIES.map((o) => (
            <button
              key={o.value}
              type="button"
              aria-pressed={proximity === o.value}
              className={[s.option, proximity === o.value ? s.optionOn : ''].filter(Boolean).join(' ')}
              onClick={() => onProximity(o.value)}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      {proximity === 'long-distance' ? (
        <div className={s.question}>
          <p className={s.qLabel}>
            How often do you usually see each other? <span className={s.qHint}>Optional</span>
          </p>
          <div className={s.options}>
            {SEE_FREQUENCIES.map((o) => (
              <button
                key={o.value}
                type="button"
                aria-pressed={seeFrequency === o.value}
                className={[s.option, seeFrequency === o.value ? s.optionOn : ''].filter(Boolean).join(' ')}
                onClick={() => onSee(o.value)}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Invite({ code, partner, joined }: { code: string; partner: string; joined: boolean }) {
  return (
    <div className={s.step}>
      <p className={s.eyebrow}>One space, two people</p>
      <h1 className={s.title}>Bring {partner} in ❤️</h1>
      <p className={s.lede}>
        Connecting gives you each your own account inside the same Couple777 space — your own
        answers, your own private notes, one shared story.
      </p>

      {joined ? (
        <div className={s.joined}>
          <p className={s.joinedTitle}>{partner} joined 🎉</p>
          <p className={s.joinedBody}>You're both in. Everything from here is shared.</p>
        </div>
      ) : (
        <>
          <div className={s.code}>
            <p className={s.codeLabel}>Your invite code</p>
            <p className={s.codeValue}>{code}</p>
            <p className={s.codeHint}>
              They download the app, enter this, and you share one space from then on.
            </p>
          </div>
          <p className={s.disclaimer}>
            <span aria-hidden>💡</span>
            <span>
              You can always invite {partner} later from Us. Until then, you can explore
              Couple777 on your own.
            </span>
          </p>
        </>
      )}
    </div>
  );
}

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

function Privacy() {
  return (
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
  );
}
