# Testing without a Supabase project

Two suites, neither of which needs an account anywhere.

## `npm run test:rls`

Runs `supabase/migrations/0001_init.sql` against real Postgres — PGlite is
Postgres compiled to WebAssembly — with a faithful stand-in for the pieces
Supabase supplies: an `auth` schema, an `auth.uid()` that reads the request's
JWT claim, and the `anon` / `authenticated` roles.

Each check is one promise the app makes to its users, stated as a test:

- a stranger cannot read your profile
- the invited partner cannot see the space before joining
- a third person cannot join a full space
- a member cannot swap the other partner out
- the partner cannot see a future surprise at all
- the sender cannot accept their own invitation
- your private words on a shared memory are yours

Writing them caught a real hole: the `couples` update policy let either
partner overwrite `partner_1_user_id` with a stranger, because a `WITH CHECK`
only sees the new row — "the caller is one of the two people" was still
satisfied, by the attacker. Comparing against `OLD` needs a trigger.

## `npm run dev:local`

A local stand-in for the parts of Supabase the app talks to, so the real client
code can be driven end to end. PGlite behind a small HTTP server speaking
enough PostgREST and GoTrue for `@supabase/supabase-js`. Every request sets
`request.jwt.claims` and runs as `authenticated`, so the actual RLS policies
decide what each user sees.

```
npm run dev:local     # stand-in on :54321
npm run dev           # the app
```

with `.env.local`:

```
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=local-anon-key
```

**It is not a Supabase emulator.** No email confirmation, no OAuth, no
Realtime, no refresh-token rotation. It exists to prove the app's own wiring is
right before it meets the real thing — and the missing Realtime is useful in
itself: the app has to stay correct on plain navigation, which it does.

Three real bugs came out of running it, all of which would have hit a user on
the first day:

- Locally-minted ids (`pl-k3f9x2a`) did not survive the round trip. Postgres
  minted its own, so the moment the reload landed, the id in the address bar
  belonged to a plan that no longer existed. Ids are UUIDs now, minted by the
  client and inserted as the primary key.
- `planToRow` never set `cycle_type`, so every plan insert was rejected.
- Between "we know who is signed in" and "we have their couple", status read
  `no-couple` for a tick — long enough to redirect a deep link or a refresh to
  couple setup, which then bounced it home. Anyone opening a link to a plan, or
  just reloading, lost their place.
