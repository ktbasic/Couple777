import { supabase } from './supabase';
import {
  emptyContext,
  localRecommendations,
  type CoupleContext,
  type Recommendation,
} from '@shared/ideaRank';
import type { IdeaFilters } from '@shared/ideaTypes';

/**
 * Asking for date ideas: from the model when it can be reached, from the phone
 * when it cannot.
 *
 * Both paths return the same list, ranked under the same rules, because the
 * rules live in `shared/ideaRank.ts` and both of them run it. What the model
 * adds is the ordering inside a tier and the wording on the card — the part
 * that needs to know what this couple is like. What it cannot add is an idea
 * that is over budget or that needs two people in a room they do not share:
 * the endpoint decides that before the model sees anything.
 *
 * One request per ask. It returns the whole ranked list, and the screen pages
 * through it — so "More ideas" costs nothing and, more to the point, cannot
 * come back with a different answer to the same question. A model's ordering
 * is stable within one response and nowhere else, which is exactly as much
 * determinism as paging needs and more than re-asking would give.
 */

export type RecommendationSource = 'model' | 'device' | 'rules';

export interface Recommendations {
  source: RecommendationSource;
  items: Recommendation[];
  /** True when the corpus is out of things to offer, not when a call failed. */
  exhausted: boolean;
}

const ENDPOINT = '/api/recommend-ideas';
const TIMEOUT_MS = 15_000;

/** Why the phone did the ranking. Shown only in debug. */
let lastFallbackReason: string | null = null;
export function fallbackReason(): string | null {
  return lastFallbackReason;
}

export async function recommendIdeas(
  filters: IdeaFilters,
  context: CoupleContext = emptyContext(),
  count = 5,
): Promise<Recommendations> {
  try {
    /*
     * The endpoint will not answer without a signed-in caller, and it is right
     * not to. No session is not an error worth a round trip — the phone can
     * rank perfectly well on its own.
     */
    const token = (await supabase?.auth.getSession())?.data.session?.access_token;
    if (!token) throw new Error('NoSession: not signed in');

    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), TIMEOUT_MS);
    const response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
      body: JSON.stringify({ filters, context, count }),
      signal: controller.signal,
    }).finally(() => window.clearTimeout(timer));

    if (response.ok) {
      const body = (await response.json()) as {
        source?: RecommendationSource;
        recommendations?: Recommendation[];
        exhausted?: boolean;
      };
      lastFallbackReason = null;
      return {
        source: body.source === 'model' ? 'model' : 'rules',
        items: body.recommendations ?? [],
        exhausted: Boolean(body.exhausted),
      };
    }

    const body = (await response.json().catch(() => ({}))) as {
      error?: string;
      upstream?: { status?: number; type?: string; message?: string };
    };
    const up = body.upstream;
    lastFallbackReason = [
      `${response.status} ${body.error ?? response.statusText}`,
      up && `— ${up.status ?? ''} ${up.type ?? ''}`.trim(),
      up?.message && `: ${up.message}`,
    ]
      .filter(Boolean)
      .join(' ');
  } catch (e) {
    lastFallbackReason = e instanceof Error ? `${e.name}: ${e.message}` : String(e);
  }

  console.warn(`[couple777] ideas ranked on this device — ${lastFallbackReason}`);
  return {
    source: 'device',
    // Deliberately generous: the screen pages through this, so it asks for
    // more than one page's worth exactly as the endpoint does.
    items: localRecommendations(filters, context, 20),
    exhausted: true,
  };
}
