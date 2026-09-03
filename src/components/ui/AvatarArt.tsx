import { useId, type ReactElement } from 'react';

/**
 * The Couple777 avatar set — people, animals and playful characters.
 *
 * Everything is composed from the same frame (thick ring, contrasting disc,
 * sparkles, shoulders cropped by the disc) and the same face language (big
 * eyes with a highlight, round blush, a small mouth), so a bearded person, a
 * fox and a one-eyed monster still read as one family.
 *
 * Characters are built from parts rather than drawn one by one: head shape,
 * hair, eyes, mouth and accessories combine, which is what keeps fourteen
 * people from looking like one person in fourteen wigs.
 *
 * Geometry on a 100×100 viewBox: disc r=43 · head centred (50, 44) · eyes y=43.
 */

export type AvatarGroup = 'People' | 'Animals' | 'Playful';

type HeadShape = 'round' | 'oval' | 'wide' | 'square' | 'taper';
type Eyes = 'open' | 'wink' | 'heart' | 'happy' | 'star' | 'sleepy';
type Mouth = 'smile' | 'grin' | 'smirk' | 'oh' | 'soft';
type Accessory =
  | 'sunglasses' | 'glasses' | 'beard' | 'moustache'
  | 'freckles' | 'earrings' | 'beanie' | 'headband';
type HairStyle =
  | 'afro' | 'long' | 'ponytail' | 'bob-cowlick' | 'buzz' | 'bob-fringe'
  | 'curls-clips' | 'short-fringe' | 'silver-long' | 'topknot' | 'waves'
  | 'fade' | 'undercut' | 'none';
type Animal = 'cat' | 'dog' | 'bear' | 'bunny' | 'frog' | 'fox' | 'panda' | 'owl';
type Playful = 'monster' | 'cyclops' | 'avocado' | 'ghost';

export interface AvatarDef {
  id: string;
  label: string;
  group: AvatarGroup;
  ring: string;
  ground: string;
  top: string;
  sparkle: string;
  skin?: string;
  hair?: string;
  hairStyle?: HairStyle;
  head?: HeadShape;
  eyes?: Eyes;
  mouth?: Mouth;
  accessories?: Accessory[];
  animal?: Animal;
  playful?: Playful;
}

/* --------------------------------- Palette -------------------------------- */

const INK = '#2B2440';
const WHITE = '#FFFFFF';
const BLUSH = '#F2879F';
const GOLD = '#E9B949';

const C = {
  rose: '#E4598A',
  coral: '#EE8B6E',
  mauve: '#9A72C0',
  mint: '#65BFA9',
  plum: '#4A3A63',
  gold: GOLD,
  sky: '#6FA8C8',
  blushPale: '#FBE3EA',
  creamPale: '#FDF0DC',
  mintPale: '#D9EFE7',
  lilacPale: '#EBE2F7',
  peachPale: '#FCE3D8',
  skyPale: '#DCE7F6',
};

/** Deliberately wide, with several distinct light tones rather than one. */
const SKIN = {
  porcelain: '#FCE4D6',
  pale: '#F9D5BD',
  light: '#F6C9A8',
  fair: '#EFBB92',
  olive: '#DFAE80',
  tan: '#CE9463',
  brown: '#A96A42',
  deep: '#7C4B2D',
  espresso: '#5C3520',
};

const HAIR = {
  ink: INK,
  soft: '#4A3A5C',
  pink: '#F58BB0',
  blonde: '#F0C361',
  sand: '#D9B173',
  lilac: '#B9A3E3',
  teal: '#5FC4C0',
  auburn: '#C06B3E',
  ginger: '#DD7C43',
  silver: '#DDD6E4',
};

