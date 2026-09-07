# Idea illustrations — the brief

One drawn scene per date idea. Sixty-five of them, none shared.

This replaces a set of seven category drawings. Those were the wrong unit:
every outdoors idea showed the same hills, so "Get up for the sunrise" and
"Ride out to lunch" were the same card twice. A picture of *the kind of
thing* is not a picture of the thing.

## What the app already does

Nothing here needs wiring. Each idea carries an `illustrationId` — its own
id without the `i-` prefix — and `IdeaIllustration` looks for
`src/assets/idea-illustrations/<illustrationId>.webp`.

- **Drop a file in and rebuild.** It appears. There is no list to update.
- **An idea with no file** falls back to its category drawing. Nothing
  breaks, nothing 404s, and the screen stays branded while the set is
  half-finished — so these can land a few at a time.
- `npm run test:ideas` reports how many of the 65 are drawn, and fails if a
  file is named after an idea that does not exist.

## Style — the part that has to be identical across all 65

Soft painted editorial illustration: a real scene with people in it, not a
symbol. Two figures, always — this is an app about two people.

The four `.webp` files in `src/assets/idea-illustrations/` **are the
reference**. Anything new is matched to those, not to this table — the table
is here to say what they have in common, and where the two disagree, they
win.

| | |
| --- | --- |
| Palette | The app's own: rose `#E4598A`, deep rose `#C93A6F`, peach `#F79C7B`, soft peach `#FBD0B9`, lavender `#9A72C0`, pale lavender `#DBD1EF`, washes `#FDEDF2` / `#FCF0EC` / `#F5EFFA`. Warm neutrals for skin and wood. No blues, no greens outside a muted sage for foliage. |
| Characters | Rounded, warm, modern. Simplified faces — a suggestion of features, not portraits. **The same two people every time**, him in lavender, her in pink: the references established it and it is what makes nine unrelated scenes read as one app rather than nine stock illustrations. No visible brand or logos. |
| Line | Little or none. Shape-led with soft edges; where there is a line it is the same weight throughout the set. |
| Depth | Soft light and gentle gradients, painted rather than flat: a lamp that glows, a window that is brighter than the wall, air between foreground and background. Never a hard drop shadow. |
| Detail | Furnish the scene. The room has a plant, a mug, a picture on the wall; the ridge has a thermos and a pack. This is what a symbol does not have, and it is most of why these read as somewhere real. |
| Mood | Warm, unhurried, a little tender. Not cute, not corporate, no exclamation-mark energy. |
| Composition | Generous negative space. One clear focal object per scene. |

### Read it at 104 × 78

The card shows the illustration as a **104px-wide, 4:3 thumbnail** on the
left, with the text beside it. It was a 92px square, which was the right
frame for a symbol and the wrong one for two people in a room — at that size
the room went first and what was left was a symbol again.

104 × 78 is enough for a scene and is barely more than that. So: **two
figures, one clear object, one suggested place.** No crowds, no fine detail,
no text in the artwork. Check every one at that size before calling it done —
if you cannot tell it from its neighbour at 104px, it has not worked. This is
the size that decides whether an illustration works; a scene that only reads
at 2× has not been drawn for this card.

## Export

| | |
| --- | --- |
| Format | `.webp` |
| Size | 1200×900, 4:3 — the same shape the card shows, so nothing is cropped |
| Background | Filled, not transparent. A wash from the palette. |
| Weight | Under 60KB each, enforced when the file is made. They are lazy-loaded per card rather than bundled, so this is a per-card cost, not a startup one — but sixty-five of them is still half a phone's patience if each is a megabyte. |
| Filename | Exactly the `file` column below. Lowercase, no spaces. |

## The two kinds of scene

**Together** — one room, one place, two people in it.

**Apart** — marked `SPLIT` below. Nineteen of the ideas are for couples in
different cities, and the distance is the whole premise. Draw them as one
image divided down the middle: two places, two people, the same moment. A
soft vertical seam or a colour shift between halves, not a hard border.
Getting these wrong — drawing them as one room — makes them meaningless.

---

## The 65

### Together · 46 illustrations

