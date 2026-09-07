# Couple777

A relationship app built on the 777 rhythm: a date every 7 days, a small
adventure every 7 weeks, a bigger one every 7 months. React + TypeScript +
Vite, CSS Modules over a token layer, Supabase behind it.

---

## Frozen as of the two-user baseline (tag `baseline-two-user-v1`)

Backend and auth are **working against a real hosted Supabase project**, tested
by two people with two real accounts on two phones. Treat all of the following
as settled. Change it only when a specific UX change genuinely requires it, and
say so before you do.

- **`supabase/migrations/0001_init.sql`** — the schema and every RLS policy.
  Add a new migration file rather than editing this one; a project has already
  run it. `0002_memory_visibility.sql` is the first such addition: it is what
  makes a private memory private, and both files run in order.
- **The 777 cycle engine** (`src/lib/cycles.ts`). Three independent clocks,
  status derived rather than stored, and the overlap rule: a 7-month moment
  satisfies the 7-week and 7-day cycles it covered, a 7-week satisfies the
  7-day. Completing early never shortens the next stretch.
- **Relationship linking** — invite code, `peek_invite`, `join_couple_by_code`,
  and the trigger that stops either partner replacing the other.
- **Shared vs private.** Enforced in the database, not the UI: a surprise plan
  is withheld from the partner until its date, and each person's private notes
  on a shared memory are their own rows. If a redesign moves a screen, the
  policies still decide what it may show.
- **The invite loop** — `sendInvite` writes a real row addressed to the other
  account, and only the recipient can answer it.

Users choose *what* to do. The rhythm decides *when*. Nothing in the UI lets
someone reclassify an activity into a different cycle.

## Where things are

| | |
| --- | --- |
| Cycle engine | `src/lib/cycles.ts` |
| Supabase client, repositories, row↔domain mapping | `src/lib/db/`, `src/lib/supabase.ts` |
| Session | `src/context/auth.tsx` |
| App state — reducer, hydrated from Supabase, writes through | `src/context/store.tsx` |
| Design tokens | `src/styles/tokens.css` |
| Logo and app icon | `src/components/ui/Logo777.tsx` |
| Date-idea illustrations | `src/components/ui/IdeaIllustration.tsx`, brief in `docs/ILLUSTRATIONS.md` |

`AppState` is the read model every screen speaks. Supabase is mapped *into* it
rather than replacing it, so screens keep using `useStore()`. A `Person.id` is
the Supabase user id. Notes, the daily question, room sessions and saved ideas
are still browser-local, keyed per account.

## Checks

```
npm run typecheck
npm run typecheck:api   # the serverless functions, which the app config skips
npm run build
npm run test:rls        # 46 checks, real Postgres via PGlite — no project needed
npm run test:memory     # how a written memory is read when no model is configured
npm run test:ai         # the rules the memory endpoint holds whatever the model says
```

```
npm run test:ideas      # the promises the date recommender keeps whatever the model says
npm run coverage        # where the idea corpus is thin, per filter combination
```

`npm run test:rls` is the one that matters most: each check is a privacy
promise the app makes. Run it after touching anything in `supabase/`.

`npm run test:memory` is the second: its corpus is sentences people actually
write, and a failure there means a hard evening would be met with a sparkle.

`supabase/tests/local-server.mjs` is a frozen local stand-in for Supabase. It
is test-only, nothing in `src/` imports it, and it is not being developed
further. Its differences from real PostgREST are its own problem — never change
app logic to satisfy it.

## Conventions

- CSS Modules, tokens from `tokens.css`, no literal colours in components.
- Single-column grids use `minmax(0, 1fr)`; plain `1fr` defaults to
  `min-width: auto` and lets long content push the page sideways on a phone.
- Comments explain *why*, especially where the obvious approach was wrong.
- No dark mode. Light only, soft pinks and warm neutrals.

## This sandbox cannot reach Supabase

The egress gateway answers **403 to CONNECT** for `*.supabase.co`, so no
session here can talk to a real project — credentials will not change that.
Verify what can be verified locally (typecheck, build, the RLS suite), and ask
the user to run `docs/TWO_PHONE_TEST.md` and report where it breaks.

## A relative import in `api/` or `shared/` needs its `.js`

`import { DATE_IDEAS } from '../shared/dateIdeas'` deploys perfectly and then
crashes on every request with `ERR_MODULE_NOT_FOUND`.

Vercel's Node builder compiles each traced `.ts` to `.js` at the same relative
path, and rewrites an import specifier **only when it already ends in `.ts` or
`.tsx`**. An extensionless one is passed through untouched, and `package.json`
says `"type": "module"`, so Node resolves it strictly with no extension
guessing: it looks for a file called exactly `dateIdeas` and gives up.

So write `'../shared/dateIdeas.js'` — the `.ts` file is what TypeScript,
esbuild and Vite all resolve, and `.js` is what exists at runtime.

Nothing local catches this: tsc resolves it, esbuild bundles it, Vite serves
it, and every test passes, because none of them are Node resolving loose ESM
files on a disk. `npm run test:ideas` checks the specifiers directly instead.

## vercel.json takes no comments

