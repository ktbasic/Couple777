import { useState } from 'react';
import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { BackBar, Screen } from '@/components/layout/Screen';
import { Button } from '@/components/ui/Button';
import { CompactField, CompactPair, Input, Textarea } from '@/components/ui/Field';
import { CalendarMark, ClockMark, LinkMark, PlaceMark } from '@/components/ui/FieldIcons';
import { useToast } from '@/components/ui/Toast';
import { useStore } from '@/context/store';
import { DATE_IDEAS } from '@/data/dateIdeas';
import { ADVENTURE_IDEAS } from '@/data/adventures';
import { TIER_META, addDays, formatClock, formatWithYear, today } from '@/lib/dates';
import { uid } from '@/lib/id';
import type { Plan, RitualTier } from '@/lib/types';
import s from './PlanEdit.module.css';

/*
 * A plan still carries an emoji — it is what Home and the timeline show — but
 * nobody is asked to pick one any more. Choosing a pictogram was the longest
 * row on the screen and the least of what makes a plan, so it comes from
 * whatever the plan was started from, or from the rhythm it belongs to.
 */
const DEFAULT_EMOJI: Record<RitualTier, string> = {
  day: '🍷',
  week: '🏔️',
  month: '✈️',
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

  /* A plan can also arrive from a memory — "another night in", "back to the
     beach" — which carries its own words rather than one of the seeded ideas. */
  const [title, setTitle] = useState(
    existing?.title ??
      params.get('title') ??
      sourceIdea?.title ??
      sourceAdventure?.title ??
      sourceDestination?.name ??
      '',
  );
  const emoji = existing?.emoji ?? sourceIdea?.emoji ?? sourceAdventure?.emoji ?? DEFAULT_EMOJI[tier];
  const [date, setDate] = useState(
    existing?.date ?? (cycle.dueDate < today() ? addDays(today(), 3) : cycle.dueDate),
  );
  const [time, setTime] = useState(existing?.time ?? '');
  const [place, setPlace] = useState(
    existing?.place ??
      params.get('place') ??
      sourceAdventure?.place ??
      sourceDestination?.country ??
      '',
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
  const [saving, setSaving] = useState(false);

  /*
   * Whether it is a surprise is decided by which button is pressed, not by a
   * switch further up the screen. The toggle and the two buttons said the same
   * thing twice, and a toggle can be left in a state you have forgotten about
   * while a button is a sentence you finish: save and tell them, or save and
   * do not.
   */
  const save = (asSurprise: boolean) => {
    if (saving) return;
    setSaving(true);
    const plan: Plan = {
      id: existing?.id ?? uid('pl'),
      cycleId: cycle.id,
      title: title.trim() || meta.label,
      emoji,
      date,
      time: time.trim() || undefined,
      endDate: existing?.endDate,
      createdBy: existing?.createdBy ?? me.id,
      surprise: asSurprise,
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

    /* Telling them rides on the save and happens after it, so nobody is ever
       told about a plan that failed to write. */
    dispatch({ type: 'upsertPlan', plan, announce: asSurprise ? 'surprise' : 'invite' });

    toast.show({
      emoji: asSurprise ? '🎁' : '💌',
      message: asSurprise
        ? `${partner.name} knows something is planned, not what`
        : `${partner.name} has been told`,
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
            {existing ? 'Change the plan' : 'Already have something in mind?'}
          </h1>

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

        {/*
          Only the title is needed. Nothing else says "optional", because
          labelling six things optional is a longer way of saying one thing is
          not — and an empty field already looks like a field you may leave.
        */}
        <div className={s.form}>
          <Input
            label="Plan title"
            placeholder={tier === 'day' ? 'Dinner at the place on the corner' : 'Somewhere new'}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <Textarea
            label="Details"
            placeholder="A few details to remember or share..."
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />

          <CompactPair>
            <CompactField
              label="Date"
              icon={<CalendarMark />}
              type="date"
              value={date}
              display={date ? formatWithYear(date) : ''}
              placeholder="Pick a date"
              onChange={(e) => setDate(e.target.value)}
            />
            <CompactField
              label="Time"
              icon={<ClockMark />}
              type="time"
              value={time}
              display={time ? formatClock(time) : ''}
              placeholder="Add time"
              onChange={(e) => setTime(e.target.value)}
            />
          </CompactPair>

          <CompactField
            label={tier === 'day' ? 'Where' : 'Destination'}
            icon={<PlaceMark />}
            placeholder="Add a place"
            value={place}
            onChange={(e) => setPlace(e.target.value)}
          />

          <CompactField
            label="Link"
            icon={<LinkMark />}
            type="url"
            inputMode="url"
            placeholder="Restaurant page, listing, tickets..."
            value={link}
            onChange={(e) => setLink(e.target.value)}
          />

          {/*
            A trip still needs the two things a trip needs. They are not on the
            7-day screen, where they were two more boxes on the way to a
            Tuesday evening.
          */}
          {rich ? (
            <>
              <Input
                label="Getting there"
                placeholder="Train from Munich, about 2 hours"
                value={transport}
                onChange={(e) => setTransport(e.target.value)}
              />
              <Input
                label={tier === 'month' ? 'Rough budget' : 'Rough cost'}
                value={cost}
                onChange={(e) => setCost(e.target.value)}
              />
            </>
          ) : null}

          <label className={s.toggle}>
            <div className={s.toggleMain}>
              <p className={s.toggleTitle}>Already reserved</p>
              <p className={s.toggleBody}>Mark it as booked.</p>
            </div>
            <input
              type="checkbox"
              checked={reserved}
              onChange={(e) => setReserved(e.target.checked)}
              style={{ position: 'absolute', opacity: 0, pointerEvents: 'none' }}
            />
            <span className={[s.switch, reserved ? s.switchOn : ''].filter(Boolean).join(' ')} aria-hidden />
          </label>
        </div>

        {/*
          Two endings, and the difference between them is what the other person
          finds out. Both save the same plan to the same place; one tells them
          what it is and one tells them only that there is one.
        */}
        <div className={s.actions}>
          <Button
            variant="accent"
            size="lg"
            block
            disabled={saving}
            onClick={() => save(false)}
          >
            {existing ? 'Save changes' : 'Save & invite partner'}
          </Button>

          {existing ? null : (
            <Button variant="outline" size="lg" block disabled={saving} onClick={() => save(true)}>
              Save as a surprise 🎁
            </Button>
          )}

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
