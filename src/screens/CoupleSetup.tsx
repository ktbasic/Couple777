import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Screen } from '@/components/layout/Screen';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Field';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/context/auth';
import { useStore } from '@/context/store';
import * as repo from '@/lib/db/repo';
import { pendingOnboarding, clearPendingOnboarding } from '@/lib/pendingOnboarding';
import { today } from '@/lib/dates';
import { createInitialCycles } from '@/lib/cycles';
import { InviteShare } from '@/features/InviteShare';
import s from './CoupleSetup.module.css';

/**
 * "How do you want to start?" — the step that turns one account into a
 * shared space. The question is about which of the two doors you take, so the
 * two buttons under it are the answer; the couple's own details come after. Everything the couple answers here is couple-level and is
 * asked once, of the first person; the partner who joins by link is never
 * asked any of it again.
 */

type Step = 'choose' | 'create' | 'join' | 'invite';

export default function CoupleSetupScreen() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { user } = useAuth();
  const { refresh, state, coupleId } = useStore();
  const toast = useToast();

  const [step, setStep] = useState<Step>(params.get('code') ? 'join' : 'choose');
  const [partnerName, setPartnerName] = useState('');
  const [since, setSince] = useState('');
  const [status, setStatus] = useState('dating');
  const [distance, setDistance] = useState('together');
  const [homeBase, setHomeBase] = useState('');
  const [code, setCode] = useState(params.get('code') ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Someone arriving here who already has a space (a stale tab, a back
  // button) belongs in the app, not in setup.
  useEffect(() => {
    if (coupleId && step !== 'invite') navigate('/', { replace: true });
  }, [coupleId, step, navigate]);

  const create = async () => {
    if (!user) return;
    setBusy(true);
    setError(null);
    try {
      // The answers given before signing up were held in this browser only.
      // Now there is an account to attach them to.
      const pending = pendingOnboarding();
      if (pending?.displayName) {
        await repo.upsertProfile(user.id, {
          display_name: pending.displayName,
          avatar_type: pending.avatarId ? 'avatar' : 'avatar',
          avatar_value: pending.avatarId ?? null,
          date_preferences: pending.datePreferences ?? {},
          relationship_preferences: pending.relationshipPreferences ?? {},
          home_base: homeBase || null,
        });
      }
      const couple = await repo.createCouple(user.id, {
        partnerName,
        togetherSince: since || undefined,
        relationshipStatus: status,
        distanceSetup: distance,
        homeBase: homeBase || undefined,
        profile: (pending?.coupleProfile ?? state.couple.profile) as never,
        rhythmStart: today(),
      });
      // The three clocks start the moment the space exists.
      await repo.seedCycles(
        couple.id,
        createInitialCycles(couple.rhythm_start?.slice(0, 10) || today()).map((c) => ({
          tier: c.tier,
          seq: c.seq,
          startDate: c.startDate,
          dueDate: c.dueDate,
        })),
      );
      clearPendingOnboarding();
      await refresh();
      setStep('invite');
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const join = async () => {
    setBusy(true);
    setError(null);
    try {
      await repo.joinCoupleByCode(code);
      const pending = pendingOnboarding();
      if (user && pending?.displayName) {
        await repo.upsertProfile(user.id, {
          display_name: pending.displayName,
          avatar_value: pending.avatarId ?? null,
          date_preferences: pending.datePreferences ?? {},
        });
      }
      clearPendingOnboarding();
      await refresh();
      toast.show({ emoji: '🎉', message: "You're in. Welcome to your 777." });
      navigate('/me/setup', { replace: true });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  if (step === 'invite') {
    return <InviteShare partnerName={partnerName} onDone={() => navigate('/', { replace: true })} />;
  }

  if (step === 'choose') {
    return (
      <Screen className={s.screen}>
        <div className={s.top}>
          <h1 className={s.title}>How do you want to start?</h1>
          <p className={s.body}>
            Couple777 is built for two. One of you starts the space, the other joins with a code.
          </p>
        </div>
        <div className={s.actions}>
          <Button variant="accent" size="lg" block onClick={() => setStep('create')}>
            Create our space
          </Button>
          <Button variant="secondary" size="lg" block onClick={() => setStep('join')}>
            I have an invite
          </Button>
        </div>
      </Screen>
    );
  }

  if (step === 'join') {
    return (
      <Screen className={s.screen}>
        <div className={s.top}>
          <h1 className={s.title}>Enter your invite code</h1>
          <p className={s.body}>It looks like K7-4M2P. Your partner has it on their phone.</p>
        </div>
        <form
          className={s.form}
          onSubmit={(e) => {
            e.preventDefault();
            void join();
          }}
        >
          <Input
            label="Invite code"
            value={code}
            autoCapitalize="characters"
            autoCorrect="off"
            spellCheck={false}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="K7-4M2P"
            required
          />
          {error ? <p className={s.error}>{error}</p> : null}
          <Button type="submit" variant="accent" size="lg" block disabled={busy || !code.trim()}>
            {busy ? 'Joining…' : 'Join'}
          </Button>
          <button type="button" className={s.link} onClick={() => setStep('choose')}>
            Back
          </button>
        </form>
      </Screen>
    );
  }

  return (
    <Screen className={s.screen}>
      <div className={s.top}>
        <h1 className={s.title}>A little about the two of you</h1>
        <p className={s.body}>
          This shapes what Couple777 suggests. You can change any of it later.
        </p>
      </div>
      <form
        className={s.form}
        onSubmit={(e) => {
          e.preventDefault();
          void create();
        }}
      >
        <Input
          label="Their name"
          value={partnerName}
          onChange={(e) => setPartnerName(e.target.value)}
          placeholder="Marian"
          required
        />
        <Input
          label="Together since"
          type="date"
          value={since}
          onChange={(e) => setSince(e.target.value)}
        />
        <Select label="Where you are" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="dating">Dating</option>
          <option value="engaged">Engaged</option>
          <option value="married">Married</option>
          <option value="unsaid">Rather not say</option>
        </Select>
        <Select
          label="How close you live"
          value={distance}
          onChange={(e) => setDistance(e.target.value)}
        >
          <option value="together">We live together</option>
          <option value="same-area">Same city</option>
          <option value="different-cities">Different cities</option>
          <option value="long-distance">Long distance</option>
        </Select>
        <Input
          label="Home base"
          value={homeBase}
          onChange={(e) => setHomeBase(e.target.value)}
          placeholder="Munich"
          hint="Used to suggest things near you."
        />
        {error ? <p className={s.error}>{error}</p> : null}
        <Button
          type="submit"
          variant="accent"
          size="lg"
          block
          disabled={busy || !partnerName.trim()}
        >
          {busy ? 'Making your space…' : 'Create our space'}
        </Button>
        <button type="button" className={s.link} onClick={() => setStep('choose')}>
          Back
        </button>
      </form>
    </Screen>
  );
}
