import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Screen } from '@/components/layout/Screen';
import { Button } from '@/components/ui/Button';
import { AppIcon } from '@/components/ui/Logo777';
import { useAuth } from '@/context/auth';
import { useStore } from '@/context/store';
import * as repo from '@/lib/db/repo';
import s from './JoinInvite.module.css';

/**
 * What the partner sees when they open the link.
 *
 * The whole point is that they arrive already knowing whose space this is, so
 * the inviter's name is fetched before anyone signs in — through peek_invite,
 * which is the only thing a stranger holding a code is allowed to learn.
 */
export default function JoinInviteScreen() {
  const { code = '' } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { refresh, coupleId } = useStore();

  const [inviter, setInviter] = useState<string | null>(null);
  const [open, setOpen] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    let alive = true;
    repo
      .peekInvite(code)
      .then((row) => {
        if (!alive) return;
        if (!row) {
          setError('That invite link does not match a Couple777 space.');
          return;
        }
        setInviter(row.inviter_name || 'Someone');
        setOpen(row.is_open);
      })
      .catch((e) => alive && setError(e instanceof Error ? e.message : String(e)));
    return () => {
      alive = false;
    };
  }, [code]);

  // Signed in and already in a space: nothing to join, go home.
  useEffect(() => {
    if (coupleId) navigate('/', { replace: true });
  }, [coupleId, navigate]);

  const join = async () => {
    setJoining(true);
    setError(null);
    try {
      await repo.joinCoupleByCode(code);
      await refresh();
      // Straight to the short personal setup: nothing the first partner
      // already answered gets asked again.
      navigate('/me/setup', { replace: true });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setJoining(false);
    }
  };

  if (error) {
    return (
      <Screen className={s.screen}>
        <div className={s.center}>
          <h1 className={s.title}>This invite did not work</h1>
          <p className={s.body}>{error}</p>
          <Button variant="secondary" block onClick={() => navigate('/', { replace: true })}>
            Go to Couple777
          </Button>
        </div>
      </Screen>
    );
  }

  return (
    <Screen className={s.screen}>
      <div className={s.center}>
        <AppIcon tone="on-accent" className={s.icon} />
        <h1 className={s.title}>
          {inviter ? `${inviter} invited you to Couple777` : 'You have been invited'} ❤️
        </h1>
        <p className={s.body}>A private space for the two of you.</p>

        {open === false ? (
          <p className={s.body}>
            This space already has two people in it. Ask {inviter ?? 'them'} to check.
          </p>
        ) : authLoading ? null : user ? (
          <Button
            variant="accent"
            size="lg"
            block
            disabled={joining}
            onClick={() => void join()}
          >
            {joining ? 'Joining…' : `Join ${inviter ?? 'them'}`}
          </Button>
        ) : (
          <>
            {/*
              Sign-in comes with the code in tow, so the partner lands back
              here and joins without ever typing it.
            */}
            <Button
              variant="accent"
              size="lg"
              block
              onClick={() => navigate(`/account?next=${encodeURIComponent(`/join/${code}`)}`)}
            >
              Join {inviter ?? 'them'}
            </Button>
            <p className={s.fine}>
              You will make your own account. Your private notes stay yours.
            </p>
          </>
        )}
      </div>
    </Screen>
  );
}
