import { DATE_IDEAS } from './dateIdeas.js';
import type { BaseIdea, IdeaCategory, IdeaFilters, Vibe } from './ideaTypes.js';

/**
 * Which ideas a couple may be shown, and in what order.
 *
 * Pure, and shared on purpose: the endpoint runs this to decide what the model
 * is even allowed to rank, and the browser runs the same code when the model
 * cannot be reached. Two copies of this logic would eventually disagree, and
 * the disagreement would show up as the app offering something it had already
 * ruled out.
 *
 * The shape of the thing:
 *
 *   eligible  — hard facts. Over budget, or needs a room you cannot share.
 *               Not a near miss; simply not on the list.
 *   tier      — how many of the three taste rows it misses (0, 1, 2, 3).
 *               Slots fill in tier order and nothing ever promotes a tier 1
 *               above a tier 0, so a preference is never traded away to make
 *               room for something the ranker liked more.
 *   score     — the ordering *within* a tier. History lives here and only
 *               here: filter compatibility outranks freshness, always.
 *
 * The model reorders within these rules. It cannot escape them.
 */

/* ------------------------------- Eligibility ------------------------------ */

export interface CoupleContext {
  /** Onboarding: what they said they want more of, as vibes. */
  wishes: Vibe[];
  /** Onboarding: how they describe themselves, as vibes. */
  vibes: Vibe[];
  proximity: 'together' | 'same-area' | 'different-cities' | 'long-distance';
  /** Hearted, or on the shared list. A positive signal about *kind*. */
  liked: string[];
  onList: string[];
  /** Actually done. Suppressed itself, but its kind is still welcome. */
  done: string[];
  /** Already shown in this run of results. Excluded outright, this run only. */
  shown: string[];
}

export function emptyContext(): CoupleContext {
  return {
    wishes: [],
    vibes: [],
    proximity: 'together',
    liked: [],
    onList: [],
    done: [],
    shown: [],
  };
}

/** Two people who are not in the same place cannot do an in-person thing. */
export function apart(proximity: CoupleContext['proximity']): boolean {
  return proximity === 'long-distance';
}

/**
 * The hard facts, in one place.
 *
 * Budget is a ceiling and is never bent — being shown something you cannot
 * afford is worse than being shown nothing. Mode is the same kind of fact for
 * a couple who live apart, which is why `long-distance` removes in-person
 * ideas rather than demoting them.
 *
 * `different-cities` deliberately does *not*: people an hour apart do see each
 * other, and making it a hard filter would quietly delete most of the app for
 * them. It is a preference there, applied in `score`.
 */
export function isEligible(idea: BaseIdea, f: IdeaFilters, ctx: CoupleContext): boolean {
  if (f.budget != null && idea.cost > f.budget) return false;
  if (apart(ctx.proximity) && idea.mode === 'in_person') return false;
  /*
   * And the mirror of it. "Coffee at the same time, two cities" is a good
   * answer to living apart and a strange thing to say to two people in the
   * same kitchen — the distance is the whole premise, so without it the idea
   * is not merely less appealing, it does not make sense. Ideas that work
   * either way are marked `either` and are unaffected.
   */
  if (ctx.proximity === 'together' && idea.mode === 'remote') return false;
  return true;
}

/* ---------------------------------- Tiers --------------------------------- */

/** The three rows that can be missed, and the words for missing one. */
export type SoftRow = 'time' | 'setting' | 'vibe';

const ROW_LABEL: Record<SoftRow, string> = {
  time: 'time',
  setting: 'setting',
  vibe: 'vibe',
};

export interface Missed {
  row: SoftRow;
  /** "Playful instead of Romantic" — what to put on the card. */
  label: string;
}

const VIBE_WORD: Record<Vibe, string> = {
  romantic: 'Romantic',
  fun: 'Playful',
  adventurous: 'Adventurous',
  relaxing: 'Cozy',
  creative: 'Creative',
};

const DAYPART_WORD: Record<string, string> = {
  morning: 'Morning',
  brunch: 'Brunch',
  afternoon: 'Afternoon',
  evening: 'Evening',
  late: 'Night',
  wholeday: 'All day',
};

