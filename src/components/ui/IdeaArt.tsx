import { useId } from 'react';
import type { IdeaCategory } from '@/lib/types';
import s from './IdeaArt.module.css';

/**
 * The picture on a date idea.
 *
 * Drawn, not fetched. Every idea already carries a `category` — it is what the
 * diversity rule counts — so there is nothing new to maintain: a new idea gets
 * a picture the moment it gets a category, and no asset has to be found,
 * cropped, licensed or uploaded.
 *
 * They are inline SVG rather than files for the reason that matters most on a
 * phone: no request. Nothing to be slow, nothing to fail on a train, nothing
 * to fall back from. Which also settles the fallback rule — there is no state
 * in which a date idea shows something unrelated, because there is no state in
 * which it shows a photograph at all.
 *
 * This replaces seeded picsum.photos placeholders. Those were random stock:
 * "Cook one dish from scratch" was as likely to be a mountain as a kitchen,
 * which is worse than an abstract shape that is at least honestly abstract.
 *
 * Nearby and Big Trips still use photography, deliberately. Those are real
 * places, and a real place wants a real picture of it.
 */

interface Palette {
  /** Background, light to slightly deeper. */
  from: string;
  to: string;
  /** The motif, and its softer companion. */
  ink: string;
  soft: string;
}

/*
 * Seven, one per category, all inside the app's pink → peach → lavender arc.
 * They are spaced around that arc rather than repeated so a row of cards reads
 * as varied without any of them leaving the family.
 */
const PALETTE: Record<IdeaCategory, Palette> = {
  food: { from: '#FFE9DC', to: '#FBD0B9', ink: '#D2703F', soft: '#F6B792' },
  wellness: { from: '#FDF0E6', to: '#F6DCC8', ink: '#C08150', soft: '#EFC5A2' },
  outdoors: { from: '#F4E9F2', to: '#E2D2E7', ink: '#8E6395', soft: '#C7A9CD' },
  culture: { from: '#EDE8F8', to: '#D9CFEF', ink: '#7256A6', soft: '#B4A0DA' },
  creative: { from: '#F9E7F2', to: '#EFD0E4', ink: '#B0538C', soft: '#DFA3C6' },
  conversation: { from: '#FDE6EE', to: '#F8CEDE', ink: '#C43569', soft: '#EE9CB8' },
  game: { from: '#FFE2EB', to: '#FFC7D9', ink: '#D83E72', soft: '#F794B0' },
};

/* If a category ever goes missing, this is what shows — branded, never
   random. It is the app's own rose, which is the safest thing to be wrong. */
const DEFAULT_PALETTE: Palette = PALETTE.conversation;

/**
 * The motif for each category, drawn on a 120×120 field.
 *
 * Deliberately simple and all in one hand: the same stroke weight, the same
 * rounded caps, the same amount of the frame filled. They are meant to read as
 * one set at thumbnail size, where detail is lost anyway.
 */
