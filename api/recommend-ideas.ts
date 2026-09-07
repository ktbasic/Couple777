import type { VercelRequest, VercelResponse } from '@vercel/node';
import Anthropic from '@anthropic-ai/sdk';
import { DATE_IDEAS } from '../shared/dateIdeas.js';
import {
  diversify,
  emptyContext,
  localRecommendations,
  rankCandidates,
  tagsFor,
  MAX_PER_CATEGORY,
  type Candidate,
  type CoupleContext,
  type Recommendation,
} from '../shared/ideaRank.js';
import type { BaseIdea, IdeaFilters } from '../shared/ideaTypes.js';

/**
 * Ranking date ideas for one couple, on a server, so the key stays on a server.
 *
 * The division of labour matters more than the model does:
 *
 *   this file decides what may be recommended — budget, whether the two of
 *   them are in the same city, which of their taste rows an idea misses;
 *   the model decides which of those are best for this couple and says why.
 *
 * The model cannot widen the first part. It is handed a list, it may only
 * return ids from that list, and its ordering is re-sorted by tier afterwards
 * so a near miss can never be promoted over an exact match however persuasive
 * it was. Everything it adds is wording and judgement inside rules it did not
 * get a vote on.
 *
 * The browser sends filters and context, not candidates. That is deliberate:
 * the corpus is imported here from `shared/`, so a caller cannot invent an
 * idea, and the endpoint is not a general-purpose way to get text out of a
 * model that somebody else is paying for.
 *
 * Swapping model or provider: MEMORY_AI_MODEL changes the model; a different
 * provider is one more branch in `rank` below. Everything else, the prompt
 * included, is provider-agnostic.
 */

/* -------------------------------- The shape ------------------------------- */

/**
 * What the model returns. Plain types only, and "nothing" is an empty string
 * rather than null — a nullable field needs either a union or a null inside an
 * enum, and a strict schema validator refuses both, which fails every request
 * on a perfectly good key. Same lesson as api/memory-read.ts.
 */
const SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['picks'],
  properties: {
    picks: {
      type: 'array',
      maxItems: 20,
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['id', 'reason'],
        properties: {
          id: { type: 'string', description: 'Must be one of the ids given. Never anything else.' },
          reason: {
            type: 'string',
            description:
              'At most 100 characters. One short sentence on why this suits this couple. Never repeat the title.',
          },
        },
      },
    },
  },
} as const;

interface Pick {
  id: string;
  reason: string;
}

/* -------------------------------- The brief ------------------------------- */

const SYSTEM = `You choose which date ideas to show a couple, from a list you are given.

You are ordering them and writing one short line for each. You are not writing
the cards — the app already owns every idea's title, description, pictures and
tags, and will use its own. Do not restate them.

Every id you return must be one of the ids in the list. An id that is not in
the list is a failure, not a suggestion, and it will be discarded.

WHAT THE TIERS MEAN

Each candidate has a tier and, when the tier is not 0, what it misses.

- tier 0 matches everything the couple chose.
- tier 1 misses one of their choices, tier 2 misses two.

Tier 0 always comes before tier 1, and tier 1 before tier 2. Do not promote a
near miss over an exact match because you find it more interesting — someone
chose those filters and a worse match is not a better idea. Your judgement is
for ordering *within* a tier, and for choosing which near misses are worth
showing when there are not enough exact matches.

WHAT MAKES A GOOD ORDER

- Variety. Five suggestions that are all cooking is a worse answer than four
  plus something different, even if the fifth scored well. Vary what they would
  be *doing*, not just how it feels.
- Fit. Use what you are told about them — what they said they want more of, the
  kinds of thing they have saved or done before. Prefer more of what they like,
  never the exact thing they already have on their list.
- Honesty. Never say "you loved this last time" unless you were told they did.
  Never invent a shared history. If you have little to go on, write a reason
  about the idea rather than about them.

THE REASON

One short sentence. At most 100 characters — this is a caption, not a
paragraph, and anything longer is cut off.

- Say why it suits *these two*, not what the idea is. The card already says
  what it is, directly above your line.
- Never repeat or paraphrase the title.
- No flattery, no exclamation marks, no marketing.
- A near miss does not need to apologise: the card already says what it gives
  up, in the couple's own words. Use the line to say why it is still worth it.

Good: "You both said you want more adventure, and this one starts early."
Bad:  "Watch the sun come up together — a beautiful romantic morning!"

TONE

Warm, plain and unhurried. No pressure about romance, no assumptions about who
lives with whom, who is married, or who has children. Two people trying to
spend an evening together well.

Return every candidate you were given, in your preferred order, so the app can
page through them. Best first.`;

