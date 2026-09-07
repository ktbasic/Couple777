import { DATE_IDEAS } from '../shared/dateIdeas';
import { emptyContext, rankCandidates, type CoupleContext } from '../shared/ideaRank';
import type { Daypart, IdeaCategory, IdeaFilters, Setting, Vibe } from '../shared/ideaTypes';

/**
 * Where the corpus is thin, measured rather than guessed.
 *
 * Run it after adding ideas: `npm run coverage`. It walks every combination
 * the four Explore rows can produce and reports the ones with no exact match,
 * so the next tranche of writing is aimed at a hole somebody will actually hit
 * instead of at a round number of ideas.
 *
 * A combination with no exact match is not broken — the ranker will offer
 * near misses and label them — but it is a screen where nobody gets what they
 * asked for, and those are worth knowing about by name.
 */

const WHEN: Daypart[] = ['morning', 'afternoon', 'evening', 'late'];
const WHERE: (Setting | null)[] = ['home', 'out', null];
const SPEND: (number | null)[] = [0, 30, 80, null];
const VIBES: Vibe[] = ['relaxing', 'romantic', 'fun', 'adventurous'];

const WORD = {
  budget: (b: number | null) => (b === null ? 'any budget' : b === 0 ? 'free' : `up to €${b}`),
  setting: (s: Setting | null) => (s === null ? 'either' : s === 'home' ? 'indoor' : 'outdoor'),
  vibe: { relaxing: 'cozy', romantic: 'romantic', fun: 'playful', adventurous: 'adventurous' } as Record<Vibe, string>,
};

const F = (p: Partial<IdeaFilters>): IdeaFilters => ({
  daypart: null, duration: null, budget: null, setting: null, vibe: null, energy: null, ...p,
});

interface Hole {
  label: string;
  exact: number;
  reachable: number;
}

function scan(ctx: CoupleContext): Hole[] {
  const holes: Hole[] = [];
  for (const daypart of WHEN)
    for (const setting of WHERE)
      for (const budget of SPEND)
        for (const vibe of VIBES) {
          const f = F({ daypart, setting, budget, vibe });
          const ranked = rankCandidates(f, ctx, { limit: 100 });
          const exact = ranked.filter((c) => c.tier === 0).length;
          if (exact === 0) {
            holes.push({
              label: `${daypart} · ${WORD.setting(setting)} · ${WORD.budget(budget)} · ${WORD.vibe[vibe]}`,
              exact,
              reachable: ranked.length,
            });
          }
        }
  return holes;
}

/** Which axis the holes cluster on — the actual brief for new ideas. */
function cluster(holes: Hole[]) {
  const axes: Record<string, Record<string, number>> = {
    time: {}, setting: {}, budget: {}, vibe: {},
  };
  const names = ['time', 'setting', 'budget', 'vibe'];
  for (const h of holes) {
    h.label.split(' · ').forEach((part, i) => {
      const axis = axes[names[i]];
      axis[part] = (axis[part] ?? 0) + 1;
    });
  }
  return axes;
}

function report(title: string, ctx: CoupleContext) {
  const holes = scan(ctx);
  const total = WHEN.length * WHERE.length * SPEND.length * VIBES.length;

  console.log(`\n${title}`);
  console.log(`  ${holes.length} of ${total} combinations have no exact match (${Math.round((holes.length / total) * 100)}%)`);
  if (!holes.length) return;

  const axes = cluster(holes);
  for (const [axis, counts] of Object.entries(axes)) {
    const line = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([k, n]) => `${k} ${n}`)
      .join(', ');
    console.log(`    by ${axis.padEnd(8)} ${line}`);
  }

  console.log('\n  The worst of them, in order:');
  for (const h of holes.slice(0, 20)) {
    console.log(`    ${h.label.padEnd(52)} ${h.reachable} near misses to fall back on`);
  }
}

console.log(`Corpus: ${DATE_IDEAS.length} ideas`);
const byCategory = new Map<IdeaCategory, number>();
const byMode = new Map<string, number>();
for (const i of DATE_IDEAS) {
  byCategory.set(i.category, (byCategory.get(i.category) ?? 0) + 1);
  byMode.set(i.mode, (byMode.get(i.mode) ?? 0) + 1);
}
console.log('  by category:', Object.fromEntries(byCategory));
console.log('  by mode:    ', Object.fromEntries(byMode));
console.log(`  free: ${DATE_IDEAS.filter((i) => i.cost === 0).length}   most expensive: €${Math.max(...DATE_IDEAS.map((i) => i.cost))}`);

report('Couples in the same place', emptyContext());
report('Couples living apart (in-person ideas are ineligible)', {
  ...emptyContext(),
  proximity: 'long-distance',
});
