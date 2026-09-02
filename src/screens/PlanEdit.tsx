import { useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { BackBar, Screen } from '@/components/layout/Screen';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Field';
import { useToast } from '@/components/ui/Toast';
import { useStore } from '@/context/store';
import { DATE_IDEAS } from '@/data/dateIdeas';
import { ADVENTURE_IDEAS } from '@/data/adventures';
import { TIER_META, addDays, today } from '@/lib/dates';
import { uid } from '@/lib/id';
import type { Plan, RitualTier } from '@/lib/types';
import s from './PlanEdit.module.css';

const EMOJI: Record<RitualTier, string[]> = {
  day: ['🍷', '🍝', '🎬', '🌙', '☕', '🎨', '🕯️', '🎧', '🥐', '💬'],
  week: ['🏔️', '🏞️', '♨️', '🎄', '🚆', '🥾', '🍇', '🏛️', '🎢', '🧳'],
  month: ['✈️', '🗼', '🏝️', '🏜️', '🌋', '🎌', '🚗', '🧭', '🌌', '⛩️'],
};

export default function PlanEditScreen() {
  const { tier: tierParam, planId } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { state, dispatch, me, partner } = useStore();

  const existing = planId ? state.plans.find((p) => p.id === planId) : undefined;
  const tier: RitualTier =
    existing?.tier ??
    (tierParam === 'week' || tierParam === 'month' ? tierParam : 'day');
  const meta = TIER_META[tier];

  // A plan can arrive pre-filled from any of the three explore surfaces.
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
    existing?.date ?? addDays(today(), meta.intervalDays === 7 ? 5 : meta.intervalDays - 7),
  );
  const [place, setPlace] = useState(
    existing?.place ?? sourceAdventure?.place ?? sourceDestination?.country ?? '',
  );
  const [budget, setBudget] = useState(
    existing?.budget ?? (sourceIdea ? (sourceIdea.cost ? `€${sourceIdea.cost}` : 'Free') : sourceAdventure?.cost ?? ''),
  );
  const [notes, setNotes] = useState(existing?.notes ?? sourceIdea?.description ?? sourceAdventure?.description ?? '');
  const [surprise, setSurprise] = useState(existing?.surprise ?? params.get('surprise') === '1');

  const save = () => {
    const plan: Plan = {
      id: existing?.id ?? uid('pl'),
      tier,
      title: title.trim() || meta.label,
      emoji,
      date,
      status: existing?.status ?? 'planned',
      createdBy: existing?.createdBy ?? me.id,
      surprise,
      place: place.trim() || undefined,
      budget: budget.trim() || undefined,
      notes: notes.trim() || undefined,
      memoryId: existing?.memoryId,
      completedAt: existing?.completedAt,
      trip:
        existing?.trip ??
        (tier === 'month'
          ? {
              destination: title.trim() || 'Somewhere new',
              country: place.trim() || undefined,
              heroImage: sourceDestination?.image,
              wishlist: [],
              stays: [],
              notes: '',
              budget: budget.trim() || undefined,
            }
          : undefined),
    };

    dispatch({ type: 'upsertPlan', plan });
    toast.show({
      emoji: surprise ? '🤫' : '✓',
      message: surprise ? `Hidden from ${partner.name} until the day` : "It's in the rhythm",
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
      <BackBar title={existing ? 'Edit plan' : meta.verb} />
      <Screen>
        <header className={s.head}>
          <p className={s.eyebrow} data-tier={tier}>
            Every {meta.cadence}
          </p>
          <h1 className={s.title}>{existing ? 'Change the plan' : meta.verb}</h1>
          <p className={s.sub}>{meta.hint}</p>

          {sourceIdea || sourceAdventure || sourceDestination ? (
            <p className={s.fromIdea}>
              <span aria-hidden>✨</span>
              <span>
                Started from{' '}
                <strong>{sourceIdea?.title ?? sourceAdventure?.title ?? sourceDestination?.name}</strong>. Change
                anything you like.
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

          <Input label="When" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          <Input
            label="Where"
            placeholder="Optional"
            value={place}
            onChange={(e) => setPlace(e.target.value)}
          />
          <Input
            label="Rough budget"
            placeholder="Optional"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
          />
          <Textarea
            label="Anything worth noting"
            placeholder="Bookings, times, who is driving…"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />

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
            <span
              className={[s.switch, surprise ? s.switchOn : ''].filter(Boolean).join(' ')}
              aria-hidden
            />
          </label>
        </div>

        <div className={s.actions}>
          <Button variant="accent" size="lg" block onClick={save}>
            {existing ? 'Save changes' : 'Put it in the rhythm'}
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