| # | file | idea | scene |
| --- | --- | --- | --- |
| 1 | `pasta.webp` | Cook one dish from scratch | Two people at a kitchen counter, one rolling dough, one holding a propped-up recipe card. Open wine bottle and two glasses; pans on a rail behind. |
| 2 | `listening.webp` | The listening hour | Two people sitting on a rug facing each other, one holding a phone up to queue a song, a small speaker between them, headphones on the floor. |
| 3 | `nightwalk.webp` | Walk somewhere with no destination | Two people walking side by side down an empty street at night, hands in coat pockets, one streetlamp casting long soft shadows. |
| 4 | `market.webp` | Breakfast at the market | Two people at a market stall under a striped awning, crates of fruit and a tray of pastries, one holding a paper bag. |
| 5 | `gallery.webp` | One room of a museum | Two people standing close together in front of one large framed painting in an otherwise empty gallery room, a bench behind them. |
| 6 | `bath.webp` | Slow evening in | A candlelit bathroom, two people relaxing in a deep tub, shoulders above the water, steam rising, candles along the rim, a small speaker. |
| 7 | `bookshop.webp` | Buy each other a book | Two people in adjacent bookshop aisles, each holding a book, glancing at each other over the top of a shelf. |
| 8 | `sunrise.webp` | Get up for the sunrise | Two people wrapped in one blanket on a hillside, facing a low sun, thermos and two enamel cups beside them. |
| 9 | `oldphotos.webp` | Go through the old photos | Two people leaning over a tablet on a sofa, printed photographs spread across the coffee table, one of them laughing. |
| 10 | `newbar.webp` | The bar you always walk past | Two people on stools at a narrow bar counter, a cocktail each, warm pendant lights, a bartender in soft silhouette. |
| 11 | `cinemahome.webp` | Home cinema, properly | Two people on a sofa under one blanket facing a glowing screen in a dark room, popcorn bowl between them, phones face-down. |
| 12 | `pottery.webp` | Be beginners at something | Two people in aprons at a pottery wheel, clay on their hands, a shelf of finished pots behind, one steadying the other's hands. |
| 13 | `picnic.webp` | Dinner outside | Two people on a blanket in a park at dusk, food spread out, a tote bag tipped over, trees and low sun behind. |
| 14 | `questions.webp` | Twenty questions you have never asked | Two people sitting cross-legged facing each other on a bed, one mid-question with a hand raised, two mugs on the floor. |
| 15 | `swim.webp` | Cold water, then something warm | Two people in swimwear stepping into a lake, arms out for balance, towels folded on the shore, a small sauna hut behind. |
| 16 | `bike.webp` | Ride out to lunch | Two people riding bicycles along a country lane, front baskets, a village roofline in the distance. |
| 17 | `letters.webp` | Write each other a letter | Two people at opposite ends of a table writing on paper, heads down, pens in hand, one folded sheet already sealed between them. |
| 18 | `newdistrict.webp` | Be tourists in your own city | Two people at an unfamiliar street corner looking up at the buildings, one holding a coffee, tram lines curving past. |
| 19 | `breakfastbed.webp` | A morning with nothing in it | Two people in bed with a breakfast tray between them, sunlight through half-open curtains, no clock in sight. |
| 20 | `stargaze.webp` | Drive out of the light | Two people reclining on the bonnet of a parked car under a dense starry sky, sharing a blanket, thermos on the roof. |
| 21 | `projectnight.webp` | Fix something together | Two people kneeling on a living-room floor assembling a wooden shelf, screws and a screwdriver, one holding the instructions upside down. |
| 22 | `tasting.webp` | Blind tasting at the kitchen table | Two people at a kitchen table, three small glasses in front of each, one blindfolded and sniffing, scorecards and a pencil. |
| 23 | `hike.webp` | A hill with a view at the top | Two people at the top of a hill with small backpacks, looking out over a valley, one unwrapping a sandwich. |
| 24 | `plans.webp` | Plan a trip you may never take | Two people sitting on the floor around a large open map, sticky notes, a laptop and two guidebooks. |
| 25 | `slowcoffee.webp` | Coffee before the phones | Two people at a small kitchen table with coffee, both phones face-down at the table's edge, early light across the wall. |
| 26 | `extrahour.webp` | Stay in bed an extra hour | Two people lying in bed talking, duvet rumpled, an alarm clock turned face-down on the nightstand. |
| 27 | `kitchenradio.webp` | Kitchen radio, before anyone is ready | Two people in pyjamas dancing in a kitchen, kettle steaming, a small radio on the counter, one mid-spin. |
| 28 | `swaproutine.webp` | Swap your morning routines | Two people in a bathroom doing each other's morning routine — one holding the other's usual mug, mirrored gestures, two toothbrushes. |
| 29 | `firstlight.webp` | Walk the block before the city wakes | Two people walking an empty pavement at dawn, shuttered shopfronts, faint mist, no traffic. |
| 30 | `greenbefore.webp` | Somewhere green before breakfast | Two people walking briskly into a park at sunrise, dew on the grass, trees and a path ahead. |
| 31 | `rearrange.webp` | Rearrange one room together | Two people carrying an armchair across a living room, rug rolled up, a plant already moved, pictures leaning against the wall. |
| 32 | `onehourskill.webp` | One hour, one skill, no quitting | Two people in a living room trying to juggle, three balls mid-air, a laptop propped open on a tutorial, one ball on the floor. |
| 33 | `twentywords.webp` | Twenty words of a language neither of you speaks | Two people on a sofa with hand-written flashcards, one mouthing a word, a phrasebook open between them. |
| 34 | `samesofa.webp` | Your own books, the same sofa | Two people at opposite ends of a sofa, each reading a different book, feet overlapping in the middle, two mugs of tea. |
| 35 | `benchlives.webp` | Pick a bench and invent lives | Two people on a park bench watching passers-by, one leaning in to point discreetly, a square with pigeons. |
| 36 | `midnightfridge.webp` | Whatever is in the fridge, at midnight | Two people standing at an open fridge at night, one plate held between them, the kitchen dark except for the fridge light. |
| 37 | `tripplaylist.webp` | The playlist for a trip you have not booked | Two people on a bed with a laptop, one earbud each from the same pair, a map pinned to the wall behind. |
| 38 | `nightgame.webp` | One long game, properly | Two people at a table with a board game spread out, cards and pieces everywhere, a low lamp, mugs pushed to the edge. |
| 39 | `tastingmenu.webp` | The restaurant you have been saving | Two people dressed up at a restaurant table, one candle, small plated dishes, a waiter passing in soft focus behind. |
| 40 | `whoeverisplaying.webp` | Whoever is playing on Friday | Two people in a small music venue near the front, stage lights, a three-piece band in silhouette. |
| 41 | `decidenothing.webp` | A day where neither of you decides anything | Two people in robes on loungers in a spa, steam drifting, glasses of water, no phones anywhere. |
| 42 | `firsttrain.webp` | First train, no return booked | Two people on a station platform at dawn with one small bag, a departure board above, a train pulling in. |
| 43 | `getlost.webp` | Get lost on purpose | Two people at an unfamiliar corner deciding between two streets, phone still in a pocket, no map out. |
| 44 | `highestpoint.webp` | The highest point you can walk to | Two people on a rooftop at night looking out over city lights, one blanket around both shoulders. |
| 45 | `emptyswings.webp` | The playground, after everyone has gone | Two adults on swings in an empty playground at night, mid-swing and laughing, one streetlamp. |
| 46 | `slowpark.webp` | An afternoon on the same blanket | Two people on a blanket in a park in the afternoon, one asleep with a hat over their face, the other reading, dappled shade. |

