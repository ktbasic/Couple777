import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Screen, Section } from '@/components/layout/Screen';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { AvatarPair } from '@/components/ui/Avatar';
import { ButtonLink } from '@/components/ui/Button';
import { CycleCardCompact, CycleCardHero } from '@/features/CycleCard';
import { DailyCard } from '@/features/DailyCard';
import { MemoryCosmos } from '@/features/MemoryCosmos';
import { MatchReveal } from '@/features/DestinationCard';
import { NotificationBell } from '@/features/NotificationBell';
import { LittleQuest } from '@/features/LittleQuest';
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
import { TOPIC_EMOJI } from '@/data/community';
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
  /* One: the section below shows the last thing you did together, and the
     rest are one tap away. */
  const latest = sortedMemories(state.memories)[0];
  const awaiting = cycleAwaitingMemory(state);
  const match = newMatch(state);
  const matched = hasMatches(state);
  /* The three busiest recent threads, so what is on offer is what is worth
     opening. Your own posts are not news to you. */
  const highlights = [...state.communityPosts]
    .filter((p) => !p.mine)
    .sort(
      (a, b) =>
        b.replies.length - a.replies.length || b.createdAt.localeCompare(a.createdAt),
    )
    .slice(0, 3);
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

      <Section>
        <LittleQuest />
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
      ) : null}

      {highlights.length ? (
        /* Three, swipeable — not a feed. Home's job is to say the community is
           alive and hand you a door into it, not to become a second reader,
           and one card looked like the only thing anyone had said. */
        <Section>
          <SectionHeader title="From the community" actionLabel="See all →" actionTo="/community" />
          <div className={`${s.threads} no-scrollbar`}>
            {highlights.map((post) => (
              <Link key={post.id} to={`/community/${post.id}`} className={s.thread}>
                <p className={s.highlightMeta}>
                  {TOPIC_EMOJI[post.topic]} {post.author} · {post.replies.length}{' '}
                  {post.replies.length === 1 ? 'reply' : 'replies'}
                </p>
                <p className={s.highlightBody}>
                  {post.body.length > 150 ? `${post.body.slice(0, 150).trimEnd()}…` : post.body}
                </p>
              </Link>
            ))}
          </div>
        </Section>
      ) : null}

      {/* No heading and no card: the page turns into sky and ends. */}
      <MemoryCosmos memory={latest} />
    </Screen>
  );
}
