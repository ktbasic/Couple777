import type { RoomTopic } from '@/lib/types';

/**
 * Relationship Room. Facilitation, not therapy — every flow is
 * private answer → reveal → respond → one small shared commitment.
 * Never diagnostic, never judgmental, always ending somewhere actionable.
 */
export const ROOM_TOPICS: RoomTopic[] = [
  {
    id: 't-connected',
    label: 'Feeling connected',
    emoji: '🪢',
    blurb: 'For when things are fine, but a little further apart than they were.',
    minutes: 15,
    depth: 'gentle',
    steps: [
      {
        kind: 'private',
        prompt: 'When have you felt most connected to me recently?',
        hint: 'A specific moment is better than a general feeling.',
      },
      { kind: 'reveal', prompt: 'Here is what you each wrote.' },
      {
        kind: 'private',
        prompt: 'And when have you felt furthest away?',
        hint: 'This is not an accusation. It is information.',
      },
      { kind: 'reveal', prompt: 'And the harder one.' },
      {
        kind: 'commitment',
        prompt: 'What is one small thing you could do for each other this week?',
        hint: 'Small and specific. "More quality time" is not a plan.',
      },
    ],
  },
  {
    id: 't-appreciation',
    label: 'Appreciation',
    emoji: '🕊️',
    blurb: 'Say the things you both assume the other already knows.',
    minutes: 10,
    depth: 'gentle',
    steps: [
      { kind: 'private', prompt: 'What is something you appreciate about me that you rarely say out loud?' },
      { kind: 'reveal', prompt: 'Read these slowly.' },
      { kind: 'private', prompt: 'What is something you appreciate about us as a pair?' },
      { kind: 'reveal', prompt: 'And about the two of you together.' },
      { kind: 'commitment', prompt: 'How will you tell each other more often?' },
    ],
  },
  {
    id: 't-intimacy',
    label: 'Intimacy',
    emoji: '🌘',
    blurb: 'Closeness, touch, and the space between wanting and asking.',
    minutes: 20,
    depth: 'deep',
    steps: [
      {
        kind: 'private',
        prompt: 'What kind of closeness do you want more of right now?',
        hint: 'Physical, emotional, or simply more time in the same room.',
      },
      { kind: 'reveal', prompt: 'What you each need more of.' },
      {
        kind: 'private',
        prompt: 'What makes it hard to ask for that?',
        hint: 'Tiredness and habit count. Most of the time it is not deeper than that.',
      },
      { kind: 'reveal', prompt: 'What gets in the way.' },
      { kind: 'commitment', prompt: 'What is one thing you will both try this week?' },
    ],
  },
  {
    id: 't-future',
    label: 'The future',
    emoji: '🧭',
    blurb: 'Where you each think this is going, said out loud.',
    minutes: 20,
    depth: 'open',
    steps: [
      { kind: 'private', prompt: 'What do you hope is true about our life in three years?' },
      { kind: 'reveal', prompt: 'Your two versions of three years from now.' },
      { kind: 'private', prompt: 'What would you regret not doing together?' },
      { kind: 'reveal', prompt: 'The regrets you want to avoid.' },
      { kind: 'commitment', prompt: 'What is one step towards that you could take this month?' },
    ],
  },
  {
    id: 't-money',
    label: 'Money',
    emoji: '🪙',
    blurb: 'A calm version of a conversation that is usually not calm.',
    minutes: 20,
    depth: 'open',
    steps: [
      {
        kind: 'private',
        prompt: 'What does money mean to you — safety, freedom, status, or something else?',
        hint: 'Where you both start matters more than the numbers.',
      },
      { kind: 'reveal', prompt: 'What money means to each of you.' },
      { kind: 'private', prompt: 'What is one money thing you worry about but rarely mention?' },
      { kind: 'reveal', prompt: 'The quiet worries.' },
      { kind: 'commitment', prompt: 'What is one thing you will decide together this month?' },
    ],
  },
  {
    id: 't-communication',
    label: 'Communication',
    emoji: '💬',
    blurb: 'How you talk when it is easy, and how you talk when it is not.',
    minutes: 15,
    depth: 'open',
    steps: [
      { kind: 'private', prompt: 'When do you find it easiest to talk to me?' },
      { kind: 'reveal', prompt: 'When it works.' },
      { kind: 'private', prompt: 'What makes you go quiet?' },
      { kind: 'reveal', prompt: 'When it does not.' },
      { kind: 'commitment', prompt: 'What will you each try differently next time it gets tense?' },
    ],
  },
  {
    id: 't-conflict',
    label: 'Conflict',
    emoji: '🌫️',
    blurb: 'Not to relitigate anything. To understand how you each fight.',
    minutes: 25,
    depth: 'deep',
    steps: [
      {
        kind: 'private',
        prompt: 'What do you need from me in the middle of a disagreement?',
        hint: 'Space, reassurance, to be heard first, or to resolve it immediately.',
      },
      { kind: 'reveal', prompt: 'What you each need in the moment.' },
      { kind: 'private', prompt: 'What helps you feel like things are properly repaired afterwards?' },
      { kind: 'reveal', prompt: 'What repair looks like for each of you.' },
      { kind: 'commitment', prompt: 'What is your agreement for next time?' },
    ],
  },
  {
    id: 't-family',
    label: 'Family',
    emoji: '🏡',
    blurb: 'The families you came from, and the one you are making.',
    minutes: 20,
    depth: 'open',
    steps: [
      { kind: 'private', prompt: 'What did you learn about love from the home you grew up in?' },
      { kind: 'reveal', prompt: 'Where you each learned it.' },
      { kind: 'private', prompt: 'What do you want to keep, and what do you want to leave behind?' },
      { kind: 'reveal', prompt: 'Keep and leave.' },
      { kind: 'commitment', prompt: 'What is one thing you want to be true of our home?' },
    ],
  },
  {
    id: 't-growth',
    label: 'Personal growth',
    emoji: '🌱',
    blurb: 'Who you are each becoming, separately.',
    minutes: 15,
    depth: 'gentle',
    steps: [
      { kind: 'private', prompt: 'What are you working on in yourself right now?' },
      { kind: 'reveal', prompt: 'What you are each working on.' },
      { kind: 'private', prompt: 'How could I support that better?' },
      { kind: 'reveal', prompt: 'What support would look like.' },
      { kind: 'commitment', prompt: 'What will you each make room for this month?' },
    ],
  },
  {
    id: 't-stress',
    label: 'Stress',
    emoji: '🫧',
    blurb: 'For a season where one or both of you is carrying a lot.',
    minutes: 15,
    depth: 'gentle',
    steps: [
      { kind: 'private', prompt: 'What is taking the most out of you at the moment?' },
      { kind: 'reveal', prompt: 'What you are each carrying.' },
      { kind: 'private', prompt: 'What actually helps when you are like this?' },
      { kind: 'reveal', prompt: 'What helps.' },
      { kind: 'commitment', prompt: 'What will you take off each other this week?' },
    ],
  },
  {
    id: 't-sex',
    label: 'Sex & affection',
    emoji: '🔥',
    blurb: 'Honest, unhurried, and without any expectation attached to it.',
    minutes: 25,
    depth: 'deep',
    steps: [
      {
        kind: 'private',
        prompt: 'What makes you feel wanted?',
        hint: 'Answer for yourself, not for what you think I want to read.',
      },
      { kind: 'reveal', prompt: 'What makes you each feel wanted.' },
      { kind: 'private', prompt: 'What is something you would like to say about this but never quite do?' },
      { kind: 'reveal', prompt: 'The thing that usually goes unsaid.' },
      { kind: 'commitment', prompt: 'What is one thing you will do differently, gently?' },
    ],
  },
  {
    id: 't-goals',
    label: 'Life goals',
    emoji: '🗺️',
    blurb: 'The big ones, before another year quietly goes by.',
    minutes: 20,
    depth: 'open',
    steps: [
      { kind: 'private', prompt: 'What is something you want to have done before you are fifty?' },
      { kind: 'reveal', prompt: 'Your two lists.' },
      { kind: 'private', prompt: 'Which of these could we do together?' },
      { kind: 'reveal', prompt: 'Where they overlap.' },
      { kind: 'commitment', prompt: 'Which one are you starting this year?' },
    ],
  },
];

export function topicById(id: string): RoomTopic | undefined {
  return ROOM_TOPICS.find((t) => t.id === id);
}
