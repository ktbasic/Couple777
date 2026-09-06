/**
 * The two rules that must hold whatever the model says.
 *
 * Everything else in this endpoint is shaped by a prompt and a schema, and a
 * prompt is a request rather than a guarantee. These are the two things a
 * request is not good enough for, so they are enforced in code and checked
 * here: a difficult memory defaults to private, and a difficult memory is
 * never offered a date idea.
 *
 * Run with: npm run test:ai
 *
 * It lives here rather than beside the endpoint because Vercel turns every
 * file under api/ into a public serverless function — a test file there is an
 * endpoint that runs process.exit() when someone opens it, and a build error
 * if its imports do not suit the function builder.
 */
import handler, { parseJson, settle, type Reading } from '../api/memory-read.ts';

let failures = 0;
const check = (what: string, ok: boolean, detail = '') => {
  console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${what}${detail ? ' — ' + detail : ''}`);
  if (!ok) failures++;
};

const ROGUE: Reading = {
  tone: 'difficult',
  type: 'conflict',
  title: 'The same argument',
  acknowledgement: 'What a lovely evening!',
  date: null,
  place: null,
  feelings: ['hurt', 'angry', 'tired', 'sad'],
  needsFollowUp: true,
  nextQuestion: 'What do you most want to remember?',
  questionField: 'context',
  quickReplies: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'],
  // Everything below here is what a model that ignored its brief would send.
  defaultVisibility: 'shared',
  offerNextSteps: true,
  nextSteps: ['idea', 'reflect', 'talk_about'],
};

console.log('\nA model that ignored its brief');
const settled = settle(ROGUE);
check('a difficult memory comes back private', settled.defaultVisibility === 'private');
check(
  'and is not congratulated, whatever the model wrote',
  !/lovely|wonderful|great|congrat/i.test(settled.acknowledgement),
  settled.acknowledgement,
);
check('the date idea is dropped', !settled.nextSteps.includes('idea'), JSON.stringify(settled.nextSteps));
check('what remains is still offered', settled.offerNextSteps);
check('feelings are capped at three', settled.feelings.length === 3);
check('quick replies are capped at six', settled.quickReplies.length === 6);
check(
  'and when only the idea was on offer, nothing is',
  !settle({ ...ROGUE, nextSteps: ['idea'] }).offerNextSteps,
);
check(
  'a follow-up with no question is not a follow-up',
  !settle({ ...ROGUE, nextQuestion: null }).needsFollowUp,
);

console.log('\nThe wire shape, which uses empty strings for "nothing"');
const blank = settle({
  ...ROGUE,
  tone: 'positive',
  type: 'everyday_memory',
  date: '',
  place: '',
  needsFollowUp: true,
  nextQuestion: '',
  questionField: '' as Reading['questionField'],
});
check('an empty date comes back as null', blank.date === null);
check('an empty place comes back as null', blank.place === null);
check('an empty question is no question', blank.nextQuestion === null && !blank.needsFollowUp);
check('and an empty field name is none', blank.questionField === null);

console.log('\nA happy memory keeps what it was given');
const happy = settle({
  ...ROGUE,
  tone: 'positive',
  type: 'everyday_memory',
  defaultVisibility: 'shared',
  nextSteps: ['idea'],
});
check('the idea stands', happy.nextSteps.includes('idea'));
check('and it stays shared', happy.defaultVisibility === 'shared');
check(
  'while one the model marked private stays private',
  settle({ ...happy, defaultVisibility: 'private' }).defaultVisibility === 'private',
);

console.log('\nReading JSON back out of whatever it arrived wrapped in');
// The path taken when a model will not do structured output and is asked for
// JSON in words instead: it may fence it, or say something first.
const wrapped = [
  '{"tone":"difficult"}',
  '```json\n{"tone":"difficult"}\n```',
  '```\n{"tone":"difficult"}\n```',
  'Here you go:\n{"tone":"difficult"}\nHope that helps.',
];
for (const raw of wrapped) {
  let ok = false;
  try {
    ok = (parseJson(raw, 'test') as { tone?: string }).tone === 'difficult';
  } catch {
    ok = false;
  }
  if (!ok) failures++;
  console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${JSON.stringify(raw).slice(0, 52)}`);
}
{
  let threw = false;
  try {
    parseJson('I would rather not.', 'test');
  } catch {
    threw = true;
  }
  check('and prose with no JSON in it is an error, not a crash later', threw);
}

console.log('\nThe route itself');
/** The two fields the handler actually reads, shaped as the real thing. */
function req(method: string, body?: unknown) {
  return { method, body } as unknown as Parameters<typeof handler>[0];
}

function spy() {
  const out: { code?: number; body?: unknown } = {};
  const res = {
    status(code: number) {
      out.code = code;
      return res;
    },
    json(body: unknown) {
      out.body = body;
    },
  };
  return { res: res as unknown as Parameters<typeof handler>[1], out };
}

delete process.env.MEMORY_AI_API_KEY;
delete process.env.ANTHROPIC_API_KEY;
{
  const { res, out } = spy();
  await handler(req('POST', { note: 'hello' }), res);
  check('with no key it says so, rather than pretending', out.code === 503, JSON.stringify(out.body));
}
{
  const { res, out } = spy();
  await handler(req('GET'), res);
  const body = out.body as { configured: boolean; working: boolean };
  check(
    'a GET says it is off, without spending a call',
    out.code === 200 && body.configured === false && body.working === false,
    JSON.stringify(out.body),
  );
}
{
  const { res, out } = spy();
  await handler(req('PUT', {}), res);
  check('anything else is refused', out.code === 405);
}

process.env.MEMORY_AI_API_KEY = 'sk-ant-deliberately-invalid';
{
  // A key that is present but refused must not report itself as working: that
  // is the state where everything looks fine and nothing is being read.
  const { res, out } = spy();
  await handler(req('GET'), res);
  const body = out.body as { configured: boolean; working: boolean; reason?: string };
  check(
    'a key that is set but refused says so',
    out.code === 200 && body.configured === true && body.working === false && Boolean(body.reason),
    JSON.stringify(out.body),
  );
}
{
  const { res, out } = spy();
  await handler(req('POST', { note: '   ' }), res);
  check('an empty note is a bad request', out.code === 400, JSON.stringify(out.body));
}
{
  // Reaches the API and is turned away, or cannot reach it at all. Either way
  // the endpoint answers rather than throwing, which is what the client needs.
  const { res, out } = spy();
  await handler(req('POST', { note: 'a real note' }), res);
  check('an upstream failure comes back as one', out.code === 502 || out.code === 429, String(out.code));
}

console.log(failures ? `\nAI: ${failures} failed` : '\nAI: all passed');
process.exit(failures ? 1 : 0);
