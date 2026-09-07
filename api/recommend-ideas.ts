import type { VercelRequest, VercelResponse } from '@vercel/node';
import Anthropic from '@anthropic-ai/sdk';
import { DATE_IDEAS } from '../shared/dateIdeas';
import {
  diversify,
  emptyContext,
  localRecommendations,
  rankCandidates,
  type Candidate,
  type CoupleContext,
  type Recommendation,
} from '../shared/ideaRank';
import type { BaseIdea, IdeaFilters } from '../shared/ideaTypes';

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
        required: ['id', 'title', 'description', 'tags', 'reason'],
        properties: {
          id: { type: 'string', description: 'Must be one of the ids given. Never anything else.' },
          title: {
            type: 'string',
            description:
              "The idea's own title, or a warmer wording of the same activity. Never a different activity.",
          },
          description: {
            type: 'string',
            description: 'One or two short sentences describing what they would actually do.',
          },
          tags: {
            type: 'array',
            items: { type: 'string' },
            maxItems: 3,
            description: 'Two or three short words. Where, what kind, what it costs.',
          },
          reason: {
            type: 'string',
            description:
              'One sentence on why this suits this couple, grounded only in what you were told.',
          },
        },
      },
    },
  },
} as const;

interface Pick {
  id: string;
  title: string;
  description: string;
  tags: string[];
  reason: string;
}

/* -------------------------------- The brief ------------------------------- */

const SYSTEM = `You choose which date ideas to show a couple, from a list you are given.

You are ranking and wording. You are not inventing. Every id you return must be
one of the ids in the list; an id that is not in the list is a failure, not a
suggestion, and it will be discarded.

WHAT THE TIERS MEAN

Each candidate has a tier and, when the tier is not 0, what it misses.

- tier 0 matches everything the couple chose.
- tier 1 misses one of their choices, tier 2 misses two.

Tier 0 always comes before tier 1, and tier 1 before tier 2. Do not promote a
near miss over an exact match because you find it more interesting — someone
chose those filters and a worse match is not a better idea. Your judgement is
for ordering *within* a tier, and for choosing which near misses are worth
showing when there are not enough exact matches.

When you include a near miss, say what it gives up, plainly, in its reason.
"A morning option was thin, so this is an evening one" is honest. Pretending it
matches is not.

WHAT MAKES A GOOD FIVE

- Variety. Five suggestions that are all cooking is a worse answer than four
  plus something different, even if the fifth scored well. Vary what they would
  be *doing*, not just how it feels.
- Fit. Use what you are told about them — what they said they want more of, the
  kinds of thing they have saved or done before. Prefer more of what they like,
  never the exact thing they already have on their list.
- Honesty. Never say "you loved this last time" unless you were told they did.
  Never invent a shared history. If you have little to go on, write a reason
  about the idea rather than about them.

WORDING

- title: their idea's title, or a warmer wording of the same activity. You may
  make "Cook one dish from scratch" sound like an evening. You may not turn it
  into a restaurant.
- description: one or two short sentences, concrete, about what they would do.
- tags: two or three short words — where it happens, what kind of thing it is,
  what it costs.
- reason: one sentence, specific, no flattery, no exclamation marks.

TONE

Warm, plain and unhurried. Not a marketer. No pressure about romance, no
assumptions about who lives with whom, who is married, or who has children.
Two people trying to spend an evening together well.

Return every candidate you were given, in your preferred order, so the app can
page through them. Best first.`;

/* --------------------------------- Calling -------------------------------- */

const MODEL = process.env.MEMORY_AI_MODEL || 'claude-opus-5';

/** Thinking spends from the same budget, so a tight ceiling returns nothing. */
const MAX_TOKENS = 6000;

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

async function rank(
  f: IdeaFilters,
  ctx: CoupleContext,
  candidates: Candidate[],
  count: number,
  apiKey: string,
): Promise<Pick[]> {
  const client = new Anthropic({ apiKey, timeout: 40_000, maxRetries: 1 });

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
  return parsePicks(text, how);
}

/* -------------------------------- Guarding -------------------------------- */

const CAP = { title: 80, description: 300, reason: 220, tag: 24 };

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
    kept.push({ pick: { id: candidate.idea.id, title: '', description: '', tags: [], reason: '' }, candidate });
  }

  // Tier order is not the model's to decide.
  kept.sort((a, b) => a.candidate.tier - b.candidate.tier);

  const merged: Recommendation[] = kept.map(({ pick, candidate }) => ({
    id: candidate.idea.id,
    title: trim(pick.title, CAP.title) || candidate.idea.title,
    description: trim(pick.description, CAP.description) || candidate.idea.description,
    tags: Array.isArray(pick.tags)
      ? pick.tags.map((t) => trim(t, CAP.tag)).filter(Boolean).slice(0, 3)
      : [],
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

const LIMITS = { candidates: 20, count: 5, ids: 40 };

const asArray = (v: unknown, max: number): string[] =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string').slice(0, max) : [];

export default async function handler(req: VercelRequest, res: VercelResponse) {
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

  const user = await callerId(req);
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
  const candidates = rankCandidates(filters, ctx, { limit: LIMITS.candidates });

  if (!candidates.length) {
    res.status(200).json({ source: 'rules', recommendations: [], exhausted: true });
    return;
  }

  if (!key) {
    // Not an error anyone should see: the device ranks it and the flow goes on.
    res.status(503).json({ error: 'ai_not_configured' });
    return;
  }

  try {
    const picks = await rank(filters, ctx, candidates, count, key);
    res.status(200).json({
      source: 'model',
      recommendations: settle(picks, candidates, count),
      exhausted: candidates.length <= count,
    });
  } catch (e) {
    const upstream = describe(e);
    console.error(
      `[recommend-ideas] FAILED model=${MODEL} ${upstream.status ?? '-'} ${upstream.type ?? ''} ${upstream.message}`,
    );
    res.status(upstream.status === 429 ? 429 : 502).json({ error: 'ai_unavailable', upstream });
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
