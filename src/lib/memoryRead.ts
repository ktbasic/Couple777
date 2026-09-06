import { addDays, today } from './dates';
import type { ISODate, Mood } from './types';

/**
 * Reading a written memory, so the flow can ask two or three short questions
 * instead of handing someone a form.
 *
 * This runs on the phone, on the text alone — there is no model behind it and
 * no request leaves the device. It is patterns over words, and it is wrong
 * sometimes, which is why nothing it decides is final: every field it fills in
 * is shown on the review screen and can be changed there.
 *
 * The rule it follows is the flow's rule. A question is only worth asking when
 * the answer is not already in what someone wrote: "we cooked pasta tonight"
 * has already answered "when was this?", and asking anyway is the difference
 * between a conversation and an interrogation.
 */

export interface NoteReading {
  /** Which way the note leans. Decides what is asked and how. */
  tone: Tone;
  /** Only set when the note names a day outright. */
  date?: ISODate;
  /** A place named in the note. "Home" for the kitchen, the sofa, our place. */
  place?: string;
  /** Feelings the words suggest. Offered pre-selected, never applied silently. */
  feelings: string[];
  /** A short name for the moment, taken from its own words. */
  title: string;
  emoji: string;
}

/* -------------------------------- The date -------------------------------- */

const WEEKDAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

/**
 * A day the note names. Anything vaguer than a single day — "last week", "a
 * while ago" — is left alone: a guess there is worse than the question.
 */
function readDate(text: string, now: ISODate): ISODate | undefined {
  const t = ` ${text.toLowerCase()} `;

  if (/\b(tonight|today|this (morning|afternoon|evening|lunchtime)|just now|right now)\b/.test(t)) {
    return now;
  }
  if (/\b(yesterday|last night)\b/.test(t)) return addDays(now, -1);

  // "on Saturday" means the Saturday just gone, which is at most a week back.
  const named = t.match(/\b(?:on|last)\s+(sunday|monday|tuesday|wednesday|thursday|friday|saturday)\b/);
  if (named) {
    const target = WEEKDAYS.indexOf(named[1]);
    const current = new Date(`${now}T12:00:00`).getDay();
    const back = ((current - target + 7) % 7) || 7;
    return addDays(now, -back);
  }
  return undefined;
}

/* -------------------------------- The place ------------------------------- */

/** Rooms and corners of a home. Any of them means the place is home. */
const AT_HOME =
  /\b(at home|our (place|flat|apartment|house|kitchen|sofa|couch|bed|balcony|garden)|in the (kitchen|living room|bedroom|bath|garden|hallway)|on the (sofa|couch|balcony|floor|rug)|in bed|home together)\b/;

/** Places worth naming, when the note says it was at one. */
const PUBLIC_PLACES = [
  'beach', 'park', 'cinema', 'restaurant', 'cafe', 'café', 'bar', 'pub', 'museum',
  'market', 'mountains', 'lake', 'river', 'pool', 'gym', 'office', 'station',
  'airport', 'gallery', 'library', 'zoo', 'harbour', 'forest', 'woods', 'garden centre',
];

function readPlace(text: string): string | undefined {
  const t = text.toLowerCase();
  if (AT_HOME.test(t)) return 'Home';

  for (const p of PUBLIC_PLACES) {
    if (new RegExp(`\\b(?:at|in|on|to|by) the ${p}\\b`).test(t)) {
      return `The ${p}`;
    }
  }

  /*
   * A proper noun after "in" or "at" — "in Lisbon", "at Rosa's". A capital is
   * only telling when it is not just the start of a sentence, so either the
   * preposition opens the whole note ("In Lisbon we walked...") or it sits
   * mid-sentence; a capital anywhere else is ignored.
   */
  const proper =
    text.match(/^(?:[Ii]n|[Aa]t)\s+([A-Z][\w'’-]+(?:\s+[A-Z][\w'’-]+)?)/) ??
    text.match(/\w[^.!?]*?\b(?:in|at)\s+([A-Z][\w'’-]+(?:\s+[A-Z][\w'’-]+)?)/);
  if (proper && !/^(I|We|My|Our|The|A|An)$/.test(proper[1])) return proper[1];

  return undefined;
}

/* --------------------------------- The tone ------------------------------- */

export type Tone = 'positive' | 'neutral' | 'mixed' | 'difficult';