/* --------------------------------- Calling -------------------------------- */

/*
 * Its own variable, not the memory reader's.
 *
 * Reading a memory is a judgement call about someone's evening and is worth a
 * heavy model. Ranking is not: eligibility, tiering, the diversity rule and
 * every guardrail are already decided in code before the model sees anything,
 * so what is left is ordering at most twenty already-vetted ideas and writing
 * a sentence for each. Sonnet does that well and answers sooner, and sooner
 * is the whole point on a screen someone is waiting at.
 *
 * Not Haiku, for one concrete reason rather than taste: Haiku 4.5 rejects
 * `output_config.effort`, which this request sends, so it is not a drop-in.
 * Moving to it would mean dropping effort as well, and that is a change worth
 * measuring rather than smuggling into a latency fix.
 */
const MODEL = process.env.RECOMMEND_AI_MODEL || 'claude-sonnet-5';

/** Thinking spends from the same budget, so a tight ceiling returns nothing. */
/*
 * Sized for what is now asked for, with room for thinking on top.
 *
 * Twenty ids and twenty one-line reasons is roughly 700 tokens; the previous
 * 6000 was sized for twenty rewritten cards, which is what made a request take
 * twenty seconds. Note this ceiling is not itself the saving — a ceiling costs
 * nothing when unused, and the latency came from the tokens actually written.
 * It is here so a runaway answer fails fast rather than expensively, and it is
 * kept well clear of the floor because thinking spends from the same budget:
 * too tight and the turn ends before any text is written, which arrives as a
 * perfectly successful response with nothing in it.
 */
const MAX_TOKENS = 2500;

function textOf(response: Anthropic.Message): string {
  return response.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('')
    .trim();
}

/** What the model is told about each candidate. Never the whole corpus. */
function describeCandidate(c: Candidate): string {
  const cost = c.idea.cost === 0 ? 'free' : `€${c.idea.cost}`;
  const misses = c.missed.length ? ` — misses: ${c.missed.map((m) => m.label).join('; ')}` : '';
  return [
    `- id: ${c.idea.id} (tier ${c.tier}${misses})`,
    `  ${c.idea.title} · ${c.idea.setting === 'home' ? 'indoors' : 'outdoors'} · ${cost} · ${c.idea.duration} min · ${c.idea.category} · ${c.idea.vibes.join('/')}`,
    `  ${c.idea.description}`,
    `  why it can land: ${c.idea.why}`,
  ].join('\n');
}

