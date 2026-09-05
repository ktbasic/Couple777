import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Screen, Section } from '@/components/layout/Screen';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { AvatarPair } from '@/components/ui/Avatar';
import { ButtonLink } from '@/components/ui/Button';
import { CycleCardCompact, CycleCardHero } from '@/features/CycleCard';
import { DailyCard } from '@/features/DailyCard';
import { MemoryCard } from '@/features/MemoryCard';
import { MatchReveal } from '@/features/DestinationCard';
import { NotificationBell } from '@/features/NotificationBell';
import { IncomingInvite } from '@/features/IncomingInvite';
import { useStore } from '@/context/store';
import {
  alsoAhead,
  cycleAwaitingMemory,
  dailyEntry,
  dailyStatus,
  hasMatches,
  newMatch,
  sortedMemories,
  upNext,
} from '@/lib/selectors';
import { quoteForDate } from '@/data/prompts';
import { cueFromText, cueToParams } from '@/lib/generator';
import { today } from '@/lib/dates';
import s from './Home.module.css';

function greetingFor(hour: number) {
  if (hour < 5) return 'Still up';
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function HomeScreen() {
  const { state, me, partner } = useStore();
  const now = today();
  // Attention decides the hero, not tier — see `attentionScore`.
  const hero = upNext(state, now);
  const ahead = alsoAhead(state, now);
  /* Two, not four: this is a glance at the last thing you did together, and
     the rest are one tap away. */
  const memories = sortedMemories(state.memories).slice(0, 2);
  const awaiting = cycleAwaitingMemory(state);
  const match = newMatch(state);
  const matched = hasMatches(state);
  const [howOpen, setHowOpen] = useState(false);

  // Once both have answered, their own words seed the date generator.
  const daily = dailyStatus(state, me.id, partner.id, now);
  const entry = dailyEntry(state, now);
  const cue =
    daily.bothAnswered && entry
      ? cueFromText(Object.values(entry.answers).map((a) => a.text).join(' '))
      : null;

  return (
    <Screen>
      <header className={s.top}>
        <div className={s.headMain}>
          <h1 className={s.greeting}>
            {greetingFor(new Date().getHours())}, {me.name} &amp; {partner.name}
          </h1>
          <p className={s.quote}>&ldquo;{quoteForDate(now)}&rdquo;</p>
        </div>
        <div className={s.headActions}>
          <Link to="/us" className={s.avatars} aria-label="Our relationship and settings">
            <AvatarPair people={state.couple.people} size={34} />
          </Link>
          <NotificationBell />
        </div>
      </header>

      {/* An unanswered invitation is the one thing here waiting on you, so it
          sits above everything else. */}
      <IncomingInvite />

      {awaiting?.plan ? (
        <div className={s.nudge}>
          <span className={s.nudgeEmoji} aria-hidden>
            {awaiting.plan.emoji}
          </span>
          <div className={s.nudgeMain}>
            <p className={s.nudgeTitle}>How was {awaiting.plan.title.toLowerCase()}?</p>
            <p className={s.nudgeBody}>Turn it into a memory while it is still fresh.</p>
          </div>
          <ButtonLink to={`/memories/new?cycle=${awaiting.cycle.id}`} variant="secondary" size="sm">
            Add
          </ButtonLink>
        </div>
      ) : null}

      {hero ? (
        <section className={s.hero}>
          <div className={s.ritual}>
            <CycleCardHero view={hero} />
          </div>

          {ahead.length ? (
            <>
              <p className={`${s.sectionKicker} ${s.aheadKicker}`}>What's ahead</p>
              <div className={s.rituals}>
                {ahead.map((v, i) => (
                  <div key={v.cycle.id} className={s.ritual} style={{ animationDelay: `${(i + 1) * 80}ms` }}>
                    <CycleCardCompact view={v} />
                  </div>
                ))}
              </div>
            </>
          ) : null}
        </section>
      ) : null}

      <Section>
        <DailyCard />
      </Section>

      {match ? (
        <Section>
          <MatchReveal destination={match} />
        </Section>
      ) : !matched ? (
        /*
         * A line, not a card with a hole in it. There is nothing to celebrate
         * yet, so this says what would make one happen and gets out of the way.
         * It is silent once a match exists and has been seen — announcing "no
         * matches yet" to a couple who have one would simply be wrong.
         */
        <Section>
          <div className={s.matchEmpty}>
            <p className={s.matchEyebrow}>Our matches</p>
            <p className={s.matchTitle}>No matches yet 🔖</p>
            <p className={s.matchBody}>
              Save things you&rsquo;d love to do. If you both save the same one, we&rsquo;ll
              reveal it here.
            </p>
            <button
              type="button"
              className={s.matchHow}
              aria-expanded={howOpen}
              onClick={() => setHowOpen((o) => !o)}
            >
              How it works
            </button>
            {/* Expands in place rather than going somewhere: a "how it works"
                that navigated away would be a detour out of an empty state. */}
            <div className={s.matchReveal} data-open={howOpen || undefined}>
              <p className={s.matchRevealText}>
                Neither of you can see what the other has saved. Save anything you like from
                Explore &mdash; the moment you both save the same thing, it turns up here.
              </p>
            </div>
          </div>
        </Section>
      ) : null}

      {cue ? (
        <Section>
          <div className={s.cue}>
            <p className={s.cueLabel}>From what you both wrote</p>
            <p className={s.cueText}>
              Sounds like something {cue.label}. Want to make it a plan?
            </p>
            <ButtonLink to={`/explore?${cueToParams(cue)}`} variant="accent" size="sm">
              Find something {cue.label}
            </ButtonLink>
          </div>
        </Section>
      ) : (
        /* The hero already says "Find an idea", so this is the smaller, lazier
           version of the same offer: no filters, no browsing, just take one. */
        <Section>
          <div className={s.spark}>
            <div className={s.sparkMain}>
              <p className={s.sparkTitle}>Need a little spark? 🪄</p>
              <p className={s.sparkBody}>Let Couple777 pick something for you.</p>
            </div>
            <ButtonLink to="/explore?surprise=1" variant="secondary" size="sm">
              🎲 Get inspirations
            </ButtonLink>
          </div>
        </Section>
      )}

      {memories.length ? (
        <Section>
          <SectionHeader
            title="Recently together"
            actionLabel="See all memories →"
            actionTo="/memories"
          />
          <div className={`${s.recent} no-scrollbar`}>
            {memories.map((m) => (
              <div key={m.id} className={s.recentItem}>
                <MemoryCard memory={m} />
              </div>
            ))}
          </div>
        </Section>
      ) : (
        /* This was a full-width button that did nothing when tapped — an empty
           state that looked like a control. It is a real invitation now. */
        <Section>
          <SectionHeader title="Recently together" />
          <div className={s.storyStart}>
            <p className={s.storyTitle}>Your story starts here 📍</p>
            <p className={s.storyBody}>
              Save a photo, note, or anything you want to remember.
            </p>
            <ButtonLink to="/memories/new" variant="accent" size="sm">
              Capture a moment
            </ButtonLink>
          </div>
        </Section>
      )}
    </Screen>
  );
}
