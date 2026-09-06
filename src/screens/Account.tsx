import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Screen } from '@/components/layout/Screen';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Field';
import { SaveUniverse } from '@/features/SaveUniverse';
import { readableAuthError, useAuth } from '@/context/auth';
import * as repo from '@/lib/db/repo';
import s from './Account.module.css';

/**
 * The first screen after the splash, every time.
 *
 * It is also the fork in the road: a new account has the whole intro ahead of
 * it — "In a huge universe…" through to "How your space works" — while someone
 * coming back has already answered all of that and wants their home screen.
 * Which of the two this is cannot be read off the button they pressed (a
 * returning user can perfectly well tap "Continue with Google"), so it is
 * decided by whether the account has a name on it.
 */

type Mode = 'choose' | 'email-up' | 'email-in';

/** Where to come back to after an OAuth round trip. */
function useNext(): string {
  const [params] = useSearchParams();
  return params.get('next') || '/';
}

export default function AccountScreen() {
  const { signUpWithEmail, signInWithEmail, signInWithProvider, user } = useAuth();
  const navigate = useNavigate();
  const next = useNext();
  const [mode, setMode] = useState<Mode>('choose');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sentConfirmation, setSentConfirmation] = useState(false);

  /*
   * Signing in is not the end of the journey, and this screen has no way of
   * knowing whether a project requires email confirmation — so it waits for a
   * real session rather than guessing, and moves on the moment one appears.
   *
   * display_name is the same signal NameSetup uses, and it is the only one
   * that survives an OAuth round trip: it is set once, on the name step, and
   * never unset. An account that has one has been through setup.
   */
  useEffect(() => {
    if (!user) return;
    let alive = true;
    const setup = () => navigate(`/me/name?next=${encodeURIComponent(next)}`, { replace: true });
    void (async () => {
      try {
        const profile = await repo.getProfile(user.id);
        if (!alive) return;
        if (profile?.display_name?.trim()) {
          // Coming back. Straight where they were headed, which is Home
          // unless a link sent them somewhere specific.
          navigate(next, { replace: true });
          return;
        }
      } catch {
        /* If we cannot tell, treat it as setup: asking a returning user one
           question they can answer in a tap beats dropping a new one into a
           home screen with nothing in it. NameSetup checks again anyway. */
        if (alive) setup();
        return;
      }
      if (!alive) return;
      // Brand new, and nothing more urgent to do first: the intro.
      if (next === '/') navigate('/onboarding', { replace: true });
      else setup();
    })();
    return () => {
      alive = false;
    };
  }, [user, next, navigate]);

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
    } catch (e) {
      setError(readableAuthError(e));
    } finally {
      setBusy(false);
    }
  };

  /* A session exists, so this screen is on its way out — showing the sign-in
     buttons again for a frame would read as the sign-in having failed. */
  if (user) return null;

  if (sentConfirmation) {
    return (
      <Screen className={s.screen}>
        <div className={s.center}>
          <span className={s.bigEmoji} aria-hidden>
            💌
          </span>
          <h1 className={s.title}>Check your email</h1>
          <p className={s.body}>
            We sent a confirmation link to <strong>{email}</strong>. Open it and you are in.
          </p>
          <button type="button" className={s.link} onClick={() => setSentConfirmation(false)}>
            Use a different email
          </button>
        </div>
      </Screen>
    );
  }

  return (
    <Screen className={s.screen}>
      <div className={s.top}>
        <SaveUniverse />
        {/* The sparkle is part of the last word, not a line of its own. */}
        <h1 className={s.title}>Your 777 universe starts here&nbsp;✨</h1>
        <p className={s.body}>
          Save your memories, plans, and shared space so they’re always here when you come back.
        </p>
      </div>

      {mode === 'choose' ? (
        <div className={s.actions}>
          <Button
            variant="secondary"
            size="lg"
            block
            disabled={busy}
            onClick={() => void run(() => signInWithProvider('google', next))}
          >
            <span className={s.mark} aria-hidden>
              <GoogleMark />
            </span>
            Continue with Google
          </Button>

          {/*
            Apple sign-in needs a paid Apple Developer account, a Services ID
            and a signing key before it can work — none of which can be set up
            from here. The button stays visible and honest rather than
            pretending: see docs/SUPABASE_SETUP.md.
          */}
          <Button
            variant="secondary"
            size="lg"
            block
            disabled={busy}
            onClick={() => void run(() => signInWithProvider('apple', next))}
          >
            <span className={s.mark} aria-hidden>
              
            </span>
            Continue with Apple
          </Button>

          <Button variant="accent" size="lg" block onClick={() => setMode('email-up')}>
            Continue with email
          </Button>

          <button type="button" className={s.link} onClick={() => setMode('email-in')}>
            Already have an account? Sign in
          </button>
        </div>
      ) : (
        <form
          className={s.form}
          onSubmit={(e) => {
            e.preventDefault();
            void run(async () => {
              if (mode === 'email-up') {
                await signUpWithEmail(email, password);
                // Whether a confirmation email is required is a project
                // setting, so ask the session rather than assuming: if we are
                // signed in already, the app moves on by itself.
                setSentConfirmation(true);
              } else {
                await signInWithEmail(email, password);
              }
            });
          }}
        >
          <Input
            label="Email"
            type="email"
            inputMode="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            label="Password"
            type="password"
            autoComplete={mode === 'email-up' ? 'new-password' : 'current-password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            hint={mode === 'email-up' ? 'At least six characters.' : undefined}
            required
          />

          {error ? <p className={s.error}>{error}</p> : null}

          <Button type="submit" variant="accent" size="lg" block disabled={busy}>
            {busy ? 'One moment…' : mode === 'email-up' ? 'Create my account' : 'Sign in'}
          </Button>
          <button
            type="button"
            className={s.link}
            onClick={() => setMode(mode === 'email-up' ? 'email-in' : 'email-up')}
          >
            {mode === 'email-up' ? 'Already have an account? Sign in' : 'Create an account instead'}
          </button>
          <button type="button" className={s.link} onClick={() => setMode('choose')}>
            Back
          </button>
        </form>
      )}

      {mode === 'choose' && error ? <p className={s.error}>{error}</p> : null}

      <p className={s.fine}>
        Couple777 is a private space for two. Nothing you write here is public.
      </p>
    </Screen>
  );
}

/** Google's mark, drawn rather than fetched so the screen has no third-party request. */
function GoogleMark() {
  return (
    <svg viewBox="0 0 48 48" width="18" height="18" aria-hidden>
      <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.6l6.7-6.7C35.6 2.6 30.2 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.8 6.1C12.3 13.2 17.6 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.1 24.6c0-1.6-.1-3.2-.4-4.6H24v9.1h12.4c-.5 2.9-2.2 5.3-4.7 6.9l7.3 5.7c4.3-3.9 6.8-9.8 6.8-17.1z" />
      <path fill="#FBBC05" d="M10.4 28.7a14.6 14.6 0 0 1 0-9.4l-7.8-6.1a24 24 0 0 0 0 21.6l7.8-6.1z" />
      <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.3-5.7c-2 1.4-4.7 2.3-8.6 2.3-6.4 0-11.7-3.7-13.6-9.1l-7.8 6.1C6.5 42.6 14.6 48 24 48z" />
    </svg>
  );
}
