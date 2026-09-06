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

/* ------------------------------- The feeling ------------------------------ */

export const FEELINGS = ['Warm', 'Joyful', 'Grateful', 'Connected', 'Calm', 'Loved'] as const;

/** The face each one wears, on a chip and on the review card. */
export const FEELING_EMOJI: Record<string, string> = {
  Warm: '☀️',
  Joyful: '😊',
  Grateful: '🌿',
  Connected: '❤️',
  Calm: '🌙',
  Loved: '✨',
};

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
  Warm: /\b(warm|cosy|cozy|hug|hugged|held|snug|blanket|candle|fire)\b/,
  Joyful: /\b(laugh|laughed|laughing|danc|silly|giggl|smil|happy|joy|fun|played|sang|singing)\b/,
  Grateful: /\b(grateful|thankful|lucky|appreciate|glad|blessed)\b/,
  Connected: /\b(talked|listened|close|closer|connected|understood|honest|opened up|together again)\b/,
  Calm: /\b(calm|quiet|peaceful|slow|still|rest|restful|breathe|easy|gentle)\b/,
  Loved: /\b(love|loved|loving|adore|heart|tender|cherish)\b/,
};

function readFeelings(text: string): string[] {
  const t = text.toLowerCase();
  return FEELINGS.filter((f) => FEELING_CUES[f].test(t)).slice(0, 2);
}

/* -------------------------------- The title ------------------------------- */

/** -ing words that are not somebody doing something. */
const NOT_A_VERB =
  /^(nothing|something|anything|everything|morning|evening|during|thing|things|ceiling|string|spring|king|ring|being|willing|sibling)$/;

const EMOJI_CUES: [RegExp, string][] = [
  [/\b(pasta|pizza|cooked|cooking|dinner|recipe|baked|baking|supper)\b/, '🍝'],
  [/\b(coffee|espresso|latte|breakfast|brunch|croissant)\b/, '☕'],
  [/\b(danc|music|song|playlist|sang|singing|vinyl)\b/, '🎶'],
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
  const emoji = EMOJI_CUES.find(([re]) => re.test(t.toLowerCase()))?.[1] ?? '✨';
  return {
    date: readDate(t, now),
    place: readPlace(t),
    feelings: readFeelings(t),
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

/* ------------------------- What it could turn into ------------------------ */

export interface Suggestion {
  id: string;
  icon: string;
  label: string;
  to: string;
}

/**
 * Offered after saving, and only when the memory actually points somewhere.
 * Every one of these opens a screen that exists — a plan to write, a note to
 * send — because a suggestion that leads nowhere is worse than no suggestion.
 */
export function suggestionsFor(
  note: string,
  place: string | undefined,
  partnerName: string,
): Suggestion[] {
  const t = note.toLowerCase();
  const out: Suggestion[] = [];
  const plan = (title: string, where?: string) =>
    `/plan/new?title=${encodeURIComponent(title)}${where ? `&place=${encodeURIComponent(where)}` : ''}`;

  if (place === 'Home') {
    out.push({ id: 'home-night', icon: '🏠', label: 'Plan another night in', to: plan('Another night in', 'Home') });
  } else if (place) {
    // "The beach" reads as "back to the beach"; "Bocca" must keep its capital.
    const named = place.startsWith('The ') ? place.toLowerCase() : place;
    out.push({ id: 'again', icon: '📍', label: `Go back to ${named}`, to: plan(`Back to ${place}`, place) });
  }

  if (/\b(pasta|cooked|cooking|dinner|recipe|baked|baking|supper|pizza)\b/.test(t)) {
    out.push({ id: 'recipe', icon: '🍝', label: 'Try a new recipe together', to: plan('Try a new recipe together') });
  }
  if (/\b(danc|music|song|sang|singing|vinyl|playlist)\b/.test(t)) {
    out.push({ id: 'music', icon: '🎶', label: 'Plan an evening of just music', to: plan('An evening of just music') });
  }
  if (/\b(walk|walked|hike|hiked|park|forest|woods|beach|sea|lake)\b/.test(t)) {
    out.push({ id: 'walk', icon: '🌿', label: 'Plan a longer walk together', to: plan('A longer walk together') });
  }
  if (/\b(talked|talk|conversation|listened|honest|opened up)\b/.test(t)) {
    out.push({ id: 'talk', icon: '💬', label: 'Pick up where that conversation left off', to: '/us/talk/room' });
  }

  // Nothing in the words pointed anywhere, so there is nothing to offer.
  if (!out.length) return [];

  // No prefilled words here on purpose: the note is the one thing that has to
  // be theirs. The screen opens on the right kind, and that is all.
  out.push({
    id: 'note',
    icon: '💌',
    label: `Tell ${partnerName} what it meant to you`,
    to: '/us/talk/notes/new?kind=appreciation',
  });

  return out.slice(0, 3);
}
