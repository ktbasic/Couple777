import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Screen, ScreenHeader, Section } from '@/components/layout/Screen';
import { Segmented } from '@/components/ui/Segmented';
import { Chip, ChipRow } from '@/components/ui/Chip';
import { Photo } from '@/components/ui/Photo';
import { Button } from '@/components/ui/Button';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { IdeaCard } from '@/features/IdeaCard';
import { AdventureCard } from '@/features/AdventureCard';
import { DestinationCard, MatchReveal } from '@/features/DestinationCard';
import { DATE_IDEAS } from '@/data/dateIdeas';
import {
  DISTANCE_OPTIONS,
  EMPTY_FILTERS,
  MOOD_OPTIONS,
  generateAdventures,
} from '@/lib/generator';
import {
  recommendIdeas,
  fallbackReason,
  lastLatency,
  type RecommendationSource,
  type Recommendations,
} from '@/lib/ideaAi';
import { contextFromState } from '@/lib/ideaContext';
import { useStore } from '@/context/store';
import { TIER_META } from '@/lib/dates';
import { ideaMatches, matches, newMatch, sharedIdeas } from '@/lib/selectors';
import type {
  DateIdea,
  SavedIdea,
  AdventureMood,
  Daypart,
  Distance,

  IdeaFilters,
  Setting,
  Vibe,
} from '@/lib/types';
import s from './Explore.module.css';

type Tab = 'day' | 'week' | 'month';

export default function ExploreScreen() {
  const { state } = useStore();
  const [params, setParams] = useSearchParams();

  // Arriving from a 777 card carries the cycle, and the cycle already knows
  // the tier — so the couple is never asked what kind of thing they are
  // planning. Browsing without a cycle keeps the manual tabs.
  const cycle = state.cycles.find((c) => c.id === params.get('cycle'));
  const tierParam = params.get('tier');
  const tab: Tab = cycle
    ? cycle.tier
    : tierParam === 'week' || tierParam === 'month'
      ? tierParam
      : 'day';

  const setTab = (t: Tab) => {
    params.set('tier', t);
    setParams(params, { replace: true });
  };

  return (
    <Screen>
      <ScreenHeader
        eyebrow="Explore"
        title={
          cycle
            ? `Ideas for your ${TIER_META[cycle.tier].cadence} moment`
            : 'Explore your next date ideas'
        }
        sub={
          cycle
            ? TIER_META[cycle.tier].hint
            : 'A few taps, and we’ll do the rest.'
        }
      />

      {cycle ? (
        <p className={s.cycleBanner}>
          <span aria-hidden>🌿</span>
          <span>
            Planning your {TIER_META[cycle.tier].cadence} moment. Whatever you pick counts for it.
          </span>
        </p>
      ) : (
        <div className={s.tabs}>
          <Segmented<Tab>
            value={tab}
            onChange={setTab}
            options={[
              { value: 'day', label: 'Dates' },
              { value: 'week', label: 'Nearby' },
              { value: 'month', label: 'Big trips' },
            ]}
          />
        </div>
      )}

      {tab === 'day' ? <DateIdeasTab cycleId={cycle?.id} /> : null}
      {tab === 'week' ? <MiniAdventuresTab cycleId={cycle?.id} /> : null}
      {tab === 'month' ? <BigAdventuresTab /> : null}
    </Screen>
  );
}

/* ------------------------------ 7 days ---------------------------------- */

/*
 * Four questions, in the order someone actually thinks them: when, where, how
 * much, what kind of evening. None of them is required — a row left alone is
 * not an unanswered question, it is "no preference", which is the most common
 * honest answer and the fastest one to give.
 *
 * Energy is not here. It asked people to rate their own capacity before they
 * had been shown anything, and the generator reads it out of the vibe well
 * enough — a cosy night in is not a high-energy one.
 */
const WHEN: { label: string; value: Daypart }[] = [
  { label: 'Morning', value: 'morning' },
  { label: 'Afternoon', value: 'afternoon' },
  { label: 'Evening', value: 'evening' },
  { label: 'Night', value: 'late' },
];

