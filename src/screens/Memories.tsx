import { useMemo, useState } from 'react';
import { Screen, ScreenHeader } from '@/components/layout/Screen';
import { Chip, ChipRow } from '@/components/ui/Chip';
import { ButtonLink } from '@/components/ui/Button';
import { FloatingAction } from '@/components/ui/FloatingAction';
import { EmptyState } from '@/components/ui/EmptyState';
import { MemoryTimelineRow } from '@/features/MemoryCard';
import { useStore } from '@/context/store';
import { memoriesByMonth, relationshipStats } from '@/lib/selectors';
import { formatMonthYear } from '@/lib/dates';
import type { MemoryKind } from '@/lib/types';
import s from './Memories.module.css';

const FILTERS: { value: MemoryKind | 'all'; label: string; emoji?: string }[] = [
  { value: 'all', label: 'Everything' },
  { value: 'day', label: 'Dates', emoji: '🍷' },
  { value: 'week', label: 'Mini adventures', emoji: '🏔️' },
  { value: 'month', label: 'Big adventures', emoji: '✈️' },
  { value: 'milestone', label: 'Milestones', emoji: '❤️' },
  { value: 'moment', label: 'Moments', emoji: '✨' },
];

export default function MemoriesScreen() {
  const { state } = useStore();
  const [filter, setFilter] = useState<MemoryKind | 'all'>('all');
  const stats = relationshipStats(state);

  const groups = useMemo(() => {
    const filtered =
      filter === 'all' ? state.memories : state.memories.filter((m) => m.kind === filter);
    return memoriesByMonth(filtered);
  }, [state.memories, filter]);

  const total = groups.reduce((n, g) => n + g.items.length, 0);

  return (
    <Screen>
      <ScreenHeader
        eyebrow="Memories"
        title="Everything you've made together"
        sub={`${stats.memories} moments kept, and ${stats.photos} photos.`}
      />

      <div className={s.stats}>
        <div className={s.stat}>
          <p className={s.statValue}>{stats.dates}</p>
          <p className={s.statLabel}>Dates</p>
        </div>
        <div className={s.stat}>
          <p className={s.statValue}>{stats.mini}</p>
          <p className={s.statLabel}>Nearby</p>
        </div>
        <div className={s.stat}>
          <p className={s.statValue}>{stats.big}</p>
          <p className={s.statLabel}>Big trips</p>
        </div>
      </div>

      <div className={s.filters}>
        <ChipRow>
          {FILTERS.map((f) => (
            <Chip
              key={f.value}
              emoji={f.emoji}
              selected={filter === f.value}
              onClick={() => setFilter(f.value)}
            >
              {f.label}
            </Chip>
          ))}
        </ChipRow>
      </div>

      {total === 0 ? (
        <EmptyState
          emoji="📷"
          title="Nothing here yet"
          body="Finish a date or a trip and it will land here, or write one down now."
          action={
            <ButtonLink to="/memories/new" variant="accent" size="sm">
              Write a memory
            </ButtonLink>
          }
        />
      ) : (
        groups.map((group) => (
          <section key={group.key} className={s.month}>
            <p className={s.monthLabel}>{formatMonthYear(`${group.key}-01`)}</p>
            <div className={s.rows}>
              {group.items.map((m, i) => (
                <div key={m.id} className={s.row} style={{ animationDelay: `${i * 60}ms` }}>
                  <MemoryTimelineRow memory={m} last={i === group.items.length - 1} />
                </div>
              ))}
            </div>
          </section>
        ))
      )}

      <div className={s.tail} />
      <FloatingAction to="/memories/new" label="Write a memory" />
    </Screen>
  );
}
