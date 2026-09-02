import { useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { BackBar, Screen, Section } from '@/components/layout/Screen';
import { Button, ButtonLink } from '@/components/ui/Button';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Photo } from '@/components/ui/Photo';
import { Avatar } from '@/components/ui/Avatar';
import { useToast } from '@/components/ui/Toast';
import { useStore } from '@/context/store';
import { TIER_META, countdownLabel, formatPlanDate, today } from '@/lib/dates';
import { uid } from '@/lib/id';
import type { Plan, TripItem } from '@/lib/types';
import s from './PlanDetail.module.css';

export default function PlanDetailScreen() {
  const { planId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { state, dispatch, me, partner } = useStore();

  const plan = state.plans.find((p) => p.id === planId);
  if (!plan) return <Navigate to="/" replace />;

  const meta = TIER_META[plan.tier];
  const hidden = plan.surprise && plan.createdBy !== me.id && plan.status === 'planned';
  const onPhoto = Boolean(plan.trip?.heroImage);

  const complete = () => {
    dispatch({ type: 'completePlan', id: plan.id });
    toast.show({ emoji: '✓', message: 'Another memory made' });
    navigate(`/memories/new?plan=${plan.id}`);
  };

  if (hidden) {
    return (
      <>
        <BackBar title="A surprise" />
        <Screen>
          <div className={s.hidden}>
            <span className={s.hiddenEmoji} aria-hidden>
              🎁
            </span>
            <p className={s.hiddenTitle}>{partner.name} has planned something.</p>
            <p className={s.hiddenBody}>
              It is {countdownLabel(today(), plan.date).toLowerCase()} away. That is all you get
              for now.
            </p>
          </div>
        </Screen>
      </>
    );
  }

  return (
    <>
      <BackBar
        title={meta.label}
        actionLabel={plan.status === 'planned' ? 'Edit' : undefined}
        onAction={() => navigate(`/plan/${plan.id}/edit`)}
        bleed
      />
      <Screen>
        <div className={s.hero} data-tier={plan.tier}>
          {plan.trip?.heroImage ? (
            <>
              <Photo src={plan.trip.heroImage} seed={plan.id} className={s.heroImg} alt="" />
              <span className={s.heroScrim} aria-hidden />
            </>
          ) : null}
          <div className={[s.heroInner, onPhoto ? s.onPhoto : ''].filter(Boolean).join(' ')}>
            <span className={s.emoji} aria-hidden>
              {plan.emoji}
            </span>
            <p className={s.cadence}>Every {meta.cadence}</p>
            <h1 className={s.title}>{plan.title}</h1>
            <p className={s.when}>
              <span>{formatPlanDate(plan.date)}</span>
              {plan.status === 'planned' ? (
                <span className={s.countdown}>{countdownLabel(today(), plan.date)}</span>
              ) : (
                <span className={s.countdown}>Done ✓</span>
              )}
            </p>
          </div>
        </div>

        <div className={s.details}>
          {plan.place ? (
            <div className={s.detail}>
              <span className={s.detailLabel}>Where</span>
              <span className={s.detailValue}>{plan.place}</span>
            </div>
          ) : null}
          {plan.budget ? (
            <div className={s.detail}>
              <span className={s.detailLabel}>Budget</span>
              <span className={s.detailValue}>{plan.budget}</span>
            </div>
          ) : null}
          {plan.notes ? (
            <div className={s.detail}>
              <span className={s.detailLabel}>Notes</span>
              <span className={s.detailValue}>{plan.notes}</span>
            </div>
          ) : null}
          <div className={s.detail}>
            <span className={s.detailLabel}>Planned by</span>
            <span className={s.detailValue}>
              {plan.createdBy === me.id ? 'You' : partner.name}
              {plan.surprise ? ' · kept hidden' : ''}
            </span>
          </div>
        </div>

        {plan.status === 'planned' ? (
          <div className={s.actions}>
            <Button variant="accent" size="lg" block onClick={complete}>
              We did this
            </Button>
            <ButtonLink to={`/explore?tier=${plan.tier}`} variant="secondary" block>
              Browse other ideas
            </ButtonLink>
          </div>
        ) : plan.memoryId ? (
          <div className={s.done}>
            <p className={s.doneTitle}>Another memory made ✓</p>
            <p className={s.doneBody}>This one is in your timeline.</p>
            <ButtonLink to={`/memories/${plan.memoryId}`} variant="secondary" size="sm">
              Open the memory
            </ButtonLink>
          </div>
        ) : (
          <div className={s.done}>
            <p className={s.doneTitle}>Another memory made ✓</p>
            <p className={s.doneBody}>Add a photo and a line each, while it is still fresh.</p>
            <ButtonLink to={`/memories/new?plan=${plan.id}`} variant="accent" size="sm">
              Turn it into a memory
            </ButtonLink>
          </div>
        )}

        {plan.trip ? <TripSpace plan={plan} /> : null}
      </Screen>
    </>
  );
}

/* ------------------------- Big adventure planning ------------------------- */

function TripSpace({ plan }: { plan: Plan }) {
  const { state, dispatch, me } = useStore();
  const trip = plan.trip!;
  const [wishDraft, setWishDraft] = useState('');
  const [stayDraft, setStayDraft] = useState('');

  const update = (patch: Partial<typeof trip>) => {
    dispatch({ type: 'upsertPlan', plan: { ...plan, trip: { ...trip, ...patch } } });
  };

  const addTo = (key: 'wishlist' | 'stays', label: string) => {
    const text = label.trim();
    if (!text) return;
    const item: TripItem = { id: uid('ti'), label: text, addedBy: me.id };
    update({ [key]: [...trip[key], item] } as Partial<typeof trip>);
  };

  const removeFrom = (key: 'wishlist' | 'stays', id: string) => {
    update({ [key]: trip[key].filter((i) => i.id !== id) } as Partial<typeof trip>);
  };

  const renderList = (key: 'wishlist' | 'stays') =>
    trip[key].map((item) => {
      const person = state.couple.people.find((p) => p.id === item.addedBy);
      return (
        <li key={item.id} className={s.listItem}>
          <span>{item.label}</span>
          {person ? (
            <span className={s.listWho}>
              <Avatar person={person} size={20} />
            </span>
          ) : null}
          <button
            type="button"
            className={s.listRemove}
            aria-label={`Remove ${item.label}`}
            onClick={() => removeFrom(key, item.id)}
          >
            ✕
          </button>
        </li>
      );
    });

  return (
    <div className={s.trip}>
      <Section>
        <SectionHeader title="What we want to do" sub="Add anything. No order, no pressure." />
        <ul className={s.list}>{renderList('wishlist')}</ul>
        <form
          className={s.add}
          onSubmit={(e) => {
            e.preventDefault();
            addTo('wishlist', wishDraft);
            setWishDraft('');
          }}
        >
          <input
            className={s.addInput}
            placeholder="Add something…"
            value={wishDraft}
            onChange={(e) => setWishDraft(e.target.value)}
          />
          <Button variant="secondary" size="sm" type="submit">
            Add
          </Button>
        </form>
      </Section>

      <Section>
        <SectionHeader title="Where we might stay" />
        <ul className={s.list}>{renderList('stays')}</ul>
        <form
          className={s.add}
          onSubmit={(e) => {
            e.preventDefault();
            addTo('stays', stayDraft);
            setStayDraft('');
          }}
        >
          <input
            className={s.addInput}
            placeholder="Add a place…"
            value={stayDraft}
            onChange={(e) => setStayDraft(e.target.value)}
          />
          <Button variant="secondary" size="sm" type="submit">
            Add
          </Button>
        </form>
      </Section>

      <Section>
        <SectionHeader title="Notes" />
        <textarea
          className={s.addInput}
          style={{ width: '100%', minHeight: 120, lineHeight: 1.6, resize: 'vertical' }}
          placeholder="Flights, routes, anything you keep forgetting…"
          value={trip.notes}
          onChange={(e) => update({ notes: e.target.value })}
        />
      </Section>
    </div>
  );
}