It is schema-validated on every deployment, and an unknown key — including a
`"//"` note — fails the build outright. A failed build is not obvious from the
app: Vercel keeps serving the last deployment that worked, so the symptom is
that changes silently do not appear. Anything worth explaining about it goes
here instead.

Two things in it matter. `outputDirectory` is the Vite build; the `rewrites`
entry sends everything *except* `/api/...` to index.html, so the serverless
functions stay reachable. Rewrites are applied after the filesystem check, so
a real function already wins — but the exclusion says the intent out loud.

## Recommending a date

The Dates tab is ranked by Claude, in three layers, and only the third is the
model's:

- **eligible** — hard facts. Over budget, or needs a room the couple do not
  share. Long distance makes `in_person` ideas ineligible; living together
  makes `remote` ones ineligible. Not near misses, simply not on the list.
- **tier** — how many of the three taste rows (time, setting, vibe) an idea
  misses. Slots fill in tier order and a tier 1 is never promoted above a
  tier 0, enforced in code after the model answers. Near misses say what they
  give up, on the card: "Close match · Evening instead of Morning".
- **score** — ordering *within* a tier, where history lives. Hearting
  something means more of its kind and not that card again; already-shown is
  excluded for that run only. Freshness never crosses tiers.

`shared/` exists for this: `dateIdeas.ts` and `ideaRank.ts` are imported by
both the browser and `api/recommend-ideas.ts`, so the server decides what may
be recommended instead of trusting a list the browser sent. Nothing in
`shared/` may import React, the `@/` alias, or anything browser-only.

The endpoint requires a signed-in Supabase user before it calls Anthropic —
it spends money, and an unauthenticated one is a bill with a public URL. It
uses `SUPABASE_PUBLISHABLE_KEY`, never the service-role key. Persistent per-user quotas are
deliberately not built yet; they belong before public beta.

The model's job is deliberately small: order the candidates and write one line
of at most 100 characters for each. Title, description, tags and pictures come
from the corpus, which the app has always owned — having the model rewrite them
was roughly three quarters of the output tokens on every request and bought
nothing. Twelve candidates are sent, not twenty; it widens toward twenty only
when twelve do not carry the three different categories that filling five
slots needs under the diversity rule.

It runs on `claude-sonnet-5` (`RECOMMEND_AI_MODEL`), not the memory reader's
model. Everything that needs judgement is already decided in code by the time
the model is called, so the job is ordering twenty vetted ideas and writing a
sentence for each — and on a screen someone is waiting at, answering sooner is
worth more than answering deeper. Haiku is not a drop-in: it rejects
`output_config.effort`, which this request sends.

Three timeouts, in this order and never any other: the phone gives up at 30s,
the SDK at 45s, the platform at 60s. The phone must be first so it can fall
back; the request must outlive it so it still finishes and still logs how long
it took; the platform must never be the one to kill it, because that looks
exactly like the model failing and explains nothing. `npm run test:ideas`
checks the ladder. Every answer logs one greppable line —
`[recommend-ideas] ok model=… auth=…ms model_call=…ms total=…ms` — and returns
the same numbers, which `?debug=1` shows.

One request per ask returns the whole ranked list and the screen pages through
it. Model output is **not** deterministic and nothing claims it is —
eligibility, tiering and the device fallback are; the model's ordering is
stable within one response, which is why paging never re-asks.

Date ideas are **drawn, not photographed**, and each has **its own** scene.
Every idea carries an `illustrationId` (its id without the `i-` prefix) and
`IdeaIllustration` resolves `src/assets/idea-illustrations/<id>.webp` through
`import.meta.glob`, so the set of drawn assets is known at build time: an idea
whose illustration does not exist yet falls back to `IdeaArt` — the category
drawing — instead of firing a 404 per card. Drop a file in, rebuild, done.

`category` is only the fallback. It used to choose the picture, and the result
was all eight outdoors ideas showing the same hills: a symbol for a *kind* of
evening where the card wants a picture of the evening. `docs/ILLUSTRATIONS.md`
is the brief for all 65, and `npm run test:ideas` reports how many are drawn.

Nearby and Big Trips keep `picsum` placeholders on purpose: those are real
places, and a real place wants a picture of itself.

Add ideas by running `npm run coverage` first and writing against what it
says. Both couples-together and couples-apart currently sit at zero uncovered
combinations; keep them there.

## Reading a memory

The capture flow asks one open question and then two or three short ones,
chosen by what the note already said. What reads it is `api/memory-read.ts`, a
serverless function — the API key stays on the server, set as
`MEMORY_AI_API_KEY` where the function runs, never with a `VITE_` prefix.
`src/lib/memoryAi.ts` calls it and builds the same object on the phone when
there is no key, no endpoint or no signal.

Two rules do not depend on the model and are enforced in the prompt, in the
endpoint and in the client: a difficult memory defaults to private, and a
difficult memory is never offered a date idea. Do not move either of them into
one layer only.

## Next: design and UX, not backend

Onboarding copy, Home hierarchy, how an upcoming 777 moment presents,
plan/invite UX, Explore, the Us tab, notifications, memories, motion, polish.
Avoid unrelated features.
