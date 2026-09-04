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

/* Six segments, of which this is the first: the name, then the five questions
   that make the space. One flow, one bar. */
const ONBOARDING_STEPS = 6;

/**
 * What the traveller says. First word only — a bubble is a small place, and
 * "Hi, Katharina Elisabeth!" is not a greeting, it is a form field read aloud.
 */
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
      await repo.upsertProfile(user.id, { display_name: trimmed });
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

      {/* Three flexible gaps rather than one. All the slack used to pool
          above the button, which packed everything else against the top —
          spreading it is what makes the screen breathe. */}
      <div className={s.gapTop} />

      <div className={s.hero}>
        <div>
          <h1 className={s.title}>What should we call you?</h1>
          <p className={s.body}>
            This is the name your partner sees on everything you share together.
          </p>
        </div>

        <div className={s.art}>
          {/* Live, so the greeting becomes theirs as they type it. */}
          <span className={s.bubble}>{greetingFor(name)}</span>
          <CosmicGreeter />
        </div>
      </div>

      <div className={s.gapMid} />

      <form
        className={s.form}
        onSubmit={(e) => {
          e.preventDefault();
          void save();
        }}
      >
        <Input
          label="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Type your name"
          autoComplete="given-name"
          autoFocus
          maxLength={40}
          required
        />

        <p className={s.privacy}>
          <LockIcon />
          Your personal information stays private.
        </p>

        {error ? <p className={s.error}>{error}</p> : null}
      </form>

      <div className={s.gapBottom} />

      <div className={s.foot}>
        <Button
          type="button"
          variant="accent"
          size="lg"
          block
          disabled={busy || !name.trim()}
          onClick={() => void save()}
        >
          {busy ? 'One moment…' : 'That’s me'}
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
