import { HARD_FEELINGS, FEELINGS, asksFor, readNote, type Tone } from './memoryRead';
import { today } from './dates';
import type { ISODate } from './types';

/**
 * The capture flow's read of a memory: from the model when there is one, from
 * the phone when there is not.
 *
 * Both paths return the same object, so the screens never learn which one they
 * got. That is the point — the flow has to work on a plane, on a dead network,
 * and before anyone has set an API key, and it must never be *wrong* in the
 * cheap case: the on-device read is coarser, but it is held to the same two
 * rules as the model, that a hard note stays private and is never handed a
 * date suggestion.
 *
 * The key lives on the server (api/memory-read.ts). Nothing here knows it.
 */

export type MemoryType =
  | 'everyday_memory'
  | 'gratitude'
  | 'milestone'
  | 'reflection'
  | 'conflict'
  | 'other';

export type NextStep = 'reflect' | 'small_step' | 'talk_about' | 'idea';

export interface MemoryReading {
  tone: Tone;
  type: MemoryType;
  title: string;
  /** The line said back to them, written for this note by whatever read it. */
  acknowledgement: string;
  date: string | null;
  place: string | null;
  feelings: string[];
  needsFollowUp: boolean;
  nextQuestion: string | null;
  questionField: 'date' | 'place' | 'feelings' | 'context' | null;
  quickReplies: string[];
  defaultVisibility: 'private' | 'shared';
  offerNextSteps: boolean;
  nextSteps: NextStep[];
}

export interface Answered {
  question: string;
  field: string | null;
  answer: string;
}

/** Which read this came from. Shown nowhere; used in tests and in logs. */
export type ReadingSource = 'model' | 'device';

/** Why the phone ended up doing the reading. Shown only in debug. */
let lastFallbackReason: string | null = null;
export function fallbackReason(): string | null {
  return lastFallbackReason;
}

/* ------------------------------ The opening ------------------------------- */

/**
 * What the phone says when it is the one reading.
 *
 * Deliberately the same sentence for every note. The device reader is pattern
 * matching, not comprehension — it can be confidently wrong about a sentence
 * it has never seen — and a wrong *guess* dressed as an emotional response is
 * worse than no response at all. So it says something true instead: it heard
 * you, and there is one more question. The reading it produces still drives
 * privacy and what is offered afterwards, because those are protections rather
 * than claims about how someone feels.
 */
export const NEUTRAL_ACKNOWLEDGEMENT = 'Got it.';

/**
 * Only reached when the model returned a reading with no sentence in it, which
 * the endpoint already guards against. Kept as a floor, not as the usual path.
 */
export const OPENING: Record<Tone, string> = {
  positive: 'That sounds like a lovely little moment ✨',
  neutral: 'Thank you for writing that down.',
  mixed: 'That sounds like it held two things at once.',
  difficult: 'That sounds like a difficult moment.',
};

/* --------------------------------- Asking --------------------------------- */

const ENDPOINT = '/api/memory-read';
const TIMEOUT_MS = 12_000;

export async function readMemory(
  note: string,
  answers: Answered[] = [],
  now: ISODate = today(),
): Promise<{ reading: MemoryReading; source: ReadingSource }> {
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
      const reading = (await response.json()) as MemoryReading;
      rememberSource('model');
      lastFallbackReason = null;
      // Trust it, but not with the two rules that matter.
      return { reading: settle(reading), source: 'model' };
    }
    const body = (await response.json().catch(() => ({}))) as { error?: string };
    lastFallbackReason = `${response.status} ${body.error ?? response.statusText}`;
  } catch (e) {
    /* No endpoint, no key, no network, or it took too long. The flow does not
       stop for any of those — but it says which, because "the app felt wrong"
       is not something anyone can debug. */
    lastFallbackReason = e instanceof Error ? `${e.name}: ${e.message}` : String(e);
  }
  console.warn(`[couple777] memory read fell back to this device — ${lastFallbackReason}`);
  rememberSource('device');
  // The status line is asked again next time it is shown, not cached from
  // before this happened.
  statusPromise = null;
  return { reading: localReading(note, answers, now), source: 'device' };
}

/**
 * Which reader is live, and whether it is actually working.
 *
 * Three states, because two would lie. A key that is set but refused looks
 * exactly like a key that works — right up until every note comes back read by
 * the phone, with nothing anywhere saying why. So the endpoint is asked
 * whether the key authenticates, and the last real read is remembered: if
 * requests are failing, "off" is what this reports, whatever the settings say.
 */
export interface ReaderStatus {
  source: ReadingSource;
  configured: boolean;
  /** Why the model is not reading, when it is configured but not working. */
  reason?: string;
}