export const AVATARS: AvatarDef[] = [
  /* ---------------------------------- People --------------------------------- */
  { id: 'person-1', label: 'Afro & hoops', group: 'People', ring: C.coral, ground: C.blushPale, skin: SKIN.deep, hair: HAIR.ink, hairStyle: 'afro', head: 'round', eyes: 'open', mouth: 'grin', accessories: ['earrings'], top: HAIR.pink, sparkle: GOLD },
  { id: 'person-2', label: 'Pink & winking', group: 'People', ring: C.plum, ground: C.creamPale, skin: SKIN.porcelain, hair: HAIR.pink, hairStyle: 'long', head: 'oval', eyes: 'wink', mouth: 'smirk', top: '#C3AEE0', sparkle: WHITE },
  { id: 'person-3', label: 'Ponytail & specs', group: 'People', ring: C.rose, ground: C.mintPale, skin: SKIN.pale, hair: HAIR.blonde, hairStyle: 'ponytail', head: 'round', eyes: 'happy', mouth: 'smile', accessories: ['glasses'], top: '#3E5A8C', sparkle: C.plum },
  { id: 'person-4', label: 'Lilac bob', group: 'People', ring: C.plum, ground: C.blushPale, skin: SKIN.porcelain, hair: HAIR.lilac, hairStyle: 'bob-cowlick', head: 'taper', eyes: 'heart', mouth: 'soft', top: HAIR.pink, sparkle: WHITE },
  { id: 'person-5', label: 'Beard & freckles', group: 'People', ring: C.mauve, ground: C.peachPale, skin: SKIN.light, hair: HAIR.auburn, hairStyle: 'buzz', head: 'square', eyes: 'open', mouth: 'smile', accessories: ['beard', 'freckles'], top: GOLD, sparkle: C.plum },
  { id: 'person-6', label: 'Blunt fringe', group: 'People', ring: C.mint, ground: C.lilacPale, skin: SKIN.tan, hair: HAIR.ink, hairStyle: 'bob-fringe', head: 'wide', eyes: 'open', mouth: 'soft', top: '#EE8B7E', sparkle: GOLD },
  { id: 'person-7', label: 'Curls & clips', group: 'People', ring: C.rose, ground: C.lilacPale, skin: SKIN.brown, hair: HAIR.ink, hairStyle: 'curls-clips', head: 'round', eyes: 'star', mouth: 'grin', top: C.mint, sparkle: GOLD },
  { id: 'person-8', label: 'Teal & shades', group: 'People', ring: C.gold, ground: C.skyPale, skin: SKIN.pale, hair: HAIR.teal, hairStyle: 'short-fringe', head: 'square', eyes: 'open', mouth: 'smirk', accessories: ['sunglasses'], top: '#B0A2D8', sparkle: C.plum },
  { id: 'person-9', label: 'Silver & sleepy', group: 'People', ring: C.sky, ground: C.skyPale, skin: SKIN.porcelain, hair: HAIR.silver, hairStyle: 'silver-long', head: 'oval', eyes: 'sleepy', mouth: 'soft', top: '#8FB8D8', sparkle: WHITE },
  { id: 'person-10', label: 'Topknot & tash', group: 'People', ring: C.coral, ground: C.creamPale, skin: SKIN.olive, hair: HAIR.ink, hairStyle: 'topknot', head: 'taper', eyes: 'open', mouth: 'smile', accessories: ['moustache'], top: C.mint, sparkle: GOLD },
  { id: 'person-11', label: 'Ginger waves', group: 'People', ring: C.mint, ground: C.peachPale, skin: SKIN.pale, hair: HAIR.ginger, hairStyle: 'waves', head: 'round', eyes: 'open', mouth: 'grin', accessories: ['freckles'], top: '#7FA8D8', sparkle: WHITE },
  { id: 'person-12', label: 'Fade & shades', group: 'People', ring: C.mauve, ground: C.mintPale, skin: SKIN.espresso, hair: HAIR.ink, hairStyle: 'fade', head: 'square', eyes: 'open', mouth: 'smile', accessories: ['sunglasses', 'headband'], top: GOLD, sparkle: WHITE },
  { id: 'person-13', label: 'Undercut & beard', group: 'People', ring: C.plum, ground: C.lilacPale, skin: SKIN.fair, hair: '#5E4536', hairStyle: 'undercut', head: 'square', eyes: 'open', mouth: 'soft', accessories: ['beard', 'moustache'], top: '#6FA8C8', sparkle: GOLD },
  { id: 'person-14', label: 'Beanie', group: 'People', ring: C.rose, ground: C.creamPale, skin: SKIN.light, hair: HAIR.sand, hairStyle: 'short-fringe', head: 'wide', eyes: 'happy', mouth: 'oh', accessories: ['beanie'], top: '#A8D8C8', sparkle: C.plum },

  /* --------------------------------- Animals -------------------------------- */
  { id: 'cat', label: 'Cat', group: 'Animals', ring: C.mauve, ground: C.lilacPale, skin: '#C9C2D2', animal: 'cat', top: '#8FB8D8', sparkle: WHITE },
  { id: 'dog', label: 'Dog', group: 'Animals', ring: C.gold, ground: C.creamPale, skin: '#D9A273', animal: 'dog', top: C.mint, sparkle: C.plum },
  { id: 'bear', label: 'Bear', group: 'Animals', ring: C.coral, ground: C.peachPale, skin: '#B27E5A', animal: 'bear', top: '#7FA8D8', sparkle: GOLD },
  { id: 'bunny', label: 'Bunny', group: 'Animals', ring: C.rose, ground: C.blushPale, skin: '#F6DCE3', animal: 'bunny', top: '#A8D8C8', sparkle: WHITE },
  { id: 'frog', label: 'Frog', group: 'Animals', ring: C.mint, ground: C.mintPale, skin: '#8CC98C', animal: 'frog', top: GOLD, sparkle: WHITE },
  { id: 'fox', label: 'Fox', group: 'Animals', ring: C.coral, ground: C.creamPale, skin: '#E8875A', animal: 'fox', top: '#6FA8C8', sparkle: WHITE },
  { id: 'panda', label: 'Panda', group: 'Animals', ring: C.plum, ground: C.skyPale, skin: '#F6F2F6', animal: 'panda', top: HAIR.pink, sparkle: GOLD },
  { id: 'owl', label: 'Owl', group: 'Animals', ring: C.mint, ground: C.lilacPale, skin: '#B49CD4', animal: 'owl', top: GOLD, sparkle: WHITE },

  /* --------------------------------- Playful -------------------------------- */
  { id: 'monster', label: 'Monster', group: 'Playful', ring: C.mint, ground: C.mintPale, skin: '#5FC4A8', playful: 'monster', top: HAIR.pink, sparkle: WHITE },
  { id: 'cyclops', label: 'Cyclops', group: 'Playful', ring: C.mauve, ground: C.lilacPale, skin: '#A98BD8', playful: 'cyclops', top: GOLD, sparkle: WHITE },
  { id: 'avocado', label: 'Avocado', group: 'Playful', ring: C.gold, ground: C.mintPale, skin: '#A8C96B', playful: 'avocado', top: '#8FB8D8', sparkle: WHITE },
  { id: 'ghost', label: 'Ghost', group: 'Playful', ring: C.plum, ground: C.skyPale, skin: '#F3EFF8', playful: 'ghost', top: '#C3AEE0', sparkle: GOLD },
];