/**
 * Which of the three taste rows this idea does not satisfy.
 *
 * An unanswered row cannot be missed — no preference is not a preference to
 * fall short of. Duration and energy are not here because no screen sets them.
 */
export function missesOf(idea: BaseIdea, f: IdeaFilters): Missed[] {
  const missed: Missed[] = [];

  if (f.daypart && !idea.dayparts.includes(f.daypart)) {
    const has = idea.dayparts.map((d) => DAYPART_WORD[d] ?? d)[0] ?? 'another time';
    missed.push({ row: 'time', label: `${has} instead of ${DAYPART_WORD[f.daypart] ?? f.daypart}` });
  }
  if (f.setting && idea.setting !== f.setting) {
    missed.push({
      row: 'setting',
      label: idea.setting === 'home' ? 'Indoor instead of outdoor' : 'Outdoor instead of indoor',
    });
  }
  if (f.vibe && !idea.vibes.includes(f.vibe)) {
    const has = idea.vibes[0] ? VIBE_WORD[idea.vibes[0]] : 'Something else';
    missed.push({ row: 'vibe', label: `${has} instead of ${VIBE_WORD[f.vibe]}` });
  }

  return missed;
}

export interface Candidate {
  idea: BaseIdea;
  /** 0 = matches everything chosen. 1 = misses one row. And so on. */
  tier: number;
  missed: Missed[];
  score: number;
}

/* --------------------------------- Scoring -------------------------------- */

/**
 * Ordering within a tier — never across one.
 *
 * The signals mean different things and are not all "demote":
 *
 *   liked / onList — a positive signal about the *kind* of thing, and a
 *                    negative one about this exact card. Someone who hearted
 *                    the listening hour does not want it offered back to them
 *                    as a discovery; they want more like it. So the id is
 *                    suppressed and its category and vibes are boosted.
 *   done           — same shape, stronger suppression of the id itself: it
 *                    has been used up. Its kind is still welcome.
 *   shown          — not a taste signal at all. Handled by exclusion, in this
 *                    run only, so paging does not repeat itself. It never
 *                    reaches this function.
 *
 * Nothing here can move an idea between tiers, which is the whole point: a
 * worse match is never promoted over a better one just because it is newer.
 */
export function scoreWithin(idea: BaseIdea, ctx: CoupleContext): number {
  let score = 0;

  // What they said they wanted, at onboarding.
  for (const v of ctx.wishes) if (idea.vibes.includes(v)) score += 1.1;
  for (const v of ctx.vibes) if (idea.vibes.includes(v)) score += 0.7;

  // What they have reached for since. Kinds, not cards.
  const affinity = kindAffinity(ctx);
  score += (affinity.categories.get(idea.category) ?? 0) * 0.9;
  for (const v of idea.vibes) score += (affinity.vibes.get(v) ?? 0) * 0.35;

  // The cards themselves.
  if (ctx.liked.includes(idea.id) || ctx.onList.includes(idea.id)) score -= 4;
  if (ctx.done.includes(idea.id)) score -= 6;

  /*
   * Couples in different cities are not blocked from in-person ideas, but a
   * thing they can do tonight beats a thing they can do when one of them next
   * gets on a train.
   */
  if (ctx.proximity === 'different-cities' && idea.mode !== 'in_person') score += 1.2;

  return score;
}

/** What kinds of thing this couple has reached for, from ids alone. */
function kindAffinity(ctx: CoupleContext) {
  const categories = new Map<IdeaCategory, number>();
  const vibes = new Map<Vibe, number>();
  const byId = new Map(DATE_IDEAS.map((i) => [i.id, i]));

  const note = (id: string, weight: number) => {
    const idea = byId.get(id);
    if (!idea) return;
    categories.set(idea.category, (categories.get(idea.category) ?? 0) + weight);
    for (const v of idea.vibes) vibes.set(v, (vibes.get(v) ?? 0) + weight);
  };

  // Hearting is the strongest thing anyone does here; the shared list is a
  // joint act and counts for a little more still. Having done something says
  // less about taste than choosing it did, but it is not nothing.
  for (const id of ctx.liked) note(id, 1);
  for (const id of ctx.onList) note(id, 1.2);
  for (const id of ctx.done) note(id, 0.6);

  return { categories, vibes };
}