const LAST_SOURCE_KEY = 'couple777:memory-reader';

function rememberSource(source: ReadingSource) {
  try {
    window.localStorage.setItem(LAST_SOURCE_KEY, source);
  } catch {
    /* private mode — the status simply falls back to asking the endpoint */
  }
}

function lastSource(): ReadingSource | null {
  try {
    const v = window.localStorage.getItem(LAST_SOURCE_KEY);
    return v === 'model' || v === 'device' ? v : null;
  } catch {
    return null;
  }
}

let statusPromise: Promise<ReaderStatus> | null = null;

export function readerStatus(): Promise<ReaderStatus> {
  statusPromise ??= fetch(ENDPOINT, { method: 'GET' })
    .then((r) =>
      r.ok
        ? (r.json() as Promise<{ configured?: boolean; working?: boolean; reason?: string }>)
        : { configured: false, working: false },
    )
    .then((body): ReaderStatus => {
      if (!body.configured) return { source: 'device', configured: false };
      if (!body.working) {
        return { source: 'device', configured: true, reason: body.reason };
      }
      // Configured and authenticating — but if the last actual read still came
      // back from the phone, say so rather than claiming otherwise.
      const last = lastSource();
      return last === 'device'
        ? { source: 'device', configured: true, reason: 'The last note was read on this phone.' }
        : { source: 'model', configured: true };
    })
    .catch((): ReaderStatus => ({ source: 'device', configured: false }));
  return statusPromise;
}

/* ----------------------------- The device read ---------------------------- */

const QUESTION: Record<string, Record<'soft' | 'hard', string>> = {
  date: {
    soft: 'Was this today?',
    hard: 'Was this today?',
  },
  /* Asked with no assumption about how the note felt, because the phone does
     not know. "Anything else you'd like to remember about this?" is true of a
     good evening and a hard one alike. */
  place: {
    soft: 'Do you want to remember where this happened?',
    hard: 'Do you want to remember where this happened?',
  },
  feelings: {
    soft: 'How did this moment leave you feeling?',
    hard: 'How did it leave you feeling?',
  },
  context: {
    soft: 'Is there anything else you’d like to remember about this?',
    hard: 'Is there anything else you’d like to remember about this?',
  },
};

type Field = 'date' | 'place' | 'feelings' | 'context';

const DATE_REPLIES = ['Yes, today', 'Choose another date', 'Doesn’t matter'];
const PLACE_REPLIES = ['At home', 'Add a place', 'Skip'];

/**
 * What the phone alone can work out. Coarser than the model — it cannot tell a
 * milestone from a Tuesday — but it asks the same shape of question, never
 * more than three, and it reads tone before it reads anything else.
 */
export function localReading(
  note: string,
  answers: Answered[] = [],
  now: ISODate = today(),
): MemoryReading {
  const read = readNote(note, now);
  const hard = read.tone === 'difficult';
  const voice = hard ? 'hard' : 'soft';

  const answeredFields = new Set(answers.map((a) => a.field));
  const wanted: Field[] = asksFor(read, {
    date: Boolean(read.date),
    place: Boolean(read.place),
  })
    /* Where someone was is rarely the point of a hard note, and asking for it
       reads as filing paperwork on a bad evening. */
    .filter((field) => !(hard && field === 'place'))
    /* The on-device reader names them in its own vocabulary; the endpoint's
       names are the ones the screens speak. */
    .map((field) => (field === 'more' ? 'context' : field === 'feeling' ? 'feelings' : field));

  /*
   * Order matters more than which questions get asked. After a good evening,
   * "was this today?" is a pleasant little thing to answer first. After a bad
   * one it is paperwork — so a hard note is asked what it wants to keep, then
   * how it felt, and only then, if there is room, when it was.
   */
  const order: Field[] = hard
    ? ['context', 'feelings', 'date', 'place']
    : ['date', 'place', 'feelings', 'context'];
  const queue = order
    .filter((field) => wanted.includes(field) || (hard && field === 'context'))
    .filter((field) => !answeredFields.has(field));

  const next = answers.length >= 3 ? undefined : queue[0];

  return settle({
    tone: read.tone,
    type: hard ? 'conflict' : read.tone === 'mixed' ? 'reflection' : 'everyday_memory',
    title: read.title,
    acknowledgement: NEUTRAL_ACKNOWLEDGEMENT,
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

function repliesFor(field: string, tone: Tone): string[] {
  if (field === 'date') return DATE_REPLIES;
  if (field === 'place') return PLACE_REPLIES;
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
function settle(reading: MemoryReading): MemoryReading {
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
export const NEXT_STEP: Record<NextStep, { icon: string; label: string; to: string }> = {
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
