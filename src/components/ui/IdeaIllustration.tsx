import { useState } from 'react';
import { IdeaArt } from './IdeaArt';
import type { IdeaCategory } from '@/lib/types';
import s from './IdeaIllustration.module.css';

/**
 * The picture on a date idea: its own scene, not a symbol for its kind.
 *
 * Each idea names an `illustrationId` and the file lives in
 * `src/assets/idea-illustrations/`. Which files exist is resolved at build
 * time rather than by asking the network, so an idea whose illustration has
 * not been drawn yet quietly falls back instead of firing a 404 on every card
 * of every screen — and a replaced illustration gets a new fingerprinted URL,
 * so nobody is served last month's from a cache.
 *
 * The fallback is `IdeaArt`, the category drawing. That is all `category` is
 * for here now: something branded to show while the real scene is still being
 * made, and a floor if one is ever missing. It is not what picks the picture.
 * It was, and the result was every outdoors idea showing the same hills.
 */

/*
 * Vite reads this at build time and hands back only files that are actually
 * present. `webp` first because that is what the brief asks for; png and svg
 * are accepted so a hand-drawn or exported-from-Figma asset drops in without
 * a code change.
 */
const FILES = import.meta.glob('@/assets/idea-illustrations/*.{webp,png,svg}', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;

/** `…/idea-illustrations/pasta.webp` → `pasta`. */
const BY_ID: Record<string, string> = Object.fromEntries(
  Object.entries(FILES).map(([path, url]) => [
    path.split('/').pop()!.replace(/\.(webp|png|svg)$/, ''),
    url,
  ]),
);

/** How many of the 65 are drawn. Read by the illustration coverage check. */
export function drawnIllustrations(): string[] {
  return Object.keys(BY_ID).sort();
}

export function IdeaIllustration({
  illustrationId,
  category,
  seed,
  alt = '',
  className,
  ratio = '1 / 1',
}: {
  illustrationId?: string;
  /** Only ever the fallback. Never what chooses the picture. */
  category?: IdeaCategory;
  seed: string;
  alt?: string;
  className?: string;
  ratio?: string;
}) {
  const src = illustrationId ? BY_ID[illustrationId] : undefined;
  /* A file can exist and still fail to decode. Rare, but a broken-image glyph
     on a card is worse than the drawing we already have. */
  const [broken, setBroken] = useState(false);

  if (!src || broken) {
    return <IdeaArt category={category} seed={seed} className={className} ratio={ratio} />;
  }

  return (
    <div className={[s.frame, className ?? ''].filter(Boolean).join(' ')} style={{ aspectRatio: ratio }}>
      <img
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        className={s.img}
        onError={() => setBroken(true)}
      />
    </div>
  );
}