### Apart, two places · 19 illustrations

| # | file | idea | scene |
| --- | --- | --- | --- |
| 1 | `videocook.webp` | Same recipe, two kitchens | SPLIT: two kitchens side by side, one person in each, the same ingredients on both counters, a propped-up phone in each showing the other. |
| 2 | `pressplay.webp` | Press play at the same second | SPLIT: two sofas in two rooms, the same film paused on both screens, each person holding a phone counting down. |
| 3 | `twotables.webp` | Same three things, two tables | SPLIT: two tables, three identical small glasses on each, a laptop on each showing the other person mid-verdict. |
| 4 | `walkandtalk.webp` | Walk your own streets, together | SPLIT: two different streets — one leafy, one city — each person walking with headphones and a phone in hand. |
| 5 | `samechapter.webp` | Read the same chapter tonight | SPLIT: two beds, two bedside lamps, both people holding the same book cover, one further through than the other. |
| 6 | `twomuseums.webp` | Two museums, one hour, photos only | SPLIT: two gallery rooms, each person photographing a different artwork with a phone. |
| 7 | `morningapart.webp` | Coffee at the same time, two cities | SPLIT: two windows with different skylines, each person with a coffee, a phone propped against something. |
| 8 | `buildit.webp` | Build the same thing, badly | SPLIT: two desks with identical half-built model kits, parts scattered, a laptop on each showing the other losing. |
| 9 | `guessbreakfast.webp` | Two breakfasts, one call | SPLIT: two breakfast tables, a different bowl on each, phones propped, both people mid-laugh. |
| 10 | `samesky.webp` | Same sky, two windows | SPLIT: two windows at night, the same moon visible from both, each person with a phone to their ear. |
| 11 | `latequiz.webp` | Midnight quiz, no googling | SPLIT: two dark bedrooms, each person with a notebook of hand-written questions, faces lit by a phone. |
| 12 | `streetview.webp` | Show me where you grew up | SPLIT: two people at laptops, one screen showing a street of small houses, that person pointing at it. |
| 13 | `marketapart.webp` | Two markets, one shopping list | SPLIT: two different markets, each person holding the same hand-written list, one holding produce up to a phone camera. |
| 14 | `coldstart.webp` | Cold shower, both of you, on three | SPLIT: two bathrooms, both people bracing at the shower door, towels ready, a phone propped on a shelf. |
| 15 | `dawnrace.webp` | Out the door in ten minutes, both of you | SPLIT: two front doors at dawn, both people lacing shoes and heading out, phones in hand. |
| 16 | `quietcall.webp` | An afternoon with the call left open | SPLIT: two rooms, one person reading and one at a desk, a laptop in each showing the other, neither talking. |
| 17 | `tenblocks.webp` | Ten blocks you have never walked | SPLIT: two unfamiliar streets in different cities, each person stopped to photograph something small. |
| 18 | `slowsunday.webp` | The same album, start to finish | SPLIT: two rooms, both people lying back with headphones on, the same album cover propped up in each. |
| 19 | `nighthunt.webp` | Midnight scavenger hunt, two cities | SPLIT: two night streets, each person photographing something odd — a red door, a bad sign — faces lit by a phone. |

