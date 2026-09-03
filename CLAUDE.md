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
  run it.
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
npx tsc --noEmit
npm run build
npm run test:rls     # 42 checks, real Postgres via PGlite — no project needed
```

`npm run test:rls` is the one that matters most: each check is a privacy
promise the app makes. Run it after touching anything in `supabase/`.

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

## Next: design and UX, not backend

Onboarding copy, Home hierarchy, how an upcoming 777 moment presents,
plan/invite UX, Explore, the Us tab, notifications, memories, motion, polish.
Avoid unrelated features.
