import { inferKind, inferTopic } from './postKind';
import { SEED_POSTS, TOPICS } from '@/data/community';

/**
 * What the community screen infers so nobody has to classify their own post.
 *
 * These are heuristics, so this is not a proof of correctness — it is a set of
 * sentences people plausibly write, and a record of what the rules currently
 * do with them. A change that moves one of these is not necessarily wrong; it
 * is a change that has to be looked at.
 *
 * The cases are what matters most: `kind` is metadata nothing renders, but
 * `topic` is what the feed filters by, and a long-distance post filed under
 * Life together is a post the person looking for it will not find.
 */

let failed = 0;
const results: string[] = [];

function check(name: string, ok: boolean, detail = '') {
  results.push(`  ${ok ? 'ok  ' : 'FAIL'} ${name}${detail ? ` — ${detail}` : ''}`);
  if (!ok) failed++;
}

function group(name: string) {
  results.push(`\n${name}`);
}

/* -------------------------- Sentences people write ------------------------- */

const CASES: [string, string, string][] = [
  [
    'We have started doing the thing where we tell each other about our day and neither of us is listening. Has anyone come back from that?',
    'question',
    'communication',
  ],
  [
    'Long distance for eight months. The thing that saved us was picking one small thing at the same time every week.',
    'advice',
    'long_distance',
  ],
  [
    'We moved in together in the spring and I did not expect the chores to be the thing. What worked in the end was writing down who actually minds about what.',
    'advice',
    'life_together',
  ],
  ['Nine years today. Nobody tells you the good part is not the big trips.', 'reflection', 'life_together'],
  [
    'How do you plan things when one of you likes planning and the other finds it stressful?',
    'question',
    'life_together',
  ],
  ['We argued about money twice this week and then did not speak for two days.', 'experience', 'conflict'],
  [
    'Our toddler stopped sleeping through and we have not had an evening to ourselves in a month.',
    'experience',
    'kids',
  ],
  [
    'Is it normal for the physical side to go quiet for a while and come back? Nobody talks about this.',
    'question',
    'intimacy',
  ],
  [
    'Two time zones and a visa application. Some weeks the only thing holding it together is that we both know the date it ends.',
    'reflection',
    'long_distance',
  ],
];

group('What a post is about, and what it is');
for (const [text, kind, topic] of CASES) {
  const gotKind = inferKind(text);
  const gotTopic = inferTopic(text);
  check(
    `"${text.slice(0, 44)}…"`,
    gotKind === kind && gotTopic === topic,
    gotKind === kind && gotTopic === topic ? '' : `got ${gotKind}/${gotTopic}, wanted ${kind}/${topic}`,
  );
}

/* ------------------------------ Standing rules ----------------------------- */

group('Rules that hold whatever the wording');

check(
  'a paragraph ending in a question mark is a question',
  inferKind('We have been together six years and something feels flat lately. Is that just what six years is?') ===
    'question',
);

check(
  'even when it also tells a story',
  inferKind('We tried date night for a month and it did not take. Has anyone found something that did?') ===
    'question',
);

check(
  'every inferred topic is one the feed can filter to',
  CASES.every(([text]) => TOPICS.includes(inferTopic(text))),
);

check(
  'a post with nothing to go on still gets a topic rather than nothing',
  TOPICS.includes(inferTopic('Hello. First time posting here.')),
);

check(
  'the title counts as part of the text',
  inferKind('Long distance for a year now.', 'Has anyone made this work?') === 'question',
  'a question in the headline is still a question',
);

/* ------------------------- The feed it has to agree with ------------------- */

group('The seeded feed');

check(
  'every seeded post is filed under a topic the filter offers',
  SEED_POSTS.every((p) => TOPICS.includes(p.topic)),
);

check(
  'and carries the kind it was written as',
  SEED_POSTS.every((p) => Boolean(p.kind)),
);

check(
  'more than one topic is represented, so the filter has something to do',
  new Set(SEED_POSTS.map((p) => p.topic)).size > 1,
  `${new Set(SEED_POSTS.map((p) => p.topic)).size} topics across ${SEED_POSTS.length} posts`,
);

console.log(results.join('\n'));
console.log(failed ? `\nPost inference: ${failed} failed` : '\nPost inference: all passed');
process.exit(failed ? 1 : 0);