/**
 * Whether a note is a good one, a hard one, or both.
 *
 * This is the decision everything else hangs off — the opening line, which
 * feelings are offered, whether it is private, whether anyone is shown a date
 * idea afterwards — so it is worth more than a word list. A first draft was
 * one: any hard word won, and it called "we talked until it got cold" a
 * difficult evening, because "cold" was in the list.
 *
 * What it does instead is score both sides and compare them, with three things
 * a flat word list cannot do:
 *
 *   - Negation. "Wasn't listening", "barely spoke", "never asks" carry no hard
 *     word at all — the hard part is the *absence* of a soft one. One pattern
 *     catches the family, and it also stops "we barely talked" counting as
 *     warmth on the strength of "talked".
 *   - Phrases. "Why do I even bother", "the only one trying", "rolled his
 *     eyes", "without being asked" say more than any of their words do.
 *   - Weight. "We had the same fight again" is not the same size of signal as
 *     "tired", and a single weak word should not outvote a clear one.
 *
 * It is still only a fallback for the model's own read, and it is still coarse.
 * But its failures should be quiet ones — calling a hard note neutral, not
 * calling it lovely.
 */

type Cue = [RegExp, number];

/** Things that are hard however they are phrased. */
const HARD_CUES: Cue[] = [
  [/\bargu\w*|\bfought\b|\bfight\b|\bfighting\b|\bbickering\b/, 3],
  [/\bsame (fight|argument|conversation|thing)\b/, 3],
  [/\b(shouted|yelled|snapped|slammed|stormed)\b/, 3],
  [/\b(cried|crying|in tears|welled up)\b/, 3],
  [/\b(ignored|dismissed|unheard|belittled|talked over)\b/, 3],
  [/\bwhy (do |did )?(i|we) (even )?bother\b/, 3],
  [/\bthe only one (who |that )?(trying|tries|cares|caring|does)/, 3],
  [/\broll(ed|s|ing)? (his|her|their) eyes\b/, 3],
  [/\b(silent treatment|walked out|shut down|stopped speaking)\b/, 3],
  [/\b(hurt|hurts|hurting|stung|sting)\b/, 2],
  [/\b(resent\w*|bitter|contempt)\b/, 3],
  [/\b(tense|awkward|frosty|distant with|cold with)\b/, 2],
  [/\b(lonely|alone in this|on my own in)\b/, 2],
  [/\b(angry|anger|furious|annoyed|frustrated|irritated)\b/, 2],
  [/\b(sad|miserable|low|down about|heavy)\b/, 2],
  [/\b(upset|shaken|rattled)\b/, 2],
  [/\b(exhausted|drained|worn out|running on empty)\b/, 2],
  [/\b(anxious|worried|scared|afraid|on edge|dreading)\b/, 2],
  [/\b(disappointed|let down|forgot again|forgets)\b/, 2],
  [/\b(hard|difficult|rough|bad) (day|week|night|evening|month|time)\b/, 2],
  [/\b(struggling|not okay|not ok|not myself)\b/, 2],
  [/\b(awful|terrible|horrible|hate)\b/, 2],
  [/\b(misunderstood|apart|drifting)\b/, 1],
  [/\b(tired of|sick of|fed up)\b/, 3],
];

/** Things that are good however they are phrased. */
const SOFT_CUES: Cue[] = [
  [/\b(laugh\w*|giggl\w*|danc\w*|smil\w*)\b/, 3],
  [/\b(so |really )?(proud|grateful|thankful)\b/, 3],
  [/\bthank (god|goodness|heavens)\b/, 3],
  [/\bwithout (me |being |even )?(asking|asked|a word)\b/, 3],
  [/\b(surprised me|brought me|made me (tea|coffee|breakfast|dinner))\b/, 3],
  [/\b(kissed|hugged|held me|held my hand|cuddl\w*|snuggl\w*)\b/, 3],
  [/\b(anniversary|\d+ years (today|together)|years today)\b/, 3],
  [/\b(lovely|beautiful|wonderful|perfect|magic|magical|best (day|night|evening))\b/, 3],
  [/\b(love|loved|adore|in love)\b/, 2],
  [/\b(happy|joy|joyful|delighted|glad)\b/, 2],
  [/\b(cosy|cozy|warm|sweet|tender|gentle)\b/, 2],
  [/\b(fun|silly|played|sang|singing)\b/, 2],
  [/\b(calm|peaceful|easy|restful|quiet together)\b/, 2],
  [/\b(closer|connected|understood|on the same page)\b/, 2],
  [/\b(talked|listened|spoke|chatted)\b/, 1],
  [/\b(sat|walked|together|side by side|curled up)\b/, 1],
  [/\b(nice|good|great|kind)\b/, 1],
];

/**
 * "Wasn't listening", "barely spoke", "never asks" — hard, and the verb inside
 * them must not also be counted as warmth. The verbs are the ones people use
 * for the things they miss.
 */
