/**
 * The promises the recommender makes that a prompt cannot keep.
 *
 * Everything the model does is a request. These are the things that must be
 * true whatever it returns, so they are enforced in code and checked here:
 * nothing over budget, nothing two people in different cities cannot do, and
 * a preference someone actually chose is never traded away for one they did
 * not. The rest — wording, which near miss is worth showing — is the model's,
 * and none of it is tested because none of it is a promise.
 *
 * Run with: npm run test:ideas
 *
 * Lives here rather than beside the endpoint because Vercel turns every file
 * under api/ into a public serverless function.
 */
import { settle, parsePicks } from '../api/recommend-ideas';
import { DATE_IDEAS } from '../shared/dateIdeas';
import {
  diversify,
  emptyContext,
  localRecommendations,
  rankCandidates,
  MAX_PER_CATEGORY,
  type CoupleContext,
} from '../shared/ideaRank';
import type { Daypart, IdeaFilters, Setting, Vibe } from '../shared/ideaTypes';

let failures = 0;
const check = (what: string, ok: boolean, detail = '') => {
  console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${what}${detail ? ' — ' + detail : ''}`);
  if (!ok) failures++;
};
const group = (name: string) => console.log(`\n${name}`);

const F = (p: Partial<IdeaFilters> = {}): IdeaFilters => ({
  daypart: null, duration: null, budget: null, setting: null, vibe: null, energy: null, ...p,
});
const byId = new Map(DATE_IDEAS.map((i) => [i.id, i]));

const WHEN: Daypart[] = ['morning', 'afternoon', 'evening', 'late'];
const WHERE: (Setting | null)[] = ['home', 'out', null];
const SPEND: (number | null)[] = [0, 30, 80, null];
const VIBES: Vibe[] = ['relaxing', 'romantic', 'fun', 'adventurous'];

/** Every filter combination the four rows can produce. */
function* everyCombination() {
  for (const daypart of WHEN)
    for (const setting of WHERE)
      for (const budget of SPEND)
        for (const vibe of VIBES) yield F({ daypart, setting, budget, vibe });
}

/* ------------------------------- Hard limits ------------------------------ */

group('Budget is a ceiling, not a suggestion');
{
  let worst: string | null = null;
  let n = 0;
  for (const f of everyCombination()) {
    n++;
    for (const r of localRecommendations(f, emptyContext(), 5)) {
      const idea = byId.get(r.id)!;
      if (f.budget != null && idea.cost > f.budget) worst = `${idea.title} €${idea.cost} > €${f.budget}`;
    }
  }
  check(`nothing over budget, across all ${n} filter combinations`, worst === null, worst ?? '');
}

group('Two people in different places');
{
  const apart: CoupleContext = { ...emptyContext(), proximity: 'long-distance' };
  let leaked: string | null = null;
  for (const f of everyCombination()) {
    for (const r of localRecommendations(f, apart, 5)) {
      if (byId.get(r.id)!.mode === 'in_person') leaked = byId.get(r.id)!.title;
    }
  }
  check('long distance is never offered an in-person idea', leaked === null, leaked ?? '');

  // Different cities is a preference, not a wall: people an hour apart do meet.
  const nearish: CoupleContext = { ...emptyContext(), proximity: 'different-cities' };
  const got = rankCandidates(F(), nearish);
  check(
    'different cities still sees in-person ideas',
    got.some((c) => c.idea.mode === 'in_person'),
  );
  const first = got[0];
  check(
    'but something they can do apart ranks above one they cannot, all else equal',
    first.idea.mode !== 'in_person',
    first.idea.title,
  );
}

/* --------------------------------- Tiers ---------------------------------- */

group('An exact match is never displaced by a near one');
{
  let inverted: string | null = null;
  for (const f of everyCombination()) {
    const rs = localRecommendations(f, emptyContext(), 5);
    for (let i = 1; i < rs.length; i++) {
      if (rs[i].tier < rs[i - 1].tier) inverted = `${rs[i - 1].title} (t${rs[i - 1].tier}) before ${rs[i].title} (t${rs[i].tier})`;
    }
  }
  check('results are in tier order everywhere', inverted === null, inverted ?? '');

  const f = F({ daypart: 'evening', setting: 'home', budget: 30, vibe: 'romantic' });
  const rs = localRecommendations(f, emptyContext(), 5);
  check('a well-served request is all exact matches', rs.every((r) => r.tier === 0));
  check('and says so rather than apologising', rs[0].reason.includes('everything you asked for'));

  const thin = F({ daypart: 'morning', budget: 0, vibe: 'relaxing' });
  const alts = localRecommendations(thin, emptyContext(), 5);
  check('a thin request still returns five', alts.length === 5, `${alts.length}`);
  check(
    'and every compromise names itself',
    alts.filter((r) => r.tier > 0).every((r) => r.missed.length > 0 && r.reason.includes('Close match')),
  );
}

/* -------------------------------- Signals --------------------------------- */

group('History orders within a tier and never across one');
{
  const done: CoupleContext = { ...emptyContext(), done: ['i-bath'] };
  const f = F({ daypart: 'evening', setting: 'home', budget: 30, vibe: 'romantic' });
  const before = localRecommendations(f, emptyContext(), 5).findIndex((r) => r.id === 'i-bath');
  const rs = localRecommendations(f, done, 5);
  const after = rs.findIndex((r) => r.id === 'i-bath');
  // -1 means it fell off the page altogether, which is further down, not up.
  const place = (i: number) => (i === -1 ? Number.MAX_SAFE_INTEGER : i);
  check(
    'an idea already done is pushed down',
    place(after) > place(before),
    `${before} -> ${after === -1 ? 'off the page' : after}`,
  );
  check('but is still an exact match, not demoted out of its tier', rs.every((r) => r.tier === 0));

  // Hearting something says "more like this", not "never again".
  const liked: CoupleContext = { ...emptyContext(), liked: ['i-listening'] };
  const withLike = localRecommendations(F(), liked, 5).map((r) => r.id);
  check('the hearted card itself is not served back as a discovery', !withLike.includes('i-listening'));
  const conversation = withLike.filter((id) => byId.get(id)!.category === 'conversation');
  check(
    'but more of its kind is',
    conversation.length > 0,
    `${conversation.length} conversation ideas`,
  );
}

group('Already on screen, this run only');
{
  const shown = ['i-bath', 'i-cinemahome'];
  const rs = localRecommendations(F({ daypart: 'evening' }), { ...emptyContext(), shown }, 5);
  check('nothing already shown comes back on the next page', rs.every((r) => !shown.includes(r.id)));
}

/* ------------------------------- Diversity -------------------------------- */

group('No one kind of evening takes over');
{
  let over: string | null = null;
  for (const f of everyCombination()) {
    const rs = localRecommendations(f, emptyContext(), 5);
    /*
     * The cap is allowed to give way, but only inside a tier that has nothing
     * else to offer — never by reaching into a worse-matching one. So the
     * question is not "were there other categories anywhere", it is "were
     * there other categories at this tier".
     */
    const perTier = new Map<number, Map<string, number>>();
    for (const r of rs) {
      const c = byId.get(r.id)!.category;
      const counts = perTier.get(r.tier) ?? new Map<string, number>();
      counts.set(c, (counts.get(c) ?? 0) + 1);
      perTier.set(r.tier, counts);
    }
    for (const [tier, counts] of perTier) {
      const overflowing = [...counts].filter(([, n]) => n > MAX_PER_CATEGORY);
      if (!overflowing.length) continue;

      /*
       * How many this tier had to supply, and the most it could have supplied
       * while honouring the cap. Going over is only a bug when the tier could
       * have filled those slots within the cap and chose not to.
       */
      const needed = [...counts.values()].reduce((a, b) => a + b, 0);
      const available = new Map<string, number>();
      for (const p of rankCandidates(f, emptyContext(), { limit: 40 })) {
        if (p.tier !== tier) continue;
        available.set(p.idea.category, (available.get(p.idea.category) ?? 0) + 1);
      }
      const capacityUnderCap = [...available.values()].reduce(
        (a, n) => a + Math.min(n, MAX_PER_CATEGORY),
        0,
      );

      if (capacityUnderCap >= needed) {
        const [c, n] = overflowing[0];
        over = `tier ${tier}: ${c} ×${n}, though ${capacityUnderCap} were available under the cap for ${needed} slots`;
      }
    }
  }
  check('at most two of a category while its tier has anything else', over === null, over ?? '');
}

/* ----------------------------- Model output ------------------------------- */

group('What the model returns is checked, not trusted');
{
  const f = F({ daypart: 'evening', setting: 'home', budget: 30, vibe: 'romantic' });
  const candidates = rankCandidates(f, emptyContext(), { limit: 20 });
  const legit = candidates[0].idea.id;

  const rogue = [
    { id: 'i-does-not-exist', title: 'Invented', description: 'x', tags: ['a'], reason: 'r' },
    { id: legit, title: 'Real', description: 'd', tags: ['a', 'b', 'c', 'd', 'e'], reason: 'r' },
    { id: legit, title: 'Same one twice', description: 'd', tags: [], reason: 'r' },
  ];
  const out = settle(rogue, candidates, 5);

  check('an id that was never offered is discarded', !out.some((r) => r.id === 'i-does-not-exist'));
  check('a duplicate appears once', out.filter((r) => r.id === legit).length === 1);
  check('tags are capped at three', out.every((r) => r.tags.length <= 3));
  check('a short answer is topped up from our own ranking', out.length >= 5, `${out.length}`);
  check(
    'every id returned was a candidate',
    out.every((r) => candidates.some((c) => c.idea.id === r.id)),
  );
  check(
    'nothing over budget survived the model',
    out.every((r) => byId.get(r.id)!.cost <= 30),
  );

  // A model that ranked purely on taste, ignoring the tiers entirely.
  const thin = F({ daypart: 'morning', budget: 0, vibe: 'relaxing' });
  const thinCandidates = rankCandidates(thin, emptyContext(), { limit: 20 });
  const reversed = [...thinCandidates].reverse().map((c) => ({
    id: c.idea.id, title: '', description: '', tags: [], reason: '',
  }));
  const fixed = settle(reversed, thinCandidates, 5);
  let inverted = false;
  for (let i = 1; i < fixed.length; i++) if (fixed[i].tier < fixed[i - 1].tier) inverted = true;
  check('a model that ignored the tiers is re-sorted back into them', !inverted);

  check(
    'an empty title falls back to the idea’s own',
    fixed[0].title === byId.get(fixed[0].id)!.title,
  );
}

group('Parsing what came back');
{
  const wrapped = '```json\n{"picks":[{"id":"i-pasta","title":"t","description":"d","tags":[],"reason":"r"}]}\n```';
  check('a fenced answer parses', parsePicks(wrapped, 'test')[0].id === 'i-pasta');
  check('prose around the object parses', parsePicks('Sure!\n{"picks":[]}\nhope that helps', 'test').length === 0);
  let threw = false;
  try { parsePicks('no json at all', 'test'); } catch { threw = true; }
  check('prose with no JSON is an error, not a crash later', threw);
}

/* ------------------------------ Determinism ------------------------------- */

group('The rules are deterministic (the model is not, and does not claim to be)');
{
  const f = F({ vibe: 'fun', budget: 30 });
  const a = JSON.stringify(localRecommendations(f, emptyContext(), 5));
  const b = JSON.stringify(localRecommendations(f, emptyContext(), 5));
  check('the same request twice gives the same answer', a === b);

  const c = JSON.stringify(rankCandidates(f, emptyContext()).map((x) => x.idea.id));
  const d = JSON.stringify(rankCandidates(f, emptyContext()).map((x) => x.idea.id));
  check('and so does the candidate list behind it', c === d);
}

group('Running out is not the same as failing');
{
  const everything: CoupleContext = { ...emptyContext(), shown: DATE_IDEAS.map((i) => i.id) };
  const rs = localRecommendations(F(), everything, 5);
  check('when everything has been seen, the list is empty rather than repeated', rs.length === 0);
  check('and diversify copes with nothing to diversify', diversify([], 5).length === 0);
}

console.log(failures ? `\nIdeas: ${failures} failed` : '\nIdeas: all passed');
process.exit(failures ? 1 : 0);
