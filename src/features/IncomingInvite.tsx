import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Field';
import { Sheet } from '@/components/ui/Sheet';
import { useStore } from '@/context/store';
import { formatPlanDate } from '@/lib/dates';
import s from './IncomingInvite.module.css';

/**
 * "Katy invited you 💌" — the other half of Ask.
 *
 * It sits at the top of Home rather than behind the bell, because an
 * unanswered invitation is the one thing in this app that is waiting on you.
 */
export function IncomingInvite() {
  const { state, space, partner, dispatch } = useStore();
  const navigate = useNavigate();
  const [suggesting, setSuggesting] = useState(false);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');

  const invite = space?.incoming;
  if (!invite) return null;

  const plan = state.plans.find((p) => p.id === invite.plan_id);
  if (!plan) return null;

  const when = plan.time
    ? `${formatPlanDate(plan.date)} · ${plan.time}`
    : formatPlanDate(plan.date);

  const answer = (response: 'yes' | 'cant' | 'reschedule') => {
    dispatch({ type: 'respondToInvite', planId: plan.id, response });
    setSuggesting(false);
  };

  return (
    <>
      <section className={s.card} aria-label="An invitation from your partner">
        <p className={s.from}>{partner.name} invited you 💌</p>

        <button type="button" className={s.plan} onClick={() => navigate(`/plan/${plan.id}`)}>
          <span className={s.emoji} aria-hidden>
            {plan.emoji}
          </span>
          <span className={s.planText}>
            <span className={s.title}>{plan.title}</span>
            <span className={s.when}>{when}</span>
          </span>
        </button>

        {invite.message ? <p className={s.message}>“{invite.message}”</p> : null}

        <div className={s.actions}>
          <Button variant="accent" block onClick={() => answer('yes')}>
            Sounds good ❤️
          </Button>
          <div className={s.minor}>
            <button type="button" className={s.link} onClick={() => setSuggesting(true)}>
              Suggest another time
            </button>
            <button type="button" className={s.link} onClick={() => answer('cant')}>
              Can&apos;t make it
            </button>
          </div>
        </div>
      </section>

      <Sheet open={suggesting} onClose={() => setSuggesting(false)} title="Suggest another time">
        <p className={s.sheetBody}>
          {partner.name} will see this instead. Nothing is booked either way.
        </p>
        <div className={s.sheetForm}>
          <Input label="Day" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          <Input label="Time" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
          <Button variant="accent" size="lg" block onClick={() => answer('reschedule')}>
            Send it back
          </Button>
        </div>
      </Sheet>
    </>
  );
}
