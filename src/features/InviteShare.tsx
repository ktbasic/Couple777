import { useState } from 'react';
import { Screen } from '@/components/layout/Screen';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { useStore } from '@/context/store';
import { appUrl } from '@/lib/supabase';
import { shareInvite } from '@/lib/share';
import s from './InviteShare.module.css';

/**
 * "Bring Marian in ❤️".
 *
 * The prototype used to claim the partner had joined as soon as you tapped
 * share. It says nothing of the kind now: joined is whether a second account
 * has actually taken the seat, and until then this screen only ever offers to
 * ask again.
 */
export function InviteShare({
  partnerName,
  onDone,
}: {
  partnerName?: string;
  onDone: () => void;
}) {
  const { state, me, refresh } = useStore();
  const toast = useToast();
  const [checking, setChecking] = useState(false);

  const name = (partnerName || state.couple.people[1]?.name || 'your partner').trim();
  const code = state.couple.inviteCode;
  const link = appUrl(`/join/${code}`);
  const joined = state.couple.partnerJoined;

  const text = `${me.name} invited you to Couple777 ❤️\n\nJoin our shared 777 space:\n${link}\n\nCode: ${code}`;

  const share = async () => {
    const outcome = await shareInvite(text, 'Couple777');
    if (outcome.method === 'clipboard') {
      toast.show({ emoji: '📋', message: 'Invite copied — paste it anywhere' });
    } else if (outcome.method === 'failed') {
      toast.show({ message: "Couldn't open sharing. The code is on screen to copy." });
    }
  };

  const check = async () => {
    setChecking(true);
    await refresh();
    setChecking(false);
  };

  if (joined) {
    return (
      <Screen className={s.screen}>
        <div className={s.center}>
          <span className={s.bigEmoji} aria-hidden>
            🎉
          </span>
          <h1 className={s.title}>{state.couple.people[1]?.name ?? name} joined</h1>
          <p className={s.body}>Your 777 starts now. Everything you plan, you plan together.</p>
          <Button variant="accent" size="lg" block onClick={onDone}>
            Let&apos;s go
          </Button>
        </div>
      </Screen>
    );
  }

  return (
    <Screen className={s.screen}>
      <div className={s.top}>
        <h1 className={s.title}>Bring {name} in ❤️</h1>
        <p className={s.body}>Your Couple777 space is ready.</p>
        <p className={s.body}>
          Invite {name} so you can plan, answer, and remember things together.
        </p>
      </div>

      <div className={s.codeCard}>
        <p className={s.codeLabel}>Your invite code</p>
        <p className={s.code}>{code}</p>
        <p className={s.codeHint}>{name} can enter this, or just open your link.</p>
      </div>

      <div className={s.actions}>
        <Button variant="accent" size="lg" block onClick={() => void share()}>
          Share invite
        </Button>
        <Button variant="quiet" block disabled={checking} onClick={() => void check()}>
          {checking ? 'Checking…' : `Check if ${name} has joined`}
        </Button>
        <button type="button" className={s.link} onClick={onDone}>
          I&apos;ll do this later
        </button>
      </div>
    </Screen>
  );
}
