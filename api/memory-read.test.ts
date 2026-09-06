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
 */
import handler, { settle, type Reading } from './memory-read.ts';

let failures = 0;
const check = (what: string, ok: boolean, detail = '') => {
  console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${what}${detail ? ' — ' + detail : ''}`);
  if (!ok) failures++;
};

const ROGUE: Reading = {
  tone: 'difficult',
  type: 'conflict',
  title: 'The same argument',
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

console.log('\nThe route itself');
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
  return { res, out };
}

delete process.env.MEMORY_AI_API_KEY;
delete process.env.ANTHROPIC_API_KEY;
{
  const { res, out } = spy();
  await handler({ method: 'POST', body: { note: 'hello' } }, res);
  check('with no key it says so, rather than pretending', out.code === 503, JSON.stringify(out.body));
}
{
  const { res, out } = spy();
  await handler({ method: 'GET' }, res);
  check(
    'a GET says it is off, without spending a call',
    out.code === 200 && (out.body as { configured: boolean }).configured === false,
    JSON.stringify(out.body),
  );
}
{
  const { res, out } = spy();
  await handler({ method: 'PUT', body: {} }, res);
  check('anything else is refused', out.code === 405);
}

process.env.MEMORY_AI_API_KEY = 'sk-ant-deliberately-invalid';
{
  const { res, out } = spy();
  await handler({ method: 'GET' }, res);
  check(
    'and with a key, that it is on',
    out.code === 200 && (out.body as { configured: boolean }).configured === true,
  );
}
{
  const { res, out } = spy();
  await handler({ method: 'POST', body: { note: '   ' } }, res);
  check('an empty note is a bad request', out.code === 400, JSON.stringify(out.body));
}
{
  // Reaches the API and is turned away, or cannot reach it at all. Either way
  // the endpoint answers rather than throwing, which is what the client needs.
  const { res, out } = spy();
  await handler({ method: 'POST', body: { note: 'a real note' } }, res);
  check('an upstream failure comes back as one', out.code === 502 || out.code === 429, String(out.code));
}

console.log(failures ? `\nAI: ${failures} failed` : '\nAI: all passed');
process.exit(failures ? 1 : 0);
