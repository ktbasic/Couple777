import { Link } from 'react-router-dom';
import { Screen, Section } from '@/components/layout/Screen';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { AvatarPair } from '@/components/ui/Avatar';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { useStore } from '@/context/store';
import { allRituals, matches, relationshipStats } from '@/lib/selectors';
import { TIER_META, countdownLabel, durationTogether, today } from '@/lib/dates';
import s from './Us.module.css';

const CHEV = (
  <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden>
    <path
      d="M9 5l7 7-7 7"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default function UsScreen() {
  const { state, me, partner } = useStore();
  const stats = relationshipStats(state);
  const rituals = allRituals(state);
  const matched = matches(state);
  const now = today();

  return (
    <Screen>
      <header className={s.hero}>
        <div className={s.avatars}>
          <AvatarPair people={state.couple.people} size={64} />
        </div>
        <h1 className={s.names}>
          {me.name} &amp; {partner.name}
        </h1>
        <p className={s.together}>Together {durationTogether(state.couple.togetherSince, now)}</p>
      </header>

      {/* The headline number is emotional, not competitive. */}
      <div className={s.headline}>
        <p className={s.headlineText}>
          You've made {stats.total} intentional moments together.
        </p>
        <p className={s.headlineSub}>
          Not counting the ordinary evenings, which are most of it.
        </p>
      </div>

      <Section>
        <SectionHeader title="Your rhythm" sub="Where each of the three stands right now." />
        <div className={s.rhythm}>
          {rituals.map((r) => (
            <div key={r.tier} className={s.rhythmRow} data-tier={r.tier}>
              <ProgressRing progress={r.progress} size={38} stroke={3} />
              <div className={s.rhythmMain}>
                <p className={s.rhythmTitle}>{TIER_META[r.tier].plural}</p>
                <p className={s.rhythmBody}>
                  {r.plan
                    ? `Next one ${countdownLabel(now, r.targetDate).toLowerCase()}`
                    : r.overdue
                      ? 'Due — nothing planned'
                      : `Due in ${countdownLabel(now, r.targetDate).toLowerCase()}`}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section>
        <SectionHeader title="What you've built" />
        <div className={s.grid}>
          {[
            { value: stats.dates, label: 'dates you actually kept' },
            { value: stats.mini, label: 'small adventures nearby' },
            { value: stats.big, label: 'big trips together' },
            { value: stats.memories, label: 'memories written down' },
            { value: stats.photos, label: 'photos kept' },
            { value: stats.checkInDays, label: 'days of checking in' },
          ].map((stat, i) => (
            <div key={stat.label} className={s.stat} style={{ animationDelay: `${i * 55}ms` }}>
              <p className={s.statValue}>{stat.value}</p>
              <p className={s.statLabel}>{stat.label}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section>
        <SectionHeader title="The two of you" />
        <div className={s.rows}>
          <Link to="/explore?tier=month" className={s.row}>
            <span className={s.rowEmoji} aria-hidden>
              ✦
            </span>
            Our matches
            <span className={s.rowValue}>
              {matched.length ? matched.map((m) => m.name).join(', ') : 'None yet'}
            </span>
            {CHEV}
          </Link>
          <Link to="/talk/notes" className={s.row}>
            <span className={s.rowEmoji} aria-hidden>
              💌
            </span>
            Notes
            <span className={s.rowValue}>{state.notes.length}</span>
            {CHEV}
          </Link>
          <Link to="/memories" className={s.row}>
            <span className={s.rowEmoji} aria-hidden>
              📷
            </span>
            Memory timeline
            <span className={s.rowValue}>{stats.memories}</span>
            {CHEV}
          </Link>
          <Link to="/us/settings" className={s.row}>
            <span className={s.rowEmoji} aria-hidden>
              ⚙️
            </span>
            Settings &amp; privacy
            {CHEV}
          </Link>
        </div>
      </Section>
    </Screen>
  );
}
