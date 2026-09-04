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
 * Two anatomies, not one mirrored twice.
 *
 * A perfect mirror reads as a logo. These two differ in every measurement
 * that shows — how far the torso runs, where the arm points, how wide the
 * legs splay, which way the antennae lean — so the pair reads as two beings
 * who happen to be drifting the same way rather than one drawn backwards.
 *
 * The proportions are deliberately unhuman: a big head, a short round torso,
 * and stubby limbs. Lengthen the arms and legs even slightly and they stop
 * being plush and start being people.
 *
 * Nothing reaches past y = -34, which is the inside of the helmet.
 */
interface Anatomy {
  torso: string;
  legUpper: string;
  legLower: string;
  armLower: string;
  armFront: string;
  band: string;
  antennaL: string;
  antennaR: string;
  trail: string;
  hand: [number, number, number];
  ballL: [number, number, number];
  ballR: [number, number, number];
}

const ANATOMY: Record<'warm' | 'cool', Anatomy> = {
  /* Leaning into the drift, arm high, legs wide. */
  warm: {
    torso:    limb(-2, 16, -22, 28, 22, 20, -3),
    legUpper: limb(-24, 24, -52, 22, 10, 6, -4),
    legLower: limb(-22, 34, -48, 42, 9.5, 6, 3),
    armLower: limb(2, 30, 26, 36, 9, 5.5, 3),
    armFront: limb(6, 21, 41, 10, 9, 4.8, 7),
    band:     limb(-10, 11, -22, 18, 12.5, 11.5, 0),
    antennaL: limb(-10, -19, -16, -27, 2.8, 1.5, -1.5),
    antennaR: limb(7, -20, 10, -28, 2.8, 1.5, 1.5),
    trail:    limb(-34, 38, -168, 84, 9, 19, 16),
    hand:     [42, 9, 5.2],
    ballL:    [-17, -29, 3.4],
    ballR:    [10, -30, 3.4],
  },
  /* Rounder, sitting back a little, arm lower and legs tucked. */
  cool: {
    torso:    limb(-3, 17, -20, 30, 23, 20, -2),
    legUpper: limb(-22, 26, -48, 26, 10, 6, -3),
    legLower: limb(-20, 36, -44, 44, 9.5, 6, 3),
    armLower: limb(2, 32, 24, 40, 9, 5.5, 2),
    armFront: limb(6, 24, 40, 16, 9, 4.8, 6),
    band:     limb(-9, 13, -20, 20, 12.5, 11.5, 0),
    antennaL: limb(-10, -20, -17, -26, 2.8, 1.5, -2),
    antennaR: limb(7, -20, 11, -27, 2.8, 1.5, 2),
    trail:    limb(-32, 40, -162, 90, 9, 18, 14),
    hand:     [41, 15, 5.2],
    ballL:    [-18, -28, 3.4],
    ballR:    [11, -29, 3.4],
  },
};

/*
 * `band` is no longer a dark panel. A hard navy block turned these into things
 * wearing space suits; a soft wash of the creature's own deep tone reads as
 * the shadowed side of something plush.
 */
