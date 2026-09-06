import type { CommunityPost, CommunityTopic } from '@/lib/types';

export const TOPIC_LABEL: Record<CommunityTopic, string> = {
  question: 'A question',
  experience: 'An experience',
  advice: 'Advice',
  reflection: 'A reflection',
  tips: 'Using Couple777',
};

export const TOPIC_EMOJI: Record<CommunityTopic, string> = {
  question: '❓',
  experience: '✨',
  advice: '🤝',
  reflection: '🌙',
  tips: '💡',
};

export const TOPICS: CommunityTopic[] = ['question', 'experience', 'advice', 'reflection', 'tips'];

const ago = (hours: number) => new Date(Date.now() - hours * 3600_000).toISOString();

/**
 * What the feed opens on before anyone here has posted.
 *
 * A forum that opens empty asks the first person to perform for an empty room,
 * so it starts with a handful of threads. They are written as other couples,
 * anonymous where the subject earns it, and none of them are about the app.
 */
export const SEED_POSTS: CommunityPost[] = [
  {
    id: 'cp-1',
    author: 'Anonymous',
    anonymous: true,
    topic: 'advice',
    body: "We have been together six years and we have started doing the thing where we tell each other about our day and neither of us is listening. Not fighting. Just... narrating. Has anyone come back from that?",
    createdAt: ago(3),
    hearts: 24,
    replies: [
      {
        id: 'cr-1a',
        author: 'Nadia & Sam',
        anonymous: false,
        body: "We put one evening a week where neither of us reports anything. No 'how was your day'. It felt forced for about three weeks and then it did not.",
        createdAt: ago(2),
      },
      {
        id: 'cr-1b',
        author: 'Anonymous',
        anonymous: true,
        body: 'Narrating is still talking. It is the not-asking-anything-back that gets you. We started asking one real question at dinner.',
        createdAt: ago(1),
      },
    ],
  },
  {
    id: 'cp-2',
    author: 'Priya & Tom',
    anonymous: false,
    topic: 'experience',
    body: 'Long distance for eight months, ends in March. The thing that saved us was picking one small thing at the same time every week — Sunday morning, coffee, both of us on video, no agenda. Not romantic. Just reliable.',
    createdAt: ago(9),
    hearts: 41,
    replies: [
      {
        id: 'cr-2a',
        author: 'Anonymous',
        anonymous: true,
        body: 'Reliable is underrated. We tried to make every call special and burned out by month two.',
        createdAt: ago(7),
      },
    ],
  },
  {
    id: 'cp-3',
    author: 'Anonymous',
    anonymous: true,
    topic: 'question',
    body: 'How do you plan things when one of you likes planning and the other finds it stressful? I want to book something for our anniversary and every time I bring it up it turns into a whole thing.',
    createdAt: ago(20),
    hearts: 12,
    replies: [],
  },
  {
    id: 'cp-4',
    author: 'Marco & Lea',
    anonymous: false,
    topic: 'reflection',
    body: 'Nine years today. Nobody tells you the good part is not the big trips, it is that you can be in the same room for four hours saying almost nothing and it is the best part of the week.',
    createdAt: ago(30),
    hearts: 88,
    replies: [
      {
        id: 'cr-4a',
        author: 'Anonymous',
        anonymous: true,
        body: 'Two years in and I am only just learning this. Thank you for saying it.',
        createdAt: ago(26),
      },
    ],
  },
  {
    id: 'cp-5',
    author: 'Anonymous',
    anonymous: true,
    topic: 'tips',
    body: 'We use the 7-week one as the actual planning slot and leave the 7-day one loose. Trying to make all three special was too much. One properly planned thing a month is plenty.',
    createdAt: ago(46),
    hearts: 19,
    replies: [],
  },
];
