/**
 * Four icons for the four ways information moves between two people. They
 * share one motif — the overlapping pair from the Couple777 mark — so the
 * distinctions read as variations on one relationship, not four stock glyphs.
 */

interface IconProps {
  size?: number;
}

const STROKE = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

/** Two circles fully overlapping: everything in the middle belongs to both. */
export function IconShared({ size = 34 }: IconProps) {
  return (
    <svg viewBox="0 0 40 40" width={size} height={size} aria-hidden>
      <circle cx="16" cy="20" r="10" fill="currentColor" opacity="0.14" />
      <circle cx="24" cy="20" r="10" fill="currentColor" opacity="0.14" />
      <path d="M20 12.2a10 10 0 0 0 0 15.6 10 10 0 0 0 0-15.6Z" fill="currentColor" opacity="0.34" />
      <circle {...STROKE} cx="16" cy="20" r="10" />
      <circle {...STROKE} cx="24" cy="20" r="10" />
    </svg>
  );
}

/** One circle closed off — a keyhole in the half that stays yours. */
export function IconPrivate({ size = 34 }: IconProps) {
  return (
    <svg viewBox="0 0 40 40" width={size} height={size} aria-hidden>
      <circle cx="24" cy="20" r="10" fill="currentColor" opacity="0.10" />
      <circle {...STROKE} cx="24" cy="20" r="10" strokeDasharray="3 3.4" />
      <circle cx="16" cy="20" r="10" fill="currentColor" opacity="0.16" />
      <circle {...STROKE} cx="16" cy="20" r="10" />
      <path {...STROKE} d="M13 20.4v-1.8a3 3 0 0 1 6 0v1.8" />
      <rect {...STROKE} x="12.2" y="20.4" width="7.6" height="5.6" rx="1.6" />
    </svg>
  );
}

/** A wrapped shape over the pair: there, visible, contents withheld. */
export function IconSurprise({ size = 34 }: IconProps) {
  return (
    <svg viewBox="0 0 40 40" width={size} height={size} aria-hidden>
      <circle cx="14" cy="17" r="8.5" fill="currentColor" opacity="0.14" />
      <circle cx="26" cy="17" r="8.5" fill="currentColor" opacity="0.14" />
      <rect x="9" y="20" width="22" height="12" rx="2.6" fill="currentColor" opacity="0.20" />
      <rect {...STROKE} x="9" y="20" width="22" height="12" rx="2.6" />
      <path {...STROKE} d="M20 20v12M9 24.6h22" />
      <path {...STROKE} d="M20 20c-3.4 0-5.4-1.2-5.4-3s3.2-2 5.4 3c2.2-5 5.4-4.8 5.4-3s-2 3-5.4 3Z" />
    </svg>
  );
}

/** Both halves opening at once — the double-blind reveal. */
export function IconReveal({ size = 34 }: IconProps) {
  return (
    <svg viewBox="0 0 40 40" width={size} height={size} aria-hidden>
      <circle cx="13" cy="20" r="8.5" fill="currentColor" opacity="0.16" />
      <circle cx="27" cy="20" r="8.5" fill="currentColor" opacity="0.16" />
      <circle {...STROKE} cx="13" cy="20" r="8.5" />
      <circle {...STROKE} cx="27" cy="20" r="8.5" />
      <path {...STROKE} d="M20 8.6v3.2M14.6 10.2l1.4 2.6M25.4 10.2 24 12.8" />
      <path {...STROKE} d="M10.4 20.6h5.2M24.4 20.6h5.2" />
    </svg>
  );
}

export const PRIVACY_ICONS = {
  shared: IconShared,
  private: IconPrivate,
  surprise: IconSurprise,
  reveal: IconReveal,
} as const;
