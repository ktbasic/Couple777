import { useState } from 'react';
import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { BackBar, Screen } from '@/components/layout/Screen';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Field';
import { useToast } from '@/components/ui/Toast';
import { useStore } from '@/context/store';
import { DATE_IDEAS } from '@/data/dateIdeas';
import { ADVENTURE_IDEAS } from '@/data/adventures';
import { TIER_META, addDays, today } from '@/lib/dates';
import { CYCLE_NOUN } from '@/lib/cycles';
import { uid } from '@/lib/id';
import type { Plan, RitualTier } from '@/lib/types';
import s from './PlanEdit.module.css';

const EMOJI: Record<RitualTier, string[]> = {
  day: ['🍷', '🍝', '🎬', '🌙', '☕', '🎨', '🕯️', '🎧', '🥐', '💬'],
  week: ['🏔️', '🏞️', '♨️', '🎄', '🚆', '🥾', '🍇', '🏛️', '🎢', '🧳'],
  month: ['✈️', '🗼', '🏝️', '🏜️', '🌋', '🎌', '🚗', '🧭', '🌌', '⛩️'],
};

export default function PlanEditScreen() {
  const { planId } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { state, dispatch, me, partner } = useStore();

  const existing = planId ? state.plans.find((p) => p.id === planId) : undefined;

  // The cycle is the context. Nobody picks a tier — the rhythm already knows.
  const cycle =
    state.cycles.find((c) => c.id === (existing?.cycleId ?? params.get('cycle'))) ??
    state.cycles.find((c) => !c.completedAt && c.tier === 'day');

  if (!cycle) return <Navigate to="/" replace />;

  const tier = cycle.tier;
  const meta = TIER_META[tier];
  const rich = tier !== 'day';

  const sourceIdea = DATE_IDEAS.find((i) => i.id === params.get('idea'));
  const sourceAdventure = ADVENTURE_IDEAS.find((a) => a.id === params.get('adventure'));
  const sourceDestination = state.destinations.find((d) => d.id === params.get('destination'));

  const [title, setTitle] = useState(
    existing?.title ?? sourceIdea?.title ?? sourceAdventure?.title ?? sourceDestination?.name ?? '',
  );
  const [emoji, setEmoji] = useState(
    existing?.emoji ?? sourceIdea?.emoji ?? sourceAdventure?.emoji ?? EMOJI[tier][0],
  );
  const [date, setDate] = useState(
    existing?.date ?? (cycle.dueDate < today() ? addDays(today(), 3) : cycle.dueDate),
  );
  const [time, setTime] = useState(existing?.time ?? '');
  const [place, setPlace] = useState(
    existing?.place ?? sourceAdventure?.place ?? sourceDestination?.country ?? '',
  );
  const [cost, setCost] = useState(
    existing?.cost ??
      (sourceIdea ? (sourceIdea.cost ? `€${sourceIdea.cost}` : 'Free') : (sourceAdventure?.cost ?? '')),
  );
  const [note, setNote] = useState(
    existing?.note ?? sourceIdea?.description ?? sourceAdventure?.description ?? '',
  );
  const [link, setLink] = useState(existing?.link ?? '');
  const [transport, setTransport] = useState(existing?.trip?.transport ?? '');
  const [reserved, setReserved] = useState(existing?.reserved ?? false);
  const [surprise, setSurprise] = useState(existing?.surprise ?? params.get('surprise') === '1');

  const save = () => {
    const plan: Plan = {
      id: existing?.id ?? uid('pl'),
      cycleId: cycle.id,
      title: title.trim() || meta.label,
      emoji,
      date,
      time: time.trim() || undefined,
      endDate: existing?.endDate,
      createdBy: existing?.createdBy ?? me.id,
      surprise,
      place: place.trim() || undefined,
      note: note.trim() || undefined,
      link: link.trim() || undefined,
      cost: cost.trim() || undefined,
      reserved,
      invite: existing?.invite,
      trip: rich
        ? {
            ...(existing?.trip ?? {
              destination: '',
              wishlist: [],
              stays: [],
              notes: '',
            }),
            destination: title.trim() || place.trim() || 'Somewhere new',
            country: place.trim() || undefined,
            heroImage: existing?.trip?.heroImage ?? sourceDestination?.image,
            transport: transport.trim() || undefined,
            budget: cost.trim() || undefined,
          }
        : undefined,
    };

    dispatch({ type: 'upsertPlan', plan });
    toast.show({
      emoji: surprise ? '🤫' : '✓',
      message: surprise ? `Hidden from ${partner.name} until the day` : "That's your plan",
    });
    navigate(`/plan/${plan.id}`, { replace: true });
  };

  const remove = () => {
    if (!existing) return;
    dispatch({ type: 'removePlan', id: existing.id });
    toast.show({ message: 'Plan removed' });
    navigate('/', { replace: true });
  };

  return (
    <>
      <BackBar title={existing ? 'Edit plan' : 'Plan something'} />
      <Screen>
        <header className={s.head}>
          <p className={s.eyebrow} data-tier={tier}>
            Your {meta.cadence} moment
          </p>
          <h1 className={s.title}>
            {existing ? 'Change the plan' : `What shall we do for this ${CYCLE_NOUN[tier]}?`}
          </h1>
          <p className={s.sub}>{meta.hint}</p>

          {sourceIdea || sourceAdventure || sourceDestination ? (
            <p className={s.fromIdea}>
              <span aria-hidden>✨</span>
              <span>
                Started from{' '}
                <strong>{sourceIdea?.title ?? sourceAdventure?.title ?? sourceDestination?.name}</strong>.
                Change anything you like.
              </span>
            </p>
          ) : null}
        </header>

        <div className={s.form}>
          <Input
            label="What are you doing?"
            placeholder={tier === 'day' ? 'Dinner at the place on the corner' : 'Somewhere new'}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <div>
            <p className={s.label}>Pick something to remember it by</p>
            <div className={`${s.emojiRow} no-scrollbar`}>
              {EMOJI[tier].map((e) => (
                <button
                  key={e}
                  type="button"
                  aria-label={`Use ${e}`}
                  aria-pressed={emoji === e}
                  className={[s.emoji, emoji === e ? s.emojiOn : ''].filter(Boolean).join(' ')}
                  onClick={() => setEmoji(e)}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          <div className={s.pair}>
            <Input label="When" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            <Input label="Time" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
          </div>

          <Input
            label={tier === 'day' ? 'Where' : 'Destination'}
            placeholder="Optional"
            value={place}
            onChange={(e) => setPlace(e.target.value)}
          />

          {rich ? (
            <Input
              label="Getting there"
              placeholder="Train from Munich, about 2 hours"
              value={transport}
              onChange={(e) => setTransport(e.target.value)}
            />
          ) : null}

          <Input
            label={tier === 'month' ? 'Rough budget' : 'Rough cost'}
            placeholder="Optional"
            value={cost}
            onChange={(e) => setCost(e.target.value)}
          />

          <Input
            label="Link"
            placeholder="Restaurant page, listing, tickets…"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            hint="Optional. Anything you want to find again quickly."
          />

          <Textarea
            label="Anything worth noting"
            placeholder="Bookings, times, who is driving…"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />

          <label className={s.toggle}>
            <div className={s.toggleMain}>
              <p className={s.toggleTitle}>Already reserved</p>
              <p className={s.toggleBody}>Marks it as booked so neither of you wonders.</p>
            </div>
            <input
              type="checkbox"
              checked={reserved}
              onChange={(e) => setReserved(e.target.checked)}
              style={{ position: 'absolute', opacity: 0, pointerEvents: 'none' }}
            />
            <span className={[s.switch, reserved ? s.switchOn : ''].filter(Boolean).join(' ')} aria-hidden />
          </label>

          <label className={s.toggle}>
            <div className={s.toggleMain}>
              <p className={s.toggleTitle}>Keep it a surprise</p>
              <p className={s.toggleBody}>
                {partner.name} will see that something is planned, but not what it is.
              </p>
            </div>
            <input
              type="checkbox"
              checked={surprise}
              onChange={(e) => setSurprise(e.target.checked)}
              style={{ position: 'absolute', opacity: 0, pointerEvents: 'none' }}
            />
            <span className={[s.switch, surprise ? s.switchOn : ''].filter(Boolean).join(' ')} aria-hidden />
          </label>
        </div>

        <div className={s.actions}>
          <Button variant="accent" size="lg" block onClick={save}>
            {existing ? 'Save changes' : 'Save plan'}
          </Button>
          {existing ? (
            <button type="button" className={s.delete} onClick={remove}>
              Remove this plan
            </button>
          ) : null}
        </div>
      </Screen>
    </>
  );
}
