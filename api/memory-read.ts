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

const SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: [
    'tone',
    'type',
    'title',
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
    date: {
      type: ['string', 'null'],
      description: 'YYYY-MM-DD, only when the note names a day. Otherwise null.',
    },
    place: {
      type: ['string', 'null'],
      description: 'Short, e.g. "Home" or "The beach". Null when the note does not say.',
    },
    feelings: {
      type: 'array',
      items: { type: 'string' },
      maxItems: 3,
      description: 'One or two words each, drawn from the note. May be difficult feelings.',
    },
    needsFollowUp: { type: 'boolean' },
    nextQuestion: { type: ['string', 'null'] },
    questionField: { type: ['string', 'null'], enum: ['date', 'place', 'feelings', 'context', null] },
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

- tone is what they wrote, not what you would prefer it to be. "We argued
  again and I felt like he wasn't listening" is difficult. Do not soften it,
  reframe it, or find a silver lining.
- type: everyday_memory, gratitude, milestone, reflection, conflict, other.
- Extract only what is actually there. If the note says "tonight", the date is
  today. If it says nothing about when, date is null — do not guess.
- Feelings are the ones the words carry, difficult ones included: sad, angry,
  hurt, lonely, unheard, anxious, tired, as readily as warm or joyful.
- title: four words or fewer, made of their own words, no invented drama and
  no summary voice. "Dancing in the kitchen". "The same argument". Never a
  judgement about the relationship.

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
  return {
    ...reading,
    feelings: (reading.feelings ?? []).slice(0, 3),
    quickReplies: (reading.quickReplies ?? []).slice(0, 6),
    defaultVisibility: hard ? 'private' : reading.defaultVisibility,
    nextSteps: steps,
    offerNextSteps: Boolean(reading.offerNextSteps) && steps.length > 0,
    needsFollowUp: Boolean(reading.needsFollowUp) && Boolean(reading.nextQuestion),
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

  /* A GET says only whether this is switched on — no key, no model call, and
     nothing to leak. The app asks so it can tell someone which reader is
     doing the reading. */
  if (req.method === 'GET') {
    res.status(200).json({ configured: Boolean(key) });
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
