import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Screen, ScreenHeader, Section } from '@/components/layout/Screen';
import { Segmented } from '@/components/ui/Segmented';
import { Chip, ChipRow } from '@/components/ui/Chip';
import { Button } from '@/components/ui/Button';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { IdeaCard } from '@/features/IdeaCard';
import { AdventureCard } from '@/features/AdventureCard';
import { DestinationCard, MatchReveal } from '@/features/DestinationCard';
import { DATE_IDEAS } from '@/data/dateIdeas';
import {
  BUDGET_OPTIONS,
  DAYPART_OPTIONS,
  DISTANCE_OPTIONS,
  DURATION_OPTIONS,
  EMPTY_FILTERS,
  ENERGY_OPTIONS,
  FEEDBACK_OPTIONS,
  MOOD_OPTIONS,
  SETTING_OPTIONS,
  VIBE_OPTIONS,
  WEATHER_OPTIONS,
  generateAdventures,
  generateDateIdeas,
} from '@/lib/generator';
import { useStore } from '@/context/store';
import { TIER_META } from '@/lib/dates';
import { matches, newMatch } from '@/lib/selectors';
import type {
  AdventureMood,
  Daypart,
  Distance,
  IdeaFeedback,
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
        title={cycle ? `Ideas for your ${TIER_META[cycle.tier].cadence} moment` : 'What should we do?'}
        sub={
          cycle
            ? TIER_META[cycle.tier].hint
            : 'Answer as much or as little as you like. The more you say, the better the suggestions.'
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

function DateIdeasTab({ cycleId }: { cycleId?: string }) {
  const { state } = useStore();
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
  const [feedback, setFeedback] = useState<IdeaFeedback[]>([]);
  const [seen, setSeen] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [surprised, setSurprised] = useState(false);

  useEffect(() => {
    if (hasCue) setFilters(cued);
  }, [cued, hasCue]);

  /*
   * Home can ask for the surprise directly — "Get inspirations" should land on
   * an answer, not on a screen with a button that produces one. The param is
   * dropped straight away so a reload or a back-forward does not re-fire it.
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

  const ideas = useMemo(
    () => generateDateIdeas(filters, seed, 4, state.couple.profile, feedback, seen),
    [filters, seed, state.couple.profile, feedback, seen],
  );

  const saved = DATE_IDEAS.filter((i) => state.savedIdeaIds.includes(i.id));

  // Selecting the value that is already set clears it, so filters stay escapable.
  const set = <K extends keyof IdeaFilters>(key: K, value: IdeaFilters[K]) =>
    setFilters((f) => ({ ...f, [key]: f[key] === value ? null : value }));

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
    }, 1100);
  };

  const react = (f: IdeaFeedback) => {
    // "Done this before" hides what is on screen; the rest just re-weight.
    if (f === 'done') setSeen((prev) => [...new Set([...prev, ...ideas.map((i) => i.id)])]);
    setFeedback((prev) => (prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]));
    setSeed((n) => n + 1);
  };

  const clearAll = () => {
    setFilters(EMPTY_FILTERS);
    setFeedback([]);
    setSeen([]);
    if (hasCue) setParams({ tier: 'day' }, { replace: true });
  };

  return (
    <>
      {hasCue ? (
        <p className={s.cueBanner}>
          <span aria-hidden>✨</span>
          <span>Set up from what you both wrote today.</span>
          <button type="button" className={s.cueClear} onClick={clearAll}>
            Clear
          </button>
        </p>
      ) : null}

      <p className={s.helper}>Pick whatever matters. Leave the rest to us.</p>

      <div className={s.filters}>
        <div className={s.filterGroup}>
          <p className={s.filterLabel}>When are we doing this?</p>
          <ChipRow>
            {DAYPART_OPTIONS.map((o) => (
              <Chip key={o.value} emoji={o.emoji} selected={filters.daypart === o.value} onClick={() => set('daypart', o.value)}>
                {o.label}
              </Chip>
            ))}
          </ChipRow>
        </div>

        <div className={s.filterGroup}>
          <p className={s.filterLabel}>How much time?</p>
          <ChipRow>
            {DURATION_OPTIONS.map((o) => (
              <Chip key={o.value} selected={filters.duration === o.value} onClick={() => set('duration', o.value)}>
                {o.label}
              </Chip>
            ))}
          </ChipRow>
        </div>

        <div className={s.filterGroup}>
          <p className={s.filterLabel}>Budget</p>
          <ChipRow>
            {BUDGET_OPTIONS.map((o) => (
              <Chip key={o.value} selected={filters.budget === o.value} onClick={() => set('budget', o.value)}>
                {o.label}
              </Chip>
            ))}
          </ChipRow>
        </div>

        <div className={s.filterGroup}>
          <p className={s.filterLabel}>What kind of mood?</p>
          <ChipRow>
            {VIBE_OPTIONS.map((o) => (
              <Chip key={o.value} emoji={o.emoji} selected={filters.vibe === o.value} onClick={() => set('vibe', o.value)}>
                {o.label}
              </Chip>
            ))}
          </ChipRow>
        </div>

        <div className={s.filterGroup}>
          <p className={s.filterLabel}>Where, and how much energy?</p>
          <ChipRow>
            {SETTING_OPTIONS.map((o) => (
              <Chip key={o.value} emoji={o.emoji} selected={filters.setting === o.value} onClick={() => set('setting', o.value)}>
                {o.label}
              </Chip>
            ))}
            {ENERGY_OPTIONS.map((o) => (
              <Chip key={o.value} emoji={o.emoji} selected={filters.energy === o.value} onClick={() => set('energy', o.value)}>
                {o.label}
              </Chip>
            ))}
          </ChipRow>
        </div>

        <div className={s.filterGroup}>
          <p className={s.filterLabel}>What is it doing outside?</p>
          <ChipRow>
            {WEATHER_OPTIONS.map((o) => (
              <Chip key={o.value} emoji={o.emoji} selected={filters.weather === o.value} onClick={() => set('weather', o.value)}>
                {o.label}
              </Chip>
            ))}
          </ChipRow>
        </div>
      </div>

      <div className={s.surprise}>
        <Button variant="accent" onClick={surpriseUs}>
          ✨ Surprise us
        </Button>
        <Button variant="quiet" onClick={clearAll}>
          Clear
        </Button>
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
              <p className={s.count}>{ideas.length} ideas for you</p>
              <button type="button" className={s.regen} onClick={() => setSeed((n) => n + 1)}>
                Show me others
              </button>
            </div>

            <div className={s.results}>
              {ideas.map((idea, i) => (
                <div
                  key={`${seed}-${idea.id}`}
                  className={i === 0 && surprised ? s.topPick : undefined}
                >
                  {i === 0 && surprised ? <span className={s.topPickBadge}>Our pick</span> : null}
                  <div className={i === 0 && surprised ? s.topPickRing : undefined}>
                    <IdeaCard idea={idea} index={i} />
                  </div>
                </div>
              ))}
            </div>

            <div className={s.feedback}>
              <p className={s.feedbackLabel}>Not quite right?</p>
              <div className={s.feedbackRow}>
                {FEEDBACK_OPTIONS.map((o) => (
                  <Chip
                    key={o.value}
                    selected={feedback.includes(o.value)}
                    onClick={() => react(o.value)}
                  >
                    {o.label}
                  </Chip>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {saved.length ? (
        <Section>
          <SectionHeader title="Saved" sub="Ideas you both liked the look of." />
          <div className={s.results}>
            {saved.map((idea, i) => (
              <IdeaCard key={idea.id} idea={idea} index={i} cycleId={cycleId} />
            ))}
          </div>
        </Section>
      ) : null}
    </>
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
