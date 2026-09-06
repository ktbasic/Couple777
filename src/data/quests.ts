import type { Quest, Wish } from '@/lib/types';

/**
 * Little Quests.
 *
 * One at a time, five to twenty minutes, and nothing that needs planning,
 * money or leaving the house. The point is a small thing done together today,
 * not a challenge — so nothing here can be failed, and none of it asks the
 * couple to be anywhere in particular.
 */
export const QUESTS: Quest[] = [
  { id: 'q-selfie', emoji: '📸', title: 'Take a silly selfie', body: 'The worse the better. It is going in the memories either way.', minutes: 5, vibes: ['fun'] },
  { id: 'q-compliment', emoji: '💬', title: 'One compliment each', body: 'Something you noticed this week, not something general.', minutes: 5, vibes: ['conversation'] },
  { id: 'q-song', emoji: '🎧', title: 'Pick a song for each other', body: 'Play it out loud. No explaining until it finishes.', minutes: 10, vibes: ['fun'] },
  { id: 'q-phonefree', emoji: '🌙', title: 'Ten phone-free minutes', body: 'Both phones in another room. Talk about anything.', minutes: 10, vibes: ['quality-time'] },
  { id: 'q-tea', emoji: '☕', title: 'Make them a drink', body: 'Exactly how they like it, without asking how they like it.', minutes: 10, vibes: ['romance'] },
  { id: 'q-oldphoto', emoji: '🖼️', title: 'Find an old photo of you two', body: 'Send it to them with one line about what you remember.', minutes: 10, vibes: ['conversation'] },
  { id: 'q-walk', emoji: '🚶', title: 'Walk once round the block', body: 'No destination. Whoever talks first picks the direction.', minutes: 20, vibes: ['adventure'] },
  { id: 'q-thankyou', emoji: '🌿', title: 'Thank them for something small', body: 'Something they do so often you both stopped noticing.', minutes: 5, vibes: ['conversation'] },
  { id: 'q-plan60', emoji: '🗺️', title: 'Sixty seconds of daydreaming', body: 'One minute each on somewhere you would go with no budget.', minutes: 5, vibes: ['adventure'] },
  { id: 'q-cook', emoji: '🍳', title: 'Make one thing together', body: 'Toast counts. One of you chops, one of you decides.', minutes: 20, vibes: ['fun'] },
  { id: 'q-question', emoji: '❓', title: 'Ask something you have never asked', body: 'It does not have to be deep. It has to be new.', minutes: 10, vibes: ['conversation'] },
  { id: 'q-dance', emoji: '💃', title: 'One song, dancing', body: 'Kitchen, hallway, anywhere. Full song, no stopping.', minutes: 5, vibes: ['fun'] },
  { id: 'q-sit', emoji: '🛋️', title: 'Sit together doing nothing', body: 'Ten minutes, no screen, no agenda. Harder than it sounds.', minutes: 10, vibes: ['quality-time'] },
  { id: 'q-note', emoji: '💌', title: 'Leave them a note', body: 'On paper, somewhere they will find it tomorrow.', minutes: 5, vibes: ['romance'] },
];

/** What a good week looks like. Reached, not required. */
export const QUEST_WEEK_GOAL = 7;

/** Roughly what other couples manage in a week — for scale, not for ranking. */
export const QUEST_WEEK_AVERAGE = 5;

/**
 * Today's quest.
 *
 * Deterministic from the date, so both phones show the same one and it does
 * not change under you when the screen re-renders. Anything already done or
 * passed on drops out of the pool first, and the couple's wishes from
 * onboarding pull matching quests forward — a light touch, not a filter, so
 * the pool never empties.
 */
export function questForDate(
  iso: string,
  wishes: Wish[],
  doneIds: string[],
  skippedIds: string[],
): Quest | undefined {
  const used = new Set([...doneIds, ...skippedIds]);
  let pool = QUESTS.filter((q) => !used.has(q.id));
  // Everything has been done at least once: start the pool again rather than
  // running out, because a feature that ends is worse than one that repeats.
  if (!pool.length) pool = QUESTS;

  const liked = pool.filter((q) => q.vibes.some((v) => wishes.includes(v)));
  const bucket = liked.length ? liked : pool;

  let h = 0;
  for (let i = 0; i < iso.length; i++) h = (h * 33 + iso.charCodeAt(i)) >>> 0;
  return bucket[h % bucket.length];
}
