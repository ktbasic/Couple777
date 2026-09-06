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
  { label: 'Whole day', value: 'wholeday' },
];

/* "Either" is a real answer rather than a third place: picking it clears the
   row, which is what no preference means to the generator. */
const WHERE: { label: string; value: Setting | null }[] = [
  { label: 'Indoor', value: 'home' },
  { label: 'Outdoor', value: 'out' },
  { label: 'Either', value: null },
];

/* Budgets are a ceiling for two people, so the labels say what someone would
   actually say out loud. The top one is not a floor of 80 — it means "we are
   not counting tonight", so nothing is priced out. */
const SPEND: { label: string; value: number }[] = [
  { label: 'Free', value: 0 },
  { label: 'Under €30', value: 30 },
  { label: '€30–80', value: 80 },
  { label: '€80+', value: 999 },
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
  /*
   * Whether anything has been asked for yet. It decides both what the main
   * button says and whether there are cards under it — arriving from Talk
   * counts as having asked, because those filters came from somewhere.
   */
  const [generated, setGenerated] = useState(hasCue);
  /*
   * "Either" and "not answered" are the same value to the generator and two
   * different things to a person. This remembers that the row was answered, so
   * an untouched screen does not open with a chip already lit.
   */
  const [settingAnswered, setSettingAnswered] = useState(Boolean(cued.setting));

  useEffect(() => {
    if (!hasCue) return;
    setFilters(cued);
    setGenerated(true);
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
    setGenerated(true);
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
    setGenerated(true);
    setSeed((n) => n + 1);
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
        {row('Budget for two', SPEND, filters.budget, (v) => set('budget', v))}
        {row('Vibe', VIBES, filters.vibe, (v) => set('vibe', v))}

        {/* One button carries the screen. The other is a shrug, and looks
            like one — two buttons of equal weight is a question, and this
            screen is meant to answer questions rather than ask another. */}
        <div className={s.genActions}>
          <Button variant="accent" size="lg" block onClick={generate}>
            {generated ? (
              <>
                Refresh ideas <RefreshMark />
              </>
            ) : (
              'Find ideas for us ✨'
            )}
          </Button>
          <button type="button" className={s.diceCta} onClick={surpriseUs}>
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
            <p className={s.loadingText}>Finding something for you two…</p>
          </div>
        ) : generated ? (
          <div className={s.results}>
            {ideas.map((idea, i) => (
              <IdeaCard key={`${seed}-${idea.id}`} idea={idea} index={i} cycleId={cycleId} />
            ))}
          </div>
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
