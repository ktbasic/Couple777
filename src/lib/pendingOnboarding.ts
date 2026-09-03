import type { CoupleProfile } from './types';
import type { Json } from './db/schema';

/**
 * The onboarding answers, held between "I answered the questions" and "I have
 * an account to attach them to".
 *
 * The emotional intro and the personalization deliberately come before sign-up
 * — asking someone to make an account before they know what the thing is loses
 * them — so the answers exist for a few screens with nowhere to live. They go
 * here, in this browser, and move to the profile the moment an account exists.
 */

const KEY = 'couple777:pending-onboarding';

export interface PendingOnboarding {
  displayName?: string;
  avatarId?: string;
  /** The personal answers: what a good date looks like, how much time, etc. */
  datePreferences?: Json;
  relationshipPreferences?: Json;
  /** The couple-level answers, used when this person creates the space. */
  coupleProfile?: CoupleProfile;
}

export function pendingOnboarding(): PendingOnboarding | null {
  try {
    const raw = window.sessionStorage.getItem(KEY) ?? window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as PendingOnboarding) : null;
  } catch {
    return null;
  }
}

export function savePendingOnboarding(patch: PendingOnboarding): void {
  try {
    const next = { ...(pendingOnboarding() ?? {}), ...patch };
    // localStorage rather than sessionStorage: an OAuth sign-in leaves and
    // comes back, and on iOS that can be a different tab.
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* Private mode — the answers are simply asked again later. */
  }
}

export function clearPendingOnboarding(): void {
  try {
    window.localStorage.removeItem(KEY);
    window.sessionStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
