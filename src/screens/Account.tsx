import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Screen } from '@/components/layout/Screen';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Field';
import { AppIcon } from '@/components/ui/Logo777';
import { readableAuthError, useAuth } from '@/context/auth';
import s from './Account.module.css';

/**
 * Where the onboarding answers stop being a browser tab's private business and
 * become an account. Sign-up comes *after* the emotional intro on purpose: by
 * this point the person has decided they want the thing, so the account is a
 * way of keeping it rather than a toll gate in front of it.
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
   * Everyone lands on the name step: it is the one thing every account needs
   * and the one thing sign-up no longer asks for.
   */
  useEffect(() => {
    if (!user) return;
    navigate(`/me/name?next=${encodeURIComponent(next)}`, { replace: true });
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
        <AppIcon tone="on-accent" className={s.icon} />
        <h1 className={s.title}>Save your Couple777</h1>
        <p className={s.body}>
          Your memories, plans, and shared space stay connected to your account.
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
            I already have an account
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
            {mode === 'email-up' ? 'I already have an account' : 'Create an account instead'}
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
