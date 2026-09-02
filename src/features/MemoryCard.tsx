import { Link } from 'react-router-dom';
import { Photo } from '@/components/ui/Photo';
import { formatGutter } from '@/lib/dates';
import type { Memory } from '@/lib/types';
import s from './MemoryCard.module.css';

const KIND_LABEL: Record<Memory['kind'], string> = {
  day: 'Date',
  week: 'Mini adventure',
  month: 'Big adventure',
  milestone: 'Milestone',
  moment: 'A moment',
};

export function MemoryCard({ memory }: { memory: Memory }) {
  const shown = memory.photos.slice(0, 3);
  const extra = memory.photos.length - shown.length;

  return (
    <Link to={`/memories/${memory.id}`} className={s.card}>
      {shown.length ? (
        <div className={s.photos} data-count={shown.length}>
          {shown.map((src, i) => (
            <div className={s.photoWrap} key={src}>
              <Photo
                src={src}
                className={s.photo}
                seed={`${memory.id}-${i}`}
                ratio={shown.length === 1 ? '16 / 10' : shown.length === 2 ? '1 / 1' : undefined}
                alt=""
              />
              {i === shown.length - 1 && extra > 0 ? (
                <span className={s.more}>+{extra}</span>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}

      <div className={s.body}>
        <h3 className={s.title}>
          <span className={s.emoji} aria-hidden>
            {memory.emoji}
          </span>
          {memory.title}
        </h3>
        <p className={s.meta}>
          <span>{KIND_LABEL[memory.kind]}</span>
          {memory.place ? <span>· {memory.place}</span> : null}
          {memory.photos.length ? (
            <span>
              · {memory.photos.length} photo{memory.photos.length === 1 ? '' : 's'}
            </span>
          ) : null}
        </p>
        {memory.sharedNote ? <p className={s.note}>“{memory.sharedNote}”</p> : null}
      </div>
    </Link>
  );
}

/** The timeline variant, with the date gutter and the connecting thread. */
export function MemoryTimelineRow({ memory, last }: { memory: Memory; last?: boolean }) {
  const { month, day } = formatGutter(memory.date);
  return (
    <div className={s.row}>
      <div className={s.gutter}>
        <p className={s.month}>{month}</p>
        <p className={s.day}>{day}</p>
        <span className={s.node} data-kind={memory.kind} aria-hidden />
        {!last ? <span className={s.line} aria-hidden /> : null}
      </div>
      <MemoryCard memory={memory} />
    </div>
  );
}
