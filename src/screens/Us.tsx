import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Screen, Section } from '@/components/layout/Screen';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { useToast } from '@/components/ui/Toast';
import { AvatarPicker } from '@/features/AvatarPicker';
import { useStore } from '@/context/store';
import {
  allRituals,
  matches,
  memoryYear,
  milestones,
  relationshipStats,
} from '@/lib/selectors';
import { TIER_META, countdownLabel, durationTogether, formatMonthYear, today } from '@/lib/dates';
import type { ID } from '@/lib/types';
import s from './Us.module.css';

const CHEV = (
  <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden>
    <path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export default function UsScreen() {
  const { state, dispatch, me, partner } = useStore();
  const navigate = useNavigate();
  const toast = useToast();
  const [editingId, setEditingId] = useState<ID | null>(null);
  const editing = state.couple.people.find((p) => p.id === editingId) ?? null;

  const stats = relationshipStats(state);
  const rituals = allRituals(state);
  const matched = matches(state);
  const marks = milestones(state);
  const year = memoryYear(state);
  const peak = Math.max(1, ...year.map((m) => m.count));
  const now = today();

  return (
    <Screen>
      <header className={s.hero}>
        <div className={s.pair}>
          {[me, partner].map((p, i) => (
            <span key={p.id} style={{ display: 'contents' }}>
              {i === 1 ? (
                <span className={s.heart} aria-hidden>
                  ❤️
                </span>
              ) : null}
              <button
                type="button"
                className={s.avatarButton}
                onClick={() => setEditingId(p.id)}
                aria-label={`Change ${p.name}'s avatar`}
              >
                <Avatar person={p} size={76} />
                <span className={s.edit} aria-hidden>
                  ✎
                </span>
              </button>
            </span>
          ))}
        </div>

        <h1 className={s.names}>
          {me.name} &amp; {partner.name}
        </h1>
        <p className={s.together}>
          Together for {durationTogether(state.couple.togetherSince, now)}
        </p>

        {!state.couple.partnerJoined ? (
          <div className={s.inviteStrip}>
            <span aria-hidden>💌</span>
            <p className={s.inviteText}>
              {partner.name} hasn't joined yet. Until they do, this space is just yours.
            </p>
            <Button
              size="sm"
              variant="accent"
              onClick={() => {
                toast.show({ emoji: '🔗', message: 'Invite link copied' });
                window.setTimeout(() => {
                  dispatch({ type: 'setPartnerJoined', joined: true });
                  toast.show({ emoji: '🎉', message: `${partner.name} joined` });
                }, 1400);
              }}
            >
              Invite
            </Button>
          </div>
        ) : null}
      </header>

      <Section>
        <SectionHeader title="Look what you've made together" />
        <div className={s.summary}>
          <p className={s.summaryNumber}>{stats.total}</p>
          <p className={s.summaryLabel}>moments intentionally made</p>
          <div className={s.breakdown}>
            <button type="button" className={s.chip} onClick={() => navigate('/memories?kind=day')}>
              <span className={s.chipCount}>{stats.dates}</span> dates
            </button>
            <button type="button" className={s.chip} onClick={() => navigate('/memories?kind=week')}>
              <span className={s.chipCount}>{stats.mini}</span> mini adventures
            </button>
            <button type="button" className={s.chip} onClick={() => navigate('/memories?kind=month')}>
              <span className={s.chipCount}>{stats.big}</span> big adventures
            </button>
          </div>
        </div>
      </Section>

      <Section>
        <SectionHeader title="Your year" sub="Tap a month to see what happened." />
        <div className={`${s.year} no-scrollbar`}>
          {year.map((m) => (
            <button
              key={m.key}
              type="button"
              className={s.month}
              aria-label={`${formatMonthYear(`${m.key}-01`)}: ${m.count} memories`}
              onClick={() => navigate(`/memories?month=${m.key}`)}
            >
              <span
                className={[s.bar, m.count ? s.barOn : ''].filter(Boolean).join(' ')}
                style={{ height: `${14 + (m.count / peak) * 52}px` }}
              />
              <span className={s.monthLabel}>{formatMonthYear(`${m.key}-01`).slice(0, 3)}</span>
            </button>
          ))}
        </div>
        <p className={s.yearHint}>
          {stats.memories} memories kept · {stats.photos} photos
        </p>
      </Section>

      <Section>
        <SectionHeader title="Worth marking" sub="Things that actually happened." />
        <div className={s.milestones}>
          {marks.map((m) => (
            <button
              key={m.id}
              type="button"
              className={[s.milestone, m.done ? s.milestoneDone : ''].filter(Boolean).join(' ')}
              onClick={() => m.to && navigate(m.to)}
            >
              <span className={s.milestoneIcon} aria-hidden>
                {m.emoji}
              </span>
              <span className={s.milestoneMain}>
                <span className={s.milestoneLabel}>{m.label}</span>
                <span className={s.milestoneProgress}>{m.progress}</span>
              </span>
              {m.done ? (
                <span className={s.check} aria-label="Reached">
                  ✓
                </span>
              ) : (
                CHEV
              )}
            </button>
          ))}
        </div>
      </Section>

      <Section>
        <SectionHeader title="Your rhythm" sub="Where each of the three stands right now." />
        <div className={s.rhythm}>
          {rituals.map((r) => (
            <button
              key={r.tier}
              type="button"
              className={s.rhythmRow}
              data-tier={r.tier}
              onClick={() => navigate(r.plan ? `/plan/${r.plan.id}` : `/plan/new/${r.tier}`)}
            >
              <ProgressRing progress={r.progress} size={38} stroke={3} />
              <span className={s.rhythmMain}>
                <span className={s.rhythmTitle}>{TIER_META[r.tier].plural}</span>
                <span className={s.rhythmBody}>
                  {r.plan
                    ? `Next one ${countdownLabel(now, r.targetDate).toLowerCase()}`
                    : r.overdue
                      ? 'Due — nothing planned'
                      : `Due in ${countdownLabel(now, r.targetDate).toLowerCase()}`}
                </span>
              </span>
              {CHEV}
            </button>
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

      {editing ? (
        <AvatarPicker person={editing} open onClose={() => setEditingId(null)} />
      ) : null}
    </Screen>
  );
}
