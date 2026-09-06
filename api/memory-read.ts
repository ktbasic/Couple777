import Anthropic from '@anthropic-ai/sdk';

/**
 * Reading a written memory, on a server, so the key stays on the server.
 *
 * The browser sends the note and whatever has been answered so far; this
 * returns one structured object saying what the note already contains, what
 * is still worth asking, and — the part that matters most — what kind of
 * moment it is. A memory about an argument must not be met with confetti and
 * a date-night suggestion, and the only way to know which one arrived is to
 * read it.
 *
 * The endpoint holds no state. Every call carries the whole short
 * conversation, which keeps it a plain function of its input and means a
 * dropped request costs nothing but a retry.
 *
 * Swapping the model or the provider: MEMORY_AI_MODEL changes the model.
 * A different provider means one more branch in `read` below — everything
 * around it, the prompt included, is provider-agnostic, and the shape it must
 * return is `Reading`.
 */

/* -------------------------------- The shape ------------------------------- */

/** What the client is told. Also, near enough, what the model is asked for. */
export interface Reading {
  tone: 'positive' | 'neutral' | 'mixed' | 'difficult';
  type:
    | 'everyday_memory'
    | 'gratitude'
    | 'milestone'
    | 'reflection'
    | 'conflict'
    | 'other';
  title: string;
  /** The one line said back to them. Written for this note, not chosen from a list. */
  acknowledgement: string;
  date: string | null;
  place: string | null;
  feelings: string[];
  needsFollowUp: boolean;
  nextQuestion: string | null;
  /** What the answer will fill in, so the client knows how to ask it. */
  questionField: 'date' | 'place' | 'feelings' | 'context' | null;
  quickReplies: string[];
  defaultVisibility: 'private' | 'shared';
  offerNextSteps: boolean;
  /** Which of the four offers fit. Empty when none of them do. */
  nextSteps: ('reflect' | 'small_step' | 'talk_about' | 'idea')[];
}

/*
 * Every field is a plain type, and "unknown" is an empty string rather than
 * null. A nullable field wants either a union type or a null inside an enum,
 * and both are the first things a strict schema validator refuses — which
 * would fail every request, on a valid key, with nothing in the app to say so.
 * The empty strings are turned back into nulls in `settle` below.
 */
const SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: [
    'tone',
    'type',
    'title',
    'acknowledgement',
    'date',
    'place',
    'feelings',
    'needsFollowUp',
    'nextQuestion',
    'questionField',
    'quickReplies',
    'defaultVisibility',
    'offerNextSteps',
    'nextSteps',
  ],
  properties: {
    tone: { type: 'string', enum: ['positive', 'neutral', 'mixed', 'difficult'] },
    type: {
      type: 'string',
      enum: ['everyday_memory', 'gratitude', 'milestone', 'reflection', 'conflict', 'other'],
    },
    title: { type: 'string', description: 'Four words or fewer, in the writer’s own words.' },
    acknowledgement: {
      type: 'string',
      description:
        'One short sentence said back to them, in the tone of what they wrote. Never contradicts the note.',
    },
    date: {
      type: 'string',
      description: 'YYYY-MM-DD, only when the note names a day. Empty string otherwise.',
    },
    place: {
      type: 'string',
      description: 'Short, e.g. "Home" or "The beach". Empty string when the note does not say.',
    },
    feelings: {
      type: 'array',
      items: { type: 'string' },
      maxItems: 3,
      description: 'One or two words each, drawn from the note. May be difficult feelings.',
    },
    needsFollowUp: { type: 'boolean' },
    nextQuestion: { type: 'string', description: 'Empty string when there is nothing to ask.' },
    questionField: {
      type: 'string',
      enum: ['date', 'place', 'feelings', 'context', ''],
      description: 'What the answer fills in. Empty string when there is no question.',
    },
    quickReplies: { type: 'array', items: { type: 'string' }, maxItems: 6 },
    defaultVisibility: { type: 'string', enum: ['private', 'shared'] },
    offerNextSteps: { type: 'boolean' },
    nextSteps: {
      type: 'array',
      items: { type: 'string', enum: ['reflect', 'small_step', 'talk_about', 'idea'] },
      maxItems: 3,
    },
  },
} as const;

/* -------------------------------- The brief ------------------------------- */

