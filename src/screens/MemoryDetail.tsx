import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { BackBar, Screen } from '@/components/layout/Screen';
import { Photo } from '@/components/ui/Photo';
import { Avatar } from '@/components/ui/Avatar';
import { Pill } from '@/components/ui/Pill';
import { ButtonLink } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { useStore } from '@/context/store';
import { formatPlanDate } from '@/lib/dates';
import type { Memory } from '@/lib/types';
import s from './MemoryDetail.module.css';

const KIND: Record<Memory['kind'], { label: string; tone: 'day' | 'week' | 'month' | 'gold' | 'neutral' }> = {
  day: { label: 'Date', tone: 'day' },
  week: { label: 'Mini adventure', tone: 'week' },
  month: { label: 'Big adventure', tone: 'month' },
  milestone: { label: 'Milestone', tone: 'gold' },
  moment: { label: 'A moment', tone: 'neutral' },
};

const MOOD_LABEL: Record<NonNullable<Memory['mood']>, string> = {
  warm: '🕯️ Warm',
  joyful: '☀️ Joyful',
  calm: '🌾 Calm',
  silly: '🤸 Silly',
  proud: '🌟 Proud',
  tender: '🤍 Tender',
};

export default function MemoryDetailScreen() {
  const { memoryId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { state, dispatch, me, partner } = useStore();

  const memory = state.memories.find((m) => m.id === memoryId);
  if (!memory) return <Navigate to="/memories" replace />;

  const kind = KIND[memory.kind];

  const setMyNote = (text: string) =>
    dispatch({ type: 'upsertMemory', memory: { ...memory, notes: { ...memory.notes, [me.id]: text } } });

  const setMyPrivate = (text: string) =>
    dispatch({
      type: 'upsertMemory',
      memory: { ...memory, privateNotes: { ...memory.privateNotes, [me.id]: text } },
    });

  const remove = () => {
    dispatch({ type: 'removeMemory', id: memory.id });
    toast.show({ message: 'Memory removed' });
    navigate('/memories', { replace: true });
  };

  return (
    <>
      <BackBar title="Memory" fallbackTo="/memories" bleed />
      <Screen>
        {memory.photos.length ? (
          <div className={`${s.gallery} no-scrollbar`}>
            {memory.photos.map((src, i) => (
              <div
                key={src}
                className={[s.slide, memory.photos.length === 1 ? s.single : ''].filter(Boolean).join(' ')}
              >
                <Photo src={src} seed={`${memory.id}-${i}`} ratio="4 / 3" alt="" />
              </div>
            ))}
          </div>
        ) : null}

        <header className={s.head}>
          <p className={s.date}>{formatPlanDate(memory.date)}</p>
          <h1 className={s.title}>
            {memory.emoji} {memory.title}
          </h1>
          <div className={s.meta}>
            <Pill tone={kind.tone}>{kind.label}</Pill>
            {memory.place ? <Pill>{memory.place}</Pill> : null}
            {memory.mood ? <Pill>{MOOD_LABEL[memory.mood]}</Pill> : null}
          </div>
        </header>

        {memory.sharedNote ? <p className={s.shared}>“{memory.sharedNote}”</p> : null}

        <div className={s.notes}>
          {[me, partner].map((p) => {
            const isMe = p.id === me.id;
            const text = memory.notes[p.id];
            return (
              <div key={p.id} className={s.note}>
                <div className={s.noteHead}>
                  <Avatar person={p} size={22} />
                  <span className={s.noteName}>{isMe ? 'You' : p.name}</span>
                </div>
                {isMe ? (
                  <textarea
                    className={s.editArea}
                    placeholder="What do you want to remember about this?"
                    value={text ?? ''}
                    onChange={(e) => setMyNote(e.target.value)}
                  />
                ) : text ? (
                  <p className={s.noteBody}>{text}</p>
                ) : (
                  <p className={`${s.noteBody} ${s.noteEmpty}`}>
                    {p.name} hasn't written anything here yet.
                  </p>
                )}
              </div>
            );
          })}

          <div className={`${s.note} ${s.privateNote}`}>
            <div className={s.noteHead}>
              <span className={s.noteName}>🔒 Just for you</span>
              <span className={s.privateLabel}>Never shared</span>
            </div>
            <textarea
              className={s.editArea}
              placeholder="Anything you want to keep to yourself."
              value={memory.privateNotes[me.id] ?? ''}
              onChange={(e) => setMyPrivate(e.target.value)}
            />
          </div>
        </div>

        <div className={s.actions}>
          <ButtonLink to="/explore" variant="secondary" block>
            Plan the next one
          </ButtonLink>
          <button type="button" className={s.delete} onClick={remove}>
            Remove this memory
          </button>
        </div>
      </Screen>
    </>
  );
}