function userMessage(f: IdeaFilters, ctx: CoupleContext, candidates: Candidate[], count: number) {
  const chose = [
    f.daypart ? `time: ${f.daypart}` : null,
    f.setting ? `setting: ${f.setting === 'home' ? 'indoor' : 'outdoor'}` : null,
    f.budget === 0 ? 'budget: free' : f.budget != null ? `budget: up to €${f.budget}` : null,
    f.vibe ? `vibe: ${f.vibe}` : null,
  ].filter(Boolean);

  const known = (label: string, ids: string[]) => {
    if (!ids.length) return null;
    const titles = ids
      .map((id) => DATE_IDEAS.find((i) => i.id === id)?.title)
      .filter(Boolean)
      .slice(0, 8);
    return titles.length ? `${label}: ${titles.join(', ')}` : null;
  };

  const about = [
    ctx.wishes.length ? `they said they want more: ${ctx.wishes.join(', ')}` : null,
    ctx.vibes.length ? `they describe themselves as: ${ctx.vibes.join(', ')}` : null,
    ctx.proximity !== 'together' ? `they live: ${ctx.proximity.replace('-', ' ')}` : null,
    known('already hearted', ctx.liked),
    known('already on their shared list', ctx.onList),
    known('already done', ctx.done),
  ].filter(Boolean);

  return [
    `They chose: ${chose.length ? chose.join(', ') : 'nothing in particular'}.`,
    '',
    about.length ? `About them:\n${about.map((a) => `- ${a}`).join('\n')}` : 'You know nothing else about them yet.',
    '',
    `Candidates (${candidates.length}), already filtered to what they can actually do:`,
    candidates.map(describeCandidate).join('\n'),
    '',
    `Order all of them, best first. The app will show the first ${count}.`,
  ].join('\n');
}

async function ask(
  client: Anthropic,
  f: IdeaFilters,
  ctx: CoupleContext,
  candidates: Candidate[],
  count: number,
  structured: boolean,
) {
  return client.messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    system: structured
      ? SYSTEM
      : `${SYSTEM}\n\nReply with one JSON object and nothing else — no prose, no code fence. It must have a single key "picks", an array of objects with exactly: id, title, description, tags, reason.`,
    messages: [{ role: 'user', content: userMessage(f, ctx, candidates, count) }],
    ...(structured
      ? {
          output_config: {
            effort: 'low' as const,
            format: { type: 'json_schema' as const, schema: SCHEMA },
          },
        }
      : { output_config: { effort: 'low' as const } }),
  });
}

/** A 400 about the shape of the request rather than about its content. */
function rejectedTheShape(e: unknown): boolean {
  if (!(e instanceof Anthropic.APIError) || e.status !== 400) return false;
  return /output_config|output_format|format|schema|structured/i.test(e.message);
}

export function parsePicks(text: string, how: string): Pick[] {
  const body = text.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();
  const start = body.indexOf('{');
  const end = body.lastIndexOf('}');
  if (start === -1 || end <= start) {
    throw new Error(`${how}: the model returned no JSON object (${body.length} chars)`);
  }
  const parsed = JSON.parse(body.slice(start, end + 1)) as { picks?: Pick[] };
  if (!Array.isArray(parsed.picks)) throw new Error(`${how}: no picks array`);
  return parsed.picks;
}

export interface Timings {
  /** Verifying the caller's Supabase token. */
  authMs: number;
  /** The Anthropic request, wall clock, retries included. */
  modelMs: number;
  /** Everything, from entering the handler to answering. */
  totalMs: number;
  /** What the model actually charged us for, when it says. */
  outputTokens?: number;
}

async function rank(
  f: IdeaFilters,
  ctx: CoupleContext,
  candidates: Candidate[],
  count: number,
  apiKey: string,
): Promise<{ picks: Pick[]; outputTokens?: number }> {
  /*
   * Comfortably above the browser's own 30s ceiling and comfortably below
   * maxDuration, so the three timeouts fire in the only order that is any use:
   * the phone gives up first and falls back, this request still finishes and
   * still writes down how long it took, and the platform never kills us
   * mid-call — which looks identical to the model failing and explains
   * nothing.
   */
  const client = new Anthropic({ apiKey, timeout: 45_000, maxRetries: 1 });

  let response: Anthropic.Message;
  let how = 'structured output';
  try {
    response = await ask(client, f, ctx, candidates, count, true);
  } catch (e) {
    if (!rejectedTheShape(e)) throw e;
    console.warn(`[recommend-ideas] ${MODEL} refused output_config.format. Asking in words.`);
    how = 'plain JSON';
    response = await ask(client, f, ctx, candidates, count, false);
  }

  const text = textOf(response);
  if (!text) {
    throw new Error(
      `${how}: empty response (stop_reason=${response.stop_reason}, output_tokens=${response.usage?.output_tokens})`,
    );
  }
  return { picks: parsePicks(text, how), outputTokens: response.usage?.output_tokens };
}

