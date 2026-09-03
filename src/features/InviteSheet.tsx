import { useState } from 'react';
import { Sheet } from '@/components/ui/Sheet';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { useStore } from '@/context/store';
import { formatPlanDate } from '@/lib/dates';
import { canShareNatively, inviteText, shareInvite } from '@/lib/share';
import type { Plan, RitualTier } from '@/lib/types';
import s from './InviteSheet.module.css';

const PLACEHOLDER: Record<RitualTier, string> = {
  day: 'I thought we could have a proper dinner together this week ❤️',
  week: 'Want to get out of town together?',
  month: 'I want to take you somewhere.',
};

/**
 * Asking your partner is an action inside a plan, not a feature of its own.
 * The share itself goes through the native sheet, which is what puts WhatsApp
 * and the rest in front of the user without integrating any of them.
 */
export function InviteSheet({
  plan,
  tier,
  open,
  onClose,
}: {
  plan: Plan;
  tier: RitualTier;
  open: boolean;
  onClose: () => void;
}) {
  const { dispatch, me, partner } = useStore();
  const toast = useToast();
  const [message, setMessage] = useState(plan.invite?.message ?? '');
  const [sent, setSent] = useState(false);

  const text = inviteText(plan, tier, me.name, message);
  const when = plan.time ? `${formatPlanDate(plan.date)} · ${plan.time}` : formatPlanDate(plan.date);

  const send = async () => {
    const outcome = await shareInvite(text, `${me.name} · Couple777`);
    if (outcome.method === 'failed') {
      toast.show({ message: "Couldn't open sharing. Try copying it instead." });
      return;
    }
    dispatch({ type: 'sendInvite', planId: plan.id, message: message.trim() || undefined });
    setSent(true);
    if (outcome.method === 'clipboard') {
      toast.show({ emoji: '📋', message: 'Invite copied — paste it anywhere' });
    }
  };

  const close = () => {
    setSent(false);
    onClose();
  };

  return (
    <Sheet open={open} onClose={close} title={sent ? 'Sent' : `Ask ${partner.name}`}>
      {sent ? (
        <div className={s.sent}>
          <span className={s.sentIcon} aria-hidden>
            💌
          </span>
          <p className={s.sentTitle}>On its way to {partner.name}</p>
          <p className={s.sentBody}>
            You'll see it here as soon as they say yes. No nagging in the meantime.
          </p>
          <div className={s.actions}>
            <Button variant="accent" block onClick={close}>
              Done
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className={s.summary}>
            <span className={s.emoji} aria-hidden>
              {plan.emoji}
            </span>
            <div>
              <p className={s.title}>{plan.title}</p>
              <p className={s.when}>{when}</p>
            </div>
          </div>

          <p className={s.label}>Add a message (optional)</p>
          <textarea
            className={s.area}
            placeholder={PLACEHOLDER[tier]}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />

          <div className={s.preview}>
            <p className={s.previewLabel}>They'll see</p>
            {text}
          </div>

          <div className={s.actions}>
            <Button variant="accent" size="lg" block onClick={() => void send()}>
              {canShareNatively() ? 'Share invite' : 'Copy invite'}
            </Button>
            <button type="button" className={s.cancel} onClick={close}>
              Cancel
            </button>
          </div>
        </>
      )}
    </Sheet>
  );
}
