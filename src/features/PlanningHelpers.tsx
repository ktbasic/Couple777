import { airbnbUrl, bookingUrl, mapsUrl, restaurantUrl } from '@/lib/share';
import type { RitualTier } from '@/lib/types';
import s from './PlanningHelpers.module.css';

const OUT = (
  <svg viewBox="0 0 24 24" width="12" height="12" aria-hidden className={s.out}>
    <path
      d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

function Out({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a className={s.link} href={href} target="_blank" rel="noopener noreferrer">
      {children}
      {OUT}
    </a>
  );
}

/**
 * Somewhere to keep going, not somewhere to book. These are plain search links
 * opened in a new tab — Couple777 stays the ritual, and the travel sites stay
 * the travel sites.
 */
export function PlanningHelpers({
  tier,
  destination,
}: {
  tier: RitualTier;
  destination?: string;
}) {
  const where = destination?.trim();
  if (!where) return null;

  if (tier === 'day') {
    return (
      <div className={s.block}>
        <p className={s.label}>Getting there</p>
        <div className={s.row}>
          <Out href={restaurantUrl(where)}>🍽 Find a restaurant</Out>
          <Out href={mapsUrl(where)}>📍 Open in Maps</Out>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={s.block}>
        <p className={s.label}>Stay</p>
        <div className={s.row}>
          <Out href={bookingUrl(where)}>Search Booking.com</Out>
          <Out href={airbnbUrl(where)}>Search Airbnb</Out>
        </div>
        <p className={s.note}>Opens a search for {where}. Nothing is booked from here.</p>
      </div>

      <div className={s.block}>
        <p className={s.label}>Getting there</p>
        <div className={s.row}>
          <Out href={mapsUrl(where)}>📍 Open in Maps</Out>
        </div>
      </div>
    </>
  );
}
