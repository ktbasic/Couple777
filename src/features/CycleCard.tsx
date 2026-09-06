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

/*
 * The orbit, in the one place the drawn ellipse and the heart's track both
 * read it from. The track is a circle of ORBIT_RX squashed to
 * ORBIT_RY/ORBIT_RX and tilted, so these three numbers decide both.
 *
 * The tilt is what keeps the heart off the type. A shallow ellipse puts its
 * highest and lowest points near the middle of the card, straight through the
 * kicker and the sub-line; steepening it swings those points out to roughly
 * ±115px, where there is nothing to collide with.
 */
const ORBIT_RX = 186;
const ORBIT_RY = 76;
const ORBIT_TILT = -20;

/* The ellipse's own major-axis ends, where the near half meets the far half —
   the silhouette of the ring, and so where the two arcs are cut. */
const T = (ORBIT_TILT * Math.PI) / 180;
const END_X = ORBIT_RX * Math.cos(T);
const END_Y = ORBIT_RX * Math.sin(T);
const ORBIT_CX = 180;
const ORBIT_CY = 130;
const A = `${(ORBIT_CX + END_X).toFixed(1)} ${(ORBIT_CY + END_Y).toFixed(1)}`;
const B = `${(ORBIT_CX - END_X).toFixed(1)} ${(ORBIT_CY - END_Y).toFixed(1)}`;
const ARC = `A ${ORBIT_RX} ${ORBIT_RY} ${ORBIT_TILT} 0 1`;
/** Sweeping clockwise from the right-hand end goes down: the near half. */
const ORBIT_FRONT = `M ${A} ${ARC} ${B}`;
const ORBIT_BACK = `M ${B} ${ARC} ${A}`;

/* Shown only while the heart is crossing type, where it turns white. */
const SPARK_DOT = (
  <svg viewBox="0 0 16 16" width="9" height="9" aria-hidden>
    <path
      d="M8 0.8c.9 5.2 1.5 5.9 6.4 6.4v.2c-4.9.5-5.5 1.2-6.4 6.4h-.2C6.9 8.6 6.3 7.9 1.4 7.4v-.2C6.3 6.7 6.9 6 7.8.8Z"
      fill="currentColor"
    />
  </svg>
);

const HEART = (
  <svg viewBox="0 0 16 16" width="11" height="11" aria-hidden>
    <path
      d="M8 13.6C3.7 10.6 1.6 8.4 1.6 5.9 1.6 3.9 3.1 2.4 5 2.4c1.2 0 2.3.6 3 1.6.7-1 1.8-1.6 3-1.6 1.9 0 3.4 1.5 3.4 3.5 0 2.5-2.1 4.7-6.4 7.7Z"
      fill="currentColor"
    />
  </svg>
);

/**
 * The countdown, as two words rather than a sentence.
 *
 * A number is the one thing on this screen worth reading from across the
 * room, so it gets to be a number and "days left" gets to be the whole
 * caption. The days that have no number — today, tomorrow, and a cycle that
 * has slipped — say the word on its own, at a size that keeps the block the
 * same shape. The cadence above already says what is being counted to.
 */
function countdown(view: CycleView): { big: string; unit: string | null } {
  if (view.overdue) return { big: 'Now', unit: null };
  if (view.daysAway === 0) return { big: 'Today', unit: null };
  if (view.daysAway === 1) return { big: 'Tomorrow', unit: null };
  return { big: String(view.daysAway), unit: 'days left' };
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
        {/* The far half of the ring is drawn under the planet, so the planet
            actually covers it — and covers it softly, because the planet's
            own edge fades out rather than ending on a line. That is the whole
            difference between a ring around a sphere and an ellipse sitting
            on top of one. It is dimmed as well, for the stretch either side
            of the planet where there is nothing to hide behind. */}
        <svg className={s.orbitBack} viewBox="0 0 360 260" preserveAspectRatio="xMidYMid meet">
          <path d={ORBIT_BACK} fill="none" stroke="var(--edge)" strokeWidth="1" />
        </svg>

        <span className={s.planet} />

        <svg className={s.orbitFront} viewBox="0 0 360 260" preserveAspectRatio="xMidYMid meet">
          <path d={ORBIT_FRONT} fill="none" stroke="var(--edge)" strokeWidth="1.1" />
        </svg>

        <div className={s.track}>
          <div className={s.spin}>
            <span className={s.node}>
              <span className={s.nodeInner}>
                {HEART}
                <span className={s.nodeSpark}>{SPARK_DOT}</span>
              </span>
            </span>
          </div>
        </div>

        {/* Different periods and a head start on one of them, so the two of
            them never breathe on the same beat. */}
        <CosmicAccent className={s.moteA} tone="warm" />
        <CosmicAccent className={s.moteB} tone="cool" flip delay="-3.4s" />
      </div>

      <div className={s.heroBody}>
        <p className={s.heroCadence}>Every {meta.cadence}</p>

        <p className={s.count} data-word={count.unit ? undefined : ''}>
          {count.big}
        </p>
        {count.unit ? <p className={s.unit}>{count.unit}</p> : null}

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