/* -------------------------------- Guarding -------------------------------- */

/*
 * The reason is a caption under a card, not a paragraph. The prompt asks for
 * 100 characters; this is the enforcement, with a little slack so a sentence
 * that runs slightly long is kept whole rather than cut mid-word.
 */
const CAP = { reason: 120 };

const trim = (v: unknown, max: number): string =>
  typeof v === 'string' ? v.trim().slice(0, max) : '';

/**
 * The model's ordering, forced back inside the rules.
 *
 * Everything here is a thing the model could get wrong and the app must not
 * pass on: an id that was never offered, a duplicate, a near miss placed above
 * an exact match, a card with no words on it. The tier re-sort is the one that
 * matters most — it is what makes "your filters are respected" true rather
 * than merely requested in a prompt.
 */
export function settle(
  picks: Pick[],
  candidates: Candidate[],
  count: number,
): Recommendation[] {
  const byId = new Map(candidates.map((c) => [c.idea.id, c]));
  const seen = new Set<string>();
  const kept: { pick: Pick; candidate: Candidate }[] = [];

  for (const pick of picks) {
    const id = trim(pick?.id, 64);
    const candidate = byId.get(id);
    // Not offered, or offered twice. Either way it does not go on screen.
    if (!candidate || seen.has(id)) continue;
    seen.add(id);
    kept.push({ pick, candidate });
  }

  // Anything the model dropped is still eligible and still ranked; it goes on
  // the end in our order, so running short is never how a couple ends up with
  // three cards.
  for (const candidate of candidates) {
    if (seen.has(candidate.idea.id)) continue;
    seen.add(candidate.idea.id);
    kept.push({ pick: { id: candidate.idea.id, reason: '' }, candidate });
  }

  // Tier order is not the model's to decide.
  kept.sort((a, b) => a.candidate.tier - b.candidate.tier);

  /*
   * The card is built here, from the corpus, not from what the model wrote.
   *
   * Title, description and tags are things the app already owns and has always
   * owned. Asking the model to write them again cost roughly three quarters of
   * the output tokens on every request, and bought nothing but the risk that
   * "Cook one dish from scratch" came back describing a restaurant. The only
   * words that are the model's are the one-line reason, which is the only part
   * that depends on knowing this particular couple.
   */
  const merged: Recommendation[] = kept.map(({ pick, candidate }) => ({
    id: candidate.idea.id,
    title: candidate.idea.title,
    description: candidate.idea.description,
    tags: tagsFor(candidate.idea),
    reason: trim(pick.reason, CAP.reason),
    tier: candidate.tier,
    missed: candidate.missed.map((m) => m.label),
  }));

  /*
   * Diversity, applied a page at a time rather than once at the top.
   *
   * The client pages through this list five at a time, so diversifying only
   * the first five leaves page two free to be all one kind of evening — which
   * is the complaint the rule exists to answer, arriving one tap later. Each
   * page is drawn from what is left, on the same rule the device uses, so
   * neither path can produce a differently-shaped screen.
   */
  const byIdCandidate = new Map(candidates.map((c) => [c.idea.id, c]));
  const byIdMerged = new Map(merged.map((r) => [r.id, r]));
  let remaining = merged
    .map((r) => byIdCandidate.get(r.id))
    .filter((c): c is Candidate => Boolean(c));

  const ordered: Recommendation[] = [];
  while (remaining.length) {
    const page = diversify(remaining, count);
    if (!page.length) break;
    for (const c of page) ordered.push(byIdMerged.get(c.idea.id)!);
    const taken = new Set(page.map((c) => c.idea.id));
    remaining = remaining.filter((c) => !taken.has(c.idea.id));
  }

  return ordered;
}

/* ------------------------------ Who is asking ----------------------------- */

