import { Link } from 'react-router-dom';
import { Screen, Section } from '@/components/layout/Screen';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { AvatarPair } from '@/components/ui/Avatar';
import { Button, ButtonLink } from '@/components/ui/Button';
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
  const memories = sortedMemories(state.memories).slice(0, 4);
  const awaiting = cycleAwaitingMemory(state);
  const match = newMatch(state);

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
          <p className={s.sectionKicker}>Up next</p>
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
        <Section>
          <div className={s.inspire}>
            <span className={s.inspireMark} aria-hidden />
            <p className={s.inspireText}>
              Your next date does not need to be extraordinary. It just needs to be intentional.
            </p>
            <div className={s.inspireCta}>
              <ButtonLink to="/explore" variant="secondary" size="sm">
                Find a date idea
              </ButtonLink>
            </div>
          </div>
        </Section>
      )}

      {memories.length ? (
        <Section>
          <SectionHeader title="Recently" actionLabel="All memories" actionTo="/memories" />
          <div className={`${s.recent} no-scrollbar`}>
            {memories.map((m) => (
              <div key={m.id} className={s.recentItem}>
                <MemoryCard memory={m} />
              </div>
            ))}
          </div>
        </Section>
      ) : (
        <Section>
          <SectionHeader title="Recently" />
          <Button variant="secondary" block onClick={() => undefined}>
            Nothing captured yet
          </Button>
        </Section>
      )}
    </Screen>
  );
}
