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
  generateDateIdeas,
} from '@/lib/generator';
import { useStore } from '@/context/store';
import { TIER_META } from '@/lib/dates';
import { ideaMatches, matches, newMatch, sharedIdeas } from '@/lib/selectors';
import type {
  DateIdea,
  SavedIdea,
  AdventureMood,
  Daypart,
  Distance,
  Energy,

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
            : 'Find your next little moment'
        }
        sub={
          cycle
            ? TIER_META[cycle.tier].hint
            : 'A few details, and Couple777 will suggest something that fits tonight.'
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
 * The four questions worth asking, in the order someone actually thinks them:
 * when, where, how much. Everything else the generator knows how to guess.
 */
const WHEN: { label: string; value: Daypart }[] = [
  { label: 'Morning', value: 'morning' },
  { label: 'Afternoon', value: 'afternoon' },
  { label: 'Evening', value: 'evening' },
  { label: 'Night', value: 'late' },
];

const WHERE: { label: string; value: Setting }[] = [
  { label: 'Indoor', value: 'home' },
  { label: 'Outdoor', value: 'out' },
];

/* Shorter than the generator's own labels: in a row of four these have to fit
   without being cut in half, and "Low energy" beside "Low" budget was saying
   the word twice anyway. */
const EFFORT: { label: string; value: Energy }[] = [
  { label: 'Easy', value: 'low' },
  { label: 'Some', value: 'medium' },
  { label: 'Plenty', value: 'high' },
];

const SPEND: { label: string; value: number }[] = [
  { label: 'Low', value: 30 },
  { label: 'Medium', value: 60 },
  { label: 'Special', value: 150 },
];

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
  const [seed, setSeed] = useState(1);
  const [loading, setLoading] = useState(false);
  const [surprised, setSurprised] = useState(false);

  useEffect(() => {
    if (hasCue) setFilters(cued);
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
    surpriseUs();
    // surpriseUs is stable for this screen's lifetime.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  /* Three, not four: a short list is something you read, a long one is
     something you scroll past. */
  const ideas = useMemo(
    () => generateDateIdeas(filters, seed, 3, state.couple.profile),
    [filters, seed, state.couple.profile],
  );

  const shared = sharedIdeas(state)
    .map((row) => ({ row, idea: DATE_IDEAS.find((i) => i.id === row.id) }))
    .filter((x): x is { row: SavedIdea; idea: DateIdea } => Boolean(x.idea));

  const matched = ideaMatches(state)
    .map((row) => ({ row, idea: DATE_IDEAS.find((i) => i.id === row.id) }))
    .filter((x): x is { row: SavedIdea; idea: DateIdea } => Boolean(x.idea));

  // Selecting the value that is already set clears it, so filters stay escapable.
  const set = <K extends keyof IdeaFilters>(key: K, value: IdeaFilters[K]) =>
    setFilters((f) => ({ ...f, [key]: f[key] === value ? null : value }));

  const nameOf = (id: string) => (id === me.id ? 'you' : partner.name);

  /** The signature action: think for a beat, then bring you to the answer. */
  const surpriseUs = () => {
    setLoading(true);
    setSurprised(true);
    window.setTimeout(() => {
      setSeed((n) => n + 7);
      setLoading(false);
      window.setTimeout(
        () => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
        60,
      );
    }, 1000);
  };

  const generate = () => {
    setSurprised(false);
    setSeed((n) => n + 1);
    window.setTimeout(
      () => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
      60,
    );
  };

  const row = (
    label: string,
    options: { label: string; value: string | number }[],
    current: string | number | null,
    onPick: (v: never) => void,
  ) => (
    <div className={s.pickRow}>
      <span className={s.pickLabel}>{label}</span>
      <div className={s.pickChips}>
        {options.map((o) => (
          <button
            key={o.label}
            type="button"
            className={[s.pick, current === o.value ? s.pickOn : ''].filter(Boolean).join(' ')}
            aria-pressed={current === o.value}
            onClick={() => onPick(o.value as never)}
          >
            {o.label}
          </button>
        ))}
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
        {row('Setting', WHERE, filters.setting, (v) => set('setting', v))}
        {row('Budget', SPEND, filters.budget, (v) => set('budget', v))}
        {row('Energy', EFFORT, filters.energy, (v) => set('energy', v))}

        <div className={s.genActions}>
          <Button variant="accent" block onClick={generate}>
            Find ideas
          </Button>
          <Button variant="quiet" block onClick={surpriseUs}>
            Surprise us 🎲
          </Button>
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
            <p className={s.loadingText}>Finding something for you two…</p>
          </div>
        ) : (
          <>
            <div className={s.resultHead}>
              <p className={s.count}>{surprised ? 'Our pick for you' : 'For you two'}</p>
              <button type="button" className={s.regen} onClick={() => setSeed((n) => n + 1)}>
                Show me others
              </button>
            </div>

            <div className={s.results}>
              {ideas.map((idea, i) => (
                <IdeaCard key={`${seed}-${idea.id}`} idea={idea} index={i} cycleId={cycleId} />
              ))}
            </div>
          </>
        )}
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
