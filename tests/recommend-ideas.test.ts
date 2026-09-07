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
import { settle, parsePicks, enoughToChooseFrom } from '../api/recommend-ideas';
import { DATE_IDEAS } from '../shared/dateIdeas';
import {
  diversify,
  emptyContext,
  isEligible,
  localRecommendations,
  rankCandidates,
  MAX_PER_CATEGORY,
  type CoupleContext,
} from '../shared/ideaRank';
import type { Daypart, IdeaFilters, Setting, Vibe } from '../shared/ideaTypes';

import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

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

  /*
   * Different cities is a preference, not a wall: people an hour apart do see
   * each other, and deleting every in-person idea would delete most of the app
   * for them. So the promise is eligibility — they can still be offered — and
   * that they surface as soon as the couple asks for something shaped like
   * being in a room together.
   */
  const nearish: CoupleContext = { ...emptyContext(), proximity: 'different-cities' };
  check(
    'different cities keeps in-person ideas eligible',
    DATE_IDEAS.filter((i) => i.mode === 'in_person').every((i) => isEligible(i, F(), nearish)),
  );
  const outdoors = rankCandidates(F({ setting: 'out', vibe: 'adventurous' }), nearish);
  check(
    'and they are actually offered when the couple asks for one',
    outdoors.some((c) => c.idea.mode === 'in_person'),
  );
  const first = rankCandidates(F(), nearish)[0];
  check(
    'but something they can do apart leads, all else equal',
    first.idea.mode !== 'in_person',
    first.idea.title,
  );

  // And the mirror: distance is the premise of a remote idea, so without it
  // the idea does not make sense rather than merely appealing less.
  let odd: string | null = null;
  for (const f of everyCombination()) {
    for (const r of localRecommendations(f, emptyContext(), 5)) {
      if (byId.get(r.id)!.mode === 'remote') odd = byId.get(r.id)!.title;
    }
  }
  check('two people in the same kitchen are never told to get on a call', odd === null, odd ?? '');

  // One evening, one form of it.
  let twice: string | null = null;
  for (const ctx of [emptyContext(), nearish, apart]) {
    for (const f of everyCombination()) {
      const families = rankCandidates(f, ctx, { limit: 100 })
        .map((c) => c.idea.familyId)
        .filter(Boolean);
      if (new Set(families).size !== families.length) twice = `${ctx.proximity}: ${families.join(',')}`;
    }
  }
  check('never both forms of the same idea at once', twice === null, twice ?? '');
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

  /*
   * A request the corpus cannot answer exactly. It has to be built rather than
   * found: the corpus now covers all 192 combinations for couples in the same
   * place and for couples apart, which is the point of the coverage script —
   * so the near-miss path needs a pool small enough to run out.
   */
  const thin = F({ daypart: 'morning', setting: 'out', budget: 0, vibe: 'adventurous' });
  const scarce = DATE_IDEAS.filter((i) => i.setting === 'home' && i.cost === 0).slice(0, 8);
  const alts = localRecommendations(thin, emptyContext(), 5, scarce);
  check('a thin request still returns five', alts.length === 5, `${alts.length}`);
  /*
   * The compromise is carried by `missed`, which is what the card turns into
   * "Close match · Evening instead of Morning". It is deliberately not also in
   * the reason — saying it twice, in two registers, was the first thing that
   * looked wrong on screen.
   */
  const nearMisses = alts.filter((r) => r.tier > 0);
  check(
    'every compromise names itself',
    nearMisses.length > 0 && nearMisses.every((r) => r.missed.length === r.tier),
  );
  check(
    'and the reason does not repeat it',
    nearMisses.every((r) => !/close match/i.test(r.reason)),
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

  const overlong = 'x'.repeat(600);
  const rogue = [
    { id: 'i-does-not-exist', reason: 'invented' },
    { id: legit, reason: overlong },
    { id: legit, reason: 'the same one twice' },
  ];
  const out = settle(rogue, candidates, 5);

  check('an id that was never offered is discarded', !out.some((r) => r.id === 'i-does-not-exist'));
  check('a duplicate appears once', out.filter((r) => r.id === legit).length === 1);
  check(
    'a runaway reason is cut to caption length',
    (out.find((r) => r.id === legit)?.reason.length ?? 0) <= 120,
  );
  /*
   * The card is the app's, not the model's. It only writes the reason now —
   * asking it to rewrite titles and descriptions it was reading off a list
   * was three quarters of the output tokens and bought nothing.
   */
  check(
    'the title comes from the corpus, never from the model',
    out.every((r) => byId.get(r.id)!.title === r.title),
  );
  check(
    'and so do the description and tags',
    out.every((r) => r.description === byId.get(r.id)!.description && r.tags.length === 3),
  );
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
  const reversed = [...thinCandidates].reverse().map((c) => ({ id: c.idea.id, reason: '' }));
  const fixed = settle(reversed, thinCandidates, 5);
  let inverted = false;
  for (let i = 1; i < fixed.length; i++) if (fixed[i].tier < fixed[i - 1].tier) inverted = true;
  check('a model that ignored the tiers is re-sorted back into them', !inverted);

  check('a card with no reason is still a whole card', Boolean(fixed[0].title && fixed[0].description));
}