/**
 * The caller must be a signed-in person.
 *
 * Without this the endpoint is a Claude subscription with a public URL, and
 * the first person to find it decides how much of it we buy. Verified against
 * Supabase rather than trusted from the body, because a user id in a request
 * is a claim and a signed token is not.
 *
 * The publishable key is used, never a service-role key: this only needs to
 * know that a token is real, and a key that bypasses RLS has no business in a
 * function that reads no rows.
 */
async function callerId(req: VercelRequest): Promise<string | null> {
  const url = process.env.SUPABASE_URL;
  const publishable = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !publishable) return null;

  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.slice(7).trim() : '';
  if (!token) return null;

  try {
    const r = await fetch(`${url.replace(/\/$/, '')}/auth/v1/user`, {
      headers: { Authorization: `Bearer ${token}`, apikey: publishable },
    });
    if (!r.ok) return null;
    const user = (await r.json()) as { id?: string };
    return typeof user?.id === 'string' && user.id ? user.id : null;
  } catch {
    return null;
  }
}

/* -------------------------------- The route ------------------------------- */

export const config = { maxDuration: 60 };

/*
 * `candidates` is the usual size of the list handed to the model, not a hard
 * cap — `enoughToChooseFrom` widens it toward `maxCandidates` when twelve do
 * not carry enough different kinds of evening to fill five slots under the
 * diversity rule.
 */
const LIMITS = { candidates: 12, maxCandidates: 20, count: 5, ids: 40 };

/**
 * How many candidates the model is given.
 *
 * Twelve, usually. Sending twenty was sending eight ideas that would never be
 * shown — the screen pages five at a time and rarely gets past the second
 * page — and every one of them cost a line of output.
 *
 * It widens for one reason, and it is the diversity rule rather than a hunch:
 * no more than two results may share a category, so filling five slots needs
 * at least three different kinds of evening available. When the first twelve
 * do not carry three, the list grows until they do — because running out of
 * variety at slot four is a worse outcome than a slightly longer answer.
 */
export function enoughToChooseFrom(
  f: IdeaFilters,
  ctx: CoupleContext,
  count: number,
  pool?: BaseIdea[],
): Candidate[] {
  const narrow = rankCandidates(f, ctx, { limit: LIMITS.candidates, pool });
  const needed = Math.ceil(count / MAX_PER_CATEGORY);
  const kinds = new Set(narrow.map((c) => c.idea.category));
  if (kinds.size >= needed) return narrow;

  const wide = rankCandidates(f, ctx, { limit: LIMITS.maxCandidates, pool });
  /* Only worth the extra tokens if the wider list actually adds a kind. */
  return new Set(wide.map((c) => c.idea.category)).size > kinds.size ? wide : narrow;
}

