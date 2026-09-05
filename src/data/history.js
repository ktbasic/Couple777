import { photo } from '@/lib/photo';
import { TIER_META, addDays, fromISODate } from '@/lib/dates';
const DATES = [
    { title: 'Ramen and the late film', emoji: '🎬', place: 'Kino, Schwabing', note: 'You cried at the ending and denied it.', mood: 'warm', photos: 2 },
    { title: 'Cooked the thing from the book', emoji: '🍳', place: 'Home', note: 'Took four hours. Worth about three of them.', mood: 'silly', photos: 3 },
    { title: 'Walked until we found a bar', emoji: '🌙', place: 'Glockenbach', note: 'Ended up somewhere with a piano.', mood: 'joyful', photos: 1 },
    { title: 'Breakfast at the market', emoji: '🥐', place: 'Viktualienmarkt', note: 'Bought far too much cheese.', mood: 'calm', photos: 3 },
    { title: 'The listening hour', emoji: '🎧', place: 'Home', note: 'Three songs each. Yours were better.', mood: 'tender', photos: 0 },
    { title: 'Bouldering, badly', emoji: '🧗', place: 'Boulderwelt', note: 'Neither of us got past the green route.', mood: 'silly', photos: 2 },
    { title: 'Sunday roast at theirs', emoji: '🍗', place: "Anna's", note: 'Stayed three hours longer than planned.', mood: 'warm', photos: 1 },
    { title: 'Pottery class', emoji: '🏺', place: 'Werkstatt', note: 'Made two objects of no known purpose.', mood: 'joyful', photos: 4 },
    { title: 'Cycled to the beer garden', emoji: '🚲', place: 'Englischer Garten', note: 'Fell asleep under a tree.', mood: 'calm', photos: 2 },
    { title: 'Wrote each other a letter', emoji: '✉️', place: 'Home', note: 'Kept both of them.', mood: 'tender', photos: 0 },
    { title: 'The bar we always walk past', emoji: '🍸', place: 'Türkenstraße', note: 'It was worth it after all.', mood: 'joyful', photos: 1 },
    { title: 'One room of the Pinakothek', emoji: '🖼️', place: 'Pinakothek der Moderne', note: 'Argued about the blue one for a week.', mood: 'warm', photos: 3 },
    { title: 'Blind wine tasting', emoji: '🍷', place: 'Home', note: 'The €4 bottle won.', mood: 'silly', photos: 2 },
    { title: 'Fixed the shelf', emoji: '🔧', place: 'Home', note: 'It is still up.', mood: 'proud', photos: 1 },
    { title: 'Dinner outside', emoji: '🧺', place: 'Isar', note: 'Watched the light go.', mood: 'calm', photos: 3 },
    { title: 'Went to see them play', emoji: '🎸', place: 'Muffatwerk', note: 'Ears ringing until Tuesday.', mood: 'joyful', photos: 2 },
    { title: 'Drove out of the light', emoji: '✨', place: 'Ammersee', note: 'Saw three shooting stars, or claimed to.', mood: 'tender', photos: 1 },
    { title: 'Twenty questions', emoji: '💬', place: 'Home', note: 'You surprised me twice.', mood: 'tender', photos: 0 },
    { title: 'Old photos, whole evening', emoji: '📷', place: 'Home', note: 'We were so young last year.', mood: 'warm', photos: 2 },
    { title: 'Bought each other a book', emoji: '📚', place: 'Buchhandlung', note: 'Both wrote something on the first page.', mood: 'tender', photos: 1 },
    { title: 'Ice skating', emoji: '⛸️', place: 'Olympiapark', note: 'One of us can skate.', mood: 'silly', photos: 3 },
    { title: 'Slow morning, no alarm', emoji: '☕', place: 'Home', note: 'Did not leave the flat until two.', mood: 'calm', photos: 1 },
    { title: 'The new Vietnamese place', emoji: '🍜', place: 'Westend', note: 'Going back next week.', mood: 'joyful', photos: 2 },
    { title: 'Sunrise from the hill', emoji: '🌅', place: 'Olympiaberg', note: 'Worth the 5am. Just.', mood: 'proud', photos: 4 },
    { title: 'Planned a trip we may never take', emoji: '🧭', place: 'Home', note: 'Patagonia. One day.', mood: 'warm', photos: 0 },
    { title: 'Swimming, far too cold', emoji: '🌊', place: 'Eisbach', note: 'Soup afterwards saved us.', mood: 'silly', photos: 2 },
    { title: 'Anniversary dinner', emoji: '🕯️', place: 'Tantris', note: 'The one properly expensive night of the year.', mood: 'tender', photos: 3 },
];
const MINIS = [
    { title: 'Thermal baths all afternoon', emoji: '♨️', place: 'Erding', note: 'Left with the brains of two very calm people.', mood: 'calm', photos: 3 },
    { title: 'Christmas market, the small one', emoji: '🎄', place: 'Regensburg', note: 'Stayed until our hands went numb.', mood: 'warm', photos: 4 },
    { title: 'Hiked to the hut', emoji: '🥾', place: 'Tegernsee', note: 'Ate an unreasonable amount of Kaiserschmarrn.', mood: 'joyful', photos: 5 },
    { title: 'Vineyard walk and a long lunch', emoji: '🍇', place: 'Franconia', note: 'Missed the train we meant to take.', mood: 'warm', photos: 3 },
    { title: 'The island in the lake', emoji: '⛴️', place: 'Herreninsel', note: 'Walked the whole way round twice.', mood: 'calm', photos: 4 },
    { title: 'A day in Salzburg', emoji: '🏛️', place: 'Salzburg', note: 'No plan at all. Best kind.', mood: 'joyful', photos: 3 },
    { title: 'Cottage with no reception', emoji: '🏡', place: 'Bavarian Forest', note: 'Two days of nothing. Needed it.', mood: 'calm', photos: 5 },
];
const BIGS = [
    { title: 'Lisbon', emoji: '🇵🇹', place: 'Lisbon, Portugal', note: 'Nine days. We got lost every one of them.', mood: 'joyful', photos: 5 },
    { title: 'The Scottish Highlands', emoji: '🏴', place: 'Skye & Glencoe', note: 'Rained for six days. Would go again tomorrow.', mood: 'warm', photos: 8 },
    { title: 'Andalusia road trip', emoji: '🚗', place: 'Seville · Granada · Cádiz', note: 'Three weeks, one very small car.', mood: 'joyful', photos: 9 },
];
const POOLS = { day: DATES, week: MINIS, month: BIGS };
/**
 * @param startOffset days back from today for the most recent generated turn —
 *   behind the handcrafted ones so the live countdowns still read correctly.
 */
