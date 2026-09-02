# Couple777 — product & design definition

The 777 Relationship Rule, made into a ritual:

- **Every 7 days** — a date, or an intentional moment together.
- **Every 7 weeks** — a getaway, day trip, or mini adventure nearby.
- **Every 7 months** — a bigger trip, somewhere new.

This is not a calendar. It is a rhythm two people keep together, and a record of
what they made while keeping it.

---

## 1. Information architecture

Five tabs. Every other screen is a push off one of them.

```
Home         /                      777 countdowns · today's prompt · inspiration · recent memories
Explore      /explore               Dates · Nearby · Big trips  (?tier=day|week|month)
Memories     /memories              Timeline, grouped by month
Talk         /talk                  Daily question · Relationship Room · Notes
Us           /us                    Relationship profile
```

Pushed flows (no tab bar — they hold your attention until finished):

```
/plan/new/:tier          Plan a date / mini adventure / big adventure
/plan/:planId            Plan detail (+ trip planning space for big adventures)
/plan/:planId/edit
/memories/new?plan=      Capture a memory (pre-filled from a completed plan)
/memories/:memoryId      Memory detail
/talk/daily              Today's prompt, answer + reveal
/talk/room               Topic list
/talk/room/:topicId      Guided conversation
/talk/notes              Inbox · Sent · Private
/talk/notes/new          Compose, send now or later
/us/settings             Settings & privacy
/onboarding              5 steps, before anything else
```

## 2. The core loop

Every feature exists to move a couple one step around this loop. The loop is
wired as literal navigation — no screen is a dead end.

```
PROMPT      Home / Talk        daily question lands
  ↓
CONNECT     /talk/daily        both answer, both reveal
  ↓
PLAN        /explore → /plan/new/:tier    "we should do this Saturday"
  ↓
EXPERIENCE  /plan/:id          the plan sits on Home, counting down
  ↓
CAPTURE     "We did this" → /memories/new?plan=   photos + a line each
  ↓
LOOK FORWARD  countdown resets, next ritual becomes the hero card
```

Concretely: finishing a Room conversation offers "Put something in the diary".
Revealing a daily answer offers "Turn this into a plan". Completing a plan
navigates straight into memory capture. An uncaptured completed plan raises a
nudge on Home. Saving a destination your partner already saved triggers a reveal
that leads into trip planning.

## 3. Key user journeys

**First run.** Welcome → the 777 rule explained in three cards → names, together-since,
home city → invite code → what stays private → Home. Five steps, one blocking field.

**Sunday evening, nothing planned.** Home shows the 7-day card as hero, overdue.
`Give me ideas` → Explore with filters (time, budget, vibe, setting, energy, weather)
→ `Surprise me` or pick → `Add to our next date` → pre-filled plan → Home.

**A surprise.** Same path, `Surprise them`. The partner sees a countdown and
"A surprise, from them" — never the title, place, or notes.

**Tonight's question.** Notification → answer privately → sealed until both have
written. On the second answer both unlock at once.

**A hard conversation.** Talk → Relationship Room → topic → answer privately →
hand the phone over → they answer → both reveal → talk → one shared commitment.

**A big trip.** Explore → Big trips → save destinations secretly. When both have
saved the same one: "You both want to go to Iceland ❤️" → start planning →
wishlist, stays, notes, budget, countdown.

## 4. Data model

`src/lib/types.ts`

| Type | Purpose |
|---|---|
| `Couple`, `Person` | Exactly two people, one shared space, `currentPersonId` for the prototype's device switch |
| `Plan` | One shape for all three tiers (`tier: 'day' \| 'week' \| 'month'`). Carries `surprise`, `status`, `memoryId`, and an optional `trip` |
| `Trip` | The big-adventure planning space: wishlist, stays, notes, budget |
| `DateIdea`, `AdventureIdea` | Generator corpora, each with a `why` — the emotional reason it might land |
| `Destination` | Wishlist entry with `savedBy: ID[]`; two entries is a match, `matchSeen` gates the reveal |
| `DailyPrompt`, `DailyEntry` | One prompt per day (deterministic from the date), answers keyed by person |
| `Memory` | Photos, mood, a `sharedNote`, per-partner `notes`, and per-partner `privateNotes` |
| `Note` | Kind, body, optional `deliverAt` for send-later; `kind: 'private'` never leaves its author |
| `RoomTopic`, `RoomSession` | Steps are `private` → `reveal` → `commitment`; sessions store answers and the commitment |

