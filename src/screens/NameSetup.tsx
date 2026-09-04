import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Screen } from '@/components/layout/Screen';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Field';
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
      <div className={s.top}>
        <h1 className={s.title}>What should we call you?</h1>
        <p className={s.body}>
          This is the name your partner sees on everything you share together.
        </p>
      </div>

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

        {error ? <p className={s.error}>{error}</p> : null}

        <Button type="submit" variant="accent" size="lg" block disabled={busy || !name.trim()}>
          {busy ? 'One moment…' : 'That’s me'}
        </Button>
      </form>

      <p className={s.fine}>
        A first name is plenty. You can change it whenever you like.
      </p>
    </Screen>
  );
}
