import { useId } from 'react';
import s from './CosmicPair.module.css';

/**
 * The welcome screen's hero: two small travellers drifting toward each other
 * across a very large, very soft universe.
 *
 * Drawn rather than shipped as an asset, for the same reason the avatars are —
 * it stays sharp at any size, weighs nothing, and takes its colours from the
 * same palette as everything around it.
 *
 * The motion is the point of the piece, and all of it lives in the stylesheet
 * so a phone can hand it to the compositor: each traveller drifts on its own
 * unhurried cycle, breathes on another, and their antennae trail a beat
 * behind. The two cycles are deliberately coprime-ish (9s against 11s), so the
 * pair never falls into step and the loop never reads as a loop.
 *
 * Geometry: a 320x240 field. Each traveller is drawn facing right, centred on
 * its own origin, and the right-hand one is mirrored — which is what keeps
 * their hands meeting in the middle whatever else changes.
 */

interface TravellerProps {
  /** Prefix for this instance's gradient ids. */
  uid: string;
  /** 'warm' is the pink-to-peach brand gradient; 'cool' its mauve answer. */
  tone: 'warm' | 'cool';
  /**
   * Set on the traveller that is drawn mirrored, to un-mirror the face.
   *
   * The eye highlights sit up and to the left, which is what makes them read
   * as catchlights from one light source rather than as a pattern. Mirroring
   * the body flips them to the right on that character, and the pair stops
   * looking like it was lit by the same star.
   */
  faceFlip?: boolean;
}

const TONES = {
  warm: {
    from: '#F79C7B',
    to: '#EE5D91',
    deep: '#D14577',
    band: '#6E4B7A',
    trail: '#F9A98D',
  },
  cool: {
    from: '#8FA9F0',
    to: '#A98BE0',
    deep: '#7E54A4',
    band: '#4F4478',
    trail: '#A6B6F2',
  },
} as const;

/** One traveller, facing right, drawn around (0, 0). */
function Traveller({ uid, tone, faceFlip = false }: TravellerProps) {
  const c = TONES[tone];
  const body = `${uid}-body-${tone}`;
  const trail = `${uid}-trail-${tone}`;

  return (
    <>
      <defs>
        <linearGradient id={body} x1="0" y1="-24" x2="18" y2="46" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={c.from} />
          <stop offset="100%" stopColor={c.to} />
        </linearGradient>
        <linearGradient id={trail} x1="-104" y1="0" x2="-10" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={c.trail} stopOpacity="0" />
          <stop offset="100%" stopColor={c.trail} stopOpacity="0.55" />
        </linearGradient>
      </defs>

      {/* The wake they have left behind them. */}
      <path
        className={s.trail}
        d="M -14 32 C -44 44, -74 40, -102 24"
        stroke={`url(#${trail})`}
        strokeWidth="30"
        strokeLinecap="round"
        fill="none"
      />

      {/* The soft bubble each of them travels in. */}
      <circle cx="0" cy="-2" r="34" fill="#FFFFFF" opacity="0.5" />
      <circle cx="0" cy="-2" r="34" fill={c.from} opacity="0.08" />

      <g className={s.breathe}>
        {/* Trailing legs, swept back by the drift. */}
        <path
          d="M -6 34 C -22 44, -38 46, -52 40 C -38 34, -20 30, -6 28 Z"
          fill={`url(#${body})`}
          opacity="0.9"
        />

        {/* Body. */}
        <ellipse cx="0" cy="26" rx="21" ry="17" fill={`url(#${body})`} />
        {/* The band at the waist, the one dark note in the whole picture. */}
        <path
          d="M -13 17 C -6 22, 8 23, 16 18 L 18 27 C 8 32, -6 31, -14 26 Z"
          fill={c.band}
          opacity="0.85"
        />

        {/* The arm reaching across. */}
        <path
          className={s.reach}
          d="M 13 24 C 28 22, 40 16, 52 11"
          stroke={`url(#${body})`}
          strokeWidth="13"
          strokeLinecap="round"
          fill="none"
        />
        <circle className={s.reach} cx="53" cy="10" r="7.5" fill={c.from} />

        {/* Head. */}
        <circle cx="0" cy="-2" r="23" fill={`url(#${body})`} />

        {/* Antennae, a beat behind the drift. */}
        <g className={s.antennae}>
          <path
            d="M -9 -20 C -13 -29, -15 -34, -15 -39"
            stroke={c.deep}
            strokeWidth="2.6"
            strokeLinecap="round"
            fill="none"
          />
          <circle cx="-15" cy="-41" r="4" fill={c.deep} />
          <path
            d="M 8 -21 C 12 -30, 14 -35, 14 -40"
            stroke={c.deep}
            strokeWidth="2.6"
            strokeLinecap="round"
            fill="none"
          />
          <circle cx="14" cy="-42" r="4" fill={c.deep} />
        </g>

        {/* A face that is already pleased about all this.
            Two big rounded eyes doing nearly all the work: a large catchlight
            up and to the left, a small one opposite it, and a mouth small
            enough that the eyes stay the thing you look at. */}
        <g transform={faceFlip ? 'scale(-1 1)' : undefined}>
          <Eye x={-9} y={-1} />
          <Eye x={9} y={-1} />

          <path
            d="M -4.2 10.5 C -4.2 9.6, -3.4 9.2, 0 9.2 C 3.4 9.2, 4.2 9.6, 4.2 10.5
               C 4.2 14.2, 2.2 16, 0 16 C -2.2 16, -4.2 14.2, -4.2 10.5 Z"
            fill="#5E2036"
          />
          <path
            d="M -2.4 13.4 C -1.6 12.9, 1.6 12.9, 2.4 13.4 C 2.1 15.3, 1.1 16, 0 16
               C -1.1 16, -2.1 15.3, -2.4 13.4 Z"
            fill="#F2778F"
          />
        </g>
      </g>
    </>
  );
}

