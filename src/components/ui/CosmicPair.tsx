import { useId } from 'react';
import s from './CosmicPair.module.css';

/**
 * The welcome screen's hero: two small travellers drifting toward each other
 * across a very large, very soft universe.
 *
 * Drawn rather than shipped as an asset, for the same reason the avatar set is
 * — it stays sharp at any size, weighs nothing, and takes its colours from the
 * same tokens as the screen around it.
 *
 * Three things carry the look, and all three are easy to lose in an edit:
 *
 *   - Nothing is stroked. Every limb is a filled tapered path from limb()
 *     below, so a shape can be fat at the shoulder and slim at the fingertip.
 *     An outline anywhere in here reads as clip-art immediately.
 *   - Nobody stands up. Each traveller is built along a diagonal axis, head
 *     forward and legs trailing, so the pose is a glide rather than a pose.
 *   - Every fill is a gradient, lighter toward the head and deeper toward the
 *     trailing end, which is what gives a flat vector shape its volume.
 *
 * The motion lives entirely in the stylesheet so a phone can hand it to the
 * compositor. See that file for the two SVG transform traps it works around.
 *
 * Geometry: a 340x260 field. Each traveller is drawn facing right around its
 * own origin — which sits at the centre of its head, not its body — and the
 * right-hand one is mirrored, so their hands meet whatever else changes.
 */

/* -------------------------------------------------------------------------- */
/*  A limb                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * One soft tapered shape: wide at `a`, narrow at `b`, bowed sideways by `bow`,
 * with both ends rounded off. Arms, legs, torsos and the ribbon trails are all
 * this same function — which is what keeps the whole creature feeling like it
 * was drawn by one hand.
 *
 * Both arcs sweep 0: the caps have to bulge away from the centreline, and
 * sweep 1 turns them inward into a pinched, insect-like joint.
 */
function limb(
  ax: number, ay: number,
  bx: number, by: number,
  aw: number, bw: number,
  bow = 0,
): string {
  const dx = bx - ax;
  const dy = by - ay;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  const px = -uy;
  const py = ux;

  const mx = (ax + bx) / 2 + px * bow;
  const my = (ay + by) / 2 + py * bow;
  const mid = (aw + bw) / 2;

  const r = (n: number) => Math.round(n * 100) / 100;

  return [
    `M ${r(ax + px * aw)} ${r(ay + py * aw)}`,
    `Q ${r(mx + px * mid)} ${r(my + py * mid)} ${r(bx + px * bw)} ${r(by + py * bw)}`,
    `A ${bw} ${bw} 0 0 0 ${r(bx - px * bw)} ${r(by - py * bw)}`,
    `Q ${r(mx - px * mid)} ${r(my - py * mid)} ${r(ax - px * aw)} ${r(ay - py * aw)}`,
    `A ${aw} ${aw} 0 0 0 ${r(ax + px * aw)} ${r(ay + py * aw)}`,
    'Z',
  ].join(' ');
}

/* -------------------------------------------------------------------------- */
/*  The anatomy, shared by both of them                                        */
/* -------------------------------------------------------------------------- */

/*
 * Head at (0, 0); everything else trails down and back to the left.
 *
 * The two legs are deliberately splayed either side of the body axis. Bring
 * their angles together and they fuse into one flipper, which is the single
 * fastest way to lose the creature.
 *
 * Nothing reaches past y = -42: that is the inside of the helmet, and an
 * antenna poking through the glass is instantly wrong.
 */
const TORSO      = limb(-6, 18, -44, 32, 23, 15, -5);
const LEG_UPPER  = limb(-38, 28, -74, 50, 11, 4, -9);
const LEG_LOWER  = limb(-32, 40, -58, 70, 10, 4, 5);
const ARM_BACK   = limb(-16, 26, -26, 56, 9, 4.5, -5);
const ARM_FRONT  = limb(6, 24, 54, 12, 9.5, 4.5, 9);
const BAND       = limb(-22, 14, -40, 24, 13, 10.5, 0);
const ANTENNA_L  = limb(-11, -20, -17, -31, 3, 1.7, -2);
const ANTENNA_R  = limb(7, -22, 10, -32, 3, 1.7, 2);
/* Narrow where it leaves them, wide and gone by the corner. It falls away
   below the body — level with it, it reads as a stripe through the picture. */
const TRAIL      = limb(-42, 50, -180, 104, 14, 28, 14);

