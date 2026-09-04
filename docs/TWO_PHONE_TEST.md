# Testing Couple777 on two phones

You are Katy on one phone. Get a second phone, or use a friend's — Marian needs
a genuinely separate account, so a second browser tab on the same phone will
not do (it shares the same sign-in).

Before you start, the app needs to be reachable from both phones. Locally it is
not: `localhost` on your laptop means nothing to a phone. See "Getting it onto
a phone" at the bottom.

---

## Phone 1 — Katy

| # | Do this | Expect |
| --- | --- | --- |
| 1 | Open the app | The 777 animation, then "Love is great. Life is busy." |
| 2 | Tap through: Start → the questions → **Let's try 777** | "Save your Couple777" |
| 3 | **Continue with email**, put in a name, an email and a password | "Check your email" (or straight in, if you turned confirmation off) |
| 4 | Come back to the app | "How do you want to start?" |
| 5 | **Create our space**. Partner's name **Marian**, a date, a city | "Bring Marian in ❤️" with a code like **K7-4M2P** |
| 6 | **Share invite** | Your phone's share sheet — WhatsApp, Messages, whatever you have |
| 7 | Send it to phone 2 | — |

Write the code down. You will want it if the link goes astray.

## Phone 2 — Marian

| # | Do this | Expect |
| --- | --- | --- |
| 8 | Open the link Katy sent | "**Katy** invited you to Couple777 ❤️" — her name, before signing in |
| 9 | **Join Katy** → **Continue with email** → a **different** email | His own account |
| 10 | Open the link again if it does not return by itself | **Join Katy** |
| 11 | Tap it | A short setup: his name, his avatar, one question. Not the whole onboarding, and nothing Katy already answered |
| 12 | **Continue**, then **Open our space** | His own Home, showing Katy |

## Back on Phone 1 — Katy

| # | Do this | Expect |
| --- | --- | --- |
| 13 | Pull to refresh, or reopen the app | Marian is there — his name and avatar in the header |

## The loop — the thing this is all for

| # | Phone | Do this | Expect |
| --- | --- | --- | --- |
| 14 | Katy | **Explore** → pick something → **Make this the plan** → **Save plan** | The plan, with **Ask Marian 💌** |
| 15 | Katy | **Ask Marian 💌**, add a message, then **Ask Marian** | "On its way to Marian" |
| 16 | Marian | Open the app | **Katy invited you 💌** at the top of Home, with the plan |
| 17 | Marian | Tap the bell | The invite is in there too |
| 18 | Marian | **Sounds good ❤️** | The invitation goes; the plan is his too now |
| 19 | Katy | Reopen the app | **YOU'RE ON** — the plan is confirmed |
| 20 | Katy | Tap the bell | "Marian said yes" |

## Then check the promises hold

| # | Phone | Do this | Expect |
| --- | --- | --- | --- |
| 21 | Katy | Plan something and mark it a **surprise** | Marian cannot see it at all until its day — not the title, not that it exists |
| 22 | Either | Add a **private** line to a memory | The other person sees the shared line, never the private one |
| 23 | Both | **Us → Settings → Sign out**, then sign back in | Everything still there: the space, the plans, the memories |

That last one matters most. It is the difference between an account and a
browser tab.

---

## What will not work yet, and why

- **Continue with Apple** — needs a paid Apple Developer membership and a key
  only you can generate. See `docs/SUPABASE_SETUP.md` §7. It says so rather
  than pretending.
- **Continue with Google** — works once you have done §6 of that file.
- **Push notifications** — deliberately not built. The bell inside the app is
  the notification centre for now.
- **A partner's yes appearing without a refresh** — only if you enabled
  Realtime (§8). Without it, reopening or navigating shows the same thing, a
  moment later.

## Getting it onto a phone

The single-file preview cannot do this one. It is served from a sandbox that
blocks the app from reaching Supabase, so accounts cannot work there.

Deploy it. **`docs/DEPLOY_VERCEL.md`** is the five-minute version, and covers
the two things that catch people out: the environment variables have to exist
*before* the build, and the Vercel address has to be added to Supabase's
redirect list or sign-in bounces.

Then open that address on both phones and, on iPhone, use **Share → Add to
Home Screen** — the app is a PWA, so it opens without Safari's chrome, with its
own icon and the 777 splash.

## If two people end up in different spaces

One code, one space, two seats. If Marian accidentally tapped "Create our
space" instead of using the link, he now has his own and the code will refuse
him — a person can only be in one space. Delete his row to start over:
Supabase → Table Editor → `couples` → find the one where `partner_1_user_id`
is his → delete it. Then send him the link again.
