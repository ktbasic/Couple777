# The scenic artwork on "Where are you based?"

That screen has a decorative layer behind it — the ringed planet with a
traveller perched on it. It is a **placed image**, not something the app
draws, so the artwork stays exactly as it was made.

**It is in and working.** You uploaded `public/onboarding-cosmos.png`; what
the app actually serves is `public/onboarding-cosmos.webp`, re-encoded from it
at quality 88.

## Why WebP

The PNG is 1.1MB. The WebP is 362KB for the same 1136x1385 pixels — a 68%
saving on a file that loads on a phone, often on mobile data, for a decoration.
Quality 88 rather than something lower because the artwork is almost entirely
soft gradients, and those are what lossy compression bands first.

The PNG stays in `public/` as the source you uploaded. Nothing fetches it, so
it costs a little space in the repo and nothing at runtime; delete it whenever
you like.

### Re-exporting

Replace the PNG, then regenerate the WebP. There is no image tooling installed
here, but Chromium is, and it will do the conversion:

```js
// with the png served over http (canvas taints on file://)
const c = document.createElement('canvas');
c.width = img.naturalWidth; c.height = img.naturalHeight;
c.getContext('2d').drawImage(img, 0, 0);
c.toDataURL('image/webp', 0.88);
```

Or just ask, and I will redo it.

## What a replacement should be

| | |
| --- | --- |
| **Format** | PNG or WebP with a **transparent background** |
| **Size** | 1100-1200px on the long edge covers a phone at 3x |
| **Weight** | under ~400KB once encoded |

The transparent background is the one that matters. Exported on a white or
pink rectangle, the artwork reads as a pasted card no matter what the CSS does
around it. The piece you sent is 64% semi-transparent and 0% fully opaque —
soft throughout — which is exactly why it sits in the page so well.

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

## If the file ever goes missing

Nothing breaks. It is a CSS background, so a missing file simply does not
paint: no broken-image icon, no gap in the layout, and the screen still reads.