export function avatarById(id?: string): AvatarDef | undefined {
  return AVATARS.find((a) => a.id === id);
}

export const AVATAR_GROUPS: AvatarGroup[] = ['People', 'Animals', 'Playful'];

/* -------------------------------- Fragments ------------------------------- */

function Sparkle({ x, y, r, fill }: { x: number; y: number; r: number; fill: string }) {
  const k = r * 0.3;
  return (
    <path
      transform={`translate(${x} ${y})`}
      d={`M0 ${-r} C ${k} ${-k} ${k} ${-k} ${r} 0 C ${k} ${k} ${k} ${k} 0 ${r} C ${-k} ${k} ${-k} ${k} ${-r} 0 C ${-k} ${-k} ${-k} ${-k} 0 ${-r} Z`}
      fill={fill}
    />
  );
}

function Shoulders({ top, skin }: { top: string; skin: string }) {
  return (
    <>
      <rect x="41" y="54" width="18" height="18" rx="8" fill={skin} />
      <ellipse cx="50" cy="98" rx="34" ry="30" fill={top} />
    </>
  );
}

/* ---------------------------------- Heads --------------------------------- */

/** Each shape keeps a consistent dome so the hair still fits, and varies the
 *  jaw, which is what actually makes two faces look like two people. */
const HEADS: Record<HeadShape, { node: ReactElement; earX: number; earY: number }> = {
  round: { node: <ellipse cx="50" cy="44" rx="20.5" ry="22" />, earX: 30, earY: 47 },
  oval: { node: <ellipse cx="50" cy="44" rx="19" ry="23.5" />, earX: 31, earY: 46 },
  wide: { node: <ellipse cx="50" cy="45" rx="22" ry="20.5" />, earX: 28.5, earY: 47 },
  square: { node: <rect x="29.5" y="22" width="41" height="44" rx="15" />, earX: 30, earY: 46 },
  taper: {
    node: (
      <path d="M50 22c11.5 0 20.5 8.5 20.5 19.5 0 8-3 15-8 20-3.5 3.5-8 5.5-12.5 5.5s-9-2-12.5-5.5c-5-5-8-12-8-20C29.5 30.5 38.5 22 50 22Z" />
    ),
    earX: 30,
    earY: 45,
  },
};

function Head({ shape, skin }: { shape: HeadShape; skin: string }) {
  return <g fill={skin}>{HEADS[shape].node}</g>;
}

function Ears({ shape, skin }: { shape: HeadShape; skin: string }) {
  const { earX, earY } = HEADS[shape];
  return (
    <>
      <circle cx={earX} cy={earY} r="5.5" fill={skin} />
      <circle cx={100 - earX} cy={earY} r="5.5" fill={skin} />
      <path d={`M${earX - 0.6} ${earY - 1.8}a2.6 2.6 0 0 0 0 3.8`} stroke={INK} strokeWidth="1" fill="none" opacity="0.3" strokeLinecap="round" />
      <path d={`M${100 - earX + 0.6} ${earY - 1.8}a2.6 2.6 0 0 1 0 3.8`} stroke={INK} strokeWidth="1" fill="none" opacity="0.3" strokeLinecap="round" />
    </>
  );
}

/* ---------------------------------- Eyes ---------------------------------- */

const EYE_L = 41.5;
const EYE_R = 58.5;
const EYE_Y = 43;

function OpenEye({ x, r = 7 }: { x: number; r?: number }) {
  return (
    <>
      <circle cx={x} cy={EYE_Y} r={r} fill={INK} />
      <circle cx={x - r * 0.3} cy={EYE_Y - r * 0.34} r={r * 0.34} fill={WHITE} />
      <circle cx={x + r * 0.28} cy={EYE_Y + r * 0.3} r={r * 0.16} fill={WHITE} opacity="0.7" />
    </>
  );
}

function ClosedEye({ x, up = false }: { x: number; up?: boolean }) {
  return (
    <path
      d={up ? `M${x - 5.5} ${EYE_Y + 2} q5.5 -6.5 11 0` : `M${x - 5.5} ${EYE_Y - 1} q5.5 6.5 11 0`}
      stroke={INK}
      strokeWidth="2.6"
      fill="none"
      strokeLinecap="round"
    />
  );
}

