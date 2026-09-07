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

/** Where the time went, when the endpoint answered. Milliseconds. */
export interface Timings {
  authMs: number;
  modelMs: number;
  totalMs: number;
  outputTokens?: number;
}

export interface Recommendations {
  source: RecommendationSource;
  items: Recommendation[];
  /** True when the corpus is out of things to offer, not when a call failed. */
  exhausted: boolean;
  timings?: Timings;
}

/** The last answer's timings, shown only in debug. */
let lastTimings: Timings | null = null;
export function lastLatency(): Timings | null {
  return lastTimings;
}

const ENDPOINT = '/api/recommend-ideas';
/*
 * Thirty seconds, up from fifteen — because fifteen was cutting off a request
 * that was on its way. The first live deployment fell back on every ask with
 * "AbortError: Fetch is aborted": the endpoint was working, the model was
 * answering, and the phone had already stopped listening.
 *
 * It sits inside two larger ceilings on purpose. The SDK gives the model 45s
 * and the platform allows 60, so when the phone does give up the request still
 * finishes and still writes down how long it took. The alternative — the
 * server being killed at the same moment — logs nothing, and a fallback with
 * no reason attached is how the last three days went.
 */
const TIMEOUT_MS = 30_000;

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
        timings?: Timings;
      };
      lastFallbackReason = null;
      lastTimings = body.timings ?? null;
      return {
        source: body.source === 'model' ? 'model' : 'rules',
        items: body.recommendations ?? [],
        exhausted: Boolean(body.exhausted),
        timings: body.timings,
      };
    }

    const body = (await response.json().catch(() => ({}))) as {
      error?: string;
      upstream?: { status?: number; type?: string; message?: string };
      timings?: Timings;
    };
    lastTimings = body.timings ?? null;
    const up = body.upstream;
    lastFallbackReason = [
      `${response.status} ${body.error ?? response.statusText}`,
      up && `— ${up.status ?? ''} ${up.type ?? ''}`.trim(),
      up?.message && `: ${up.message}`,
    ]
      .filter(Boolean)
      .join(' ');
  } catch (e) {
    lastTimings = null;
    lastFallbackReason =
      e instanceof Error && e.name === 'AbortError'
        ? `gave up waiting after ${TIMEOUT_MS / 1000}s`
        : e instanceof Error
          ? `${e.name}: ${e.message}`
          : String(e);
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