const SYSTEM = `You help someone keep a memory in a couples' journal. You are reading what
they just wrote and deciding what, if anything, is still worth asking.

Return only the structured object. Never write a reply to the person other
than through nextQuestion.

HOW TO READ IT

Read the whole note and work out what the person is telling you. Do not count
positive and negative words: what matters is what the sentence means when it
is read as a sentence.

- tone is what they wrote, not what you would prefer it to be, and not what
  the cheerful half of a sentence says on its own.
    - "The wedding was beautiful, but I felt lonely and sad the entire
      evening" is about being lonely at a wedding. It is difficult, or at the
      very best mixed. It is never positive.
    - "We argued and I felt ignored" is difficult. Do not soften it, reframe
      it, or find a silver lining in it.
    - A note that says something good happened and nothing else is positive.
    - A note that records something plainly, with no feeling either way, is
      neutral. Neutral is a real answer; do not reach for positive.
  When someone states how they felt, that is the tone, whatever else the note
  describes. Their feeling outranks the scenery around it.
- type: everyday_memory, gratitude, milestone, reflection, conflict, other.
- Extract only what is actually there. If the note says "tonight", the date is
  today. If it says nothing about when, leave date empty — do not guess.
- Feelings are the ones the note carries, difficult ones included: sad, angry,
  hurt, lonely, unheard, anxious, tired, as readily as warm or joyful.
- title: four words or fewer, made of their own words, no invented drama and
  no summary voice. "Dancing in the kitchen". "The same argument". Never a
  judgement about the relationship.

THE ACKNOWLEDGEMENT

One short sentence, said back to them before the question. It is the first
thing they read, so it has to fit what they actually wrote:

- positive  — warm and small. "That sounds like a lovely little moment ✨"
- neutral   — plain and unhurried. "Thank you for writing that down."
- mixed     — hold both, decide neither. "That sounds like it held two things
              at once." Never celebrate the good half.
- difficult — calm, no cheer, no emoji, no advice, no reassurance that it will
              be fine. "That sounds like a difficult moment."

Write it for this note rather than copying those. Never say a hard note was
lovely, and never open with a compliment on something the person is upset
about.

WHAT TO ASK

- Ask nothing you can already answer from the note. If the note has a day, a
  place and a clear feeling, set needsFollowUp false and stop.
- One question at a time, and never more than three across the whole
  conversation. Count the answers already given.
- Questions are short, warm and plain. Offer quickReplies that can be tapped:
  three or four for a date or a place, up to six single words for feelings.
- questionField says what the answer fills in: date, place, feelings, or
  context for anything else.

TONE RULES

- Positive or neutral: light and glad, one small warm phrase at most.
- Mixed: acknowledge both without deciding which one wins.
- Difficult: calm, unhurried, no cheerfulness, no emoji, no advice, no
  interpretation of the relationship or of the other person. Ask about what
  they want to remember or what they need, not about what went wrong or whose
  fault it was. You are not a therapist and you do not diagnose. Never suggest
  a date, a treat, or a romantic gesture.

VISIBILITY

- defaultVisibility is private for anything difficult, for conflict, and for
  private reflection; shared for everyday memories, gratitude and milestones.

AFTER SAVING

- offerNextSteps and nextSteps say what may be offered once it is kept.
  reflect     — help me sit with this. Fits reflection and difficult notes.
  small_step  — one small thing that might help. Fits difficult and mixed.
  talk_about  — turn this into something to raise together, gently. Fits
                conflict and mixed, never a light happy note.
  idea        — suggest something to do together. ONLY for positive or
                neutral notes. Never offer it on a difficult one.
- Offer none of them when nothing fits. An empty list is a good answer.`;

/* --------------------------------- Calling -------------------------------- */

interface Turn {
  question: string;
  field: string | null;
  answer: string;
}

interface Ask {
  note: string;
  today: string;
  answers: Turn[];
}

function userMessage(ask: Ask): string {
  const answered = ask.answers.length
    ? ask.answers
        .map((a) => `- You asked: ${a.question}\n  They answered: ${a.answer || '(skipped)'}`)
        .join('\n')
    : '(nothing asked yet)';

  return [
    `Today is ${ask.today}.`,
    '',
    'What they wrote:',
    '"""',
    ask.note,
    '"""',
    '',
    'Answers so far:',
    answered,
    '',
    `Questions asked so far: ${ask.answers.length}. At three, needsFollowUp must be false.`,
  ].join('\n');
}

async function read(ask: Ask, apiKey: string): Promise<Reading> {
  const client = new Anthropic({ apiKey });
  const response = await client.messages.create({
    model: process.env.MEMORY_AI_MODEL || 'claude-opus-5',
    max_tokens: 2000,
    system: SYSTEM,
    messages: [{ role: 'user', content: userMessage(ask) }],
    // A short, well-specified read: low effort keeps the person waiting for
    // one question rather than for a considered essay about their evening.
    output_config: { effort: 'low', format: { type: 'json_schema', schema: SCHEMA } },
  });

  const text = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('');
  return JSON.parse(text) as Reading;
}

/* -------------------------------- Guarding -------------------------------- */

