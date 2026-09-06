import { addDays, today } from './dates';
/* -------------------------------- The date -------------------------------- */
const WEEKDAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
/**
 * A day the note names. Anything vaguer than a single day — "last week", "a
 * while ago" — is left alone: a guess there is worse than the question.
 */
function readDate(text, now) {
    const t = ` ${text.toLowerCase()} `;
    if (/\b(tonight|today|this (morning|afternoon|evening|lunchtime)|just now|right now)\b/.test(t)) {
        return now;
    }
    if (/\b(yesterday|last night)\b/.test(t))
        return addDays(now, -1);
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
const AT_HOME = /\b(at home|our (place|flat|apartment|house|kitchen|sofa|couch|bed|balcony|garden)|in the (kitchen|living room|bedroom|bath|garden|hallway)|on the (sofa|couch|balcony|floor|rug)|in bed|home together)\b/;
/** Places worth naming, when the note says it was at one. */
const PUBLIC_PLACES = [
    'beach', 'park', 'cinema', 'restaurant', 'cafe', 'café', 'bar', 'pub', 'museum',
    'market', 'mountains', 'lake', 'river', 'pool', 'gym', 'office', 'station',
    'airport', 'gallery', 'library', 'zoo', 'harbour', 'forest', 'woods', 'garden centre',
];
function readPlace(text) {
    const t = text.toLowerCase();
    if (AT_HOME.test(t))
        return 'Home';
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
    const proper = text.match(/^(?:[Ii]n|[Aa]t)\s+([A-Z][\w'’-]+(?:\s+[A-Z][\w'’-]+)?)/) ??
        text.match(/\w[^.!?]*?\b(?:in|at)\s+([A-Z][\w'’-]+(?:\s+[A-Z][\w'’-]+)?)/);
    if (proper && !/^(I|We|My|Our|The|A|An)$/.test(proper[1]))
        return proper[1];
    return undefined;
}
const HARD_WORDS = /\b(argu\w*|fight|fought|shout|shouted|yelled|angry|anger|upset|hurt|hurts|cried|crying|tears|lonely|alone|ignored|dismissed|not listening|wasn.t listening|didn.t listen|resent|distant|cold|exhausted|drained|anxious|scared|afraid|worried|sad|awful|terrible|hate|misunderstood|unheard|apart|shut down|walked out|silent treatment)\b/;
const SOFT_WORDS = /\b(laugh\w*|danc\w*|smil\w*|happy|joy|lovely|beautiful|grateful|thankful|love|loved|warm|proud|glad|fun|sweet|calm|peaceful|close|closer)\b/;
/**
 * Which way the note leans, on the words alone. Only ever a fallback for the
 * model's own read — but a fallback that gets this wrong is worse than none,
 * because it decides whether someone's worst evening is met with a sparkle.
 * So it errs toward difficult: any hard word present is enough.
 */