/** One eye: the dark almond, then its two catchlights. */
function Eye({ x, y }: { x: number; y: number }) {
  return (
    <>
      <ellipse cx={x} cy={y} rx="6.6" ry="8.1" fill="#241E2B" />
      <circle cx={x - 2.3} cy={y - 3.1} r="2.8" fill="#FFFFFF" />
      <circle cx={x + 2.4} cy={y + 3.2} r="1.4" fill="#FFFFFF" opacity="0.9" />
    </>
  );
}

function Sparkle({ x, y, r, fill, className }: {
  x: number; y: number; r: number; fill: string; className?: string;
}) {
  return (
    <path
      className={className}
      d={`M ${x} ${y - r} Q ${x + r * 0.22} ${y - r * 0.22} ${x + r} ${y}
          Q ${x + r * 0.22} ${y + r * 0.22} ${x} ${y + r}
          Q ${x - r * 0.22} ${y + r * 0.22} ${x - r} ${y}
          Q ${x - r * 0.22} ${y - r * 0.22} ${x} ${y - r} Z`}
      fill={fill}
    />
  );
}

export function CosmicPair() {
  const uid = `cp-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;

  return (
    <svg
      className={s.svg}
      viewBox="0 0 320 240"
      role="img"
      aria-label="Two small travellers drifting toward each other across a wide, soft universe"
    >
      <defs>
        <radialGradient id={`${uid}-moon`} cx="0.35" cy="0.32" r="0.78">
          <stop offset="0%" stopColor="#F4EEF8" />
          <stop offset="100%" stopColor="#EADFF0" />
        </radialGradient>
        <linearGradient id={`${uid}-planet`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#F7A9BD" />
          <stop offset="100%" stopColor="#EE7FA0" />
        </linearGradient>
        <linearGradient id={`${uid}-heart`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#F5789F" />
          <stop offset="100%" stopColor="#EE5D91" />
        </linearGradient>
      </defs>

      {/* ---- The universe they are small in ---- */}

      {/* A moon, mostly off the edge, because the frame cannot hold it. */}
      <g opacity="0.55">
        <circle cx="300" cy="52" r="46" fill={`url(#${uid}-moon)`} />
        <circle cx="286" cy="38" r="9" fill="#E2D4EA" opacity="0.7" />
        <circle cx="310" cy="70" r="6" fill="#E2D4EA" opacity="0.6" />
        <circle cx="316" cy="34" r="4" fill="#E2D4EA" opacity="0.5" />
      </g>

      {/* A ringed planet. */}
      <g className={s.planet} opacity="0.75">
        <circle cx="56" cy="46" r="21" fill={`url(#${uid}-planet)`} opacity="0.55" />
        <ellipse
          cx="56"
          cy="46"
          rx="35"
          ry="9"
          fill="none"
          stroke="#F6B79C"
          strokeWidth="3"
          opacity="0.75"
          transform="rotate(-18 56 46)"
        />
      </g>

      <Sparkle className={s.tw1} x={186} y={44} r={7} fill="#F5C98E" />
      <Sparkle className={s.tw2} x={246} y={30} r={5} fill="#A9B6EE" />
      <Sparkle className={s.tw3} x={30} y={104} r={5.5} fill="#F6C08C" />
      <Sparkle className={s.tw1} x={80} y={158} r={4} fill="#A9B6EE" />
      <Sparkle className={s.tw2} x={276} y={132} r={4.5} fill="#F3A9BE" />

      <circle className={s.tw3} cx="122" cy="34" r="3" fill="#F3B9C9" opacity="0.8" />
      <circle className={s.tw1} cx="262" cy="96" r="2.6" fill="#F0AEBF" opacity="0.75" />
      <circle className={s.tw2} cx="44" cy="150" r="2.4" fill="#F5C6A2" opacity="0.8" />

      {/* ---- The two of them ---- */}

      {/* Placement on the outer group, motion on the inner one — a CSS
          transform replaces the attribute rather than adding to it. */}
      <g transform="translate(96 132)">
        <g className={s.left}>
          <Traveller uid={uid} tone="warm" />
        </g>
      </g>

      <g transform="translate(224 138)">
        <g className={s.right}>
          <g transform="scale(-1 1)">
            <Traveller uid={uid} tone="cool" faceFlip />
          </g>
        </g>
      </g>

      {/* What is happening in the gap between their hands. */}
      <g transform="translate(160 116)">
        <g className={s.heart}>
        <path
          d="M 0 9 C -9 2, -13 -3, -13 -8 C -13 -13, -9 -16, -5 -16
             C -2 -16, 0 -14, 0 -12 C 0 -14, 2 -16, 5 -16
             C 9 -16, 13 -13, 13 -8 C 13 -3, 9 2, 0 9 Z"
          fill={`url(#${uid}-heart)`}
        />
        <path
          d="M -20 -18 L -25 -24 M 0 -24 L 0 -32 M 20 -18 L 25 -24"
          stroke="#F5789F"
          strokeWidth="2.6"
          strokeLinecap="round"
          opacity="0.7"
        />
        </g>
      </g>

      {/* ---- The clouds they are drifting above ---- */}
      <g opacity="0.5">
        <path
          d="M -10 240 C 10 210, 46 206, 66 222 C 84 204, 116 210, 124 232
             C 140 224, 158 232, 162 240 Z"
          fill="#FBDDE4"
        />
        <path
          d="M 196 240 C 206 220, 236 214, 252 228 C 268 212, 300 216, 310 236
             C 318 232, 326 236, 330 240 Z"
          fill="#FCE4E6"
        />
      </g>
    </svg>
  );
}