function buildTier(tier, today, startOffset, people) {
    const cycles = [];
    const plans = [];
    const memories = [];
    const pool = POOLS[tier];
    const step = TIER_META[tier].intervalDays;
    pool.forEach((entry, i) => {
        // Slight jitter so the rhythm looks kept, not clockwork.
        const jitter = ((i * 37) % 7) - 3;
        const offset = startOffset + i * (step + 3) + jitter;
        const date = addDays(today, -offset);
        const by = people[i % 2];
        const cycleId = `h-cy-${tier}-${i}`;
        const planId = `h-pl-${tier}-${i}`;
        const memoryId = `h-m-${tier}-${i}`;
        cycles.push({
            id: cycleId,
            tier,
            seq: pool.length - i,
            startDate: addDays(date, -step),
            dueDate: date,
            planId,
            completedAt: fromISODate(date).toISOString(),
            memoryId,
        });
        plans.push({
            id: planId,
            cycleId,
            title: entry.title,
            emoji: entry.emoji,
            date,
            createdBy: by,
            surprise: false,
            place: entry.place,
            invite: {
                sentAt: fromISODate(addDays(date, -3)).toISOString(),
                respondedAt: fromISODate(addDays(date, -3)).toISOString(),
                response: 'yes',
            },
        });
        memories.push({
            id: memoryId,
            date,
            title: entry.title,
            emoji: entry.emoji,
            kind: tier,
            place: entry.place,
            photos: Array.from({ length: entry.photos }, (_, p) => photo(`${planId}-${p}`)),
            mood: entry.mood,
            sharedNote: entry.note,
            notes: {},
            privateNotes: {},
            planId,
            cycleId,
        });
    });
    return { cycles, plans, memories };
}
export function buildHistory(today, people) {
    const day = buildTier('day', today, 12, people);
    const week = buildTier('week', today, 84, people);
    const month = buildTier('month', today, 310, people);
    return {
        cycles: [...day.cycles, ...week.cycles, ...month.cycles],
        plans: [...day.plans, ...week.plans, ...month.plans],
        memories: [...day.memories, ...week.memories, ...month.memories],
    };
}