const TONES = {
  warm: {
    light: '#FDBE98',
    mid:   '#F8907F',
    deep:  '#EF6F8E',
    band:  '#8A6BA6',
    tip:   '#F4837F',
    trail: ['#FBCBA9', '#F5A8C2', '#E9B9E4'],
  },
  cool: {
    light: '#9CC0F7',
    mid:   '#8496F0',
    deep:  '#9071DF',
    band:  '#454372',
    tip:   '#8AA2F2',
    trail: ['#BFD0F9', '#C0B4F2', '#E4C2E8'],
  },
} as const;

interface TravellerProps {
  uid: string;
  tone: 'warm' | 'cool';
  /**
   * Set on the traveller drawn mirrored.
   *
   * The gaze must mirror — that is what makes them look at each other — but
   * the catchlights must not. Both sets sit up and to the left, because they
   * are reflections of one light, and a pair lit from opposite sides stops
   * reading as two beings in the same sky.
   */
  faceFlip?: boolean;
}

/** One eye: the dark almond, then its two catchlights. */
function Eye({ x, y, rx, ry, flip }: {
  x: number; y: number; rx: number; ry: number; flip: boolean;
}) {
  const f = flip ? -1 : 1;
  return (
    <>
      <ellipse cx={x} cy={y} rx={rx} ry={ry} fill="#241E2B" />
      <circle cx={x - 2.6 * f} cy={y - 3.4} r="3" fill="#FFFFFF" />
      <circle cx={x + 2.7 * f} cy={y + 3.6} r="1.5" fill="#FFFFFF" opacity="0.85" />
    </>
  );
}

function Traveller({ uid, tone, faceFlip = false }: TravellerProps) {
  const c = TONES[tone];
  const g = (name: string) => `${uid}-${tone}-${name}`;

  return (
    <>
      <defs>
        {/* Lighter at the head, deeper at the trailing end. */}
        <linearGradient id={g('body')} x1="24" y1="-24" x2="-72" y2="62" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={c.light} />
          <stop offset="55%" stopColor={c.mid} />
          <stop offset="100%" stopColor={c.deep} />
        </linearGradient>
        <linearGradient id={g('arm')} x1="0" y1="24" x2="56" y2="12" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={c.mid} />
          <stop offset="100%" stopColor={c.tip} />
        </linearGradient>
        {/* The head reads round because the light sits off to one side. */}
        <radialGradient id={g('head')} cx="0.34" cy="0.28" r="0.86">
          <stop offset="0%" stopColor={c.light} />
          <stop offset="100%" stopColor={c.mid} />
        </radialGradient>
        <linearGradient id={g('trail')} x1="-250" y1="6" x2="-40" y2="48" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={c.trail[2]} stopOpacity="0" />
          <stop offset="45%" stopColor={c.trail[1]} stopOpacity="0.32" />
          <stop offset="100%" stopColor={c.trail[0]} stopOpacity="0.68" />
        </linearGradient>
        {/* Glass: nothing in the middle, a breath of tint at the rim. */}
        {/* Glass is only visible at its edges. Almost nothing through the
            middle, a swell of white toward the rim, and a band of the
            traveller's own colour right at it — without that last stop the
            bubble disappears entirely against a pale background. */}
        <radialGradient id={g('glass')} cx="0.4" cy="0.34" r="0.6">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.03" />
          <stop offset="62%" stopColor="#FFFFFF" stopOpacity="0.26" />
          <stop offset="88%" stopColor="#FFFFFF" stopOpacity="0.5" />
          <stop offset="97%" stopColor={c.light} stopOpacity="0.5" />
          <stop offset="100%" stopColor={c.light} stopOpacity="0.16" />
        </radialGradient>
      </defs>

      <path className={s.trail} d={TRAIL} fill={`url(#${g('trail')})`} />

      <path d={LEG_UPPER} fill={`url(#${g('body')})`} />
      <path d={LEG_LOWER} fill={`url(#${g('body')})`} />
      <path className={s.armBack} d={ARM_BACK} fill={`url(#${g('body')})`} />

      <g className={s.breathe}>
        <path d={TORSO} fill={`url(#${g('body')})`} />
        {/* The one dark note in the whole picture, and the only thing keeping
            a soft gradient creature from dissolving into the background. */}
        <path d={BAND} fill={c.band} opacity="0.85" />
        {/* Where the head meets the body, very faintly. */}
        <ellipse cx="-14" cy="14" rx="20" ry="12" fill={c.deep} opacity="0.14" />

        {/* Arm and hand in one group: rotating a circle about its own centre
            does nothing, so a separately-animated hand would stay behind. */}
        <g className={s.reach}>
          <path d={ARM_FRONT} fill={`url(#${g('arm')})`} />
          <circle cx="55" cy="11" r="5.6" fill={c.tip} />
        </g>

        <g className={s.antennae}>
          <path d={ANTENNA_L} fill={c.mid} />
          <circle cx="-18" cy="-33" r="4" fill={c.mid} />
          <path d={ANTENNA_R} fill={c.mid} />
          <circle cx="10" cy="-33" r="4" fill={c.mid} />
        </g>

        <circle cx="0" cy="0" r="26" fill={`url(#${g('head')})`} />
        {/* A soft sheen high on the head, under the glass. */}
        <ellipse cx="-9" cy="-11" rx="13" ry="9" fill="#FFFFFF" opacity="0.16"
          transform="rotate(-28 -9 -11)" />

        {/* Three-quarters forward, so the gaze lands on the other one. */}
        <g className={s.face}>
          <g className={s.blink}>
            <Eye x={-1} y={4} rx={7} ry={8.6} flip={faceFlip} />
            <Eye x={15.5} y={2.5} rx={6.6} ry={8.2} flip={faceFlip} />
          </g>

          <path
            d="M 3.4 17.6 C 3.4 16.7, 4.2 16.3, 7.4 16.3 C 10.6 16.3, 11.4 16.7, 11.4 17.6
               C 11.4 21.2, 9.6 23, 7.4 23 C 5.2 23, 3.4 21.2, 3.4 17.6 Z"
            fill="#5E2036"
          />
          <path
            d="M 5.2 20.4 C 6 19.9, 8.8 19.9, 9.6 20.4 C 9.3 22.2, 8.5 23, 7.4 23
               C 6.3 23, 5.5 22.2, 5.2 20.4 Z"
            fill="#F2778F"
          />
        </g>

        {/* The helmet goes over everything, antennae included — it is the
            reason they read as travellers rather than as animals. */}
        <circle cx="1" cy="-4" r="34" fill={`url(#${g('glass')})`} />
        <circle cx="1" cy="-4" r="34" fill="none" stroke={c.light}
          strokeWidth="1.2" opacity="0.45" />
        {/* Two catchlights on the glass, at the angle a single light would
            put them, and one long arc opposite. */}
        <ellipse cx="-14" cy="-19" rx="9.5" ry="5.6" fill="#FFFFFF" opacity="0.78"
          transform="rotate(-40 -14 -19)" />
        <circle cx="-24" cy="-5" r="3.2" fill="#FFFFFF" opacity="0.58" />
        <path
          d="M 23 -26 A 34 34 0 0 1 32 -7"
          stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round"
          fill="none" opacity="0.4"
        />
      </g>
    </>
  );
}

