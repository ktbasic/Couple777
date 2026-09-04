import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Screen } from '@/components/layout/Screen';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Field';
import { CosmicGreeter } from '@/components/ui/CosmicPair';
import { useAuth } from '@/context/auth';
import * as repo from '@/lib/db/repo';
import s from './NameSetup.module.css';

/**
 * "What should we call you?" — the first thing asked after an account exists.
 *
 * An email address is a login, not a name. Nobody wants to be greeted as
 * katy.b1994@gmail.com on their own home screen, or to have that appear on an
 * invitation to their partner, so it is never used as one: this screen is the
 * only way display_name gets set for a new account, and until it is answered
 * the rest of setup does not start.
 *
 * An OAuth provider that already told us a real name pre-fills it, so most
 * people confirm rather than type — but the guard below means an address is
 * never what gets offered back.
 */

/* Five segments, of which this is the first: the name, then the four questions
   that make the space. One flow, one bar. */
const ONBOARDING_STEPS = 5;

/**
 * What the traveller says. First word only — a bubble is a small place, and
 * "Hi, Katharina Elisabeth!" is not a greeting, it is a form field read aloud.
 */
/*
 * Optional, and stored where it costs nobody a migration: profiles already
 * carries a relationship_preferences document, and nothing else writes to it
 * on this path. A dedicated column would be tidier and can come later — it
 * would mean running SQL against a project that is already live.
 */
const IDENTITIES = [
  { value: 'woman', label: 'Woman' },
  { value: 'man', label: 'Man' },
  { value: 'non-binary', label: 'Non-binary' },
  { value: 'self-describe', label: 'Self-describe' },
  { value: 'unsaid', label: 'Prefer not to say' },
];

function greetingFor(name: string): string {
  const first = name.trim().split(/\s+/)[0] ?? '';
  return first ? `Hi, ${first}!` : 'Hi there!';
}

/** A name a provider gave us, if it is actually a name. */
function suggestedName(meta: Record<string, unknown> | undefined): string {
  const candidate = [meta?.display_name, meta?.full_name, meta?.name]
    .find((v) => typeof v === 'string' && v.trim());
  const value = typeof candidate === 'string' ? candidate.trim() : '';
  // Providers fall back to the address when they have nothing else, and an
  // address arriving under the key "name" is still an address.
  return value.includes('@') ? '' : value;
}

export default function NameSetupScreen() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { user } = useAuth();
  const next = params.get('next') || '/couple';

  const [name, setName] = useState('');
  const [identity, setIdentity] = useState('');
  const [selfDescribed, setSelfDescribed] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // The session can land a moment after the screen does.
  useEffect(() => {
    if (!user) return;
    setName((current) => current || suggestedName(user.user_metadata));
  }, [user]);

  const save = async () => {
    if (!user) return;
    const trimmed = name.trim();
    if (!trimmed) return;
    setBusy(true);
    setError(null);
    try {
      await repo.upsertProfile(user.id, {
        display_name: trimmed,
        ...(identity
          ? {
              relationship_preferences: {
                gender: identity,
                ...(identity === 'self-describe' && selfDescribed.trim()
                  ? { genderNote: selfDescribed.trim() }
                  : {}),
              },
            }
          : {}),
      });
      navigate(next, { replace: true });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setBusy(false);
    }
  };

  return (
    <Screen className={s.screen}>
      <div className={s.progress} aria-hidden>
        {Array.from({ length: ONBOARDING_STEPS }).map((_, i) => (
          <span key={i} className={[s.tick, i === 0 ? s.tickOn : ''].filter(Boolean).join(' ')} />
        ))}
      </div>

      <div className={s.gapTop} />

      <div className={s.head}>
        <h1 className={s.title}>What should we call you?</h1>
        <p className={s.body}>
          This is the name your partner sees on everything you share together.
        </p>
      </div>

      <div className={s.hero}>
        {/* Live, so the greeting becomes theirs as they type it. */}
        <span className={s.bubble}>{greetingFor(name)}</span>
        <CosmicGreeter />
      </div>

      <div className={s.fields}>
        <Input
          label="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Type your name"
          autoComplete="given-name"
          maxLength={40}
          required
        />

        <fieldset className={s.identity}>
          <legend className={s.legend}>
            How do you identify?
            <span className={s.optional}>(optional)</span>
          </legend>
          <div className={s.chips}>
            {IDENTITIES.map((o) => (
              <button
                key={o.value}
                type="button"
                className={s.chip}
                aria-pressed={identity === o.value}
                onClick={() => setIdentity(identity === o.value ? '' : o.value)}
              >
                {o.label}
              </button>
            ))}
          </div>

          {identity === 'self-describe' ? (
            <div className={s.selfDescribe}>
              <Input
                label="In your words"
                value={selfDescribed}
                onChange={(e) => setSelfDescribed(e.target.value)}
                placeholder="However you describe yourself"
                maxLength={40}
                autoFocus
              />
            </div>
          ) : null}
        </fieldset>

        <p className={s.privacy}>
          <LockIcon />
          Your personal information stays private.
        </p>

        {error ? <p className={s.error}>{error}</p> : null}
      </div>

      <div className={s.gapBottom} />

      <div className={s.foot}>
        <Button
          type="button"
          variant="accent"
          size="lg"
          block
          glow
          disabled={busy || !name.trim()}
          onClick={() => void save()}
        >
          {busy ? 'One moment…' : 'Continue'}
        </Button>
      </div>
    </Screen>
  );
}

/** Drawn rather than an emoji, so it takes the ink colour and never colours itself. */
function LockIcon() {
  return (
    <svg className={s.lock} viewBox="0 0 16 16" width="13" height="13" aria-hidden>
      <path
        d="M4.6 7V5.2a3.4 3.4 0 0 1 6.8 0V7"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <rect x="3" y="7" width="10" height="7" rx="2.2" fill="currentColor" />
    </svg>
  );
}
