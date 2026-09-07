import { DATE_IDEAS } from '@/data/dateIdeas';
import { COUPLE_VIBE_VIBES, WISH_VIBES } from './generator';
import type { AppState, ID, Vibe } from './types';
import type { CoupleContext } from '@shared/ideaRank';

/**
 * What the recommender is told about a couple.
 *
 * Deliberately small, and deliberately made of ids and enums. Nothing here is
 * anyone's writing: not a memory, not a note, not an answer to the daily
 * question, not either person's name. A recommendation does not need those to
 * be good, and the couple did not write them so that a model could read them.
 *
 * The home city is not here either. It was proposed and it belongs to the
 * Nearby tab, where it changes the answer; on Dates — tonight, at home or a
 * short walk away — it earns nothing and is the one genuinely personal string
 * we would be sending.
 */
export function contextFromState(state: AppState, meId: ID): CoupleContext {
  const profile = state.couple.profile;

  const wishes = new Set<Vibe>();
  for (const wish of profile.wishes ?? []) for (const v of WISH_VIBES[wish] ?? []) wishes.add(v);

  const vibes = new Set<Vibe>();
  for (const vibe of profile.vibes ?? []) for (const v of COUPLE_VIBE_VIBES[vibe] ?? []) vibes.add(v);

  return {
    wishes: [...wishes],
    vibes: [...vibes],
    proximity: profile.proximity ?? 'together',
    /*
     * Hearts are personal and the shared list is joint, so they are kept
     * apart: what you alone reached for says something different from what
     * the two of you put on a list together. Both are read as "more like
     * this", never as "never show me this".
     */
    liked: state.savedIdeas.filter((i) => i.likedBy.includes(meId)).map((i) => i.id),
    onList: state.savedIdeas.filter((i) => i.sharedBy.length > 0).map((i) => i.id),
    done: doneIdeas(state),
    shown: [],
  };
}

/**
 * Which ideas this couple has actually done.
 *
 * Matched by title, which is not how it should work. A plan made from an idea
 * knows its id for exactly as long as it takes to open the form: PlanEdit
 * reads ?idea= to prefill the title and cost and then drops it, and plans have
 * no column to keep it in. So the title is the only thread left, and it holds
 * only while nobody renames a plan.
 *
 * The honest fix is a source_idea_id column on plans. Until then this is
 * better than pretending we have no history at all, and it fails in the
 * forgiving direction — a renamed plan looks like an idea not yet done, which
 * costs a repeat suggestion rather than a wrong one.
 */
function doneIdeas(state: AppState): string[] {
  const titles = new Map(DATE_IDEAS.map((i) => [i.title.toLowerCase(), i.id]));
  const done = new Set<string>();
  for (const plan of state.plans) {
    const id = titles.get(plan.title.trim().toLowerCase());
    if (id) done.add(id);
  }
  return [...done];
}
