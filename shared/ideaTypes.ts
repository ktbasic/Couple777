/**
 * The vocabulary the date-idea corpus is written in.
 *
 * This file and `dateIdeas.ts` beside it are the one place both halves of the
 * app agree on what an idea is: the browser imports them through
 * `src/lib/types.ts`, and the serverless recommender imports them directly.
 * That is the whole reason they live outside `src/` — nothing here may import
 * React, the `@/` alias, or anything that only exists in a browser, because
 * the moment it does the endpoint can no longer read the corpus and the
 * browser becomes the only source of truth for what may be recommended.
 */

export type Vibe = 'romantic' | 'fun' | 'adventurous' | 'relaxing' | 'creative';
export type Setting = 'home' | 'out';
export type Energy = 'low' | 'medium' | 'high';
export type Weather = 'any' | 'rain' | 'sun' | 'cold' | 'warm';
export type Spontaneity = 'spontaneous' | 'planned';

/** When in the day an idea belongs. */
export type Daypart = 'morning' | 'brunch' | 'afternoon' | 'evening' | 'late' | 'wholeday';

/**
 * What kind of thing this actually is.
 *
 * Vibe says how an evening should feel; category says what you would be
 * doing. They are not the same axis and conflating them is what lets five
 * "romantic, indoor, low energy" suggestions all turn out to be cooking. The
 * diversity rule counts categories for exactly that reason.
 *
 * There is deliberately no `spontaneous` category, though it was proposed:
 * every idea already carries a `spontaneity` field, and two differently-typed
 * fields sharing a name is a bug waiting for someone tired.
 */
export type IdeaCategory =
  | 'food'
  | 'creative'
  | 'conversation'
  | 'outdoors'
  | 'culture'
  | 'game'
  | 'wellness';

/**
 * Whether two people have to be in the same room.
 *
 * `in_person` is not a preference, it is a fact about the activity, and for a
 * couple who live apart it is the difference between a suggestion and an
 * insult. Long distance makes in-person ideas ineligible outright — the same
 * treatment as being over budget, not a near miss.
 */
export type IdeaMode = 'in_person' | 'remote' | 'either';

export interface BaseIdea {
  id: string;
  title: string;
  emoji: string;
  description: string;
  /** Minutes. */
  duration: number;
  /** Euros. 0 means free. */
  cost: number;
  prep: string;
  /** The emotional reason this might land for a couple. */
  why: string;
  vibes: Vibe[];
  setting: Setting;
  energy: Energy;
  weather: Weather[];
  spontaneity: Spontaneity;
  dayparts: Daypart[];
  category: IdeaCategory;
  mode: IdeaMode;
  /**
   * Ideas that are the same concept in two forms — cooking together at one
   * table, and cooking the same recipe on a video call. Never shown together:
   * one couple gets one of them, chosen by whether they are in the same city.
   */
  familyId?: string;
  /** Feeds the placeholder photography. The URL is built in the browser. */
  imageSeed: string;
}

/**
 * What the four Explore rows come to.
 *
 * `null` everywhere means no preference, which is both the default and the
 * most common honest answer. `budget` is a ceiling in euros and `null` there
 * means no limit — not "cheap", not 999.
 */
export interface IdeaFilters {
  daypart: Daypart | null;
  duration: number | null;
  budget: number | null;
  setting: Setting | null;
  vibe: Vibe | null;
  energy: Energy | null;
}
