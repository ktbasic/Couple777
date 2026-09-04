# The scenic artwork on "Where are you based?"

That screen has a decorative layer behind it — the ringed planet with a
traveller perched on it. It is a **placed image**, not something the app
draws, so the artwork stays exactly as it was made.

**The app is already wired for it. The file is the only thing missing.**

## Adding it

Drop the artwork here:

```
public/onboarding-cosmos.png
```

That is all. `public/` is copied verbatim into the build, so the next deploy
picks it up — there is no import to add and no code to change.

## What the file should be

| | |
| --- | --- |
| **Path** | `public/onboarding-cosmos.png` |
| **Format** | PNG with a transparent background, or WebP (see below) |
| **Size** | around 900–1200px on the long edge is plenty; it is never shown larger than a phone screen |
| **Background** | **transparent** — the page's own pink shows through, which is what makes it sit in the screen rather than on it |
| **Weight** | keep it under ~300KB; it loads on a phone, often on mobile data |

A transparent background is the one that actually matters. Exported on a
white or pink rectangle, the artwork will read as a pasted card no matter what
the CSS does around it.

### If you would rather ship WebP

Smaller, and every browser this app targets reads it. Change the one line in
`src/screens/CoupleSetup.module.css`:

```css
background-image: url('/onboarding-cosmos.webp');
```

## How it is placed

In `.cosmos`, in that same stylesheet:

- pinned to the **bottom** of the screen, `height: 62%`, anchored bottom-right
- `background-size: contain`, so its proportions are never stretched
- faded out with a radial mask from its own corner, which is what keeps it
  scenery rather than a sticker with a hard edge halfway up the screen
- `pointer-events: none`, and the progress bar, question and button all sit
  on a layer above it, so nothing it covers becomes unreadable or untappable

To move it to a different question, change `q === 3` in
`src/screens/CoupleSetup.tsx` — the questions are zero-indexed, so
`0` is the partner's name and `4` is "Together since?".

## Until the file is there

Nothing breaks. It is a CSS background, so a missing file simply does not
paint: no broken-image icon, no gap in the layout, and the screen reads
exactly as it does today.