const TONES = {
  warm: {
    headLight: '#FFD9BC',
    light:     '#FDBE98',
    lightMid:  '#FBA68B',
    mid:       '#F8907F',
    deep:      '#EF6F8E',
    band:      '#D97E93',
    tip:       '#F79683',
    trail: ['#FBCBA9', '#F5A8C2', '#E9B9E4'],
  },
  cool: {
    headLight: '#C6DBFB',
    light:     '#9CC0F7',
    lightMid:  '#8FADF4',
    mid:       '#8496F0',
    deep:      '#9071DF',
    band:      '#7F87D4',
    tip:       '#95AEF4',
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
  /** The wake behind them. Off for a single traveller in a small frame. */
  trail?: boolean;
  /**
   * One eye winks instead of both blinking.
   *
   * A blink caught in a still frame reads as a mistake — two eyes drawn as
   * two flat lines. A wink never does: it is the same closed eye, but with
   * an open one beside it saying the closure was on purpose.
   */
  wink?: boolean;
}

/** One eye: the dark almond, then its two catchlights. */
function Eye({ x, y, rx, ry, flip }: {
  x: number; y: number; rx: number; ry: number; flip: boolean;
}) {
  const f = flip ? -1 : 1;
  return (
    <>
      <ellipse cx={x} cy={y} rx={rx} ry={ry} fill="#2A2333" />
      <circle cx={x - 2.5 * f} cy={y - 2.7} r="3.5" fill="#FFFFFF" />
      <circle cx={x + 2.7 * f} cy={y + 3.2} r="2" fill="#FFFFFF" opacity="0.9" />
    </>
  );
}

function Traveller({ uid, tone, faceFlip = false, trail = true, wink = false }: TravellerProps) {
  const c = TONES[tone];
  const a = ANATOMY[tone];
  const g = (name: string) => `${uid}-${tone}-${name}`;

  return (
    <>
      <defs>
        {/* Lighter at the head, deeper at the trailing end. */}
        <linearGradient id={g('body')} x1="22" y1="-22" x2="-58" y2="56" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={c.light} />
          <stop offset="32%" stopColor={c.lightMid} />
          <stop offset="62%" stopColor={c.mid} />
          <stop offset="100%" stopColor={c.deep} />
        </linearGradient>
        <linearGradient id={g('arm')} x1="0" y1="24" x2="56" y2="12" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={c.mid} />
          <stop offset="100%" stopColor={c.tip} />
        </linearGradient>
        {/* The head reads round because the light sits off to one side. */}
        <radialGradient id={g('head')} cx="0.33" cy="0.26" r="0.9">
          <stop offset="0%" stopColor={c.headLight} />
          <stop offset="45%" stopColor={c.light} />
          <stop offset="100%" stopColor={c.mid} />
        </radialGradient>
        <linearGradient id={g('trail')} x1="-250" y1="6" x2="-40" y2="48" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={c.trail[2]} stopOpacity="0" />
          <stop offset="45%" stopColor={c.trail[1]} stopOpacity="0.26" />
          <stop offset="100%" stopColor={c.trail[0]} stopOpacity="0.55" />
        </linearGradient>
        {/* Glass: nothing in the middle, a breath of tint at the rim. */}
        {/* Glass is only visible at its edges, and here it stays quiet: the
            head is the character, the helmet is context. */}
        <radialGradient id={g('glass')} cx="0.4" cy="0.34" r="0.6">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.02" />
          <stop offset="66%" stopColor="#FFFFFF" stopOpacity="0.15" />
          <stop offset="90%" stopColor="#FFFFFF" stopOpacity="0.3" />
          <stop offset="97%" stopColor={c.light} stopOpacity="0.3" />
          <stop offset="100%" stopColor={c.light} stopOpacity="0.1" />
        </radialGradient>
        {/* Laid over the body: light off the top-left, the colour deepening
            into the underside. Two gradients on one shape is the difference
            between a rounded thing and a flat one with a highlight on it. */}
        <radialGradient id={g('volume')} cx="0.3" cy="0.16" r="0.95">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.34" />
          <stop offset="42%" stopColor="#FFFFFF" stopOpacity="0.06" />
          <stop offset="72%" stopColor={c.deep} stopOpacity="0.05" />
          <stop offset="100%" stopColor={c.deep} stopOpacity="0.26" />
        </radialGradient>
      </defs>

      {trail ? <path className={s.trail} d={a.trail} fill={`url(#${g('trail')})`} /> : null}

      {/* Two legs, and nothing else back here. The old third shape hung
          between them and turned the silhouette into four legs with an
          unfortunate thing in the middle; the second arm belongs at the
          front, alongside the reaching one. The torso's own trailing cap is
          the hip — nearly as wide as its shoulder, which is what makes the
          rear read as round rather than tapered. */}
      <path d={a.legUpper} fill={`url(#${g('body')})`} />
      <path d={a.legLower} fill={`url(#${g('body')})`} />

      <g className={s.breathe}>
        <path d={a.torso} fill={`url(#${g('body')})`} />
        {/* A soft wash, not a panel. */}
        <path d={a.band} fill={c.band} opacity="0.3" />
        {/* Where the head meets the body, very faintly. */}
        <ellipse cx="-12" cy="14" rx="18" ry="11" fill={c.deep} opacity="0.12" />
        {/* And the shading that rounds the trailing mass off. Two gradients on
            one shape is the difference between a rounded thing and a flat one
            with a highlight sitting on top of it. */}
        <path d={a.torso} fill={`url(#${g('volume')})`} />
        <path d={a.legUpper} fill={`url(#${g('volume')})`} opacity="0.7" />
        <path d={a.legLower} fill={`url(#${g('volume')})`} opacity="0.7" />

        {/* The second arm, low and forward under the reaching one. */}
        <path className={s.armLower} d={a.armLower} fill={`url(#${g('body')})`} />
        <path className={s.armLower} d={a.armLower} fill={`url(#${g('volume')})`} opacity="0.5" />

        {/* Arm and hand in one group: rotating a circle about its own centre
            does nothing, so a separately-animated hand would stay behind. */}
        <g className={s.reach}>
          <path d={a.armFront} fill={`url(#${g('arm')})`} />
          <circle cx={a.hand[0]} cy={a.hand[1]} r={a.hand[2]} fill={c.tip} />
        </g>

        <g className={s.antennae}>
          <path d={a.antennaL} fill={c.lightMid} />
          <circle cx={a.ballL[0]} cy={a.ballL[1]} r={a.ballL[2]} fill={c.lightMid} />
          <path d={a.antennaR} fill={c.lightMid} />
          <circle cx={a.ballR[0]} cy={a.ballR[1]} r={a.ballR[2]} fill={c.lightMid} />
        </g>

        <circle cx="0" cy="0" r="26" fill={`url(#${g('head')})`} />
        {/* A soft sheen high on the head, under the glass. */}
        <ellipse cx="-9" cy="-11" rx="14" ry="9.5" fill="#FFFFFF" opacity="0.2"
          transform="rotate(-28 -9 -11)" />
        {/* A whisper of the deep tone along the lower edge, so the head reads
            as a ball rather than a disc. */}
        <ellipse cx="8" cy="15" rx="18" ry="10" fill={c.deep} opacity="0.1" />

        {/* Three-quarters forward, so the gaze lands on the other one. */}
        <g className={s.face}>
          {/* Separate groups so one can close without the other. For the
              pair both carry the same blink and so still close together. */}
          <g className={wink ? undefined : tone === 'cool' ? s.blinkAlt : s.blink}>
            <Eye x={-1} y={4} rx={7.6} ry={8} flip={faceFlip} />
          </g>
          <g className={wink ? s.wink : tone === 'cool' ? s.blinkAlt : s.blink}>
            <Eye x={15} y={3} rx={7.2} ry={7.6} flip={faceFlip} />
          </g>

          {/* Barely there. A bigger mouth pulls the eye down off the eyes,
              which are the whole charm of the face. */}
          <path
            d="M 4.4 16.4 C 4.4 15.9, 5 15.7, 7.2 15.7 C 9.4 15.7, 10 15.9, 10 16.4
               C 10 18.7, 8.8 19.8, 7.2 19.8 C 5.6 19.8, 4.4 18.7, 4.4 16.4 Z"
            fill="#6B2A40"
          />
          <path
            d="M 5.6 18.1 C 6.2 17.8, 8.2 17.8, 8.8 18.1 C 8.6 19.3, 8 19.8, 7.2 19.8
               C 6.4 19.8, 5.8 19.3, 5.6 18.1 Z"
            fill="#F5899E"
          />
        </g>

        {/* The helmet goes over everything, antennae included — it is the
            reason they read as travellers rather than as animals. */}
        <circle cx="1" cy="-3" r="31" fill={`url(#${g('glass')})`} />
        <circle cx="1" cy="-3" r="31" fill="none" stroke={c.light}
          strokeWidth="1" opacity="0.28" />
        {/* Two catchlights on the glass, at the angle a single light would
            put them, and one long arc opposite. */}
        <ellipse cx="-13" cy="-18" rx="8" ry="4.6" fill="#FFFFFF" opacity="0.6"
          transform="rotate(-40 -13 -18)" />
        <circle cx="-22" cy="-5" r="2.6" fill="#FFFFFF" opacity="0.45" />
        <path
          d="M 21 -24 A 31 31 0 0 1 29 -7"
          stroke="#FFFFFF" strokeWidth="2.4" strokeLinecap="round"
          fill="none" opacity="0.3"
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

/**
 * One traveller, leaning in from the edge of a screen to say hello.
 *
 * The same creature as the welcome screen's pair, drawn from the same anatomy
 * and the same tones — a second, separately-drawn alien would read as a
 * different species one screen later. It is mirrored so its face and its
 * reaching arm point back at the text rather than off the edge, and its wake
 * is switched off: there is nothing here for it to have flown in from.
 *
 * It arrives with a small overshoot and then settles into the same idle float
 * as its counterpart, so the greeting lands and the screen keeps breathing.
 */
export function CosmicGreeter({ tone = 'warm' }: { tone?: 'warm' | 'cool' }) {
  const uid = `cg-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const heartFill = tone === 'cool' ? ['#B9A6F2', '#8E79DD'] : ['#FCA98D', '#F26C93'];

  return (
    <svg
      className={s.greeter}
      viewBox="0 0 170 150"
      role="img"
      aria-label="A small traveller waving hello"
    >
      <defs>
        <linearGradient id={`${uid}-heart`} x1="0" y1="0" x2="0.4" y2="1">
          <stop offset="0%" stopColor={heartFill[0]} />
          <stop offset="100%" stopColor={heartFill[1]} />
        </linearGradient>
      </defs>

      <g className={s.dustA}>
        <Sparkle className={s.tw1} x={22} y={42} r={6} fill="#F8C983" />
        <Sparkle className={s.tw2} x={152} y={36} r={5} fill="#A9B6EE" />
        <circle className={s.tw3} cx="16" cy="98" r="3" fill="#F3B0C6" opacity="0.8" />
      </g>
      <g className={s.dustB}>
        <Sparkle className={s.tw3} x={158} y={86} r={5} fill="#F3A9C6" />
        <circle className={s.tw1} cx="46" cy="132" r="2.8" fill="#B6BEEF" opacity="0.7" />
      </g>

      {/* A small heart, at the shoulder rather than in the middle of things.
          Placement outside, animation inside — a CSS transform replaces the
          attribute, and with both on one node the heart snaps to the origin. */}
      <g transform="translate(150 124)">
        <g className={s.heart}>
          <path
            d="M 0 5.5 C -5.5 1.3, -8 -1.7, -8 -4.7 C -8 -7.7, -5.8 -9.7, -3.3 -9.7
               C -1.4 -9.7, 0 -8.3, 0 -7.2 C 0 -8.3, 1.4 -9.7, 3.3 -9.7
               C 5.8 -9.7, 8 -7.7, 8 -4.7 C 8 -1.7, 5.5 1.3, 0 5.5 Z"
            fill={`url(#${uid}-heart)`}
          />
        </g>
      </g>

      <g transform="translate(92 86) rotate(4) scale(0.84)">
        <g className={s.greeterFloat}>
          <g transform="scale(-1 1)">
            <Traveller uid={uid} tone={tone} faceFlip trail={false} wink />
          </g>
        </g>
      </g>
    </svg>
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
      <g transform="translate(112 108) rotate(-6) scale(0.92)">
        <g className={s.left}>
          <Traveller uid={uid} tone="warm" />
        </g>
      </g>

      <g transform="translate(232 122) rotate(5) scale(0.9)">
        <g className={s.right}>
          <g transform="scale(-1 1)">
            <Traveller uid={uid} tone="cool" faceFlip />
          </g>
        </g>
      </g>

      {/* What is happening in the gap between their hands. */}
      <g transform="translate(172 113)">
        <g className={s.heart}>
          <path
            d="M 0 6.6 C -6.6 1.6, -9.6 -2, -9.6 -5.6 C -9.6 -9.2, -7 -11.6, -4 -11.6
               C -1.7 -11.6, 0 -10, 0 -8.6 C 0 -10, 1.7 -11.6, 4 -11.6
               C 7 -11.6, 9.6 -9.2, 9.6 -5.6 C 9.6 -2, 6.6 1.6, 0 6.6 Z"
            fill={`url(#${uid}-heart)`}
          />
          <path
            d="M -13 -13 L -16.5 -17 M 0 -16 L 0 -21.5 M 13 -13 L 16.5 -17"
            stroke="#F5899E" strokeWidth="2" strokeLinecap="round" opacity="0.55"
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