function HeartEye({ x }: { x: number }) {
  return (
    <path
      transform={`translate(${x} ${EYE_Y}) scale(0.72)`}
      d="M0 8 C-9 1 -9 -6 -4.4 -8 C-1.6 -9.2 0 -7 0 -5.4 C0 -7 1.6 -9.2 4.4 -8 C9 -6 9 1 0 8 Z"
      fill="#E45C7A"
    />
  );
}

function StarEye({ x }: { x: number }) {
  const r = 7.4;
  const k = r * 0.28;
  return (
    <path
      transform={`translate(${x} ${EYE_Y})`}
      d={`M0 ${-r} C ${k} ${-k} ${k} ${-k} ${r} 0 C ${k} ${k} ${k} ${k} 0 ${r} C ${-k} ${k} ${-k} ${k} ${-r} 0 C ${-k} ${-k} ${-k} ${-k} 0 ${-r} Z`}
      fill={INK}
    />
  );
}

/** Half-lidded and content: a sagging upper lid over a round lower eye. */
function SleepyEye({ x }: { x: number }) {
  return (
    <>
      <path
        d={`M${x - 6.6} ${EYE_Y - 0.8} q6.6 -4.4 13.2 0 a6.6 6.6 0 0 1 -13.2 0 Z`}
        fill={INK}
      />
      <circle cx={x - 2} cy={EYE_Y + 1.6} r="2.1" fill={WHITE} />
    </>
  );
}

function EyePair({ kind }: { kind: Eyes }) {
  switch (kind) {
    case 'wink':
      return (
        <>
          <OpenEye x={EYE_L} />
          <ClosedEye x={EYE_R} />
        </>
      );
    case 'heart':
      return (
        <>
          <HeartEye x={EYE_L} />
          <HeartEye x={EYE_R} />
        </>
      );
    case 'happy':
      return (
        <>
          <ClosedEye x={EYE_L} up />
          <ClosedEye x={EYE_R} up />
        </>
      );
    case 'star':
      return (
        <>
          <StarEye x={EYE_L} />
          <StarEye x={EYE_R} />
        </>
      );
    case 'sleepy':
      return (
        <>
          <SleepyEye x={EYE_L} />
          <SleepyEye x={EYE_R} />
        </>
      );
    default:
      return (
        <>
          <OpenEye x={EYE_L} />
          <OpenEye x={EYE_R} />
        </>
      );
  }
}

/* --------------------------------- Mouths --------------------------------- */

function MouthShape({ kind, y = 55 }: { kind: Mouth; y?: number }) {
  switch (kind) {
    case 'grin':
      return (
        <>
          <path d={`M42 ${y - 1.5} h16 a8 8 0 0 1 -16 0Z`} fill={INK} />
          <path d={`M46 ${y + 3.4} a4 3 0 0 0 8 0Z`} fill="#F2879F" />
        </>
      );
    case 'smirk':
      return <path d={`M45 ${y} q5 4.5 10 -1.5`} stroke={INK} strokeWidth="2.4" fill="none" strokeLinecap="round" />;
    case 'oh':
      return <ellipse cx="50" cy={y + 1} rx="3.4" ry="4.2" fill={INK} />;
    case 'soft':
      return <path d={`M46.5 ${y} q3.5 3.4 7 0`} stroke={INK} strokeWidth="2.4" fill="none" strokeLinecap="round" />;
    default:
      return <path d={`M44.5 ${y} q5.5 5.5 11 0`} stroke={INK} strokeWidth="2.4" fill="none" strokeLinecap="round" />;
  }
}

function Blush() {
  return (
    <>
      <ellipse cx="30.5" cy="52" rx="5.4" ry="3.4" fill={BLUSH} opacity="0.55" />
      <ellipse cx="69.5" cy="52" rx="5.4" ry="3.4" fill={BLUSH} opacity="0.55" />
    </>
  );
}

/* ------------------------------- Accessories ------------------------------ */

function Glasses() {
  return (
    <g stroke={INK} strokeWidth="1.9" fill="none">
      <circle cx={EYE_L} cy={EYE_Y} r="8.1" />
      <circle cx={EYE_R} cy={EYE_Y} r="8.1" />
      <path d="M50.4 43h-0.8M33.2 41.6 29 43.4M66.8 41.6 71 43.4" strokeLinecap="round" />
    </g>
  );
}

function Sunglasses() {
  return (
    <g>
      <path d="M30 38.5h40v3.2H30Z" fill={INK} />
      <rect x="30" y="39" width="18" height="13.5" rx="6" fill={INK} />
      <rect x="52" y="39" width="18" height="13.5" rx="6" fill={INK} />
      <path d="M48 41h4v2h-4Z" fill={INK} />
      <path d="M34 43.5a5 5 0 0 1 5-2.5" stroke={WHITE} strokeWidth="1.8" fill="none" strokeLinecap="round" opacity="0.55" />
      <path d="M56 43.5a5 5 0 0 1 5-2.5" stroke={WHITE} strokeWidth="1.8" fill="none" strokeLinecap="round" opacity="0.55" />
    </g>
  );
}

