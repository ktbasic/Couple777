import { useState, type CSSProperties } from 'react';
import { gradientFor } from '@/lib/photo';
import s from './Photo.module.css';

interface PhotoProps {
  src?: string;
  alt?: string;
  seed?: string;
  className?: string;
  style?: CSSProperties;
  /** CSS aspect-ratio, e.g. "4 / 3". */
  ratio?: string;
  rounded?: string;
}

/**
 * Images fail — offline, blocked, or a dead placeholder host. A warm gradient
 * underneath means a card never renders as a grey hole.
 */
export function Photo({ src, alt = '', seed, className, style, ratio, rounded }: PhotoProps) {
  const [loaded, setLoaded] = useState(false);
  const key = seed ?? src ?? alt ?? 'c777';

  return (
    <div
      className={[s.wrap, className ?? ''].filter(Boolean).join(' ')}
      style={{ aspectRatio: ratio, borderRadius: rounded, ...style }}
    >
      <div className={s.fallback} style={{ background: gradientFor(key) }} aria-hidden />
      {src ? (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          className={[s.img, loaded ? s.loaded : ''].join(' ')}
          onLoad={() => setLoaded(true)}
        />
      ) : null}
    </div>
  );
}
