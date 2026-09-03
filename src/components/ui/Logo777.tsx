import { useId } from 'react';
import s from './Logo777.module.css';

/**
 * Geometry notes, so the parts stay in register if anyone nudges them:
 *
 *   - Each 7 is drawn as a path (not type) so the mark is identical on every
 *     platform — a system font would reflow the whole lockup on Android.
 *   - The two rings are r=47 at cx 82 / 138, so they cross at (110, 22.2) and
 *     (110, 97.8). The heart sits on that lower crossing on purpose: it is the
 *     point where the two lives overlap.
 *   - Rings carry pathLength="100", which makes the draw-on animation a plain
 *     100 -> 0 dash offset regardless of their real circumference, and they are
 *     rotated -90deg so the stroke starts at the top and closes at the heart.
 */

const SEVEN =
  'M2 0H28.5C29.9 0 30.7 1.5 30.1 2.8L15.6 43.6C15.2 44.5 14.4 45 13.4 45H7.6' +
  'C6.1 45 5.1 43.5 5.6 42.1L18.8 8.6H2C0.9 8.6 0 7.7 0 6.6V2C0 0.9 0.9 0 2 0Z';

const HEART =
  'M0 7C-1.2 5.6 -8 1.4 -8 -3.2C-8 -6.2 -5.8 -8 -3.4 -8C-1.7 -8 -0.5 -7 0 -6.1' +
  'C0.5 -7 1.7 -8 3.4 -8C5.8 -8 8 -6.2 8 -3.2C8 1.4 1.2 5.6 0 7Z';

/**
 * The digits live in their own space centred on (0, 0) — 30 wide, 8 apart, so
 * the trio spans -53..53 — and the group below scales and leans them to sit
 * inside the rings with air around them.
 *
 * Each 7 gets its own gradient rather than sharing one: a shared gradient
 * resolves inside each digit's own local space, so all three would come out
 * identical. Chaining the stops (each digit ends on the colour the next one
 * starts from) makes one pink-to-peach ramp read across the whole 777.
 */
const DIGIT_RAMP = [
  ['#EE4B8D', '#F26580'],
  ['#F26580', '#F58A78'],
  ['#F58A78', '#FBAE72'],
];
const DIGIT_X = [-53, -15, 23];
/** A few degrees of lean — enough to feel drawn rather than typed. */
const DIGIT_LEAN = -6;

/**
 * `dense` is the app-icon cut: heavier rings and a larger 777, because at
 * 40px the regular weight silts up into a pink smudge. Same drawing, tuned so
 * it survives being small.
 */
const WEIGHTS = {
  regular: { digits: 0.83, stroke: 2.3, heart: 0.85 },
  dense: { digits: 0.92, stroke: 3.4, heart: 1 },
};

export function Logo777({
  animated = false,
  dense = false,
  className,
  title = 'Couple777',
}: {
  animated?: boolean;
  dense?: boolean;
  className?: string;
  title?: string;
}) {
  const w = dense ? WEIGHTS.dense : WEIGHTS.regular;
  // Two of these can be on screen at once, so the gradient ids must not collide.
  const uid = useId().replace(/:/g, '');
  const gDigits = `${uid}-d`;
  const gRingA = `${uid}-a`;
  const gRingB = `${uid}-b`;
  const gHeart = `${uid}-h`;

  return (
    <svg
      viewBox="0 0 220 120"
      role="img"
      aria-label={title}
      className={[s.svg, animated ? s.animated : '', className].filter(Boolean).join(' ')}
    >
      <defs>
        {DIGIT_RAMP.map(([from, to], i) => (
          <linearGradient key={i} id={`${gDigits}${i}`} x1="0" y1="0.15" x2="1" y2="0.85">
            <stop offset="0" stopColor={from} />
            <stop offset="1" stopColor={to} />
          </linearGradient>
        ))}
        <linearGradient id={gRingA} x1="0.1" y1="0" x2="0.9" y2="1">
          <stop offset="0" stopColor="#F6A2BE" />
          <stop offset="1" stopColor="#EF6E9B" />
        </linearGradient>
        <linearGradient id={gRingB} x1="0.1" y1="1" x2="0.9" y2="0">
          <stop offset="0" stopColor="#F79C7B" />
          <stop offset="1" stopColor="#FBC79C" />
        </linearGradient>
        <linearGradient id={gHeart} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#F1638F" />
          <stop offset="1" stopColor="#F5837F" />
        </linearGradient>
      </defs>

      {/* Rings first, so the 777 always reads on top of them. */}
      <g fill="none" strokeWidth={w.stroke} strokeLinecap="round">
        <circle
          className={s.ringA}
          cx="82"
          cy="60"
          r="47"
          pathLength="100"
          stroke={`url(#${gRingA})`}
          transform="rotate(-90 82 60)"
        />
        <circle
          className={s.ringB}
          cx="138"
          cy="60"
          r="47"
          pathLength="100"
          stroke={`url(#${gRingB})`}
          transform="rotate(-90 138 60)"
        />
      </g>

      {/* The placing transforms live on the <g>s so CSS is free to own the
          transform of each <path> without fighting them. */}
      <g transform={`translate(110 60) scale(${w.digits}) skewX(${DIGIT_LEAN})`}>
        {DIGIT_X.map((x, i) => (
          <g key={x} transform={`translate(${x} -22.5)`}>
            <path
              className={s[`digit${i + 1}` as 'digit1' | 'digit2' | 'digit3']}
              d={SEVEN}
              fill={`url(#${gDigits}${i})`}
            />
          </g>
        ))}
      </g>

      <g transform={`translate(110 98) scale(${w.heart})`}>
        <path className={s.heart} d={HEART} fill={`url(#${gHeart})`} />
      </g>
    </svg>
  );
}

/**
 * The app icon. It carries its own off-white ground rather than sitting
 * transparent, which is what lets one asset work on both a light and a dark
 * home screen — the same trick public/favicon.svg uses.
 *
 * `tone="on-accent"` flips it: the mark in white on the brand gradient. Below
 * roughly 56px the hairline rings fall under a pixel and the whole thing goes
 * to a pale smudge, so anywhere the icon appears small inside the app it wants
 * this cut instead.
 */
export function AppIcon({
  className,
  tone = 'ground',
  label = 'Couple777',
}: {
  className?: string;
  tone?: 'ground' | 'on-accent';
  label?: string;
}) {
  return (
    <span
      className={[s.icon, tone === 'on-accent' ? s.iconOnAccent : '', className]
        .filter(Boolean)
        .join(' ')}
    >
      <Logo777 dense title={label} className={s.iconMark} />
    </span>
  );
}
