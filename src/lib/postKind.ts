import type { CommunityPostKind, CommunityTopic } from './types';

/**
 * What a post is, and what it is about, read off the text.
 *
 * Nobody is asked either. The topic is asked for — it is what the feed filters
 * by — but `inferTopic` exists so posts written before the topics existed can
 * be placed, and so a wrong default is never the only thing available.
 *
 * These are heuristics and they are wrong sometimes. That is affordable
 * because of where the answers go: `kind` is metadata nothing renders, and an
 * inferred topic only ever fills in for a post that had none. Neither decides
 * what a reader is shown of what they wrote.
 */

/** Longest phrases first, so "long distance" is not caught by "distance". */
const TOPIC_WORDS: [CommunityTopic, RegExp][] = [
  [
    'long_distance',
    /\b(long[- ]distance|different (cities|countries|time ?zones)|time ?zone|apart|visa|flight|miles apart|see each other every)\b/i,
  ],
  [
    'kids',
    /\b(kids?|child(ren)?|baby|babies|toddler|parenting|pregnan\w*|nursery|school run|childcare|step[- ]?(kid|child|son|daughter))\b/i,
  ],
  [
    'conflict',
    /\b(argu\w*|fight\w*|row|resent\w*|silent treatment|shut(s|ting)? down|blow ?up|angry|anger|apolog\w*|slam\w*|snap(ped|ping)?)\b/i,
  ],
  [
    'intimacy',
    /\b(intima\w*|sex\w*|touch\w*|affection\w*|desire|libido|attracted|kiss\w*|physically close|physical (side|intimacy|connection|closeness|contact|affection)|in bed)\b/i,
  ],
  [
    'communication',
    /\b(listen\w*|talk\w*|conversation|communicat\w*|say(ing)? (what|how)|not saying|bring it up|open up|honest\w*|narrat\w*)\b/i,
  ],
  [
    'life_together',
    /\b(mov(e|ed|ing) in|house|flat|rent|mortgage|money|chores|routine|anniversar\w*|marri\w*|wedding|plan(ning)? (a|the) (trip|holiday)|weekend|years? (together|in)|living together)\b/i,
  ],
];

/**
 * The fallback is `life_together` because it is the widest of the six: a post
 * that matched nothing is more likely to be about the shape of a shared life
 * than about a fight or a baby, and a wrong guess there is the least wrong.
 */
export function inferTopic(text: string): CommunityTopic {
  for (const [topic, re] of TOPIC_WORDS) if (re.test(text)) return topic;
  return 'life_together';
}

const ASKS_BACK =
  /\b(has anyone|does anyone|how do you|what do you|any(one| ideas| advice)|am i|are we|should (i|we)|is (it|this|that) (normal|just us))\b/i;
const OFFERS =
  /\b(what (worked|helped)|what (worked|helped) (for us|in the end)|we started|we put|try |my advice|the thing that (saved|helped|worked)|i would|if you|it helps to|turned out to be)\b/i;
/*
 * "We did X" is the obvious shape and not the only one: plenty of these are
 * about something that happened *to* a couple rather than something they did,
 * so a past-tense event on its own counts even when the subject is a toddler.
 */
const RECOUNTS =
  /\b(we (were|had|have|did|went|tried|spent|moved|argued)|we have ?n[o']?t|last (week|month|year)|for (six|seven|eight|nine|ten|\d+) (months?|years?)|ended up|it turned out|stopped|started|began)\b/i;

/**
 * Order matters and is not arbitrary.
 *
 * A question wins outright: someone who ended on a question mark wants an
 * answer, whatever else the paragraph did. Advice beats experience because
 * almost every piece of advice here is a story with a recommendation on the
 * end, and the recommendation is the point of it. Reflection is what is left
 * — the posts that are neither asking nor telling you to do anything.
 */
export function inferKind(body: string, title?: string): CommunityPostKind {
  const text = `${title ?? ''} ${body}`.trim();
  if (/\?\s*$/.test(body.trim()) || ASKS_BACK.test(text)) return 'question';
  if (OFFERS.test(text)) return 'advice';
  if (RECOUNTS.test(text)) return 'experience';
  return 'reflection';
}
