import { Link } from 'react-router-dom';
import { Screen, Section } from '@/components/layout/Screen';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { AvatarPair } from '@/components/ui/Avatar';
import { Button, ButtonLink } from '@/components/ui/Button';
import { RitualCardCompact, RitualCardHero } from '@/features/RitualCard';
import { DailyCard } from '@/features/DailyCard';
import { MemoryCard } from '@/features/MemoryCard';
import { MatchReveal } from '@/features/DestinationCard';
import { useStore } from '@/context/store';
import {
  allRituals,
  inboxNotes,
  mostUrgent,
  newMatch,
  planAwaitingMemory,
  sortedMemories,
} from '@/lib/selectors';
import { INSPIRATION_LINES } from '@/data/prompts';
import { daysBetween, today } from '@/lib/dates';
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
  const unread = inboxNotes(state, me.id).filter((n) => !n.readAt);

  // Rotates daily, so the line is not the same one every time you open the app.
  const line =
    INSPIRATION_LINES[Math.abs(daysBetween('2024-01-01', now)) % INSPIRATION_LINES.length];

  return (
    <Screen>
      <header className={s.top}>
        <div>
          <p className={s.brand}>Couple777</p>
          <p className={s.greeting}>
            {greetingFor(new Date().getHours())}, {me.name} &amp; {partner.name}
          </p>
        </div>
        <Link to="/us" className={s.avatars} aria-label="Our relationship">
          <AvatarPair people={state.couple.people} size={30} />
        </Link>
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

      {unread.length ? (
        <div className={s.waiting}>
          <span aria-hidden>💌</span>
          <p className={s.waitingText}>
            {partner.name} left you {unread.length === 1 ? 'a note' : `${unread.length} notes`}.
          </p>
          <Link to="/talk/notes" className={s.waitingLink}>
            Read
          </Link>
        </div>
      ) : null}

      <section className={s.hero}>
        <h1 className={s.heroTitle}>Our 777</h1>
        <p className={s.heroSub}>
          Every seven days, seven weeks, and seven months — kept together.
        </p>

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

      <Section>
        <div className={s.inspire}>
          <span className={s.inspireMark} aria-hidden>
            &ldquo;
          </span>
          <p className={s.inspireText}>{line}</p>
          <div className={s.inspireCta}>
            <ButtonLink to="/explore" variant="secondary" size="sm">
              Find a date idea
            </ButtonLink>
          </div>
        </div>
      </Section>

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