const NEGATED =
  /\b(did ?n.?t|does ?n.?t|was ?n.?t|were ?n.?t|is ?n.?t|are ?n.?t|has ?n.?t|have ?n.?t|would ?n.?t|could ?n.?t|ca ?n.?t|wo ?n.?t|never|barely|hardly|no longer|stopped)\s+(\w+\s+){0,2}(listen\w*|hear\w*|talk\w*|speak\w*|spoke|say|said|ask\w*|notice\w*|care\w*|help\w*|try\w*|tried|look\w*|touch\w*|call\w*|answer\w*|bother\w*)\b/g;

function score(text: string, cues: Cue[]): number {
  return cues.reduce((total, [re, weight]) => (re.test(text) ? total + weight : total), 0);
}

export function readTone(text: string): Tone {
  // Curly apostrophes are what phones type, and every contraction above uses
  // a straight one.
  const t = text.toLowerCase().replace(/[’‘`]/g, "'");

  const negations = [...t.matchAll(NEGATED)];
  // The absence of listening is a strong signal, and whatever verb it took
  // with it is no longer evidence of warmth.
  const withoutNegated = t.replace(NEGATED, ' ');

  const hard = score(withoutNegated, HARD_CUES) + negations.length * 3;
  const soft = score(withoutNegated, SOFT_CUES);

  // Both, and both meant: an evening that held two things.
  if (hard >= 2 && soft >= 2) return 'mixed';
  if (hard > soft) return 'difficult';
  if (soft > hard && soft >= 2) return 'positive';
  return 'neutral';
}

/* ------------------------------- The feeling ------------------------------ */

export const FEELINGS = ['Warm', 'Joyful', 'Grateful', 'Connected', 'Calm', 'Loved'] as const;

/** What is offered when a note is hard. Nobody is "joyful" about an argument. */
export const HARD_FEELINGS = ['Sad', 'Angry', 'Hurt', 'Lonely', 'Anxious', 'Tired'] as const;

/** The face each one wears, on a chip and on the review card. */
export const FEELING_EMOJI: Record<string, string> = {
  Warm: '☀️',
  Joyful: '😊',
  Grateful: '🌿',
  Connected: '❤️',
  Calm: '🌙',
  Loved: '✨',
  Sad: '🌧',
  Angry: '🌩',
  Hurt: '💔',
  Lonely: '🌫',
  Anxious: '🌀',
  Tired: '🌵',
  Unheard: '🔇',
  Distant: '🌌',
  Relieved: '🌤',
  Hopeful: '🌱',
};

/** A word the model returned that is not in either list still gets a face. */
export function feelingEmoji(feeling: string): string {
  const key = feeling.charAt(0).toUpperCase() + feeling.slice(1).toLowerCase();
  return FEELING_EMOJI[key] ?? '·';
}

/**
 * Where a feeling lands in the six-mood vocabulary the rest of the app draws
 * with. Two of them share `tender`, which is the honest answer: the older set
 * has no word for either.
 */
export const FEELING_MOOD: Record<string, Mood> = {
  Warm: 'warm',
  Joyful: 'joyful',
  Grateful: 'proud',
  Connected: 'tender',
  Calm: 'calm',
  Loved: 'tender',
};

const FEELING_CUES: Record<string, RegExp> = {
  Sad: /\b(sad|cried|crying|tears|down|low|grief|miss|missed)\b/,
  Angry: /\b(angry|anger|furious|annoyed|frustrated|snapped|shouted|yelled)\b/,
  Hurt: /\b(hurt|wounded|stung|betrayed|dismissed|ignored|unheard|not listening|wasn.t listening)\b/,
  Lonely: /\b(lonely|alone|distant|apart|shut out|cold)\b/,
  Anxious: /\b(anxious|worried|scared|afraid|nervous|on edge)\b/,
  Tired: /\b(tired|exhausted|drained|worn out|done in)\b/,
  Warm: /\b(warm|cosy|cozy|hug|hugged|held|snug|blanket|candle|fire)\b/,
  Joyful: /\b(laugh\w*|danc\w*|silly|giggl\w*|smil\w*|happy|joy|joyful|fun|played|sang|singing)\b/,
  Grateful: /\b(grateful|thankful|lucky|appreciate|glad|blessed)\b/,
  Connected: /\b(talked|listened|close|closer|connected|understood|honest|opened up|together again)\b/,
  Calm: /\b(calm|quiet|peaceful|slow|still|rest|restful|breathe|easy|gentle)\b/,
  Loved: /\b(love|loved|loving|adore|heart|tender|cherish)\b/,
};

function readFeelings(text: string, tone: Tone): string[] {
  const t = text.toLowerCase();
  // A hard note is read against the hard words first: "we argued and laughed
  // about it after" should not come back as Joyful and nothing else.
  const order = tone === 'positive' ? [...FEELINGS, ...HARD_FEELINGS] : [...HARD_FEELINGS, ...FEELINGS];
  return order.filter((f) => FEELING_CUES[f]?.test(t)).slice(0, 2);
}

/* -------------------------------- The title ------------------------------- */

/** -ing words that are not somebody doing something. */
const NOT_A_VERB =
  /^(nothing|something|anything|everything|morning|evening|during|thing|things|ceiling|string|spring|king|ring|being|willing|sibling)$/;

const EMOJI_CUES: [RegExp, string][] = [
  [/\b(pasta|pizza|cooked|cooking|dinner|recipe|baked|baking|supper)\b/, '🍝'],
  [/\b(coffee|espresso|latte|breakfast|brunch|croissant)\b/, '☕'],
  [/\b(danc\w*|music|song|playlist|sang|singing|vinyl)\b/, '🎶'],
  [/\b(walk|walked|hike|hiked|park|forest|woods)\b/, '🌿'],
  [/\b(beach|sea|swim|swam|lake|river)\b/, '🌊'],
  [/\b(film|movie|cinema|series|watched)\b/, '🎬'],
  [/\b(talked|talk|conversation|listened)\b/, '💬'],
  [/\b(night|midnight|stars|moon|late)\b/, '🌙'],
];

function titleCase(phrase: string): string {
  return phrase.charAt(0).toUpperCase() + phrase.slice(1);
}

/**
 * A name for the moment, in the writer's own words rather than a summary of
 * them. The best one is nearly always the thing that happened — "dancing in
 * the kitchen" — so that shape is looked for first, and the opening clause is
 * the fallback.
 */
/** "On Friday we talked" is about the talking. The day is stored separately. */
const LEADING_TIME =
  /^(tonight|today|yesterday|last night|this (morning|afternoon|evening)|on \w+day|last \w+day)\s*[,:-]?\s*/i;

function readTitle(text: string): string {
  const clean = text.replace(/\s+/g, ' ').trim().replace(LEADING_TIME, '');
  if (!clean) return 'A moment worth keeping';

  const doing = clean.matchAll(
    /\b(\w+ing)\s+(in|at|on|with|to|through|around|under|over|by|for)\s+((?:the|a|an|our|my|his|her|their)\s+)?([\w'’-]+(?:\s+[\w'’-]+)?)/gi,
  );
  for (const m of doing) {
    if (NOT_A_VERB.test(m[1].toLowerCase())) continue;
    const phrase = `${m[1]} ${m[2]} ${m[3] ?? ''}${m[4]}`.replace(/\s+/g, ' ');
    return titleCase(phrase.toLowerCase()).replace(/[.,;:]$/, '');
  }

  // Otherwise the first clause, cut at its own punctuation and kept short.
  const first = clean.split(/(?<=[.!?])\s|,\s|\sand\s|\sbut\s/)[0] ?? clean;
  const words = first.split(' ');
  const cut = words.length > 7 ? `${words.slice(0, 7).join(' ')}…` : first;
  return titleCase(cut.replace(/[.,;:]$/, ''));
}

/* --------------------------------- Reading -------------------------------- */

export function readNote(text: string, now: ISODate = today()): NoteReading {
  const t = text.trim();
  const tone = readTone(t);
  // A hard note gets no cheerful little picture at the top of it.
  const emoji =
    tone === 'difficult' ? '🤍' : (EMOJI_CUES.find(([re]) => re.test(t.toLowerCase()))?.[1] ?? '✨');
  return {
    tone,
    date: readDate(t, now),
    place: readPlace(t),
    feelings: readFeelings(t, tone),
    title: readTitle(t),
    emoji,
  };
}

/* ------------------------------ What to ask ------------------------------- */

export type Ask = 'date' | 'place' | 'feeling' | 'more';

/**
 * The questions worth asking, in order, and never more than three of them.
 * Anything the note already answered is dropped, and what is left is trimmed
 * from the end — so the softest question, "anything else?", is the first to go
 * when the note left a lot open.
 */
export function asksFor(reading: NoteReading, known: { date?: boolean; place?: boolean } = {}): Ask[] {
  const asks: Ask[] = [];
  if (!reading.date && !known.date) asks.push('date');
  if (!reading.place && !known.place) asks.push('place');
  // Always worth asking, and pre-answered when the words suggested something:
  // how a moment felt is the writer's to say, not a guess to file silently.
  asks.push('feeling');
  asks.push('more');
  return asks.slice(0, 3);
}