function Motif({ category, p }: { category: IdeaCategory; p: Palette }) {
  const stroke = { stroke: p.ink, strokeWidth: 3.4, fill: 'none', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };

  switch (category) {
    case 'food':
      return (
        <g>
          {/* Two glasses, met in the middle. */}
          <path d="M42 46h20l-3 15a7 7 0 0 1-14 0Z" {...stroke} />
          <path d="M52 61v13" {...stroke} />
          <path d="M45 74h14" {...stroke} />
          <path d="M62 40h20l-3 15a7 7 0 0 1-14 0Z" {...stroke} opacity="0.55" />
          <path d="M72 55v13" {...stroke} opacity="0.55" />
          <path d="M65 68h14" {...stroke} opacity="0.55" />
        </g>
      );

    case 'wellness':
      return (
        <g>
          {/* Still water, and steam off it. */}
          <path d="M34 68h52" {...stroke} />
          <path d="M38 68v8a10 10 0 0 0 10 10h24a10 10 0 0 0 10-10v-8" {...stroke} />
          <path d="M52 52c0-6 6-6 6-12" {...stroke} opacity="0.6" />
          <path d="M64 56c0-6 6-6 6-12" {...stroke} opacity="0.6" />
          <circle cx="60" cy="34" r="4" fill={p.soft} stroke="none" />
        </g>
      );

    case 'outdoors':
      return (
        <g>
          {/* A horizon worth walking to. */}
          <circle cx="76" cy="42" r="9" fill={p.soft} stroke="none" />
          <path d="M28 82l18-22 12 14 10-12 24 20Z" fill={p.ink} opacity="0.16" stroke="none" />
          <path d="M28 82l18-22 12 14 10-12 24 20" {...stroke} />
          <path d="M30 82h60" {...stroke} opacity="0.45" />
        </g>
      );

    case 'culture':
      return (
        <g>
          {/*
            An open book — museums, bookshops, films and records all live in
            this category, and a book is the one shape that reads as all of
            them. It was a framed picture, which at thumbnail size was exactly
            the broken-image glyph, and a mountain inside a frame besides.
          */}
          <path d="M60 44c-6-5-14-7-22-6v38c8-1 16 1 22 6" {...stroke} />
          <path d="M60 44c6-5 14-7 22-6v38c-8-1-16 1-22 6" {...stroke} />
          <path d="M60 44v38" {...stroke} opacity="0.5" />
          <path d="M45 55h9M45 64h9" {...stroke} strokeWidth={2.4} opacity="0.45" />
          <path d="M66 55h9M66 64h9" {...stroke} strokeWidth={2.4} opacity="0.45" />
        </g>
      );

    case 'creative':
      return (
        <g>
          {/*
            A palette. It was a circle with a handle, which at this size is a
            magnifying glass — and "search" is not what making something with
            your hands looks like.
          */}
          <path
            d="M60 32c16 0 28 11 28 25 0 9-7 12-13 12h-5a6 6 0 0 0-4 10c1 3-1 6-6 6-16 0-28-12-28-27S44 32 60 32Z"
            {...stroke}
          />
          <circle cx="50" cy="50" r="4" fill={p.ink} stroke="none" opacity="0.75" />
          <circle cx="64" cy="45" r="4" fill={p.soft} stroke="none" />
          <circle cx="75" cy="55" r="4" fill={p.ink} stroke="none" opacity="0.45" />
        </g>
      );

    case 'conversation':
      return (
        <g>
          {/* Two people, still asking. */}
          <path d="M32 40h34a6 6 0 0 1 6 6v16a6 6 0 0 1-6 6H46l-10 9V68h-4a6 6 0 0 1-6-6V46a6 6 0 0 1 6-6Z" {...stroke} />
          <path d="M82 54h6a6 6 0 0 1 6 6v14a6 6 0 0 1-6 6h-2v8l-9-8" {...stroke} opacity="0.5" />
          <circle cx="43" cy="54" r="2.6" fill={p.ink} stroke="none" />
          <circle cx="52" cy="54" r="2.6" fill={p.ink} stroke="none" />
          <circle cx="61" cy="54" r="2.6" fill={p.ink} stroke="none" />
        </g>
      );

    case 'game':
      return (
        <g>
          {/* Competing, briefly and badly. */}
          <rect x="30" y="46" width="36" height="36" rx="8" {...stroke} />
          <circle cx="42" cy="58" r="3.2" fill={p.ink} stroke="none" />
          <circle cx="54" cy="70" r="3.2" fill={p.ink} stroke="none" />
          <rect x="62" y="34" width="30" height="30" rx="7" {...stroke} opacity="0.55" />
          <circle cx="77" cy="49" r="3.2" fill={p.soft} stroke="none" />
        </g>
      );
  }
}

/**
 * A small, stable variation per idea, so two food cards in one list are not
 * the same picture twice. It only moves the light — the gradient angle and
 * where the soft blooms sit — never the colours or the motif, because the
 * point of a set is that it stays a set.
 */
function wobble(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return {
    angle: 100 + (h % 60),
    bloomX: 22 + (h % 30),
    bloomY: 20 + ((h >> 3) % 26),
    bloomR: 26 + ((h >> 6) % 12),
  };
}

export function IdeaArt({
  category,
  seed,
  className,
  ratio = '1 / 1',
}: {
  category?: IdeaCategory;
  /** The idea's id. Only moves the light, never the colours. */
  seed: string;
  className?: string;
  ratio?: string;
}) {
  /* SVG gradient ids are global to the document, so several cards on one
     screen would otherwise all paint with whichever gradient rendered last. */
  const uid = useId().replace(/:/g, '');
  const p = (category && PALETTE[category]) || DEFAULT_PALETTE;
  const w = wobble(seed);

  return (
    <div className={[s.frame, className ?? ''].filter(Boolean).join(' ')} style={{ aspectRatio: ratio }}>
      {/*
        `slice` rather than the default `meet`. The field is square and the
        frame is not — a card asks for 4:3 — and letterboxing a square into it
        painted two bare pink bars either side of a small square drawing, which
        read as a broken image rather than a picture. Filling crops about
        fifteen units off the top and bottom of the field, which the motifs
        (all inside y 35–90) never use.
      */}
      <svg
        viewBox="0 0 120 120"
        preserveAspectRatio="xMidYMid slice"
        className={s.svg}
        role="presentation"
        aria-hidden
        focusable="false"
      >
        <defs>
          <linearGradient id={`g${uid}`} gradientTransform={`rotate(${w.angle} 0.5 0.5)`}>
            <stop offset="0%" stopColor={p.from} />
            <stop offset="100%" stopColor={p.to} />
          </linearGradient>
          <radialGradient id={`b${uid}`}>
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.75" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </radialGradient>
        </defs>

        <rect width="120" height="120" fill={`url(#g${uid})`} />
        <circle cx={w.bloomX} cy={w.bloomY} r={w.bloomR} fill={`url(#b${uid})`} />
        <circle cx={120 - w.bloomX} cy={118 - w.bloomY} r={w.bloomR * 0.8} fill={p.soft} opacity="0.18" />

        <Motif category={(category && PALETTE[category] ? category : 'conversation') as IdeaCategory} p={p} />
      </svg>
    </div>
  );
}