const asArray = (v: unknown, max: number): string[] =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string').slice(0, max) : [];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const startedAt = Date.now();
  const key = process.env.MEMORY_AI_API_KEY || process.env.ANTHROPIC_API_KEY;

  /* Whether this is switched on, and whether the pieces it needs are here.
     Costs nothing and answers "why is it always falling back" without a
     deploy. Does not call the model. */
  if (req.method === 'GET') {
    res.status(200).json({
      configured: Boolean(key),
      auth: Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_PUBLISHABLE_KEY),
      corpus: DATE_IDEAS.length,
      model: MODEL,
    });
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method_not_allowed' });
    return;
  }

  const authStartedAt = Date.now();
  const user = await callerId(req);
  const authMs = Date.now() - authStartedAt;
  if (!user) {
    res.status(401).json({ error: 'sign_in_required' });
    return;
  }

  const body = (typeof req.body === 'string' ? JSON.parse(req.body) : req.body) as {
    filters?: Partial<IdeaFilters>;
    context?: Partial<CoupleContext>;
    count?: number;
  };

  const filters: IdeaFilters = {
    daypart: (body?.filters?.daypart as IdeaFilters['daypart']) ?? null,
    duration: typeof body?.filters?.duration === 'number' ? body.filters.duration : null,
    budget: typeof body?.filters?.budget === 'number' ? body.filters.budget : null,
    setting: (body?.filters?.setting as IdeaFilters['setting']) ?? null,
    vibe: (body?.filters?.vibe as IdeaFilters['vibe']) ?? null,
    energy: (body?.filters?.energy as IdeaFilters['energy']) ?? null,
  };

  const ctx: CoupleContext = {
    ...emptyContext(),
    wishes: asArray(body?.context?.wishes, 8) as CoupleContext['wishes'],
    vibes: asArray(body?.context?.vibes, 8) as CoupleContext['vibes'],
    proximity:
      (body?.context?.proximity as CoupleContext['proximity']) ?? 'together',
    liked: asArray(body?.context?.liked, LIMITS.ids),
    onList: asArray(body?.context?.onList, LIMITS.ids),
    done: asArray(body?.context?.done, LIMITS.ids),
    shown: asArray(body?.context?.shown, LIMITS.ids),
  };

  const count = Math.min(Math.max(Number(body?.count) || LIMITS.count, 1), 10);

  /* The server decides what is even a candidate. This is the line the model
     never gets to cross, and the reason the browser sends filters instead of
     ideas. */
  const candidates = enoughToChooseFrom(filters, ctx, count);

  if (!candidates.length) {
    res.status(200).json({ source: 'rules', recommendations: [], exhausted: true });
    return;
  }

  if (!key) {
    // Not an error anyone should see: the device ranks it and the flow goes on.
    res.status(503).json({ error: 'ai_not_configured' });
    return;
  }

  const modelStartedAt = Date.now();
  try {
    const { picks, outputTokens } = await rank(filters, ctx, candidates, count, key);
    const modelMs = Date.now() - modelStartedAt;
    const timings: Timings = {
      authMs,
      modelMs,
      totalMs: Date.now() - startedAt,
      outputTokens,
    };
    /*
     * One greppable line per request. "It felt slow" is not something anyone
     * can act on; "model=claude-sonnet-5 model=8420ms auth=180ms" says whether
     * to change the model, the timeout, or neither.
     */
    console.log(
      `[recommend-ideas] ok model=${MODEL} auth=${authMs}ms model_call=${modelMs}ms total=${timings.totalMs}ms candidates=${candidates.length} out_tokens=${outputTokens ?? '-'}`,
    );
    res.status(200).json({
      source: 'model',
      recommendations: settle(picks, candidates, count),
      exhausted: candidates.length <= count,
      timings,
    });
  } catch (e) {
    const modelMs = Date.now() - modelStartedAt;
    const upstream = describe(e);
    console.error(
      `[recommend-ideas] FAILED model=${MODEL} auth=${authMs}ms model_call=${modelMs}ms total=${Date.now() - startedAt}ms ${upstream.status ?? '-'} ${upstream.type ?? ''} ${upstream.message}`,
    );
    res.status(upstream.status === 429 ? 429 : 502).json({
      error: 'ai_unavailable',
      upstream,
      timings: { authMs, modelMs, totalMs: Date.now() - startedAt },
    });
  }
}

/** Safe to hand back to the browser: no key material, bounded length. */
function describe(e: unknown): { status?: number; type?: string; message: string } {
  const scrub = (s: string) => s.replace(/sk-ant-[A-Za-z0-9_-]+/g, 'sk-ant-***').slice(0, 300);

  if (e instanceof Anthropic.APIError) {
    const err = e.error as { error?: { type?: string; message?: string } } | undefined;
    return {
      status: e.status,
      type: err?.error?.type ?? e.name,
      message: scrub(err?.error?.message ?? e.message),
    };
  }
  if (e instanceof Error) return { type: e.name, message: scrub(e.message) };
  return { message: scrub(String(e)) };
}

/** Re-exported so the device fallback and the endpoint cannot drift apart. */
export { localRecommendations, rankCandidates };
export type { BaseIdea, Candidate, CoupleContext, Recommendation };
