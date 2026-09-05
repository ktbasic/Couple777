import { Link } from 'react-router-dom';
import { ButtonLink } from '@/components/ui/Button';
import { CosmicAccent } from '@/components/ui/CosmicPair';
import { formatPlanDate, TIER_META } from '@/lib/dates';
import { CYCLE_NOUN, type CycleView } from '@/lib/cycles';
import { useStore } from '@/context/store';
import s from './CycleCard.module.css';

const CHEV = (
  <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden>
    <path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const STATUS_CHIP: Record<CycleView['status'], { label: string; emoji?: string } | null> = {
  upcoming: null,
  planned: { label: 'Planned' },
  invited: { label: 'Invite sent', emoji: '💌' },
  confirmed: { label: "You're on", emoji: '❤️' },
  completed: { label: 'Made', emoji: '✓' },
};

/** A partner's surprise stays hidden — you see that something exists, not what. */
function hidden(view: CycleView, meId: string) {
  return Boolean(view.plan?.surprise && view.plan.createdBy !== meId);
}

function StatusChip({ view }: { view: CycleView }) {
  const chip = STATUS_CHIP[view.status];
  if (!chip) return null;
  return (
    <span className={s.status} data-state={view.status}>
      {chip.emoji ? <span aria-hidden>{chip.emoji}</span> : null}
      {chip.label}
    </span>
  );
}

export function CycleCardCompact({ view }: { view: CycleView }) {
  const { me } = useStore();
  const meta = TIER_META[view.cycle.tier];
  const isHidden = hidden(view, me.id);
  const plan = view.plan;

  return (
    <Link
      to={plan ? `/plan/${plan.id}` : `/plan/new?cycle=${view.cycle.id}`}
      className={s.card}
      data-tier={view.cycle.tier}
    >
      <div className={s.compact}>
        <span className={s.dot} aria-hidden />
        <div className={s.compactMain}>
          <p className={s.cadence}>{meta.cadence}</p>
          <p className={[s.compactTitle, !plan ? s.compactEmpty : ''].filter(Boolean).join(' ')}>
            {isHidden ? '🎁 A surprise, from them' : plan ? `${plan.emoji} ${plan.title}` : 'Nothing planned yet'}
          </p>
        </div>
        {view.status === 'confirmed' || view.status === 'invited' ? (
          <span className={s.compactStatus}>
            <StatusChip view={view} />
          </span>
        ) : (
          <span className={s.compactCount}>
            {view.overdue ? 'Open' : `${view.daysAway} days`}
          </span>
        )}
        <span className={s.chev}>{CHEV}</span>
      </div>
    </Link>
  );
}

const HEART = (
  <svg viewBox="0 0 16 16" width="9" height="9" aria-hidden>
    <path
      d="M8 13.6C3.7 10.6 1.6 8.4 1.6 5.9 1.6 3.9 3.1 2.4 5 2.4c1.2 0 2.3.6 3 1.6.7-1 1.8-1.6 3-1.6 1.9 0 3.4 1.5 3.4 3.5 0 2.5-2.1 4.7-6.4 7.7Z"
      fill="currentColor"
    />
  </svg>
);

/**
 * The countdown, as an editorial line rather than a sentence.
 *
 * A number is the one thing on this screen worth reading from across the
 * room, so it gets to be a number. The days that have no number — today,
 * tomorrow, and a cycle that has slipped — say the word instead, at a size
 * that keeps the block the same shape.
 */
function countdown(view: CycleView): { big: string; unit: string | null; sub: string } {
  const noun = CYCLE_NOUN[view.cycle.tier];
  if (view.overdue) return { big: 'Now', unit: null, sub: `is a good time for your next ${noun}.` };
  if (view.daysAway === 0) return { big: 'Today', unit: null, sub: `your ${noun} is here.` };
  if (view.daysAway === 1) return { big: 'Tomorrow', unit: null, sub: `your ${noun} is almost here.` };
  return { big: String(view.daysAway), unit: 'days', sub: `to your next ${noun}.` };
}

/**
 * The hero. Which cycle gets it is decided by attention, not by tier — see
 * `attentionScore` — so a confirmed date steps aside for an unplanned getaway.
 */
export function CycleCardHero({ view }: { view: CycleView }) {
  const { me, partner } = useStore();
  const meta = TIER_META[view.cycle.tier];
  const plan = view.plan;
  const isHidden = hidden(view, me.id);
  const count = countdown(view);

  return (
    <div className={`${s.card} ${s.hero}`} data-tier={view.cycle.tier}>
      {/* One glow, one orbit, two small travellers. Everything here is behind
          the type and out of the way of it: the countdown is the subject and
          this is the room it sits in. */}
      <div className={s.decor} aria-hidden>
        <span className={s.aura} />
        <span className={s.orbit}>
          <span className={s.orbitNode}>{HEART}</span>
        </span>
        <CosmicAccent className={s.moteA} tone="warm" />
        <CosmicAccent className={s.moteB} tone="cool" flip />
      </div>

      <div className={s.heroBody}>
        <p className={s.heroCadence}>Every {meta.cadence}</p>

        <p className={s.count} data-word={count.unit ? undefined : ''}>
          {count.big}
        </p>
        {count.unit ? <p className={s.unit}>{count.unit}</p> : null}
        <p className={s.sub}>{count.sub}</p>

      {plan ? (
        <>
          <Link to={`/plan/${plan.id}`} className={s.heroPlan}>
            <span className={s.heroEmoji} aria-hidden>
              {isHidden ? '🎁' : plan.emoji}
            </span>
            <div className={s.heroPlanMain}>
              <p className={s.heroPlanTitle}>{isHidden ? 'A surprise, from them' : plan.title}</p>
              <p className={s.heroPlanMeta}>
                {formatPlanDate(plan.date)}
                {plan.time ? ` · ${plan.time}` : ''}
                {!isHidden && plan.place ? ` · ${plan.place}` : ''}
              </p>
            </div>
          </Link>

          <div className={s.actions}>
            <StatusChip view={view} />
            {view.status === 'planned' && !isHidden ? (
              <ButtonLink to={`/plan/${plan.id}?ask=1`} variant="accent" size="sm">
                Ask {partner.name} 💌
              </ButtonLink>
            ) : (
              <ButtonLink to={`/plan/${plan.id}`} variant="secondary" size="sm">
                See plan
              </ButtonLink>
            )}
          </div>
        </>
      ) : (
        <>
          <div className={s.actions}>
            <ButtonLink to={`/explore?cycle=${view.cycle.id}`} variant="accent" size="sm">
              Find an idea
            </ButtonLink>
            <ButtonLink to={`/plan/new?cycle=${view.cycle.id}`} variant="quiet" size="sm">
              Create my own
            </ButtonLink>
          </div>
        </>
      )}
      </div>
    </div>
  );
}

export { CYCLE_NOUN };
