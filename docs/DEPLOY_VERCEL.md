# Putting Couple777 somewhere your phones can reach it

`localhost` on a laptop means nothing to a phone, and the two-account test
needs two real devices. This deploys the app to a public address in about five
minutes, free.

Vercel is the path below. Netlify, Cloudflare Pages and GitHub Pages all work
the same way — build, upload `dist`, set the environment variables — but only
Vercel is written out step by step here.

---

## The one thing that catches everybody

**Vite bakes the environment variables into the bundle at build time, not at
run time.** They are not read when someone opens the page; they are compiled
in when Vercel builds it.

So if you add the variables *after* a deploy, that deploy still has nothing in
it. You have to **redeploy** for them to take. If the app comes up showing the
"not connected to a backend" setup screen, this is almost always why.

---

## 1. Push the branch (already done)

The code is on `claude/hosted-supabase-testing-y76s2j`. Vercel can deploy any
branch, so there is nothing to merge first.

## 2. Import the project

1. Go to **vercel.com** and sign in with GitHub.
2. **Add New… → Project**.
3. Find **ktbasic/Couple777** and click **Import**. If it is not listed, click
   **Adjust GitHub App Permissions** and give Vercel access to the repo.
4. On the configure screen:
   - **Framework Preset** — Vite. It should detect this by itself.
   - **Build Command**, **Output Directory**, **Install Command** — leave them
     alone. `vercel.json` in the repo already sets them.
   - **Root Directory** — leave as `./`.

## 3. Add the environment variables — before you deploy

Still on that screen, open **Environment Variables** and add two:

| Name | Value |
| --- | --- |
| `VITE_SUPABASE_URL` | `https://fqphoihumfmuxaqvkfkk.supabase.co` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | your `sb_publishable_...` key |

Both come from Supabase → **Project Settings** → **API Keys**.

Leave them applied to all three environments (Production, Preview,
Development) — that is the default.

Do **not** add `VITE_PUBLIC_APP_URL`. Without it the app reads its own address
from the browser, which is right on every Vercel URL including preview ones.
Setting it wrong is a good way to make invite links point at the wrong place.

Never add a `service_role` or `sb_secret_...` key. It bypasses every security
rule and this is a browser bundle.

## 4. Deploy

Click **Deploy** and wait. You get an address like
`https://couple777-xxxx.vercel.app`. That is what goes on both phones.

## 5. Tell Supabase about that address

This is the step people miss, and it breaks sign-in confirmation links and both
OAuth buttons.

Supabase → **Authentication** → **URL Configuration**:

- **Site URL** — your Vercel address, e.g. `https://couple777-xxxx.vercel.app`
- **Redirect URLs** — click Add URL and add:
  ```
  https://couple777-xxxx.vercel.app/**
  ```
  The `/**` matters. The app sends people back to deep links like
  `/join/K7-4M2P` after signing in, and Supabase refuses any redirect that is
  not on this list.

## 6. Turn off email confirmation while you test

Supabase → **Authentication** → **Sign In / Providers** → **Email** → uncheck
**Confirm email**, and Save.

With it on, each signup waits on an emailed link, and Supabase's built-in mail
is rate-limited hard enough that the second account often never arrives. Turn
it back on before real people use this.

## 7. Check it worked

Open the Vercel address in a browser. You should get the 777 animation and
"Love is great. Life is busy."

If you get a **setup screen saying it is not connected to a backend**, the
environment variables did not reach the build. Go to Vercel →
**Deployments** → the newest one → **⋯** → **Redeploy**, with *Use existing
build cache* **unchecked**.

To check the backend rather than the frontend, run this from the project
folder on your own machine (not from a Claude cloud session, which cannot
reach Supabase):

```bash
npm install
VITE_SUPABASE_URL=https://fqphoihumfmuxaqvkfkk.supabase.co \
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_... \
npm run test:hosted
```

It signs up two throwaway accounts and drives the entire flow — space, invite
code, join, plan, invitation, acceptance — then tells you, for anything that
fails, whether it is a bug in the code, a Supabase setting, or an auth step
still to do. It leaves two test users behind; delete them in
**Authentication → Users** when you are done.

---

## Deploying again later

Every push to the branch redeploys it automatically. Nothing else to do.

If you change an environment variable, you must redeploy by hand — see §7. The
variable is compiled in, so a change to it does nothing until the next build.

## Doing it without Vercel

`npm run build` produces `dist`. Drag that folder onto **netlify.com/drop** and
you have an address just as quickly. Two caveats:

- Set the same two environment variables in the host's settings and build
  there, or the bundle you dragged over has no credentials in it.
- The app uses real URLs (`/join/K7-4M2P`), so the host must send unknown
  paths to `index.html`. `vercel.json` does this for Vercel; on Netlify it is
  a `_redirects` file containing `/*  /index.html  200`. Without it, an invite
  link opens a 404 on your partner's phone.