/**
 * The model is well behaved and the schema is enforced, but this endpoint's
 * output drives what a person is asked about the worst evening of their week.
 * So the two rules that must not bend are enforced here as well: a difficult
 * memory is private by default, and it is never offered a date idea.
 */
export function settle(reading: Reading): Reading {
  const hard = reading.tone === 'difficult' || reading.type === 'conflict';
  const steps = (reading.nextSteps ?? []).filter((s) => !(hard && s === 'idea'));
  // Empty string is how the schema says "nothing"; null is how the app does.
  const orNull = (v: string | null | undefined) => (v && v.trim() ? v : null);
  /*
   * The acknowledgement is the first thing a person reads, so it is the last
   * thing left to chance. A model that called a hard note lovely gets its
   * sentence replaced rather than softened — there is no version of "lovely"
   * that belongs on top of an argument.
   */
  const congratulatory = /\b(lovely|wonderful|beautiful|great|sweet|delightful|magical|congrat\w*|how nice|so good)\b/i;
  const acknowledgement =
    hard && congratulatory.test(reading.acknowledgement ?? '')
      ? 'That sounds like a difficult moment.'
      : (orNull(reading.acknowledgement) ?? 'Thank you for writing that down.');

  return {
    ...reading,
    acknowledgement,
    date: orNull(reading.date),
    place: orNull(reading.place),
    nextQuestion: orNull(reading.nextQuestion),
    questionField: (orNull(reading.questionField) as Reading['questionField']) ?? null,
    feelings: (reading.feelings ?? []).slice(0, 3),
    quickReplies: (reading.quickReplies ?? []).slice(0, 6),
    defaultVisibility: hard ? 'private' : reading.defaultVisibility,
    nextSteps: steps,
    offerNextSteps: Boolean(reading.offerNextSteps) && steps.length > 0,
    needsFollowUp: Boolean(reading.needsFollowUp) && Boolean(orNull(reading.nextQuestion)),
  };
}

/* -------------------------------- The route ------------------------------- */

interface Req {
  method?: string;
  body?: unknown;
}
interface Res {
  status: (code: number) => Res;
  json: (body: unknown) => void;
}

export default async function handler(req: Req, res: Res) {
  const key = process.env.MEMORY_AI_API_KEY || process.env.ANTHROPIC_API_KEY;

  /*
   * A GET reports whether this is switched on and whether the key actually
   * authenticates. "Present" is not the same as "works" — a typo, a revoked
   * key or an exhausted account all leave the app quietly falling back while
   * something in Settings insists the model is reading. Listing models costs
   * no tokens, so the check is free.
   */
  if (req.method === 'GET') {
    if (!key) {
      res.status(200).json({ configured: false, working: false });
      return;
    }
    try {
      await new Anthropic({ apiKey: key, maxRetries: 0 }).models.list({ limit: 1 });
      res.status(200).json({ configured: true, working: true });
    } catch (e) {
      const reason =
        e instanceof Anthropic.AuthenticationError
          ? 'The key was refused. Check it was pasted whole.'
          : e instanceof Anthropic.PermissionDeniedError
            ? 'The key has no access. Check the workspace it belongs to.'
            : e instanceof Anthropic.RateLimitError
              ? 'Rate limited just now. It should work again shortly.'
              : 'Could not reach the model just now.';
      res.status(200).json({ configured: true, working: false, reason });
    }
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method_not_allowed' });
    return;
  }

  if (!key) {
    /* Not an error the person should ever see: the app reads its own notes on
       the device when this happens, and the flow carries on. */
    res.status(503).json({ error: 'ai_not_configured' });
    return;
  }

  const body = (typeof req.body === 'string' ? JSON.parse(req.body) : req.body) as Partial<Ask>;
  const note = typeof body?.note === 'string' ? body.note.trim() : '';
  if (!note) {
    res.status(400).json({ error: 'note_required' });
    return;
  }

  const ask: Ask = {
    // Long enough for anything anyone writes in one sitting; bounded so the
    // endpoint cannot be used as a general-purpose model proxy.
    note: note.slice(0, 2000),
    today: typeof body.today === 'string' ? body.today : new Date().toISOString().slice(0, 10),
    answers: Array.isArray(body.answers)
      ? body.answers.slice(0, 3).map((a) => ({
          question: String(a?.question ?? '').slice(0, 300),
          field: a?.field ? String(a.field).slice(0, 20) : null,
          answer: String(a?.answer ?? '').slice(0, 300),
        }))
      : [],
  };

  try {
    res.status(200).json(settle(await read(ask, key)));
  } catch (e) {
    const status = e instanceof Anthropic.APIError ? e.status ?? 502 : 502;
    console.error('memory-read failed', e);
    res.status(status === 429 ? 429 : 502).json({ error: 'ai_unavailable' });
  }
}
