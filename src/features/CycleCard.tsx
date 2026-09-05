import type { CSSProperties } from 'react';
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

/* The compass is the one the Explore tab already uses — "Find an idea" goes
   to Explore, so the button and the destination wear the same mark. Both are
   drawn here at the size the buttons need rather than scaled down from 22px,
   which would have thinned their strokes. */
const COMPASS = (
  <svg viewBox="0 0 24 24" width="17" height="17" aria-hidden>
    <circle cx="12" cy="12" r="8.2" fill="none" stroke="currentColor" strokeWidth="1.7" />
    <path
      d="m15 9-2 4.2-4 1.8 2-4.2z"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const PLUS = (
  <svg viewBox="0 0 24 24" width="17" height="17" aria-hidden>
    <path
      d="M12 5.2v13.6M5.2 12h13.6"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

/* The orbit, in the one place both the drawn ellipse and the heart's track
   read it from. The track is a circle of ORBIT_RX squashed to ORBIT_RY/ORBIT_RX
   and tilted, so these three numbers decide both. */
const ORBIT_RX = 168;
const ORBIT_RY = 63;
const ORBIT_TILT = -14;

const HEART = (
  <svg viewBox="0 0 16 16" width="11" height="11" aria-hidden>
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
    <div
      className={s.hero}
      data-tier={view.cycle.tier}
      style={
        {
          '--orbit-rx': `${ORBIT_RX}px`,
          '--orbit-squash': ORBIT_RY / ORBIT_RX,
          '--orbit-tilt': `${ORBIT_TILT}deg`,
        } as CSSProperties
      }
    >
      {/*
        A planet, one orbit around it, and two travellers — not a card. The
        countdown is standing in the middle of a small piece of sky, so there
        is no panel, no border and no shadow behind it: the round shapes carry
        the composition and the page shows through everywhere else.

        The heart is moved by two nested rotations rather than an `offset-path`
        so it works the same everywhere: the track is a circle squashed and
        tilted into the orbit's ellipse, and the heart counter-rotates and
        counter-squashes by exactly the same amounts, which leaves it upright
        and perfectly round the whole way round.
      */}
      <div className={s.sky} aria-hidden>
        <span className={s.planet} />

        <svg className={s.orbitArt} viewBox="0 0 360 260" preserveAspectRatio="xMidYMid meet">
          <ellipse
            cx="180"
            cy="130"
            rx={ORBIT_RX}
            ry={ORBIT_RY}
            transform={`rotate(${ORBIT_TILT} 180 130)`}
            fill="none"
            stroke="var(--edge)"
            strokeWidth="1"
          />
        </svg>

        <div className={s.track}>
          <div className={s.spin}>
            <span className={s.node}>
              <span className={s.nodeInner}>{HEART}</span>
            </span>
          </div>
        </div>

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
            <ButtonLink
              to={`/explore?cycle=${view.cycle.id}`}
              variant="accent"
              size="sm"
              icon={COMPASS}
            >
              Find an idea
            </ButtonLink>
            <ButtonLink
              to={`/plan/new?cycle=${view.cycle.id}`}
              variant="quiet"
              size="sm"
              icon={PLUS}
            >
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