group('Parsing what came back');
{
  const wrapped = '```json\n{"picks":[{"id":"i-pasta","reason":"r"}]}\n```';
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

/* --------------------------- Will it even load? --------------------------- */

group('The endpoint can actually be imported where it runs');
{
  /*
   * This one is not about recommendations at all. It caught a production
   * outage: the function deployed cleanly and then died on every request with
   * ERR_MODULE_NOT_FOUND.
   *
   * Vercel's Node builder compiles each traced .ts to .js at the same relative
   * path, and rewrites an import specifier only when it already ends in .ts or
   * .tsx. An extensionless relative specifier is passed through untouched —
   * and package.json says "type": "module", so Node resolves it strictly, with
   * no extension guessing. `from '../shared/dateIdeas'` therefore becomes a
   * request for a file called exactly `dateIdeas`, which does not exist.
   *
   * Nothing catches this before deployment: tsc resolves it, esbuild bundles
   * it, Vite serves it, and every test here passes, because none of them are
   * Node resolving loose ESM files on a disk. So the shape of the specifier is
   * checked directly instead.
   *
   * Type-only imports are erased and cannot fail at runtime, but they are held
   * to the same rule: the day one becomes a value import is not the day to
   * rediscover this.
   */
  const shipped = ['api', 'shared'];
  const bad: string[] = [];

  for (const dir of shipped) {
    for (const name of readdirSync(join(process.cwd(), dir))) {
      if (!name.endsWith('.ts') || name.endsWith('.d.ts')) continue;
      const source = readFileSync(join(process.cwd(), dir, name), 'utf8');
      for (const m of source.matchAll(/from\s+'(\.[^']*)'/g)) {
        const specifier = m[1];
        if (!/\.(js|mjs|cjs|json)$/.test(specifier)) {
          bad.push(`${dir}/${name}: ${specifier}`);
        }
      }
    }
  }

  check(
    'every relative import that ships carries a .js extension',
    bad.length === 0,
    bad.join('; '),
  );
}

group('How much the model is asked to look at');
{
  /*
   * Twelve, not twenty. The screen pages five at a time and rarely reaches
   * the third page, so the other eight were ideas nobody would see, each
   * costing a line of output — which is what made a request take twenty
   * seconds.
   */
  let widest = 0;
  let thinnest = Infinity;
  for (const f of everyCombination()) {
    const n = enoughToChooseFrom(f, emptyContext(), 5).length;
    widest = Math.max(widest, n);
    thinnest = Math.min(thinnest, n);
  }
  check('normally twelve at most', widest <= 12, `widest was ${widest}`);
  check('and never fewer than the five being shown', thinnest >= 5, `thinnest was ${thinnest}`);

  /*
   * It widens for exactly one reason, and it has to actually work: the
   * diversity rule allows two per category, so five slots need three kinds
   * of evening. A pool that cannot offer three in its first twelve should
   * make the list grow rather than run out of variety at slot four.
   */
  const base = DATE_IDEAS.find((i) => i.mode !== 'remote' && i.cost === 0)!;
  /* Ids are the final tie-break, so numbering them fixes the order: the first
     twelve are all one kind, and the third kind only appears past that. */
  const lopsided = Array.from({ length: 20 }, (_, n) => ({
    ...base,
    id: `z-${String(n).padStart(2, '0')}`,
    category: n < 12 ? ('outdoors' as const) : n < 16 ? ('food' as const) : ('game' as const),
  }));
  const widened = enoughToChooseFrom(F(), emptyContext(), 5, lopsided);
  const kinds = new Set(widened.map((c) => c.idea.category));
  check(
    'a lopsided pool makes it reach further for a third kind',
    widened.length > 12 && kinds.size >= 3,
    `${widened.length} candidates, ${kinds.size} kinds`,
  );
  check('but never past twenty', widened.length <= 20, `${widened.length}`);
}

group('The three timeouts fire in a useful order');
{
  /*
   * Client < SDK < platform, and never any other way round.
   *
   * Getting this backwards is what produced "AbortError: Fetch is aborted" on
   * every ask in production: the phone gave up at 15s while the model was
   * still answering. The order matters beyond that one bug — when the phone
   * does give up, the request has to survive long enough to finish and write
   * down how long it took, and the platform must never be the thing that
   * kills it, because a platform kill looks exactly like the model failing
   * and explains nothing.
   */
  const read = (file: string) => readFileSync(join(process.cwd(), file), 'utf8');
  const num = (source: string, re: RegExp): number => {
    const m = source.match(re);
    return m ? Number(m[1].replace(/_/g, '')) : NaN;
  };

  const client = read('src/lib/ideaAi.ts');
  const server = read('api/recommend-ideas.ts');

  const clientMs = num(client, /const TIMEOUT_MS = ([\d_]+);/);
  const sdkMs = num(server, /timeout: ([\d_]+),\s*maxRetries/);
  const platformS = num(server, /maxDuration: (\d+)/);

  check('the phone gives up first', clientMs < sdkMs, `${clientMs}ms < ${sdkMs}ms`);
  check(
    'with real headroom, not a rounding error',
    sdkMs - clientMs >= 10_000,
    `${(sdkMs - clientMs) / 1000}s of headroom`,
  );
  check(
    'and the platform outlasts the request it is running',
    platformS * 1000 > sdkMs,
    `${platformS}s > ${sdkMs / 1000}s`,
  );
  check('the client waits at least 30s', clientMs >= 30_000, `${clientMs / 1000}s`);
}

console.log(failures ? `\nIdeas: ${failures} failed` : '\nIdeas: all passed');
process.exit(failures ? 1 : 0);
