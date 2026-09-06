import type { CSSProperties } from 'react';
import { AppIcon } from '@/components/ui/Logo777';
import s from './SaveUniverse.module.css';

/**
 * The little universe above "Your 777 universe starts here" — the Couple777
 * mark with a memory, a plan and a heart circling it, drifting in now and
 * then as if being tucked away.
 *
 * It is the sign-up screen's whole argument, drawn: this is what an account
 * keeps hold of. So it is deliberately quiet — one slow revolution, one soft
 * bloom of light, nothing that asks to be watched.
 *
 * Geometry, so the parts stay in register:
 *
 *   - Every element rides one ellipse: a circle of RX, squashed to SQUASH and
 *     tilted by TILT. The chips counter-rotate, counter-squash and
 *     counter-tilt, so a card stays a square card wherever it is on the ring.
 *   - The ring below is drawn at rx=100 in its own units and sized off the
 *     same RX, so the two cannot drift apart — one number moves both, which
 *     is what the short-screen rule at the bottom of the stylesheet relies on.
 *   - RX * SQUASH must clear half the icon plus half a chip, or the chips
 *     cross the mark at the top of the orbit.
 */

const SQUASH = 0.66;
const TILT = -10;

/**
 * Three phases, evenly spread. The offsets are what keeps them apart when
 * prefers-reduced-motion stops the orbit: the angle lives on its own static
 * layer rather than in a delay, so a frozen ring is still a ring.
 */
const NODES = [
  { phase: 18, delay: '0s', art: <MemoryChip /> },
  { phase: 138, delay: '-3s', art: <PlanChip /> },
  { phase: 258, delay: '-6s', art: <HeartChip /> },
];

export function SaveUniverse() {
  return (
    <div
      className={s.universe}
      style={{ '--squash': SQUASH, '--tilt': `${TILT}deg` } as CSSProperties}
      aria-hidden
    >
      <span className={s.glow} />

      <svg className={s.ring} viewBox="-106 -70 212 140" fill="none">
        <defs>
          <linearGradient id="c777-orbit" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#EE5D91" stopOpacity="0.5" />
            <stop offset="0.5" stopColor="#C79BDC" stopOpacity="0.42" />
            <stop offset="1" stopColor="#F7B08D" stopOpacity="0.5" />
          </linearGradient>
        </defs>
        {/* rx=100 in its own units, so the stylesheet's `width` is the one
            place the ring's size is set — and ry/rx here IS --squash. */}
        <ellipse rx="100" ry="66" stroke="url(#c777-orbit)" strokeWidth="1.4" transform={`rotate(${TILT})`} />
      </svg>

      <AppIcon tone="on-accent" className={s.icon} />

      <div className={s.track}>
        {NODES.map((n) => (
          <div key={n.phase} className={s.arm} style={{ '--phase': `${n.phase}deg` } as CSSProperties}>
            <div className={s.spin}>
              {/* The one layer that moves off the ring: a small pull toward
                  the middle, which is the whole "saved" gesture. */}
              <div className={s.pull} style={{ animationDelay: n.delay }}>
                <div className={s.unspin}>
                  <div className={s.face}>{n.art}</div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** A photo, small enough that it is a shape more than a picture. */
function MemoryChip() {
  return (
    <svg className={s.chip} viewBox="0 0 26 26" width="26" height="26">
      <defs>
        <linearGradient id="c777-photo" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FBC6A8" />
          <stop offset="1" stopColor="#F293B4" />
        </linearGradient>
        <clipPath id="c777-photo-clip">
          <rect x="5" y="6" width="16" height="14" rx="3.5" />
        </clipPath>
      </defs>
      <rect x="0.6" y="0.6" width="24.8" height="24.8" rx="8" fill="#FFFFFF" stroke="#F6DCE6" strokeWidth="1.2" />
      <g clipPath="url(#c777-photo-clip)">
        <rect x="5" y="6" width="16" height="14" fill="url(#c777-photo)" />
        <circle cx="10" cy="11" r="1.9" fill="#FFFFFF" opacity="0.9" />
        <path d="M4 20.5 L10.5 13.5 L15 17.5 L18 15 L22 20.5 Z" fill="#FFFFFF" opacity="0.55" />
      </g>
    </svg>
  );
}

/**
 * A plan: a little card with a coloured header and two lines of writing on it.
 * Drawn as a card rather than a calendar on purpose — at this size the two
 * rings of a calendar icon read as a face.
 */
function PlanChip() {
  return (
    <svg className={s.chip} viewBox="0 0 26 26" width="26" height="26">
      <defs>
        <clipPath id="c777-plan-clip">
          <rect x="5" y="6" width="16" height="14" rx="3.5" />
        </clipPath>
      </defs>
      <rect x="0.6" y="0.6" width="24.8" height="24.8" rx="8" fill="#FFFFFF" stroke="#F6DCE6" strokeWidth="1.2" />
      <g clipPath="url(#c777-plan-clip)">
        <rect x="5" y="6" width="16" height="14" fill="#FDECF2" />
        <rect x="5" y="6" width="16" height="4.6" fill="#EE5D91" opacity="0.85" />
      </g>
      <rect x="7.6" y="13" width="10.8" height="1.7" rx="0.85" fill="#EE5D91" opacity="0.45" />
      <rect x="7.6" y="16.3" width="6.8" height="1.7" rx="0.85" fill="#C79BDC" opacity="0.5" />
    </svg>
  );
}

/** The heart the two of them keep. Same gradient as the hero's orbiting one. */
function HeartChip() {
  return (
    <svg className={s.chip} viewBox="0 0 26 26" width="26" height="26">
      <defs>
        <linearGradient id="c777-uheart" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#EE5D91" />
          <stop offset="1" stopColor="#F79C7B" />
        </linearGradient>
      </defs>
      <circle cx="13" cy="13" r="10.4" fill="url(#c777-uheart)" />
      <path
        d="M13 18.4c-1-1.1-5.6-3.9-5.6-7.2 0-1.9 1.5-3.1 3-3.1 1.1 0 2 .7 2.6 1.5.6-.8 1.5-1.5 2.6-1.5 1.5 0 3 1.2 3 3.1 0 3.3-4.6 6.1-5.6 7.2Z"
        fill="#FFFFFF"
      />
      <path
        className={s.spark}
        d="M23.1 2.6c.3 1.85.65 2.2 2.5 2.5-1.85.3-2.2.65-2.5 2.5-.3-1.85-.65-2.2-2.5-2.5 1.85-.3 2.2-.65 2.5-2.5Z"
        fill="#F5A57F"
      />
    </svg>
  );
}