function Beard({ hair }: { hair: string }) {
  return (
    <path
      d="M30 45c.4 3 1.2 5.6 2.4 7.6 4-2.6 10-3.8 17.6-3.8s13.6 1.2 17.6 3.8c1.2-2 2-4.6 2.4-7.6 0 13.5-8.2 22-20 22s-20-8.5-20-22Z"
      fill={hair}
    />
  );
}

function Moustache({ hair }: { hair: string }) {
  return (
    <path
      d="M50 53.4c-2-2-5-2.5-7-1.2-1.6 1-1.6 2.7 0 3.3 2.4 1 5.2.1 7-2.1Zm0 0c2-2 5-2.5 7-1.2 1.6 1 1.6 2.7 0 3.3-2.4 1-5.2.1-7-2.1Z"
      fill={hair}
    />
  );
}

function Freckles() {
  return (
    <g fill={INK} opacity="0.26">
      <circle cx="29" cy="49" r="1" />
      <circle cx="33.5" cy="47" r="1" />
      <circle cx="34" cy="52.4" r="1" />
      <circle cx="71" cy="49" r="1" />
      <circle cx="66.5" cy="47" r="1" />
      <circle cx="66" cy="52.4" r="1" />
    </g>
  );
}

function Earrings() {
  return (
    <g fill={GOLD}>
      <circle cx="29" cy="53" r="3.2" />
      <circle cx="71" cy="53" r="3.2" />
    </g>
  );
}

function Headband({ color }: { color: string }) {
  return <path d="M29 37c5-4 13-6 21-6s16 2 21 6c-1 3-2 5-3 6-5-4-11-6-18-6s-13 2-18 6c-1-1-2-3-3-6Z" fill={color} />;
}

function Beanie({ color }: { color: string }) {
  return (
    <>
      <path d="M28 38c0-13 10-21 22-21s22 8 22 21Z" fill={color} />
      <rect x="27" y="36" width="46" height="7" rx="3.5" fill={color} />
      <rect x="27" y="36" width="46" height="7" rx="3.5" fill={INK} opacity="0.12" />
      <circle cx="50" cy="15" r="5" fill={color} />
    </>
  );
}

/* ---------------------------------- Hair ---------------------------------- */

function HairBack({ style, hair }: { style: HairStyle; hair: string }) {
  switch (style) {
    case 'long':
      return <path d="M24 44c0-16 11-24 26-24s26 8 26 24v30c0 6-6 8-9 4-3-16-6-22-17-22s-14 6-17 22c-3 4-9 2-9-4Z" fill={hair} />;
    case 'silver-long':
      return <path d="M23 46c0-17 12-26 27-26s27 9 27 26v28c0 6-7 7-9 2-2-14-7-20-18-20s-16 6-18 20c-2 5-9 4-9-2Z" fill={hair} />;
    case 'waves':
      return (
        <>
          <path d="M24 46c0-16 11-25 26-25s26 9 26 25v22c0 6-6 7-8 2-3 5-9 4-10-1-2 5-8 5-9 0-2 4-7 4-8 0-2 4-7 3-7-2Z" fill={hair} />
          <circle cx="27" cy="66" r="6" fill={hair} />
          <circle cx="73" cy="66" r="6" fill={hair} />
        </>
      );
    case 'ponytail':
      return (
        <>
          <path d="M72 34c9 2 12 12 10 22-1 7-6 11-10 9-3-2-2-6-1-11 1-6 0-13-4-16Z" fill={hair} />
          <path d="M24 46c0-15 11-24 26-24s26 9 26 24v6c0-12-10-18-26-18s-26 6-26 18Z" fill={hair} />
        </>
      );
    case 'bob-cowlick':
    case 'bob-fringe':
      return <path d="M24 46c0-16 11-25 26-25s26 9 26 25v16c0 4-5 5-6 1-1-12-3-18-20-18s-19 6-20 18c-1 4-6 3-6-1Z" fill={hair} />;
    case 'curls-clips':
      return (
        <>
          <circle cx="30" cy="34" r="11" fill={hair} />
          <circle cx="50" cy="26" r="12" fill={hair} />
          <circle cx="70" cy="34" r="11" fill={hair} />
          <circle cx="25" cy="46" r="8" fill={hair} />
          <circle cx="75" cy="46" r="8" fill={hair} />
        </>
      );
    case 'afro':
      return (
        <>
          <circle cx="31" cy="33" r="12.5" fill={hair} />
          <circle cx="50" cy="23" r="13.5" fill={hair} />
          <circle cx="69" cy="33" r="12.5" fill={hair} />
        </>
      );
    case 'topknot':
      return (
        <>
          <circle cx="50" cy="16" r="8.5" fill={hair} />
          <path d="M50 14c-4-4-3-8 0-9 3 1 4 5 0 9Z" fill={hair} />
        </>
      );
    default:
      return null;
  }
}

