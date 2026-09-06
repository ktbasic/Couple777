import { HARD_FEELINGS, FEELINGS, asksFor, readNote } from './memoryRead';
import { today } from './dates';
/* ------------------------------ The opening ------------------------------- */
/**
 * The first thing said back, chosen by tone rather than written by the model —
 * so that whatever else varies, an argument is never met with a sparkle.
 */
export const OPENING = {
    positive: 'That sounds like a lovely little moment ✨',
    neutral: 'Thank you for writing that down.',
    mixed: 'That sounds like it held a few things at once.',
    difficult: 'That sounds like a difficult moment.',
};
/* --------------------------------- Asking --------------------------------- */
const ENDPOINT = '/api/memory-read';
const TIMEOUT_MS = 12_000;
export async function readMemory(note, answers = [], now = today()) {
    try {
        const controller = new AbortController();
        const timer = window.setTimeout(() => controller.abort(), TIMEOUT_MS);
        const response = await fetch(ENDPOINT, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ note, today: now, answers }),
            signal: controller.signal,
        }).finally(() => window.clearTimeout(timer));
        if (response.ok) {
            const reading = (await response.json());
            // Trust it, but not with the two rules that matter.
            return { reading: settle(reading), source: 'model' };
        }
    }
    catch {
        /* No endpoint, no key, no network, or it took too long. The flow does not
           stop for any of those. */
    }
    return { reading: localReading(note, answers, now), source: 'device' };
}
/* ----------------------------- The device read ---------------------------- */
const QUESTION = {
    date: {
        soft: 'Was this today?',
        hard: 'Was this today?',
    },
    place: {
        soft: 'Do you want to remember where this happened?',
        hard: 'Do you want to remember where this happened?',
    },
    feelings: {
        soft: 'How did this moment leave you feeling?',
        hard: 'How did it leave you feeling?',
    },
    context: {
        soft: 'Anything else you want to remember about this?',
        hard: 'What do you most want to remember about how it felt?',
    },
};
const DATE_REPLIES = ['Yes, today', 'Choose another date', 'Doesn’t matter'];
const PLACE_REPLIES = ['At home', 'Add a place', 'Skip'];
/**
 * What the phone alone can work out. Coarser than the model — it cannot tell a
 * milestone from a Tuesday — but it asks the same shape of question, never
 * more than three, and it reads tone before it reads anything else.
 */
export function localReading(note, answers = [], now = today()) {
    const read = readNote(note, now);
    const hard = read.tone === 'difficult';
    const voice = hard ? 'hard' : 'soft';
    const answeredFields = new Set(answers.map((a) => a.field));
    const queue = asksFor(read, {
        date: Boolean(read.date),
        place: Boolean(read.place),
    })
        /* Where someone was is rarely the point of a hard note, and asking for it
           reads as filing paperwork on a bad evening. */
        .filter((field) => !(hard && field === 'place'))
        /* The on-device reader names them in its own vocabulary; the endpoint's
           names are the ones the screens speak. */
        .map((field) => field === 'more' ? 'context' : field === 'feeling' ? 'feelings' : field)
        .filter((field) => !answeredFields.has(field));
    const next = answers.length >= 3 ? undefined : queue[0];
    return settle({
        tone: read.tone,
        type: hard ? 'conflict' : read.tone === 'mixed' ? 'reflection' : 'everyday_memory',
        title: read.title,
        date: read.date ?? null,
        place: read.place ?? null,
        feelings: read.feelings,
        needsFollowUp: Boolean(next),
        nextQuestion: next ? QUESTION[next][voice] : null,
        questionField: next ?? null,
        quickReplies: next ? repliesFor(next, read.tone) : [],
        defaultVisibility: hard ? 'private' : 'shared',
        offerNextSteps: true,
        nextSteps: hard
            ? ['reflect', 'small_step', 'talk_about']
            : read.tone === 'mixed'
                ? ['reflect', 'talk_about']
                : ['idea'],
    });
}
function repliesFor(field, tone) {
    if (field === 'date')
        return DATE_REPLIES;
    if (field === 'place')
        return PLACE_REPLIES;
    if (field === 'feelings') {
        return tone === 'difficult' || tone === 'mixed' ? [...HARD_FEELINGS] : [...FEELINGS];
    }
    return [];
}
/* -------------------------------- The rules ------------------------------- */
/**
 * Held on both paths, and again on the server. Two things must be true however
 * the reading was produced, because both of them are promises to somebody
 * having a bad week: a difficult memory is private unless they say otherwise,
 * and nobody is offered a date night on the back of an argument.
 */
function settle(reading) {
    const hard = reading.tone === 'difficult' || reading.type === 'conflict';
    const steps = (reading.nextSteps ?? []).filter((s) => !(hard && s === 'idea'));
    return {
        ...reading,
        feelings: reading.feelings ?? [],
        quickReplies: reading.quickReplies ?? [],
        defaultVisibility: hard ? 'private' : (reading.defaultVisibility ?? 'shared'),
        nextSteps: steps,
        offerNextSteps: Boolean(reading.offerNextSteps) && steps.length > 0,
        needsFollowUp: Boolean(reading.needsFollowUp) && Boolean(reading.nextQuestion),
    };
}
/* ------------------------------- Next steps -------------------------------- */
/**
 * Each offer opens a screen that already exists. "A small next step" is the
 * one that had to be renamed: nothing here generates a step, so it says what
 * it actually does — opens the note that asks plainly for one thing.
 */
export const NEXT_STEP = {
    reflect: {
        icon: '🕯️',
        label: 'Help me reflect',
        to: '/us/talk/notes/new?kind=private',
    },
    small_step: {
        icon: '🤲',
        label: 'Ask for one small thing',
        to: '/us/talk/notes/new?kind=request',
    },
    talk_about: {
        icon: '💬',
        label: 'Turn this into something to talk about',
        to: '/us/talk/notes/new?kind=talk',
    },
    idea: {
        icon: '✨',
        label: 'Give us an idea',
        to: '/explore',
    },
};
