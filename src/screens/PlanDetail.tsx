import { useEffect, useState } from 'react';
import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { BackBar, Screen, Section } from '@/components/layout/Screen';
import { Button, ButtonLink } from '@/components/ui/Button';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Photo } from '@/components/ui/Photo';
import { Avatar } from '@/components/ui/Avatar';
import { useToast } from '@/components/ui/Toast';
import { InviteSheet } from '@/features/InviteSheet';
import { PlanningHelpers } from '@/features/PlanningHelpers';
import { useStore } from '@/context/store';
import { TIER_META, countdownLabel, formatPlanDate, today } from '@/lib/dates';
import { CYCLE_NOUN, cycleStatus } from '@/lib/cycles';
import { uid } from '@/lib/id';
import type { Plan, TripItem } from '@/lib/types';
import s from './PlanDetail.module.css';

export default function PlanDetailScreen() {
  const { planId } = useParams();
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { state, dispatch, me, partner } = useStore();

  const plan = state.plans.find((p) => p.id === planId);
  const cycle = state.cycles.find((c) => c.id === plan?.cycleId);
  const [asking, setAsking] = useState(false);

  // The hero card links straight here with the invite open.
  useEffect(() => {
    if (params.get('ask') === '1') {
      setAsking(true);
      params.delete('ask');
      setParams(params, { replace: true });
    }
  }, [params, setParams]);

  if (!plan || !cycle) return <Navigate to="/" replace />;

  const tier = cycle.tier;
  const meta = TIER_META[tier];
  const status = cycleStatus(cycle, plan);
  const hidden = plan.surprise && plan.createdBy !== me.id && !cycle.completedAt;
  const onPhoto = Boolean(plan.trip?.heroImage);
  const destination = plan.trip?.destination ?? plan.place ?? plan.title;

  const complete = () => {
    dispatch({ type: 'completeCycle', cycleId: cycle.id });
    // The engine closes overlapped smaller cycles too; say so plainly.
    const alsoClosed = tier === 'month' ? 'your 7-week and 7-day moments' : tier === 'week' ? 'your 7-day moment' : null;
    toast.show({
      emoji: '✓',
      message: alsoClosed ? `Made — this covered ${alsoClosed} too` : 'Another memory made',
    });
    navigate(`/memories/new?cycle=${cycle.id}`);
  };

  if (hidden) {
    return (
      <>
        <BackBar title="A surprise" />
        <Screen>
          <div className={s.hidden}>
            <span className={s.hiddenEmoji} aria-hidden>🎁</span>
            <p className={s.hiddenTitle}>{partner.name} has planned something.</p>
            <p className={s.hiddenBody}>
              It is {countdownLabel(today(), plan.date).toLowerCase()} away. That is all you get for now.
            </p>
          </div>
        </Screen>
      </>
    );
  }

  return (
    <>
      <BackBar
        title={`Your ${meta.cadence} moment`}
        actionLabel={cycle.completedAt ? undefined : 'Edit'}
        onAction={() => navigate(`/plan/${plan.id}/edit`)}
        bleed
      />
      <Screen>
        <div className={s.hero} data-tier={tier}>
          {plan.trip?.heroImage ? (
            <>
              <Photo src={plan.trip.heroImage} seed={plan.id} className={s.heroImg} alt="" />
              <span className={s.heroScrim} aria-hidden />
            </>
          ) : null}
          <div className={[s.heroInner, onPhoto ? s.onPhoto : ''].filter(Boolean).join(' ')}>
            <span className={s.emoji} aria-hidden>{plan.emoji}</span>
            <p className={s.cadence}>Every {meta.cadence}</p>
            <h1 className={s.title}>{plan.title}</h1>
            <p className={s.when}>
              <span>
                {formatPlanDate(plan.date)}
                {plan.time ? ` · ${plan.time}` : ''}
              </span>
              <span className={s.countdown}>
                {cycle.completedAt ? 'Done ✓' : countdownLabel(today(), plan.date)}
              </span>
            </p>
          </div>
        </div>

        {/* Invite state lives on the plan, where the couple already is. */}
        {!cycle.completedAt ? (
          <div className={s.inviteRow} data-state={status}>
            {status === 'planned' ? (
              <>
                <p className={s.inviteText}>
                  {partner.name} doesn't know about this yet.
                </p>
                <Button variant="accent" size="sm" onClick={() => setAsking(true)}>
                  Ask {partner.name} 💌
                </Button>
              </>
            ) : status === 'invited' ? (
              <>
                <p className={s.inviteText}>💌 Invite sent — waiting on {partner.name}.</p>
                <div className={s.inviteActions}>
                  <Button variant="quiet" size="sm" onClick={() => setAsking(true)}>
                    Share again
                  </Button>
                  {/* No real partner device in the prototype, so acceptance is simulated
                      rather than faked silently. */}
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      dispatch({ type: 'respondToInvite', planId: plan.id, response: 'yes' });
                      toast.show({ emoji: '❤️', message: `${partner.name} said yes` });
                    }}
                  >
                    Simulate yes
                  </Button>
                </div>
              </>
            ) : (
              <p className={s.inviteText}>❤️ You're on. {partner.name} said yes.</p>
            )}
          </div>
        ) : null}

        <div className={s.details}>
          {plan.place ? (
            <div className={s.detail}>
              <span className={s.detailLabel}>Where</span>
              <span className={s.detailValue}>{plan.place}</span>
            </div>
          ) : null}
          {plan.trip?.transport ? (
            <div className={s.detail}>
              <span className={s.detailLabel}>Getting there</span>
              <span className={s.detailValue}>{plan.trip.transport}</span>
            </div>
          ) : null}
          {plan.cost ? (
            <div className={s.detail}>
              <span className={s.detailLabel}>{tier === 'month' ? 'Budget' : 'Cost'}</span>
              <span className={s.detailValue}>
                {plan.cost}
                {plan.reserved ? ' · reserved ✓' : ''}
              </span>
            </div>
          ) : null}
          {plan.note ? (
            <div className={s.detail}>
              <span className={s.detailLabel}>Notes</span>
              <span className={s.detailValue}>{plan.note}</span>
            </div>
          ) : null}
          {plan.link ? (
            <div className={s.detail}>
              <span className={s.detailLabel}>Link</span>
              <a className={s.detailLink} href={plan.link} target="_blank" rel="noopener noreferrer">
                Open
              </a>
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

        <PlanningHelpers tier={tier} destination={destination} />

        {!cycle.completedAt ? (
          <div className={s.actions}>
            <Button variant="accent" size="lg" block onClick={complete}>
              We did this
            </Button>
            <ButtonLink to={`/explore?cycle=${cycle.id}`} variant="secondary" block>
              Browse other ideas
            </ButtonLink>
          </div>
        ) : cycle.memoryId ? (
          <div className={s.done}>
            <p className={s.doneTitle}>Another memory made ✓</p>
            <p className={s.doneBody}>This one is in your 777 story.</p>
            <ButtonLink to={`/memories/${cycle.memoryId}`} variant="secondary" size="sm">
              Open the memory
            </ButtonLink>
          </div>
        ) : (
          <div className={s.done}>
            <p className={s.doneTitle}>How was it?</p>
            <p className={s.doneBody}>Add a photo and a line each, while it is still fresh.</p>
            <ButtonLink to={`/memories/new?cycle=${cycle.id}`} variant="accent" size="sm">
              Turn this into a memory
            </ButtonLink>
          </div>
        )}

        {plan.trip ? <TripSpace plan={plan} /> : null}
      </Screen>

      <InviteSheet plan={plan} tier={tier} open={asking} onClose={() => setAsking(false)} />
    </>
  );
}

/* ------------------------- Bigger-adventure space ------------------------- */

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
          <Button variant="secondary" size="sm" type="submit">Add</Button>
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
          <Button variant="secondary" size="sm" type="submit">Add</Button>
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

export { CYCLE_NOUN };