/* -------------------------------- The list -------------------------------- */

export interface RankOptions {
  /** How many to hand to the model, across all tiers. */
  limit?: number;
  /** The corpus, so tests can rank a small fixed set. */
  pool?: BaseIdea[];
}

/**
 * Every idea this couple may be shown, best first.
 *
 * Ordered by tier, then by score, then by id — so the same request produces
 * the same list every time. The model reorders within it; the fallback takes
 * it as-is.
 */
export function rankCandidates(
  f: IdeaFilters,
  ctx: CoupleContext,
  { limit = 20, pool = DATE_IDEAS }: RankOptions = {},
): Candidate[] {
  return oneOfEachFamily(pool, ctx)
    .filter((idea) => isEligible(idea, f, ctx))
    // Already on screen in this run. Excluded rather than demoted: paging
    // through a ranking should not show page one again on page two.
    .filter((idea) => !ctx.shown.includes(idea.id))
    .map((idea) => {
      const missed = missesOf(idea, f);
      return { idea, tier: missed.length, missed, score: scoreWithin(idea, ctx) };
    })
    .sort(
      (a, b) =>
        a.tier - b.tier || b.score - a.score || a.idea.id.localeCompare(b.idea.id),
    )
    .slice(0, limit);
}

/**
 * One idea per family.
 *
 * Some ideas are the same evening in two forms — cooking one recipe at one
 * table, and cooking the same recipe in two kitchens on a video call. Offering
 * both is offering the same thing twice and making the couple work out which
 * one is for them. So the family picks its own representative, by the only
 * fact that decides it: whether the two of them will be in the same room.
 *
 * Ideas with no familyId are not in a family and always pass through.
 */
function oneOfEachFamily(pool: BaseIdea[], ctx: CoupleContext): BaseIdea[] {
  const wantRemote = apart(ctx.proximity) || ctx.proximity === 'different-cities';

  /** How well a form of the idea suits how these two actually meet. */
  const fits = (idea: BaseIdea): number => {
    if (idea.mode === 'either') return 1;
    if (wantRemote) return idea.mode === 'remote' ? 2 : 0;
    return idea.mode === 'in_person' ? 2 : 0;
  };

  const best = new Map<string, BaseIdea>();
  for (const idea of pool) {
    if (!idea.familyId) continue;
    const held = best.get(idea.familyId);
    // Ties go to whichever came first in the corpus, so this is deterministic.
    if (!held || fits(idea) > fits(held)) best.set(idea.familyId, idea);
  }

  const chosen = new Set([...best.values()].map((i) => i.id));
  return pool.filter((idea) => !idea.familyId || chosen.has(idea.id));
}

/* -------------------------------- Diversity ------------------------------- */

export const MAX_PER_CATEGORY = 2;

/**
 * Take `count` from a ranked list without letting one kind of evening take it
 * over. Five suggestions that are all cooking is a worse answer than four
 * plus something else, however well the fifth scored.
 *
 * Tier order still wins: a category is only skipped while something of the
 * same tier is available to take its place. Once the tier is exhausted the
 * cap gives way rather than returning short — running out of ideas and
 * running out of *variety* are different problems, and only the first one is
 * worth showing someone an empty row over.
 */
export function diversify(ranked: Candidate[], count: number): Candidate[] {
  const taken: Candidate[] = [];
  const used = new Map<IdeaCategory, number>();

  /*
   * Tier by tier, because variety must never buy itself a better slot.
   *
   * Holding one idea back and letting the next one through is fine inside a
   * tier — they are equally good answers to what was asked. Doing it across
   * tiers is not: the idea that comes through is a worse match, and the couple
   * asked for the match, not for the variety. So each tier is filled and
   * closed before the next is opened, and an idea skipped for its category can
   * only ever be overtaken by something at least as good a fit.
   */
  const tiers = [...new Set(ranked.map((c) => c.tier))].sort((a, b) => a - b);

  for (const tier of tiers) {
    if (taken.length >= count) break;
    const group = ranked.filter((c) => c.tier === tier);
    const skipped: Candidate[] = [];

    for (const c of group) {
      if (taken.length >= count) break;
      const n = used.get(c.idea.category) ?? 0;
      if (n >= MAX_PER_CATEGORY) {
        skipped.push(c);
        continue;
      }
      used.set(c.idea.category, n + 1);
      taken.push(c);
    }

    // This tier had nothing else to offer, so the cap gives way rather than
    // reaching into a worse one. Running out of variety and running out of
    // ideas are different problems.
    for (const c of skipped) {
      if (taken.length >= count) break;
      used.set(c.idea.category, (used.get(c.idea.category) ?? 0) + 1);
      taken.push(c);
    }
  }

  return taken;
}

