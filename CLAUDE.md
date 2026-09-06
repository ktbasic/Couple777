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