/* -------------------------------------------------------------------------- */
/*  The sky                                                                    */
/* -------------------------------------------------------------------------- */

function Sparkle({ x, y, r, fill, className }: {
  x: number; y: number; r: number; fill: string; className?: string;
}) {
  const w = r * 0.2;
  return (
    <path
      className={className}
      d={`M ${x} ${y - r} Q ${x + w} ${y - w} ${x + r} ${y}
          Q ${x + w} ${y + w} ${x} ${y + r}
          Q ${x - w} ${y + w} ${x - r} ${y}
          Q ${x - w} ${y - w} ${x} ${y - r} Z`}
      fill={fill}
    />
  );
}

export function CosmicPair() {
  const uid = `cp-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;

  return (
    <svg
      className={s.svg}
      viewBox="0 0 340 260"
      role="img"
      aria-label="Two small travellers drifting toward each other across a wide, soft universe"
    >
      <defs>
        <radialGradient id={`${uid}-moon`} cx="0.34" cy="0.3" r="0.8">
          <stop offset="0%" stopColor="#F0E9F8" />
          <stop offset="100%" stopColor="#E3D8F1" />
        </radialGradient>
        <linearGradient id={`${uid}-planet`} x1="0" y1="0" x2="0.8" y2="1">
          <stop offset="0%" stopColor="#FBBCD0" />
          <stop offset="100%" stopColor="#F492B4" />
        </linearGradient>
        <linearGradient id={`${uid}-heart`} x1="0" y1="0" x2="0.4" y2="1">
          <stop offset="0%" stopColor="#FCA98D" />
          <stop offset="100%" stopColor="#F26C93" />
        </linearGradient>
        {/* The clouds have to dissolve rather than stop. This drawing ends
            partway down the screen, so a cloud that keeps its colour to the
            last row of the viewBox leaves a hard horizontal seam across the
            middle of the page. Fading them out hides where the picture ends. */}
        <linearGradient id={`${uid}-cloud-a`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FBE3EC" stopOpacity="1" />
          <stop offset="45%" stopColor="#F8DEEA" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#F6D9E8" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={`${uid}-cloud-b`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#F2E4F4" stopOpacity="1" />
          <stop offset="45%" stopColor="#EFE0F2" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#EDDCEF" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* ---- Far background, drifting slowest ---- */}
      <g className={s.far}>
        {/* A moon too big for the frame to hold. */}
        <g opacity="0.6">
          <circle cx="332" cy="34" r="54" fill={`url(#${uid}-moon)`} />
          <circle cx="318" cy="16" r="9" fill="#DCCFEC" opacity="0.75" />
          <circle cx="340" cy="52" r="6.5" fill="#DCCFEC" opacity="0.65" />
          <circle cx="306" cy="44" r="4" fill="#DCCFEC" opacity="0.55" />
        </g>

        <g className={s.planet} opacity="0.8">
          <circle cx="52" cy="42" r="23" fill={`url(#${uid}-planet)`} opacity="0.72" />
          <ellipse
            cx="52" cy="42" rx="40" ry="9.5"
            fill="none" stroke="#F8BFA4" strokeWidth="4" opacity="0.72"
            transform="rotate(-16 52 42)"
          />
        </g>
      </g>

      {/* ---- Starlight, in two layers that drift against each other ---- */}
      <g className={s.dustA}>
        <Sparkle className={s.tw1} x={214} y={40} r={9} fill="#F8C983" />
        <Sparkle className={s.tw3} x={26} y={100} r={6} fill="#F9CE95" />
        <Sparkle className={s.tw2} x={96} y={182} r={6.5} fill="#A9B6EE" />
        <circle className={s.tw2} cx="132" cy="46" r="3.4" fill="#F3B0C6" opacity="0.8" />
        <circle className={s.tw1} cx="58" cy="196" r="3" fill="#F7C4A4" opacity="0.8" />
      </g>

      <g className={s.dustB}>
        <Sparkle className={s.tw2} x={268} y={26} r={5.5} fill="#A9B6EE" />
        <Sparkle className={s.tw1} x={300} y={140} r={5} fill="#F3A9C6" />
        <circle className={s.tw3} cx="44" cy="76" r="3.2" fill="#B6BEEF" opacity="0.75" />
        <circle className={s.tw1} cx="298" cy="98" r="2.8" fill="#F0AEC6" opacity="0.7" />
        <circle className={s.tw3} cx="188" cy="196" r="2.6" fill="#F2C0A8" opacity="0.7" />
      </g>

      {/* ---- The two of them ---- */}
      {/* Placement on the outer group, motion on the inner: a CSS transform
          replaces the transform attribute rather than adding to it. */}
      <g transform="translate(111 108) scale(0.94)">
        <g className={s.left}>
          <Traveller uid={uid} tone="warm" />
        </g>
      </g>

      <g transform="translate(232 113) scale(0.94)">
        <g className={s.right}>
          <g transform="scale(-1 1)">
            <Traveller uid={uid} tone="cool" faceFlip />
          </g>
        </g>
      </g>

      {/* What is happening in the gap between their hands. */}
      <g transform="translate(171 92)">
        <g className={s.heart}>
          <path
            d="M 0 10 C -10 2.5, -14.5 -3, -14.5 -8.5 C -14.5 -14, -10.5 -17.5, -6 -17.5
               C -2.5 -17.5, 0 -15.2, 0 -13 C 0 -15.2, 2.5 -17.5, 6 -17.5
               C 10.5 -17.5, 14.5 -14, 14.5 -8.5 C 14.5 -3, 10 2.5, 0 10 Z"
            fill={`url(#${uid}-heart)`}
          />
          <path
            d="M -21 -20 L -26 -27 M 0 -25 L 0 -34 M 21 -20 L 26 -27"
            stroke="#F5789F" strokeWidth="2.8" strokeLinecap="round" opacity="0.65"
          />
        </g>
      </g>

      {/* ---- Cloud country, well below them ---- */}
      <g opacity="0.5">
        <path
          d="M -20 260 C -20 232, 4 214, 30 218 C 42 198, 74 194, 90 212
             C 108 200, 134 208, 140 228 C 152 222, 168 230, 172 260 Z"
          fill={`url(#${uid}-cloud-b)`}
        />
        <path
          d="M 168 260 C 172 238, 196 224, 218 232 C 232 212, 266 210, 278 230
             C 296 220, 322 228, 328 246 C 340 244, 354 250, 358 260 Z"
          fill={`url(#${uid}-cloud-a)`}
        />
        <path
          d="M 44 260 C 48 244, 70 234, 88 242 C 100 226, 128 226, 138 242
             C 152 236, 172 244, 176 260 Z"
          fill={`url(#${uid}-cloud-a)`}
          opacity="0.8"
        />
      </g>
    </svg>
  );
}
