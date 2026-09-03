import { Link } from 'react-router-dom';
import { ButtonLink } from '@/components/ui/Button';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { formatPlanDate, TIER_META } from '@/lib/dates';
import { CYCLE_NOUN, cycleHeadline, type CycleView } from '@/lib/cycles';
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

/**
 * The hero. Which cycle gets it is decided by attention, not by tier — see
 * `attentionScore` — so a confirmed date steps aside for an unplanned getaway.
 */
export function CycleCardHero({ view }: { view: CycleView }) {
  const { me, partner } = useStore();
  const meta = TIER_META[view.cycle.tier];
  const plan = view.plan;
  const isHidden = hidden(view, me.id);

  return (
    <div className={`${s.card} ${s.hero}`} data-tier={view.cycle.tier}>
      <div className={s.heroTop}>
        <span className={s.heroCadence}>Every {meta.cadence}</span>
        <ProgressRing progress={view.progress} size={40} stroke={3} className={s.ring}>
          <span className={s.ringNum}>{view.overdue ? '·' : Math.max(0, view.daysAway)}</span>
        </ProgressRing>
      </div>

      <p className={s.heroHeadline}>{cycleHeadline(view)}</p>

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
          <p className={s.heroEmpty}>{meta.hint}</p>
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
  );
}

export { CYCLE_NOUN };
