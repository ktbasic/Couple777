import type { Plan, RitualTier } from './types';
import { formatPlanDate } from './dates';

/**
 * The invite text. One shape per rhythm, because "a date idea" and "somewhere
 * to take you" are not the same invitation.
 */
const OPENER: Record<RitualTier, (name: string) => string> = {
  day: (n) => `${n} has a date idea for you 💌`,
  week: (n) => `${n} has a little adventure in mind 🏔️`,
  month: (n) => `${n} wants to take you somewhere ✈️`,
};

const CLOSER: Record<RitualTier, string> = {
  day: 'Open Couple777 to see the plan.',
  week: 'Your next Couple777 adventure.',
  month: 'Our next big Couple777 adventure.',
};

/** Stands in for a real deep link until there is a backend to link to. */
export function planLink(plan: Plan): string {
  return `https://couple777.app/i/${plan.id}`;
}

export function inviteText(plan: Plan, tier: RitualTier, from: string, message?: string): string {
  const when = plan.time ? `${formatPlanDate(plan.date)} · ${plan.time}` : formatPlanDate(plan.date);
  const lines = [OPENER[tier](from), '', plan.title, when];
  if (message?.trim()) lines.push('', `“${message.trim()}”`);
  lines.push('', CLOSER[tier], planLink(plan));
  return lines.join('\n');
}

export interface ShareOutcome {
  method: 'share' | 'clipboard' | 'failed';
}

/**
 * Native sheet where the platform offers one — that is what puts WhatsApp,
 * Messages and the rest in front of the user without integrating any of them.
 * Falls back to the clipboard.
 */
export async function shareInvite(text: string, title: string): Promise<ShareOutcome> {
  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({ title, text });
      return { method: 'share' };
    } catch (err) {
      // A user dismissing the sheet is not a failure worth falling back on.
      if (err instanceof DOMException && err.name === 'AbortError') return { method: 'share' };
    }
  }
  try {
    await navigator.clipboard.writeText(text);
    return { method: 'clipboard' };
  } catch {
    return { method: 'failed' };
  }
}

export function canShareNatively(): boolean {
  return typeof navigator !== 'undefined' && typeof navigator.share === 'function';
}

/* --------------------------- External planning --------------------------- */

/**
 * Plain search links, opened in a new tab. No APIs, no embedding, no scraping —
 * Couple777 stays a relationship ritual rather than a travel marketplace.
 */
export function bookingUrl(destination: string): string {
  return `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(destination)}`;
}

export function airbnbUrl(destination: string): string {
  return `https://www.airbnb.com/s/${encodeURIComponent(destination)}/homes`;
}

export function mapsUrl(query: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export function restaurantUrl(query: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${query} restaurant`)}`;
}