/* ------------------------------- The fallback ----------------------------- */

export interface Recommendation {
  id: string;
  title: string;
  description: string;
  tags: string[];
  reason: string;
  /** 0 when it matches everything asked for. */
  tier: number;
  /** "Playful instead of Romantic", when it does not. */
  missed: string[];
}

/**
 * The whole recommendation, worked out on the device.
 *
 * Reached whenever the model cannot be: no key, a refused key, a timeout, a
 * plane. It is the same eligibility and the same ordering the endpoint would
 * have started from, so the list is honest — it is only the wording that is
 * plainer, because a rule can say what an idea is but not why it suits you.
 */
export function localRecommendations(
  f: IdeaFilters,
  ctx: CoupleContext,
  count = 5,
  pool?: BaseIdea[],
): Recommendation[] {
  const ranked = rankCandidates(f, ctx, { limit: Math.max(count * 4, 20), pool });
  return diversify(ranked, count).map((c) => ({
    id: c.idea.id,
    title: c.idea.title,
    description: c.idea.description,
    tags: tagsFor(c.idea),
    reason: reasonFor(c, f),
    tier: c.tier,
    missed: c.missed.map((m) => m.label),
  }));
}

/**
 * The two or three words under a card. Exported because the endpoint needs the
 * same ones: the model no longer writes tags, and the two paths must not
 * produce differently-shaped cards.
 */
export function tagsFor(idea: BaseIdea): string[] {
  const where = idea.setting === 'home' ? 'Indoor' : 'Outdoor';
  const price = idea.cost === 0 ? 'Free' : `€${idea.cost}`;
  return [where, VIBE_WORD[idea.vibes[0]] ?? 'Something else', price];
}

/**
 * Why this one, said in rules rather than in taste.
 *
 * It never claims to know the couple. The model's version of this sentence can
 * say "you told us you want more adventure"; this one says what is true of the
 * idea and what was asked for, which is the most it can honestly do.
 */
function reasonFor(c: Candidate, f: IdeaFilters): string {
  /*
   * A near miss already carries its own line on the card, in the couple's
   * words — "Close match · Evening instead of Morning". Repeating it here as
   * a sentence was the first thing that looked wrong on screen: the same
   * apology twice, in two registers, before anything had been said about the
   * idea. So a near miss gets told what it *is* instead, and the label is
   * left to say what it is not.
   */
  if (c.tier > 0) return shape(c.idea);

  const asked = [
    f.daypart ? DAYPART_WORD[f.daypart]?.toLowerCase() : null,
    f.setting ? (f.setting === 'home' ? 'indoors' : 'outdoors') : null,
    f.budget === 0 ? 'free' : f.budget != null ? `under €${f.budget}` : null,
    f.vibe ? VIBE_WORD[f.vibe].toLowerCase() : null,
  ].filter(Boolean);

  return asked.length
    ? `${cap(asked.join(', '))} — everything you asked for.`
    : shape(c.idea);
}

/** What an idea is, in the plainest terms the rules can manage. */
function shape(idea: BaseIdea): string {
  const hours = idea.duration / 60;
  const long =
    idea.duration < 60
      ? `${idea.duration} minutes`
      : hours === 1
        ? 'about an hour'
        : `about ${Math.round(hours)} hours`;
  const where = idea.setting === 'home' ? 'at home' : 'out';
  const price = idea.cost === 0 ? 'free' : `around €${idea.cost}`;
  return `${cap(long)}, ${where}, ${price}.`;
}

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export { ROW_LABEL, VIBE_WORD, DAYPART_WORD };