/* "Either" is a real answer rather than a third place: picking it clears the
   row, which is what no preference means to the generator. */
const WHERE: { label: string; value: Setting | null }[] = [
  { label: 'Indoor', value: 'home' },
  { label: 'Outdoor', value: 'out' },
  { label: 'Either', value: null },
];

/*
 * A ceiling for two people, phrased the way someone would say it out loud.
 *
 * "€80+" used to sit here and was a lie in both directions: it read as a floor
 * while behaving as a ceiling of 999, and since nothing in the corpus costs
 * more than €60 it selected exactly what "€30–80" selected. "No limit" is what
 * that chip always meant, and null is what it always did.
 */
const SPEND: { label: string; value: number | null }[] = [
  { label: 'Free', value: 0 },
  { label: 'Up to €30', value: 30 },
  { label: 'Up to €80', value: 80 },
  { label: 'No limit', value: null },
];

/** The four moods people name. Mapped onto the axis the ideas are tagged on. */
const VIBES: { label: string; value: Vibe }[] = [
  { label: 'Cozy', value: 'relaxing' },
  { label: 'Romantic', value: 'romantic' },
  { label: 'Playful', value: 'fun' },
  { label: 'Adventurous', value: 'adventurous' },
];

/**
 * A circling arrow: the one shape that reads as "again" without a word next to
 * it. Drawn rather than an emoji so it inherits the button's colour and sits
 * on the text baseline instead of hanging below it.
 */
function RefreshMark() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden className={s.refreshMark}>
      <path
        d="M20 12a8 8 0 1 1-2.34-5.66"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.1"
        strokeLinecap="round"
      />
      <path d="M20 3.5V9h-5.5" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * What the screen says while it waits.
 *
 * One line held for the whole wait is fine for one second and wrong for
 * fifteen: a message that has not changed reads as a message that is stuck.
 * These move, slowly, and each one is true of what is actually happening at
 * that moment rather than invented progress — nothing here is a fake
 * percentage. The last one is the honest one, and it is the last because by
 * then the phone is about to stop waiting anyway.
 */
const WAITING: { after: number; line: string }[] = [
  { after: 0, line: 'Finding something for you two…' },
  { after: 4_000, line: 'Reading what you both like…' },
  { after: 10_000, line: 'Narrowing it down…' },
  { after: 18_000, line: 'Nearly there — this one is taking a moment.' },
];

function WaitingLine() {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const started = Date.now();
    const id = window.setInterval(() => setElapsed(Date.now() - started), 500);
    return () => window.clearInterval(id);
  }, []);

  const line = [...WAITING].reverse().find((w) => elapsed >= w.after)?.line ?? WAITING[0].line;

  return (
    <p className={s.loadingText} aria-live="polite">
      {line}
    </p>
  );
}