export function readTone(text) {
    const t = text.toLowerCase();
    const hard = HARD_WORDS.test(t);
    const soft = SOFT_WORDS.test(t);
    if (hard && soft)
        return 'mixed';
    if (hard)
        return 'difficult';
    if (soft)
        return 'positive';
    return 'neutral';
}
/* ------------------------------- The feeling ------------------------------ */
export const FEELINGS = ['Warm', 'Joyful', 'Grateful', 'Connected', 'Calm', 'Loved'];
/** What is offered when a note is hard. Nobody is "joyful" about an argument. */
export const HARD_FEELINGS = ['Sad', 'Angry', 'Hurt', 'Lonely', 'Anxious', 'Tired'];
/** The face each one wears, on a chip and on the review card. */
export const FEELING_EMOJI = {
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
export function feelingEmoji(feeling) {
    const key = feeling.charAt(0).toUpperCase() + feeling.slice(1).toLowerCase();
    return FEELING_EMOJI[key] ?? '·';
}
/**
 * Where a feeling lands in the six-mood vocabulary the rest of the app draws
 * with. Two of them share `tender`, which is the honest answer: the older set
 * has no word for either.
 */
export const FEELING_MOOD = {
    Warm: 'warm',
    Joyful: 'joyful',
    Grateful: 'proud',
    Connected: 'tender',
    Calm: 'calm',
    Loved: 'tender',
};
const FEELING_CUES = {
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
function readFeelings(text, tone) {
    const t = text.toLowerCase();
    // A hard note is read against the hard words first: "we argued and laughed
    // about it after" should not come back as Joyful and nothing else.
    const order = tone === 'positive' ? [...FEELINGS, ...HARD_FEELINGS] : [...HARD_FEELINGS, ...FEELINGS];
    return order.filter((f) => FEELING_CUES[f]?.test(t)).slice(0, 2);
}
/* -------------------------------- The title ------------------------------- */
/** -ing words that are not somebody doing something. */
const NOT_A_VERB = /^(nothing|something|anything|everything|morning|evening|during|thing|things|ceiling|string|spring|king|ring|being|willing|sibling)$/;
const EMOJI_CUES = [
    [/\b(pasta|pizza|cooked|cooking|dinner|recipe|baked|baking|supper)\b/, '🍝'],
    [/\b(coffee|espresso|latte|breakfast|brunch|croissant)\b/, '☕'],
    [/\b(danc\w*|music|song|playlist|sang|singing|vinyl)\b/, '🎶'],
    [/\b(walk|walked|hike|hiked|park|forest|woods)\b/, '🌿'],
    [/\b(beach|sea|swim|swam|lake|river)\b/, '🌊'],
    [/\b(film|movie|cinema|series|watched)\b/, '🎬'],
    [/\b(talked|talk|conversation|listened)\b/, '💬'],
    [/\b(night|midnight|stars|moon|late)\b/, '🌙'],
];
function titleCase(phrase) {
    return phrase.charAt(0).toUpperCase() + phrase.slice(1);
}
/**
 * A name for the moment, in the writer's own words rather than a summary of
 * them. The best one is nearly always the thing that happened — "dancing in
 * the kitchen" — so that shape is looked for first, and the opening clause is
 * the fallback.
 */
/** "On Friday we talked" is about the talking. The day is stored separately. */
const LEADING_TIME = /^(tonight|today|yesterday|last night|this (morning|afternoon|evening)|on \w+day|last \w+day)\s*[,:-]?\s*/i;
function readTitle(text) {
    const clean = text.replace(/\s+/g, ' ').trim().replace(LEADING_TIME, '');
    if (!clean)
        return 'A moment worth keeping';
    const doing = clean.matchAll(/\b(\w+ing)\s+(in|at|on|with|to|through|around|under|over|by|for)\s+((?:the|a|an|our|my|his|her|their)\s+)?([\w'’-]+(?:\s+[\w'’-]+)?)/gi);
    for (const m of doing) {
        if (NOT_A_VERB.test(m[1].toLowerCase()))
            continue;
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
export function readNote(text, now = today()) {
    const t = text.trim();
    const tone = readTone(t);
    // A hard note gets no cheerful little picture at the top of it.
    const emoji = tone === 'difficult' ? '🤍' : (EMOJI_CUES.find(([re]) => re.test(t.toLowerCase()))?.[1] ?? '✨');
    return {
        tone,
        date: readDate(t, now),
        place: readPlace(t),
        feelings: readFeelings(t, tone),
        title: readTitle(t),
        emoji,
    };
}
/**
 * The questions worth asking, in order, and never more than three of them.
 * Anything the note already answered is dropped, and what is left is trimmed
 * from the end — so the softest question, "anything else?", is the first to go
 * when the note left a lot open.
 */
export function asksFor(reading, known = {}) {
    const asks = [];
    if (!reading.date && !known.date)
        asks.push('date');
    if (!reading.place && !known.place)
        asks.push('place');
    // Always worth asking, and pre-answered when the words suggested something:
    // how a moment felt is the writer's to say, not a guess to file silently.
    asks.push('feeling');
    asks.push('more');
    return asks.slice(0, 3);
}