---

## What is drawn, and in what

Fifteen, in two tiers. Both render identically — `IdeaIllustration` takes
`.webp`, `.png` and `.svg` — but only one of them is the house style.

**Painted (`.webp`). The style. Match these.**

| file | scenario | idea |
| --- | --- | --- |
| `pasta.webp` | cooking | Cook one dish from scratch |
| `pottery.webp` | creative / playful | Be beginners at something |
| `sunrise.webp` | outdoor, romantic | Get up for the sunrise |
| `cinemahome.webp` | cozy indoor | Home cinema, properly |
| `nightgame.webp` | game, late | One long game, properly |
| `slowpark.webp` | outdoor, unhurried | An afternoon on the same blanket |
| `slowcoffee.webp` | conversation, morning | Coffee before the phones |
| `bike.webp` | active, out | Ride out to lunch |
| `pressplay.webp` | long distance, `SPLIT` | Press play at the same second |

**Vector (`.svg`). The floor, for scenarios with no painting yet.**

| file | scenario | idea |
| --- | --- | --- |
| `bath.svg` | cozy indoor | Slow evening in |
| `hike.svg` | outdoor | A hill with a view at the top |
| `stargaze.svg` | romantic | Drive out of the light |
| `firsttrain.svg` | adventurous | First train, no return booked |
| `questions.svg` | conversation | Twenty questions you have never asked |
| `videocook.svg` | long distance, `SPLIT` | Same recipe, two kitchens |

These six are generated by `scripts/pilot-illustrations.py` and are flat
vector — recognisably the same palette and the same two-people rule, and
recognisably not the same craft. They are there because a drawn scene of the
right evening beats a category symbol, not because they are finished. A
painting replaces one the moment there is one: `pasta` and `pottery` were
both SVG and are not any more, and the generator now skips them by name so a
rerun cannot put the old file back.

The other 50 fall back to the category drawing until their file exists, so
the app is usable throughout and they can land in any order.

---

## Settled: the card layout

A **104-wide 4:3 thumbnail** on the left, text on the right, fixed at that
width down the whole list. Not a hero image across the top of the card: that
is what the style would prefer, but it makes every card taller and fewer fit
on a screen, and Explore is a list people scan.

104 rather than the 132 this briefly used. At 132 the picture starts reading
as half the card instead of the thing beside the title, and every row pays
for it in wrapped text. The size comes from an experience-listing reference;
the 4:3 does not — that is the shape the illustrations are drawn and exported
in, and a portrait crop would take the sun out of `sunrise` and the screen
out of `cinemahome`.

**Nearby and Big Trips are not this.** They keep the hero image and the photo
tile respectively. They were briefly rows on the same 104 thumbnail and it
was the wrong trade there: those cards are about a real place, and a place
sold at thumbnail size stops being somewhere you want to go.
