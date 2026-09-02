import { Link } from 'react-router-dom';
import { Button, ButtonLink } from '@/components/ui/Button';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { formatPlanDate, TIER_META } from '@/lib/dates';
import type { RitualStatus } from '@/lib/selectors';
import { useStore } from '@/context/store';
import s from './RitualCard.module.css';

const CHEV = (
  <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden>
    <path
      d="M9 5l7 7-7 7"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/**
 * A partner's surprise plan stays hidden — you see that something exists,
 * not what it is. Privacy is a feature, so it is enforced at render.
 */
function isHidden(status: RitualStatus, meId: string) {
  return Boolean(status.plan?.surprise && status.plan.createdBy !== meId);
}

export function RitualCardCompact({ status }: { status: RitualStatus }) {
  const { me } = useStore();
  const meta = TIER_META[status.tier];
  const hidden = isHidden(status, me.id);
  const plan = status.plan;

  return (
    <Link
      to={plan ? `/plan/${plan.id}` : `/plan/new/${status.tier}`}
      className={s.card}
      data-tier={status.tier}
    >
      <div className={s.compact}>
        <span className={s.dot} aria-hidden />
        <div className={s.compactMain}>
          <p className={s.cadence}>{meta.cadence}</p>
          <p className={[s.compactTitle, !plan ? s.compactEmpty : ''].filter(Boolean).join(' ')}>
            {hidden
              ? '🎁 A surprise, from them'
              : plan
                ? `${plan.emoji} ${plan.title}`
                : 'Nothing planned yet'}
          </p>
        </div>
        <span className={s.compactCount}>{status.label}</span>
        <span className={s.chev}>{CHEV}</span>
      </div>
    </Link>
  );
}

export function RitualCardHero({ status }: { status: RitualStatus }) {
  const { me } = useStore();
  const meta = TIER_META[status.tier];
  const plan = status.plan;
  const hidden = isHidden(status, me.id);
  const days = Math.max(0, status.daysAway);

  return (
    <div className={`${s.card} ${s.hero}`} data-tier={status.tier}>
      <div className={s.heroTop}>
        <span className={s.heroCadence}>Every {meta.cadence}</span>
        <ProgressRing progress={status.progress} size={40} stroke={3} className={s.ring}>
          <span className={s.ringNum}>{days > 99 ? '99+' : days}</span>
        </ProgressRing>
      </div>

      <p className={s.heroCount}>{status.overdue ? "It's time" : status.label}</p>
      <p className={s.heroLabel}>
        {status.overdue ? `${meta.label} is due` : meta.label}
      </p>

      {plan ? (
        <>
          <Link to={`/plan/${plan.id}`} className={s.heroPlan}>
            <span className={s.heroEmoji} aria-hidden>
              {hidden ? '🎁' : plan.emoji}
            </span>
            <div className={s.heroPlanMain}>
              <p className={s.heroPlanTitle}>{hidden ? 'A surprise, from them' : plan.title}</p>
              <p className={s.heroPlanMeta}>
                {formatPlanDate(plan.date)}
                {!hidden && plan.place ? ` · ${plan.place}` : ''}
              </p>
            </div>
            {plan.surprise && plan.createdBy === me.id ? (
              <span className={s.surprise}>🤫 Hidden</span>
            ) : null}
          </Link>
          <div className={s.actions}>
            <ButtonLink to={`/plan/${plan.id}`} variant="secondary" size="sm">
              See the plan
            </ButtonLink>
            {!hidden ? (
              <ButtonLink to={`/explore?tier=${status.tier}`} variant="quiet" size="sm">
                Browse ideas
              </ButtonLink>
            ) : null}
          </div>
        </>
      ) : (
        <>
          <p className={s.heroEmpty}>{meta.hint}</p>
          <div className={s.actions}>
            <ButtonLink to={`/plan/new/${status.tier}`} variant="accent" size="sm">
              Plan something together
            </ButtonLink>
            <ButtonLink to={`/explore?tier=${status.tier}`} variant="quiet" size="sm">
              Give me ideas
            </ButtonLink>
          </div>
        </>
      )}
    </div>
  );
}

/** Used on the plan detail screen to close the loop. */
export function CompleteButton({ onComplete }: { onComplete: () => void }) {
  return (
    <Button variant="accent" block onClick={onComplete}>
      We did this
    </Button>
  );
}