function DateIdeasTab({ cycleId }: { cycleId?: string }) {
  const { state, me, partner } = useStore();
  const [params, setParams] = useSearchParams();
  const resultsRef = useRef<HTMLDivElement>(null);

  // A cue from Talk arrives as query params, so the generator opens already
  // pointed at what the couple just said to each other.
  const cued = useMemo<IdeaFilters>(() => {
    const read = <T extends string>(key: string) => (params.get(key) as T | null) ?? null;
    return {
      ...EMPTY_FILTERS,
      daypart: read<Daypart>('daypart'),
      setting: read<Setting>('setting'),
      vibe: read<Vibe>('vibe'),
    };
  }, [params]);

  const hasCue = Boolean(cued.daypart || cued.setting || cued.vibe);
  const [filters, setFilters] = useState<IdeaFilters>(cued);
  const [loading, setLoading] = useState(false);
  /*
   * "Either" and "not answered" are the same value to the ranker and two
   * different things to a person. This remembers that the row was answered, so
   * an untouched screen does not open with a chip already lit.
   */
  const [settingAnswered, setSettingAnswered] = useState(Boolean(cued.setting));
  /* Same for Budget: "No limit" and "not answered" are both null. */
  const [budgetAnswered, setBudgetAnswered] = useState(false);

  /*
   * One ask, one ranked list, paged through five at a time.
   *
   * "More ideas" moves down this list rather than asking again. Asking again
   * would cost another model call and, worse, could answer the same question
   * differently — a model's ordering is stable inside one response and nowhere
   * else. Changing a filter throws the list away, because it is an answer to a
   * question nobody is asking any more.
   */
  const [result, setResult] = useState<Recommendations | null>(null);
  const [page, setPage] = useState(0);
  const [source, setSource] = useState<RecommendationSource | null>(null);

  const context = useMemo(() => contextFromState(state, me.id), [state, me.id]);

  const PER_PAGE = 5;
  const showing = result ? result.items.slice(page * PER_PAGE, page * PER_PAGE + PER_PAGE) : [];
  const more = result ? (page + 1) * PER_PAGE < result.items.length : false;

  /** Everything on screen already, so a second page is a second page. */
  const ask = async (next: IdeaFilters, keepShown: string[] = []) => {
    setLoading(true);
    setPage(0);
    try {
      const got = await recommendIdeas(next, { ...context, shown: keepShown }, PER_PAGE);
      setResult(got);
      setSource(got.source);
    } finally {
      setLoading(false);
      window.setTimeout(
        () => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
        60,
      );
    }
  };

  useEffect(() => {
    if (!hasCue) return;
    setFilters(cued);
    void ask(cued);
    // The cue is the ask; re-running it on every render would re-ask it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cued, hasCue]);

  /*
   * Home can ask for the surprise directly — an inspiration button should land
   * on an answer, not on a screen with a button that produces one. The param
   * is dropped straight away so a reload does not re-fire it.
   */
  useEffect(() => {
    if (!params.get('surprise')) return;
    const next = new URLSearchParams(params);
    next.delete('surprise');
    setParams(next, { replace: true });
    void surpriseUs();
    // surpriseUs is stable for this screen's lifetime.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  const shared = sharedIdeas(state)
    .map((row) => ({ row, idea: DATE_IDEAS.find((i) => i.id === row.id) }))
    .filter((x): x is { row: SavedIdea; idea: DateIdea } => Boolean(x.idea));

  const matched = ideaMatches(state)
    .map((row) => ({ row, idea: DATE_IDEAS.find((i) => i.id === row.id) }))
    .filter((x): x is { row: SavedIdea; idea: DateIdea } => Boolean(x.idea));

  /* Selecting the value that is already set clears it, so filters stay
     escapable — and any change makes the list on screen stale. */
  const set = <K extends keyof IdeaFilters>(key: K, value: IdeaFilters[K]) =>
    setFilters((f) => {
      const next = { ...f, [key]: f[key] === value ? null : value };
      setResult(null);
      return next;
    });

  const nameOf = (id: string) => (id === me.id ? 'you' : partner.name);

  /**
   * Surprise us: drop the taste, keep the facts.
   *
   * It does not randomise the four rows. Random filters produce combinations
   * nobody asked for, and a couple who said "morning" and then tapped surprise
   * did not thereby agree to midnight stargazing. So the two rows that are
   * about what is *possible* stay exactly as they were — when it is, and what
   * it may cost — and the two that are about taste are cleared, which is what
   * "surprise us" actually means: you choose, we have no preference.
   *
   * Being in the same city or not is not a row at all and is never negotiable;
   * the ranker holds that one whatever this button does.
   */
  const surpriseUs = async () => {
    const next: IdeaFilters = { ...filters, setting: null, vibe: null };
    setFilters(next);
    setSettingAnswered(false);
    await ask(next);
  };

  /** More of the same list, not a different answer to the same question. */
  const showMore = () => {
    setPage((n) => n + 1);
    window.setTimeout(
      () => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
      60,
    );
  };

  const row = (
    label: string,
    options: { label: string; value: string | number | null }[],
    /** undefined means the row has not been answered at all. */
    current: string | number | null | undefined,
    onPick: (v: never) => void,
  ) => (
    <div className={s.pickRow}>
      <span className={s.pickLabel}>{label}</span>
      <div className={s.pickChips}>
        {options.map((o) => {
          const on = current !== undefined && current === o.value;
          return (
            <button
              key={o.label}
              type="button"
              className={[s.pick, on ? s.pickOn : ''].filter(Boolean).join(' ')}
              aria-pressed={on}
              onClick={() => onPick(o.value as never)}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <>
      {hasCue ? (
        <p className={s.cueBanner}>
          <span aria-hidden>✨</span>
          <span>Set up from what you both wrote today.</span>
          <button
            type="button"
            className={s.cueClear}
            onClick={() => {
              setFilters(EMPTY_FILTERS);
              setParams({ tier: 'day' }, { replace: true });
            }}
          >
            Clear
          </button>
        </p>
      ) : null}

      {/* The whole generator in one card: three questions and two buttons.
          Nothing here is required, which is why none of it is a field. */}
      <div className={s.gen}>
        <span className={s.genSky} aria-hidden />
        {row('Time', WHEN, filters.daypart, (v) => set('daypart', v))}
        {row(
          'Setting',
          WHERE,
          settingAnswered ? filters.setting : undefined,
          (v) => {
            // Tapping the answer you already gave takes it back, on this row
            // as on every other — and "Either" taken back is no answer at all.
            const same = settingAnswered && (filters.setting ?? null) === (v ?? null);
            setSettingAnswered(!same);
            set('setting', v);
          },
        )}
        {row(
          'Budget for two',
          SPEND,
          budgetAnswered ? filters.budget : undefined,
          (v) => {
            const same = budgetAnswered && (filters.budget ?? null) === (v ?? null);
            setBudgetAnswered(!same);
            set('budget', v);
          },
        )}
        {row('Vibe', VIBES, filters.vibe, (v) => set('vibe', v))}

        {/* One button carries the screen. The other is a shrug, and looks
            like one — two buttons of equal weight is a question, and this
            screen is meant to answer questions rather than ask another. */}
        <div className={s.genActions}>
          <Button variant="accent" size="lg" block disabled={loading} onClick={() => void ask(filters)}>
            {result ? (
              <>
                Find ideas again <RefreshMark />
              </>
            ) : (
              'Find ideas for us ✨'
            )}
          </Button>
          <button
            type="button"
            className={s.diceCta}
            disabled={loading}
            onClick={() => void surpriseUs()}
          >
            <span className={s.diceLabel}>🎲 Surprise us</span>
          </button>
        </div>
      </div>

      <div ref={resultsRef} className={s.resultsAnchor}>
        {loading ? (
          <div className={s.loading}>
            <span className={s.loadingDots} aria-hidden>
              <span className={s.loadingDot} />
              <span className={s.loadingDot} />
              <span className={s.loadingDot} />
            </span>
            <WaitingLine />
          </div>
        ) : result ? (
          <>
            {debugOn() && source ? <RankerBadge source={source} /> : null}

            {showing.length ? (
              <>
                <div className={s.results}>
                  {showing.map((rec, i) => {
                    const idea = DATE_IDEAS.find((x) => x.id === rec.id);
                    return idea ? (
                      <IdeaCard
                        key={rec.id}
                        idea={idea}
                        recommendation={rec}
                        index={i}
                        cycleId={cycleId}
                      />
                    ) : null;
                  })}
                </div>

                {/*
                  Paging, not re-asking. When the list runs out it says so
                  rather than quietly starting again — being shown the same
                  five a second time is how an app admits it has nothing left
                  without saying it.
                */}
                <div className={s.moreRow}>
                  {more ? (
                    <button type="button" className={s.moreBtn} onClick={showMore}>
                      More ideas
                    </button>
                  ) : (
                    <p className={s.moreEnd}>
                      That’s everything that fits. Change a filter to see something else.
                    </p>
                  )}
                </div>
              </>
            ) : (
              /* Nothing eligible at all — almost always a budget of zero
                 crossed with something the corpus cannot do for free yet. */
              <p className={s.noneFound}>
                Nothing in the collection fits that yet. Try loosening the budget or the time.
              </p>
            )}
          </>
        ) : null}
      </div>

      {/* Matches only exist here, and only once one has happened. */}
      {matched.length ? (
        <Section>
          <SectionHeader title="Our matches" sub="You both reached for these on your own." />
          <div className={s.savedList}>
            {matched.map(({ idea }) => (
              <SavedRow key={idea.id} idea={idea} note="You both saved this 💕" matched />
            ))}
          </div>
        </Section>
      ) : null}

      <Section>
        <SectionHeader title="Saved together" sub="Ideas either of you put on the list." />
        {shared.length ? (
          <div className={s.savedList}>
            {shared.map(({ idea, row: r }) => (
              <SavedRow
                key={idea.id}
                idea={idea}
                note={`Added by ${r.sharedBy.map(nameOf).join(' and ')}`}
              />
            ))}
          </div>
        ) : (
          <p className={s.savedEmpty}>Start saving ideas you&rsquo;d love to do together.</p>
        )}
      </Section>
    </>
  );
}

const DEBUG_KEY = 'couple777:debug';

/**
 * Which ranker answered. Only ever visible with ?debug=1, and there for one
 * reason: "the suggestions feel off" is not something anyone can act on, while
 * "it fell back to the phone because the key was refused" is.
 */
function debugOn(): boolean {
  try {
    const param = new URLSearchParams(window.location.search).get('debug');
    if (param === '1') window.localStorage.setItem(DEBUG_KEY, '1');
    if (param === '0') window.localStorage.removeItem(DEBUG_KEY);
    return window.localStorage.getItem(DEBUG_KEY) === '1';
  } catch {
    return false;
  }
}

const RANKER_LABEL: Record<RecommendationSource, string> = {
  model: '● Ranked by Claude',
  rules: '● Ranked by the rules (no model)',
  device: '● Ranked on this device',
};

function RankerBadge({ source }: { source: RecommendationSource }) {
  const why = source === 'device' ? fallbackReason() : null;
  const t = lastLatency();
  return (
    <p className={[s.rankBadge, source === 'model' ? s.rankBadgeModel : s.rankBadgeLocal].join(' ')}>
      <span>{RANKER_LABEL[source]}</span>
      {/* Where the time went, so "it feels slow" becomes a number worth acting
          on — and so the model call can be told apart from the auth check. */}
      {t ? (
        <span className={s.rankBadgeWhy}>
          {Math.round(t.totalMs / 100) / 10}s total · model {Math.round(t.modelMs / 100) / 10}s ·
          auth {t.authMs}ms{t.outputTokens ? ` · ${t.outputTokens} tokens out` : ''}
        </span>
      ) : null}
      {why ? <span className={s.rankBadgeWhy}>why: {why}</span> : null}
    </p>
  );
}

/** A saved idea, at list size: enough to recognise, one tap to open. */
function SavedRow({
  idea,
  note,
  matched,
}: {
  idea: DateIdea;
  note: string;
  matched?: boolean;
}) {
  return (
    <Link to={`/plan/new?idea=${idea.id}`} className={s.savedRow}>
      <Photo src={idea.image} seed={idea.id} ratio="1 / 1" className={s.savedShot} alt="" />
      <span className={s.savedMain}>
        <span className={s.savedTitle}>{idea.title}</span>
        <span className={[s.savedNote, matched ? s.savedNoteMatch : ''].filter(Boolean).join(' ')}>
          {note}
        </span>
      </span>
      <span className={s.savedChev} aria-hidden>
        ›
      </span>
    </Link>
  );
}

/* ------------------------------ 7 weeks --------------------------------- */

function MiniAdventuresTab({ cycleId }: { cycleId?: string }) {
  const { state } = useStore();
  const [distance, setDistance] = useState<Distance | null>(null);
  const [mood, setMood] = useState<AdventureMood | null>(null);
  const [seed, setSeed] = useState(1);

  const ideas = useMemo(() => generateAdventures(distance, mood, seed), [distance, mood, seed]);

  return (
    <>
      <div className={s.filters}>
        <div className={s.filterGroup}>
          <p className={s.filterLabel}>How far do you want to go?</p>
          <ChipRow>
            {DISTANCE_OPTIONS.map((o) => (
              <Chip
                key={o.value}
                emoji={o.emoji}
                selected={distance === o.value}
                onClick={() => setDistance((d) => (d === o.value ? null : o.value))}
              >
                {o.label}
              </Chip>
            ))}
          </ChipRow>
        </div>

        <div className={s.filterGroup}>
          <p className={s.filterLabel}>What mood?</p>
          <ChipRow>
            {MOOD_OPTIONS.map((o) => (
              <Chip
                key={o.value}
                emoji={o.emoji}
                selected={mood === o.value}
                onClick={() => setMood((m) => (m === o.value ? null : o.value))}
              >
                {o.label}
              </Chip>
            ))}
          </ChipRow>
        </div>
      </div>

      <div className={s.surprise}>
        <Button variant="accent" onClick={() => { setDistance(null); setMood(null); setSeed((n) => n + 5); }}>
          Surprise me
        </Button>
        <Button variant="quiet" onClick={() => setSeed((n) => n + 1)}>
          Show me others
        </Button>
      </div>

      <p className={s.secretNote}>
        <span aria-hidden>📍</span>
        <span>Suggestions are from around {state.couple.homeCity}. Change that in Us → Settings.</span>
      </p>

      <div className={s.results}>
        {ideas.map((idea, i) => (
          <AdventureCard key={`${seed}-${idea.id}`} idea={idea} index={i} cycleId={cycleId} />
        ))}
      </div>
    </>
  );
}

/* ------------------------------ 7 months -------------------------------- */

function BigAdventuresTab() {
  const { state, me, partner } = useStore();
  const matched = matches(state);
  // Saving something they already saved is a moment — show it here and now,
  // not only the next time they open Home.
  const pending = newMatch(state);
  const mine = state.destinations.filter((d) => d.savedBy.includes(me.id));
  const rest = state.destinations.filter((d) => !d.savedBy.includes(me.id));

  return (
    <>
      <p className={s.secretNote}>
        <span aria-hidden>🤫</span>
        <span>
          What you save here is private. {partner.name} only finds out if they save the same
          place — and then you both do, at once.
        </span>
      </p>

      {pending ? (
        <Section>
          <MatchReveal destination={pending} />
        </Section>
      ) : null}

      {matched.length ? (
        <div className={s.matchStrip}>
          <span aria-hidden>✦</span>
          <p className={s.matchText}>
            <span className={s.matchNames}>
              {matched.length} {matched.length === 1 ? 'match' : 'matches'}
            </span>{' '}
            — {matched.map((m) => m.name).join(', ')}. You both want to go.
          </p>
        </div>
      ) : null}

      {mine.length ? (
        <Section>
          <SectionHeader title="On your list" sub="Only you can see this." />
          <div className={s.grid}>
            {mine.map((d) => (
              <DestinationCard key={d.id} destination={d} />
            ))}
          </div>
        </Section>
      ) : (
        <EmptyState
          emoji="🧭"
          title="Nothing on your list yet"
          body="Save anywhere that pulls at you. Nobody sees it unless they want it too."
        />
      )}

      <Section>
        <SectionHeader title="Somewhere new" sub="Tap the heart to add it, quietly." />
        <div className={s.grid}>
          {rest.map((d) => (
            <DestinationCard key={d.id} destination={d} />
          ))}
        </div>
      </Section>
    </>
  );
}
