import type { VercelRequest, VercelResponse } from '@vercel/node';
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

const MODEL = process.env.MEMORY_AI_MODEL || 'claude-opus-5';

/**
 * The request is generous with tokens on purpose. Thinking is on by default on
 * this model and it spends from the same budget, so a tight max_tokens can end
 * the turn before any text is written — which arrives as a perfectly successful
 * response containing nothing to parse.
 */
const MAX_TOKENS = 4000;

/** The text blocks, joined. Thinking blocks are not text and are skipped. */
function textOf(response: Anthropic.Message): string {
  return response.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('')
    .trim();
}

/**
 * Structured output is a request, not a guarantee: a model, a plan or an API
 * version that will not take `output_config.format` fails the whole call with a
 * 400, and there is no reason for that to take the feature down when the same
 * model will happily return the same JSON if asked in words. So it is tried,
 * and a rejection of *the request shape* falls back to asking plainly — once.
 */
async function ask_model(client: Anthropic, ask: Ask, structured: boolean) {
  return client.messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    system: structured
      ? SYSTEM
      : `${SYSTEM}\n\nReply with one JSON object and nothing else — no prose, no code fence. It must have exactly these keys: ${SCHEMA.required.join(', ')}.`,
    messages: [{ role: 'user', content: userMessage(ask) }],
    // Low effort keeps the person waiting for one question rather than for a
    // considered essay about their evening.
    ...(structured
      ? { output_config: { effort: 'low' as const, format: { type: 'json_schema' as const, schema: SCHEMA } } }
      : { output_config: { effort: 'low' as const } }),
  });
}

/** A 400 about the shape of the request, rather than about its content. */
function rejectedTheShape(e: unknown): boolean {
  if (!(e instanceof Anthropic.APIError) || e.status !== 400) return false;
  return /output_config|output_format|format|schema|structured/i.test(e.message);
}

/** Whatever the model wrapped its JSON in, if it wrapped it in anything. */
export function parseJson(text: string, how: string): Reading {
  const body = text.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();
  const start = body.indexOf('{');
  const end = body.lastIndexOf('}');
  if (start === -1 || end <= start) {
    throw new Error(`${how}: the model returned no JSON object (${body.length} chars)`);
  }
  return JSON.parse(body.slice(start, end + 1)) as Reading;
}

async function read(ask: Ask, apiKey: string): Promise<Reading> {
  const client = new Anthropic({
    apiKey,
    // Comfortably inside the function's own ceiling, so a slow call comes back
    // as an error we can report rather than as the platform killing us.
    timeout: 40_000,
    maxRetries: 1,
  });

  let response: Anthropic.Message;
  let how = 'structured output';
  try {
    response = await ask_model(client, ask, true);
  } catch (e) {
    if (!rejectedTheShape(e)) throw e;
    console.warn(
      `[memory-read] ${MODEL} refused output_config.format (${String((e as Error).message)}). Asking in words instead.`,
    );
    how = 'plain JSON';
    response = await ask_model(client, ask, false);
  }

  const text = textOf(response);
  if (!text) {
    // A successful response with nothing in it. Almost always the budget going
    // entirely on thinking, and it says so rather than failing as a parse error.
    throw new Error(
      `${how}: empty response (stop_reason=${response.stop_reason}, output_tokens=${response.usage?.output_tokens})`,
    );
  }
  return parseJson(text, how);
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

/**
 * A model call is slower than a default function ceiling allows for, and being
 * killed by the platform mid-call looks identical to the model failing. The
 * SDK's own timeout above is set below this so the error is ours to report.
 */
export const config = { maxDuration: 60 };


/**
 * A default-exported (req, res) handler in api/ is what Vercel builds into a
 * serverless function. Typed with the platform's own types rather than
 * hand-rolled ones, so there is no question about the shape it expects.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
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
    /*
     * ?probe=1 goes further and actually calls the model, twice: once plainly
     * and once asking for structured output. Listing models proves the key is
     * real, which is not the same as proving a Messages call will work — a key
     * with no credit, or a model the workspace cannot reach, passes the first
     * and fails the second. This says which, in one request, for a handful of
     * tokens. Not run on the ordinary check because it costs money.
     */
    if (req.query?.probe) {
      res.status(200).json(await probe(key));
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
    const upstream = describe(e);
    /* One line, greppable, with the model on it — this is what to look for in
       the function's log when the badge says the reading fell back. */
    console.error(`[memory-read] FAILED model=${MODEL} ${upstream.status ?? '-'} ${upstream.type ?? ''} ${upstream.message}`);
    res.status(upstream.status === 429 ? 429 : 502).json({ error: 'ai_unavailable', upstream });
  }
}

/**
 * The three things that have to be true, checked one at a time: the key is
 * real, the model will answer this workspace, and it will answer in the shape
 * this endpoint asks for. Each reports its own outcome, so a failure names
 * itself instead of arriving as "the model call failed".
 */
async function probe(key: string) {
  const client = new Anthropic({ apiKey: key, maxRetries: 0, timeout: 30_000 });
  const out: Record<string, unknown> = { model: MODEL, node: process.version };

  try {
    await client.models.list({ limit: 1 });
    out.key = { ok: true };
  } catch (e) {
    return { ...out, key: { ok: false, ...describe(e) } };
  }

  const tiny = { max_tokens: 16, messages: [{ role: 'user' as const, content: 'Reply with the word ok.' }] };

  try {
    const r = await client.messages.create({ model: MODEL, ...tiny });
    out.messages = { ok: true, stop_reason: r.stop_reason, text: textOf(r).slice(0, 40) };
  } catch (e) {
    return { ...out, messages: { ok: false, ...describe(e) } };
  }

  try {
    const r = await client.messages.create({
      model: MODEL,
      ...tiny,
      output_config: {
        effort: 'low',
        format: {
          type: 'json_schema',
          schema: { type: 'object', additionalProperties: false, required: ['ok'], properties: { ok: { type: 'boolean' } } },
        },
      },
    });
    out.structuredOutput = { ok: true, text: textOf(r).slice(0, 40) };
  } catch (e) {
    // Not fatal: the endpoint falls back to asking for JSON in words.
    out.structuredOutput = { ok: false, ...describe(e) };
  }

  return out;
}

/**
 * What went wrong, in a form that is safe to hand back to the browser.
 *
 * The whole point is that the reason reaches whoever is looking at the screen:
 * "the model call failed" is not something anyone can act on, while "400 —
 * your credit balance is too low" is a thing to go and fix. The API's own
 * message is quoted, trimmed, and swept for anything key-shaped, which should
 * never be in there but costs nothing to be sure of.
 */
function describe(e: unknown): { status?: number; type?: string; message: string } {
  const scrub = (s: string) => s.replace(/sk-ant-[A-Za-z0-9_-]+/g, 'sk-ant-***').slice(0, 300);

  if (e instanceof Anthropic.APIError) {
    const body = e.error as { error?: { type?: string; message?: string } } | undefined;
    return {
      status: e.status,
      type: body?.error?.type ?? e.name,
      message: scrub(body?.error?.message ?? e.message),
    };
  }
  if (e instanceof Error) return { type: e.name, message: scrub(e.message) };
  return { message: scrub(String(e)) };
}
