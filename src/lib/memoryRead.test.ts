/**
 * What the phone alone makes of a note.
 *
 * This is the fallback reader — the one that runs when no API key is set, on a
 * dead network, or when the endpoint is slow. It decides the tone, and the
 * tone decides the opening line, the feelings offered, whether the memory is
 * private, and whether anyone is shown a date idea afterwards. Getting it
 * wrong is not cosmetic.
 *
 * The corpus below is sentences people actually write. A failure here is a
 * real failure: it means someone's hard evening would be met with a sparkle.
 *
 * Run with: npm run test:memory
 */
import { readTone, readNote } from './memoryRead';
import { localReading } from './memoryAi';

const NOW = '2026-09-06';
let failures = 0;

function tone(want: string, note: string) {
  const got = readTone(note);
  const ok = got === want;
  if (!ok) failures++;
  console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${want.padEnd(9)} ${ok ? '' : `(got ${got}) `}${note}`);
}

console.log('\nGood ones');
tone('positive', 'We cooked pasta tonight and ended up dancing in the kitchen.');
tone('positive', 'He brought me coffee in bed without me asking.');
tone('positive', 'Ten years today. Same little restaurant, same order.');
tone('positive', 'I am so proud of her for finishing the course.');
tone('positive', 'We just sat on the balcony and talked until it got cold.');
tone('positive', 'Thank god for him honestly.');
tone('positive', 'She held my hand the whole way through the appointment.');
tone('positive', 'Nothing special, just a really nice quiet evening together.');

console.log('\nHard ones');
tone('difficult', 'We argued again and I felt like he wasn’t listening to me.');
tone('difficult', 'He forgot again. I just went to bed.');
tone('difficult', 'I don’t know why I even bother anymore.');
tone('difficult', 'She said something that really stung and I have not been able to shake it.');
tone('difficult', 'Another night where we barely spoke.');
tone('difficult', 'I feel like I am the only one trying.');
tone('difficult', 'We had the same fight about the dishes for the third time this week.');
tone('difficult', 'I cried in the car after.');
tone('difficult', 'It was tense the whole evening and neither of us said why.');
tone('difficult', 'He rolled his eyes at me in front of his friends.');
tone('difficult', 'He never asks how my day was.');
tone('difficult', 'I am so tired of being the one who plans everything.');

console.log('\nA sad word anywhere means the sparkle is off');
// The one that must never happen: a note that says "sad" met with "that
// sounds like a lovely little moment". Positive requires nothing hard at all.
tone('difficult', 'I feel sad today.');
tone('difficult', 'I am sad.');
tone('difficult', 'Had a really nice day with him but I still feel sad about my mum.');
tone('mixed', 'It was a beautiful wedding and I felt sad the whole way home.');
tone('mixed', 'We had a lovely dinner and I told him I have been feeling sad.');
tone('mixed', 'He made me laugh even though I am sad.');
tone('mixed', 'Sad day but he was sweet about it.');

console.log('\nBoth at once');
tone('mixed', 'We argued but we sorted it out and ended up laughing.');
tone('mixed', 'Hard week, but he made me tea without being asked.');

console.log('\nNeither');
tone('neutral', 'Went to the shop. Nothing much happened.');
tone('neutral', 'Booked the flights for October.');

console.log('\nWords that mean something else');
// "Cold" is weather, "fine" is not a feeling, and a film is not a fight.
tone('positive', 'We walked home and talked until it got cold.');
tone('neutral', 'Watched a film about a boxer. Bed early.');

console.log('\nNo tone but positive gets the sparkle');
// Every opening except the positive one is safe on a hard note; this checks
// the one that is not can only be reached with nothing hard in the note.
for (const note of [
  'I feel sad today.',
  'It was a beautiful wedding and I felt sad the whole way home.',
  'We drifted apart for a while but had a lovely day.',
  'He forgot again. I just went to bed.',
]) {
  const got = readTone(note);
  const ok = got !== 'positive';
  if (!ok) failures++;
  console.log(`  ${ok ? 'ok  ' : 'FAIL'} not positive (${got}) — ${note}`);
}

console.log('\nAnd what the tone then decides');
const cases: [string, 'private' | 'shared', boolean][] = [
  ['We argued again and I felt unheard.', 'private', false],
  ['He forgot again. I just went to bed.', 'private', false],
  ['We danced in the kitchen and laughed for ages.', 'shared', true],
];
for (const [note, visibility, idea] of cases) {
  const r = localReading(note, [], NOW);
  const okV = r.defaultVisibility === visibility;
  const okI = r.nextSteps.includes('idea') === idea;
  if (!okV || !okI) failures++;
  console.log(
    `  ${okV && okI ? 'ok  ' : 'FAIL'} ${r.tone.padEnd(9)} ${r.defaultVisibility.padEnd(7)} idea=${r.nextSteps.includes('idea')}  ${note}`,
  );
}

console.log('\nAnd what it takes from the words');
const read = readNote('We cooked pasta tonight and ended up dancing in the kitchen.', NOW);
const title = read.title === 'Dancing in the kitchen';
const when = read.date === NOW;
const where = read.place === 'Home';
if (!title || !when || !where) failures++;
console.log(`  ${title && when && where ? 'ok  ' : 'FAIL'} "${read.title}" · ${read.date} · ${read.place}`);

console.log(failures ? `\nMemory: ${failures} failed` : '\nMemory: all passed');
process.exit(failures ? 1 : 0);
