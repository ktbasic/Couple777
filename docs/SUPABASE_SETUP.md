# Setting up Couple777's backend

Written for someone who is not a developer. Roughly 15 minutes, all of it
clicking and copying. Nothing here costs money — Supabase's free tier is more
than enough for two people testing.

---

## 1. Make a Supabase project

1. Go to **supabase.com** and sign up (GitHub or email, either is fine).
2. Click **New project**.
3. Give it a name — `couple777` — and a database password. **Write the
   password down somewhere.** You will not need it for the app, but you will
   need it if you ever want to get at the database directly.
4. Pick the region closest to you. This is where the data lives.
5. Click **Create new project** and wait a couple of minutes.

## 2. Create the tables

1. In the left sidebar, click **SQL Editor**.
2. Click **New query**.
3. Open `supabase/migrations/0001_init.sql` from this repository, copy the
   **whole file**, and paste it in.
4. Click **Run**.

You should see *Success. No rows returned*. That is what success looks like
here — it created tables rather than fetching anything.

To check it properly, open a new query, paste in **`supabase/verify.sql`** and
run it. You want a single row reading `ok | ok | ok | ok`. Anything else names
what is missing, and re-running the migration is safe.

You can also just look: click **Table Editor** in the sidebar. You should see `profiles`,
`couples`, `cycles`, `plans`, `plan_invites`, `memories`,
`memory_private_notes` and `notifications`.

Every one of them should show a green **RLS enabled** badge. If any does not,
the SQL did not run completely — run it again.

## 3. Copy your two keys

1. Sidebar → **Project Settings** → **API**.
2. Copy the **Project URL**. It looks like
   `https://abcdefghijklm.supabase.co`.
3. Copy the **anon public** key. It is a long string starting `eyJ...`.

> **The `service_role` key on that same page must never go in the app.** It
> bypasses every security rule. The `anon` key is designed to be public — the
> rules you installed in step 2, not the key, are what keep one couple's data
> away from another's.

## 4. Tell the app

In the project folder, copy `.env.example` to a new file called `.env.local`,
and fill in the two values:

```
VITE_SUPABASE_URL=https://abcdefghijklm.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
```

If you deploy the app somewhere (see §7), add the same two as environment
variables there, plus:

```
VITE_PUBLIC_APP_URL=https://your-app-address
```

That last one is what makes invite links point at the right place. Without it
the app guesses from the browser's address bar, which is right locally and
usually right in production.

## 5. Turn off email confirmation while you test

By default Supabase emails a confirmation link before an account works, and
its built-in mail is heavily rate-limited — you will hit the limit while
testing two accounts.

Sidebar → **Authentication** → **Sign In / Providers** → **Email**, and turn
**Confirm email** off. Turn it back on before real people use this.

## 6. Google sign-in

You need a Google Cloud project. It is free.

**In Supabase first**, to get the address Google needs:

- Sidebar → **Authentication** → **Sign In / Providers** → **Google**.
- Copy the **Callback URL** shown there. It looks like
  `https://abcdefghijklm.supabase.co/auth/v1/callback`.

**Then in Google:**

1. Go to **console.cloud.google.com** and create a project.
2. **APIs & Services** → **OAuth consent screen**. Choose **External**, fill in
   an app name and your own email, and save. While it is in "Testing" mode,
   add both of your Google accounts under **Test users** — otherwise Google
   will refuse to sign you in.
3. **APIs & Services** → **Credentials** → **Create credentials** → **OAuth
   client ID** → **Web application**.
4. Under **Authorised redirect URIs**, paste the Supabase callback URL from
   above. Add nothing else.
5. Create it. Google shows you a **Client ID** and a **Client secret**.

**Back in Supabase:** paste both into the Google provider panel, toggle it on,
and save.

If you skip this, "Continue with Google" will say the method is not switched
on. Email sign-up works regardless.

## 7. Apple sign-in — what is still needed

The button is built and wired. It cannot be finished from code alone, because
Apple requires things only an account holder can do:

1. **An Apple Developer Program membership** — $99/year. There is no free path
   for Sign in with Apple on the web.
2. **A Services ID** in the Apple Developer portal, configured for "Sign in
   with Apple", with your Supabase callback URL as the return URL.
3. **A key** (.p8 file) downloaded from Apple, plus your Team ID and the Key
   ID.
4. Those pasted into Supabase → Authentication → Providers → Apple.

Until then the button is honest: tapping it says the method is not switched
on, rather than pretending to sign you in.

## 8. Realtime (optional)

Sidebar → **Database** → **Replication** → enable `supabase_realtime` for
`plans`, `plan_invites`, `couples` and `notifications`. The migration attempts
this already; the UI is where you confirm it.

This only makes a partner's *yes* appear without a refresh. The app is correct
without it — every screen re-reads on navigation — so if this is fiddly, skip
it.

---

## The environment variables, in one place

| Variable | Where it comes from | Needed? |
| --- | --- | --- |
| `VITE_SUPABASE_URL` | Project Settings → API → Project URL | Yes |
| `VITE_SUPABASE_ANON_KEY` | Project Settings → API → anon public | Yes |
| `VITE_PUBLIC_APP_URL` | The address you deploy to | Only when deployed |

Never add `SUPABASE_SERVICE_ROLE_KEY` to this app.

## If something is wrong

**"Couple777 is not connected yet"** — the app cannot see the two variables.
Check `.env.local` sits in the project root, and restart the dev server; Vite
only reads it at startup.

**Sign-up says "Check your email" and nothing arrives** — either confirmation
is still on (§5), or you have hit Supabase's built-in mail limit. Turn
confirmation off for testing.

**"That code does not match a Couple777 space"** — codes are case-insensitive
but the dash matters: `K7-4M2P`, not `K74M2P`.

**A screen is empty where you expect data** — almost always RLS. Open the SQL
Editor and run:

```sql
select relname, relrowsecurity from pg_class
where relnamespace = 'public'::regnamespace and relkind = 'r';
```

Every row should say `true`. If a table is missing entirely, re-run the
migration.
