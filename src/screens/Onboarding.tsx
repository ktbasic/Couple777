import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Field';
import { useStore } from '@/context/store';
import { TIER_META } from '@/lib/dates';
import s from './Onboarding.module.css';

const STEPS = 5;

export default function OnboardingScreen() {
  const { state, dispatch } = useStore();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [nameA, setNameA] = useState('');
  const [nameB, setNameB] = useState('');
  const [since, setSince] = useState(state.couple.togetherSince);
  const [city, setCity] = useState('');

  const next = () => setStep((n) => Math.min(STEPS - 1, n + 1));
  const back = () => setStep((n) => Math.max(0, n - 1));

  const finish = () => {
    dispatch({
      type: 'completeOnboarding',
      nameA: nameA.trim() || 'Katy',
      nameB: nameB.trim() || 'Sam',
      since,
      city: city.trim() || 'Munich',
    });
    navigate('/', { replace: true });
  };

  const canContinue = step !== 2 || nameA.trim().length > 0;

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
          {step === 1 ? <Rule /> : null}
          {step === 2 ? (
            <Names
              nameA={nameA}
              nameB={nameB}
              since={since}
              city={city}
              onA={setNameA}
              onB={setNameB}
              onSince={setSince}
              onCity={setCity}
            />
          ) : null}
          {step === 3 ? <Invite code={state.couple.inviteCode} partner={nameB.trim() || 'them'} /> : null}
          {step === 4 ? <Privacy /> : null}
        </div>

        <div className={s.foot}>
          <Button
            variant={step === STEPS - 1 ? 'accent' : 'primary'}
            size="lg"
            block
            disabled={!canContinue}
            onClick={step === STEPS - 1 ? finish : next}
          >
            {step === 0
              ? 'Start'
              : step === 3
                ? "They've joined"
                : step === STEPS - 1
                  ? 'Open our space'
                  : 'Continue'}
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

function Mark() {
  return (
    <div className={s.mark}>
      <span className={s.markGlyph}>777</span>
      <span className={s.markWord}>Couple777</span>
    </div>
  );
}

function Welcome() {
  return (
    <div className={s.step}>
      <Mark />
      <p className={s.eyebrow}>A private space for two</p>
      <h1 className={s.title}>Nobody drifts on purpose.</h1>
      <p className={s.lede}>
        Couple777 is not a calendar. It is a rhythm — one you keep together, so the months do not
        quietly pass without anything in them.
      </p>
    </div>
  );
}

function Rule() {
  const rules = [
    { tier: 'day' as const, n: '7', unit: 'days', body: 'A date, or a moment that belongs only to the two of you.' },
    { tier: 'week' as const, n: '7', unit: 'weeks', body: 'A day trip, a getaway, a small adventure somewhere nearby.' },
    { tier: 'month' as const, n: '7', unit: 'months', body: 'Something bigger. Somewhere neither of you has been.' },
  ];

  return (
    <div className={s.step}>
      <p className={s.eyebrow}>The 777 rule</p>
      <h1 className={s.title}>Three rhythms, and that is the whole idea.</h1>
      <div className={s.rules}>
        {rules.map((r, i) => (
          <div
            key={r.tier}
            className={s.rule}
            data-tier={r.tier}
            style={{ animationDelay: `${120 + i * 90}ms` }}
          >
            <span className={s.ruleNum}>{r.n}</span>
            <div>
              <p className={s.ruleTitle}>
                Every {r.n} {r.unit} — {TIER_META[r.tier].plural.toLowerCase()}
              </p>
              <p className={s.ruleBody}>{r.body}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Names({
  nameA,
  nameB,
  since,
  city,
  onA,
  onB,
  onSince,
  onCity,
}: {
  nameA: string;
  nameB: string;
  since: string;
  city: string;
  onA: (v: string) => void;
  onB: (v: string) => void;
  onSince: (v: string) => void;
  onCity: (v: string) => void;
}) {
  return (
    <div className={s.step}>
      <p className={s.eyebrow}>Just the basics</p>
      <h1 className={s.title}>Who are the two of you?</h1>
      <div className={s.fields}>
        <Input
          label="Your name"
          placeholder="Katy"
          value={nameA}
          autoFocus
          onChange={(e) => onA(e.target.value)}
        />
        <Input
          label="Your partner's name"
          placeholder="Sam"
          value={nameB}
          onChange={(e) => onB(e.target.value)}
        />
        <Input
          label="Together since"
          type="date"
          value={since}
          onChange={(e) => onSince(e.target.value)}
          hint="Only used to count the time, and to remember the anniversaries."
        />
        <Input
          label="Where you're based"
          placeholder="Munich"
          value={city}
          onChange={(e) => onCity(e.target.value)}
          hint="So mini adventures suggest places you can actually get to."
        />
      </div>
    </div>
  );
}

function Invite({ code, partner }: { code: string; partner: string }) {
  return (
    <div className={s.step}>
      <p className={s.eyebrow}>One space, two people</p>
      <h1 className={s.title}>Invite {partner}.</h1>
      <p className={s.lede}>
        Couple777 only works as a pair. Send this code — it links your two accounts and nobody
        else can join.
      </p>
      <div className={s.code}>
        <p className={s.codeLabel}>Your invite code</p>
        <p className={s.codeValue}>{code}</p>
        <p className={s.codeHint}>
          They download the app, enter this, and you share one space from then on.
        </p>
      </div>
    </div>
  );
}

function Privacy() {
  return (
    <div className={s.step}>
      <p className={s.eyebrow}>Before you start</p>
      <h1 className={s.title}>Some things stay yours alone.</h1>
      <p className={s.lede}>
        A shared space only works if there is also a private one. This is how it splits.
      </p>
      <div className={s.privacy}>
        {[
          { icon: '👥', strong: 'Shared', body: 'Plans, trips, memories, and the conversations you finish together.' },
          { icon: '🔒', strong: 'Yours only', body: 'Private reflections, and anything you write for yourself.' },
          { icon: '🤫', strong: 'Hidden until ready', body: 'Surprise plans, and destinations you save to the wishlist.' },
          { icon: '⏳', strong: 'Held back', body: 'Daily answers stay sealed until you have both written one.' },
        ].map((r) => (
          <p key={r.strong} className={s.privacyRow}>
            <span className={s.privacyIcon} aria-hidden>
              {r.icon}
            </span>
            <span>
              <span className={s.privacyStrong}>{r.strong}.</span> {r.body}
            </span>
          </p>
        ))}
      </div>
    </div>
  );
}