**The privacy split is in the model, not just the UI:**

| Shared | Yours only | Hidden until ready | Sealed |
|---|---|---|---|
| Plans, trips, memories, finished conversations | `privateNotes`, `Note.kind === 'private'` | `Plan.surprise`, unmatched `Destination.savedBy` | Daily and Room answers until both are in |

Rendering enforces it: `RitualCard` hides a partner's surprise, `PlanDetail`
refuses to show it, `matches()` excludes unrevealed matches so a mutual save is
never named before its reveal.

## 5. Design system

`src/styles/tokens.css` — everything else consumes tokens.

**Colour.** Soft blush surfaces (`#FFFCFC` page, white cards), warm plum-charcoal
ink (`#2C2430`), and one rose accent (`#E4598A`). The signature is the pink →
peach gradient (`#EE5D91 → #F79C7B`) carried by every primary action — it is the
one loud thing in the interface, so nothing else competes with it. Each ritual
tier owns a hue from a warm, soft triad so the rhythm stays legible at a glance:
rose for 7 days, coral `#D2705A` for 7 weeks, mauve `#9A72C0` for 7 months.
Light only — there is no dark theme.

Every brand tone exists twice: `--c-day` and friends paint dots, rings and
fills, while `--c-day-ink` carries the small uppercase labels. The soft tones
sit around 3.5:1 on white, which is fine for a 3px ring and not fine for 11px
type, so text always takes the `-ink` variant, all of which clear 4.5:1.

**Type.** San Francisco on Apple platforms (`-apple-system` → SF Pro Display /
SF Pro Text), Inter everywhere else, with real fallback stacks. No serif and no
italics in the display type — sans carries emphasis through weight (700 for
display, 600 for titles) and tighter tracking instead.

**Space & shape.** A 4px scale, radii 10→36, and three diffuse pink-tinted
shadows plus a coloured glow under the gradient CTA. Generous padding — the app
should feel unhurried.

Inputs use a notched floating label sitting in a gap in the field's own border,
which is the detail that most defines the reference screens.

**Motion.** `cubic-bezier(.32,.72,0,1)`, 160/260/420ms. Entrance rises with
per-item stagger. Everything collapses under `prefers-reduced-motion`.

**Primitives** (`src/components/ui/`): Button, Card, Chip, Avatar, Photo,
Pill, Field, Segmented, Sheet, ProgressRing, Toast, EmptyState, SectionHeader,
FloatingAction, HeartToggle.
**Layout** (`src/components/layout/`): AppShell (phone frame on desktop), TabBar,
Screen / ScreenHeader / BackBar / Section.
**Feature components** (`src/features/`): RitualCard, DailyCard, MemoryCard,
IdeaCard, AdventureCard, DestinationCard, NoteCard.

**Voice.** "Your next date", not "Next event". "Plan something together", not
"Create event". "Another memory made ✓", not "Completed". "25 days of checking
in with each other", not "🔥 25 day streak".

## 6. MVP scope

**In (all built):** onboarding and partner connection · Home dashboard ·
7/7/7 planning for all three tiers · daily prompt with double-blind reveal ·
date idea generator with six filters and Surprise Me · mini adventure generator ·
big adventure wishlist with secret matching · trip planning space · memory
timeline, detail, and capture · Relationship Room (12 topics) · notes with
send-later and private reflections · relationship profile · settings and
notification preference.

**Deliberately out:** real accounts and sync, push delivery, photo upload
(a stand-in camera roll is used), live travel/maps/booking APIs, any form of
therapy positioning.

## 7. Product decisions worth naming

- **Emphasis follows urgency.** All three tiers always render in 7/7/7 order,
  but the closest gets the hero treatment and the other two stay compact.
- **The streak is a plant, not a fire.** Counted only on days *both* partners
  answered, and phrased as a fact rather than a score.
- **Reveals are symmetric.** Nobody ever reads first — daily answers and Room
  answers both unlock only when the second person submits.
- **Ideas explain themselves.** Every generated idea carries a `why`, because
  a reason is what turns a list into a suggestion.
- **Filters are soft.** An over-constrained search returns the closest matches
  rather than an empty screen.
- **The Room is facilitation, not therapy.** Stated plainly on the Talk screen.
