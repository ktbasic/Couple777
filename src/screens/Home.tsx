import { Link } from 'react-router-dom';
import { Screen, Section } from '@/components/layout/Screen';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { AvatarPair } from '@/components/ui/Avatar';
import { Button, ButtonLink } from '@/components/ui/Button';
import { RitualCardCompact, RitualCardHero } from '@/features/RitualCard';
import { DailyCard } from '@/features/DailyCard';
import { MemoryCard } from '@/features/MemoryCard';
import { MatchReveal } from '@/features/DestinationCard';
import { NotificationBell } from '@/features/NotificationBell';
import { useStore } from '@/context/store';
import {
  allRituals,
  dailyEntry,
  dailyStatus,
  mostUrgent,
  newMatch,
  planAwaitingMemory,
  sortedMemories,
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
  const rituals = allRituals(state, now);
  const urgent = mostUrgent(state, now);
  const memories = sortedMemories(state.memories).slice(0, 4);
  const awaiting = planAwaitingMemory(state);
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

      {awaiting ? (
        <div className={s.nudge}>
          <span className={s.nudgeEmoji} aria-hidden>
            {awaiting.emoji}
          </span>
          <div className={s.nudgeMain}>
            <p className={s.nudgeTitle}>Turn {awaiting.title.toLowerCase()} into a memory?</p>
            <p className={s.nudgeBody}>Add a photo and a line each, while it is still fresh.</p>
          </div>
          <ButtonLink to={`/memories/new?plan=${awaiting.id}`} variant="secondary" size="sm">
            Add
          </ButtonLink>
        </div>
      ) : null}

      <section className={s.hero}>
        <div className={s.rituals}>
          {rituals.map((r, i) => (
            <div key={r.tier} className={s.ritual} style={{ animationDelay: `${i * 80}ms` }}>
              {r.tier === urgent.tier ? (
                <RitualCardHero status={r} />
              ) : (
                <RitualCardCompact status={r} />
              )}
            </div>
          ))}
        </div>

        <div className={s.cta}>
          <ButtonLink to={`/plan/new/${urgent.tier}`} variant="primary" block>
            Plan something together
          </ButtonLink>
        </div>
      </section>

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