function HairFront({ style, hair }: { style: HairStyle; hair: string }) {
  switch (style) {
    case 'afro':
      return <path d="M30 38c0-11 9-18 20-18s20 7 20 18c-4-8-11-11-20-11s-16 3-20 11Z" fill={hair} />;
    case 'long':
      return (
        <>
          <path d="M29 42c0-14 9-22 21-22s21 8 21 22c-3-9-8-13-13-10-6 4-17 8-29 10Z" fill={hair} />
          <path d="M46 17c2-4 7-5 9-2-3 0-6 2-7 4Z" fill={hair} />
        </>
      );
    case 'silver-long':
      return <path d="M28 43c0-15 10-23 22-23s22 8 22 23c-3-10-9-14-15-11-7 4-18 8-29 11Z" fill={hair} />;
    case 'waves':
      return (
        <>
          <path d="M29 43c0-15 9-23 21-23s21 8 21 23c-3-10-9-13-14-10-7 4-16 7-28 10Z" fill={hair} />
          <path d="M33 30c6-6 22-8 32-2-8-2-22-1-32 2Z" fill={hair} opacity="0.5" />
        </>
      );
    case 'ponytail':
      return <path d="M29 42c0-14 9-22 21-22s21 8 21 22c-2-9-7-13-12-11-7 3-16 7-30 11Z" fill={hair} />;
    case 'bob-cowlick':
      return (
        <>
          <path d="M29 43c0-15 9-23 21-23s21 8 21 23c-4-11-11-14-21-14s-17 3-21 14Z" fill={hair} />
          <path d="M48 20c1-7 6-9 9-8-4 2-5 5-5 8Z" fill={hair} />
        </>
      );
    case 'bob-fringe':
      return <path d="M28 44c0-15 10-24 22-24s22 9 22 24c-2-12-9-17-22-17s-20 5-22 17Z" fill={hair} />;
    case 'curls-clips':
      return (
        <>
          <path d="M30 40c1-11 9-17 20-17s19 6 20 17c-5-8-12-11-20-11s-15 3-20 11Z" fill={hair} />
          <rect x="63" y="33" width="9" height="3.4" rx="1.7" transform="rotate(-24 63 33)" fill={GOLD} />
          <rect x="64" y="39" width="9" height="3.4" rx="1.7" transform="rotate(-24 64 39)" fill={GOLD} />
        </>
      );
    case 'short-fringe':
      return (
        <>
          <path d="M27 46c0-17 10-26 23-26s23 9 23 26c-2-9-6-14-11-16-8-3-20-2-27 4-4 3-7 7-8 12Z" fill={hair} />
          <path d="M30 32c8 9 32 9 40 0-2 13-38 13-40 0Z" fill={hair} />
        </>
      );
    case 'buzz':
      return (
        <>
          <path d="M30 42c0-13 9-20 20-20s20 7 20 20c-4-9-11-12-20-12s-16 3-20 12Z" fill={hair} />
          <path d="M47 22c1-6 6-8 9-7-4 1-5 4-5 7Z" fill={hair} />
        </>
      );
    case 'topknot':
      return <path d="M29 41c1-13 9-20 21-20s20 7 21 20c-4-10-11-13-21-13s-17 3-21 13Z" fill={hair} />;
    case 'fade':
      return (
        <>
          <path d="M30 40c1-12 9-19 20-19s19 7 20 19c-3-9-10-12-20-12s-17 3-20 12Z" fill={hair} />
          <path d="M30 40c1-4 2-7 4-9 8 5 24 5 32 0 2 2 3 5 4 9-4-5-36-5-40 0Z" fill={hair} opacity="0.45" />
        </>
      );
    case 'undercut':
      return (
        <>
          <path d="M29 38c2-11 10-17 21-17s19 6 21 17c-6-8-13-10-21-10s-15 2-21 10Z" fill={hair} />
          <path d="M29 38c1 3 1 5 1 7 3-6 10-8 20-8s17 2 20 8c0-2 0-4 1-7-5-6-13-8-21-8s-16 2-21 8Z" fill={INK} opacity="0.22" />
        </>
      );
    default:
      return null;
  }
}

/* --------------------------------- Animals -------------------------------- */

function AnimalEars({ animal, skin }: { animal: Animal; skin: string }) {
  switch (animal) {
    case 'cat':
    case 'fox':
      return (
        <>
          <path d="M30 30 33 12 48 24Z" fill={skin} />
          <path d="M70 30 67 12 52 24Z" fill={skin} />
          <path d="M33.4 27 35 17.6 42.6 23.6Z" fill={BLUSH} opacity="0.5" />
          <path d="M66.6 27 65 17.6 57.4 23.6Z" fill={BLUSH} opacity="0.5" />
        </>
      );
    case 'bear':
      return (
        <>
          <circle cx="30" cy="26" r="11" fill={skin} />
          <circle cx="70" cy="26" r="11" fill={skin} />
          <circle cx="30" cy="26" r="5.5" fill={BLUSH} opacity="0.45" />
          <circle cx="70" cy="26" r="5.5" fill={BLUSH} opacity="0.45" />
        </>
      );
    case 'panda':
      return (
        <>
          <circle cx="29" cy="25" r="11" fill={INK} />
          <circle cx="71" cy="25" r="11" fill={INK} />
        </>
      );
    case 'bunny':
      return (
        <>
          <ellipse cx="39" cy="16" rx="7" ry="18" fill={skin} />
          <ellipse cx="61" cy="16" rx="7" ry="18" fill={skin} />
          <ellipse cx="39" cy="17" rx="3.4" ry="12" fill={BLUSH} opacity="0.5" />
          <ellipse cx="61" cy="17" rx="3.4" ry="12" fill={BLUSH} opacity="0.5" />
        </>
      );
    case 'dog':
      return (
        <>
          <ellipse cx="26" cy="46" rx="9" ry="17" fill="#A9764C" />
          <ellipse cx="74" cy="46" rx="9" ry="17" fill="#A9764C" />
        </>
      );
    case 'owl':
      return (
        <>
          <path d="M28 34 36 16 46 30Z" fill="#9A7EC0" />
          <path d="M72 34 64 16 54 30Z" fill="#9A7EC0" />
        </>
      );
    case 'frog':
      return (
        <>
          <circle cx="34" cy="26" r="11" fill={skin} />
          <circle cx="66" cy="26" r="11" fill={skin} />
        </>
      );
    default:
      return null;
  }
}

function AnimalFace({ animal }: { animal: Animal }) {
  switch (animal) {
    case 'fox':
      return <path d="M50 40c-13 0-19 10-16 19 3 8 29 8 32 0 3-9-3-19-16-19Z" fill="#FBEEE4" />;
    case 'panda':
      return (
        <>
          <ellipse cx="42" cy="43" rx="9.5" ry="11" fill={INK} />
          <ellipse cx="58" cy="43" rx="9.5" ry="11" fill={INK} />
        </>
      );
    case 'cat':
    case 'dog':
    case 'bear':
      return <ellipse cx="50" cy="53" rx="13" ry="9" fill={WHITE} opacity={animal === 'bear' ? 0.5 : 0.72} />;
    case 'owl':
      return (
        <>
          <circle cx="42" cy="43" r="11" fill={WHITE} opacity="0.85" />
          <circle cx="58" cy="43" r="11" fill={WHITE} opacity="0.85" />
        </>
      );
    default:
      return null;
  }
}

function AnimalMouth({ animal }: { animal: Animal }) {
  if (animal === 'frog') {
    return <path d="M39 52q11 10 22 0" stroke={INK} strokeWidth="2.6" fill="none" strokeLinecap="round" />;
  }
  if (animal === 'owl') return <path d="M50 49 45 56h10Z" fill="#E3944F" />;
  if (animal === 'bunny' || animal === 'panda') {
    return (
      <>
        <ellipse cx="50" cy="50" rx="2.6" ry="2" fill={INK} />
        <path d="M50 52.4q-4 5 -7.5 1.6M50 52.4q4 5 7.5 1.6" stroke={INK} strokeWidth="2" fill="none" strokeLinecap="round" />
      </>
    );
  }
  return (
    <>
      <ellipse cx="50" cy="49.5" rx="3.4" ry="2.6" fill={INK} />
      <path d="M50 52.4q-4.5 5.5 -8.5 1.6M50 52.4q4.5 5.5 8.5 1.6" stroke={INK} strokeWidth="2.1" fill="none" strokeLinecap="round" />
    </>
  );
}

/* --------------------------------- Playful -------------------------------- */

function PlayfulBody({ kind, skin }: { kind: Playful; skin: string }) {
  switch (kind) {
    case 'monster':
      return (
        <>
          <path d="M34 20 38 8 45 19ZM66 20 62 8 55 19Z" fill="#3F9E86" />
          <path d="M50 20c13 0 22 10 22 23s-9 23-22 23-22-10-22-23 9-23 22-23Z" fill={skin} />
          <circle cx="34" cy="26" r="2.6" fill={INK} opacity="0.18" />
          <circle cx="66" cy="26" r="2.6" fill={INK} opacity="0.18" />
        </>
      );
    case 'cyclops':
      return (
        <>
          <path d="M50 19c13 0 23 11 23 24s-10 23-23 23-23-10-23-23 10-24 23-24Z" fill={skin} />
          <path d="M50 19c-2-6 1-10 4-10-2 3-2 6-1 9Z" fill={skin} />
        </>
      );
    case 'avocado':
      return (
        <>
          <path d="M50 18c12 0 21 12 21 26 0 13-9 22-21 22s-21-9-21-22c0-14 9-26 21-26Z" fill={skin} />
          <path d="M50 24c9 0 15 9 15 20 0 10-6 17-15 17s-15-7-15-17c0-11 6-20 15-20Z" fill="#D8E8A8" />
        </>
      );
    case 'ghost':
      return (
        <path
          d="M50 18c12 0 21 9 21 22v24c0 4-4 6-7 3l-3-3c-2-2-4-2-6 0l-2 2c-2 2-4 2-6 0l-2-2c-2-2-4-2-6 0l-3 3c-3 3-7 1-7-3V40c0-13 9-22 21-22Z"
          fill={skin}
        />
      );
  }
}

function PlayfulFace({ kind }: { kind: Playful }) {
  if (kind === 'cyclops') {
    return (
      <>
        <circle cx="50" cy="42" r="13" fill={WHITE} />
        <circle cx="50" cy="42" r="7" fill={INK} />
        <circle cx="46.6" cy="38.8" r="2.6" fill={WHITE} />
        <path d="M43 55q7 6 14 0" stroke={INK} strokeWidth="2.6" fill="none" strokeLinecap="round" />
      </>
    );
  }
  if (kind === 'avocado') {
    return (
      <>
        <circle cx="50" cy="61" r="6" fill="#B98047" />
        <circle cx="48.2" cy="59.2" r="2" fill="#D8A472" />
        <OpenEye x={43.5} r={5.6} />
        <OpenEye x={56.5} r={5.6} />
        <path d="M46.5 51q3.5 3.6 7 0" stroke={INK} strokeWidth="2.2" fill="none" strokeLinecap="round" />
      </>
    );
  }
  if (kind === 'monster') {
    return (
      <>
        <OpenEye x={EYE_L} />
        <OpenEye x={EYE_R} />
        <path d="M42 53.5h16a8 8 0 0 1-16 0Z" fill={INK} />
        <path d="M44.5 53.5 46.5 58 48.5 53.5ZM51.5 53.5 53.5 58 55.5 53.5Z" fill={WHITE} />
      </>
    );
  }
  return (
    <>
      <OpenEye x={EYE_L} r={6} />
      <OpenEye x={EYE_R} r={6} />
      <ellipse cx="50" cy="54" rx="3.4" ry="4.2" fill={INK} />
    </>
  );
}

/* ------------------------------- The avatar ------------------------------- */

export function AvatarArt({ id, size = 44 }: { id: string; size?: number }) {
  const def = avatarById(id) ?? AVATARS[0];
  const uid = useId().replace(/:/g, '');
  const clip = `c777-${uid}`;

  const {
    skin = SKIN.light,
    hair = INK,
    hairStyle = 'none',
    head = 'round',
    eyes = 'open',
    mouth = 'smile',
    accessories = [],
    animal,
    playful,
  } = def;

  const has = (a: Accessory) => accessories.includes(a);

  return (
    <svg viewBox="0 0 100 100" width={size} height={size} role="img" aria-label={def.label}>
      <defs>
        <clipPath id={clip}>
          <circle cx="50" cy="50" r="43" />
        </clipPath>
      </defs>

      <circle cx="50" cy="50" r="50" fill={def.ring} />
      <circle cx="50" cy="50" r="43" fill={def.ground} />

      <g clipPath={`url(#${clip})`}>
        <Sparkle x={20} y={30} r={4.6} fill={def.sparkle} />
        <Sparkle x={81} y={38} r={3.4} fill={def.sparkle} />
        <Sparkle x={24} y={64} r={2.8} fill={def.sparkle} />
        <Sparkle x={79} y={68} r={4.2} fill={def.sparkle} />

        <Shoulders top={def.top} skin={playful ? def.top : skin} />

        {playful ? (
          <>
            <PlayfulBody kind={playful} skin={skin} />
            <Blush />
            <PlayfulFace kind={playful} />
          </>
        ) : animal ? (
          <>
            <AnimalEars animal={animal} skin={skin} />
            <Head shape="round" skin={skin} />
            <AnimalFace animal={animal} />
            {animal === 'frog' ? (
              <>
                <circle cx="34" cy="26" r="5.6" fill={WHITE} />
                <circle cx="66" cy="26" r="5.6" fill={WHITE} />
                <circle cx="34" cy="27" r="2.9" fill={INK} />
                <circle cx="66" cy="27" r="2.9" fill={INK} />
              </>
            ) : animal === 'panda' ? (
              <>
                <circle cx="42" cy="43" r="4.6" fill={WHITE} />
                <circle cx="58" cy="43" r="4.6" fill={WHITE} />
                <circle cx="42" cy="43" r="2.7" fill={INK} />
                <circle cx="58" cy="43" r="2.7" fill={INK} />
              </>
            ) : (
              <>
                <OpenEye x={42} r={animal === 'owl' ? 5 : 6} />
                <OpenEye x={58} r={animal === 'owl' ? 5 : 6} />
              </>
            )}
            <Blush />
            <AnimalMouth animal={animal} />
          </>
        ) : (
          <>
            <HairBack style={hairStyle} hair={hair} />
            <Ears shape={head} skin={skin} />
            {has('earrings') ? <Earrings /> : null}
            <Head shape={head} skin={skin} />
            {has('beard') ? <Beard hair={hair} /> : null}
            <HairFront style={hairStyle} hair={hair} />
            {has('headband') ? <Headband color={def.top} /> : null}
            {has('beanie') ? <Beanie color={def.top} /> : null}

            <EyePair kind={eyes} />
            <Blush />
            {has('freckles') ? <Freckles /> : null}
            <MouthShape kind={mouth} y={has('moustache') ? 60 : 55} />
            {has('moustache') ? <Moustache hair={hair} /> : null}
            {has('glasses') ? <Glasses /> : null}
            {has('sunglasses') ? <Sunglasses /> : null}
          </>
        )}
      </g>

    </svg>
  );
}
