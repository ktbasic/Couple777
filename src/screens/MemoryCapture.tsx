import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { BackBar, Screen } from '@/components/layout/Screen';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Field';
import { Chip } from '@/components/ui/Chip';
import { Photo } from '@/components/ui/Photo';
import { useToast } from '@/components/ui/Toast';
import { useStore } from '@/context/store';
import { photo } from '@/lib/photo';
import { today } from '@/lib/dates';
import { uid } from '@/lib/id';
import type { Memory, MemoryKind, Mood } from '@/lib/types';
import s from './MemoryCapture.module.css';

const MOODS: { value: Mood; label: string; emoji: string }[] = [
  { value: 'warm', label: 'Warm', emoji: '🕯️' },
  { value: 'joyful', label: 'Joyful', emoji: '☀️' },
  { value: 'calm', label: 'Calm', emoji: '🌾' },
  { value: 'silly', label: 'Silly', emoji: '🤸' },
  { value: 'proud', label: 'Proud', emoji: '🌟' },
  { value: 'tender', label: 'Tender', emoji: '🤍' },
];

const KINDS: { value: MemoryKind; label: string; emoji: string }[] = [
  { value: 'day', label: 'A date', emoji: '🍷' },
  { value: 'week', label: 'Mini adventure', emoji: '🏔️' },
  { value: 'month', label: 'Big adventure', emoji: '✈️' },
  { value: 'milestone', label: 'Milestone', emoji: '❤️' },
  { value: 'moment', label: 'Just a moment', emoji: '✨' },
];

export default function MemoryCaptureScreen() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { state, dispatch, me } = useStore();

  // Arrives from a completed cycle, so the rhythm, plan and partner are known.
  const cycle = state.cycles.find((c) => c.id === params.get('cycle'));
  const plan =
    state.plans.find((p) => p.id === (cycle?.planId ?? params.get('plan'))) ?? undefined;

  const [title, setTitle] = useState(plan?.title ?? '');
  const [emoji] = useState(plan?.emoji ?? '✨');
  const [date, setDate] = useState(plan?.date ?? today());
  const [place, setPlace] = useState(plan?.place ?? '');
  const [shared, setSharedNote] = useState('');
  const [kind, setKind] = useState<MemoryKind>(cycle?.tier ?? 'moment');
  const [mood, setMood] = useState<Mood | null>(null);
  const [mine, setMine] = useState('');
  const [selected, setSelected] = useState<string[]>([]);

  // Stands in for the camera roll — a real build reads the last week of photos.
  const roll = useMemo(
    () => Array.from({ length: 9 }, (_, i) => photo(`roll-${plan?.id ?? 'new'}-${i}`, 600, 600)),
    [plan?.id],
  );

  const toggle = (src: string) =>
    setSelected((prev) => (prev.includes(src) ? prev.filter((p) => p !== src) : [...prev, src]));

  const save = () => {
    const memory: Memory = {
      id: uid('m'),
      date,
      title: title.trim() || 'A moment together',
      emoji,
      kind,
      place: place.trim() || undefined,
      photos: selected,
      mood: mood ?? undefined,
      sharedNote: shared.trim() || undefined,
      notes: mine.trim() ? { [me.id]: mine.trim() } : {},
      privateNotes: {},
      planId: plan?.id,
      cycleId: cycle?.id,
    };

    dispatch({ type: 'upsertMemory', memory });
    if (plan) dispatch({ type: 'linkMemoryToPlan', planId: plan.id, memoryId: memory.id });

    toast.show({ emoji: '✓', message: 'Another memory made', actionLabel: 'See it', actionTo: `/memories/${memory.id}` });
    navigate(`/memories/${memory.id}`, { replace: true });
  };

  return (
    <>
      <BackBar title="New memory" fallbackTo="/memories" />
      <Screen>
        <header className={s.head}>
          <p className={s.eyebrow}>{plan ? 'Another memory made' : 'Keep it'}</p>
          <h1 className={s.title}>
            {plan ? `How was ${plan.title.toLowerCase()}?` : 'What do you want to remember?'}
          </h1>
          <p className={s.sub}>
            {plan
              ? 'A photo and a line each is plenty. You will be glad of it in a year.'
              : 'It does not have to be an occasion. The small ones age best.'}
          </p>
        </header>

        <div className={s.form}>
          <Input
            label="What happened"
            placeholder="Pasta date at home"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <div>
            <p className={s.label}>Photos</p>
            <div className={s.roll}>
              {roll.map((src) => (
                <button
                  key={src}
                  type="button"
                  aria-pressed={selected.includes(src)}
                  className={[s.tile, selected.includes(src) ? s.tileOn : ''].filter(Boolean).join(' ')}
                  onClick={() => toggle(src)}
                >
                  <Photo src={src} seed={src} className={s.tileImg} alt="" />
                </button>
              ))}
            </div>
            <p className={s.hint}>
              {selected.length
                ? `${selected.length} selected`
                : 'From the last few days. Tap the ones that belong to this.'}
            </p>
          </div>

          <div>
            <p className={s.label}>What kind of moment?</p>
            <div className={s.moods}>
              {KINDS.map((k) => (
                <Chip key={k.value} emoji={k.emoji} selected={kind === k.value} onClick={() => setKind(k.value)}>
                  {k.label}
                </Chip>
              ))}
            </div>
          </div>

          <div>
            <p className={s.label}>How did it feel?</p>
            <div className={s.moods}>
              {MOODS.map((m) => (
                <Chip
                  key={m.value}
                  emoji={m.emoji}
                  selected={mood === m.value}
                  onClick={() => setMood((v) => (v === m.value ? null : m.value))}
                >
                  {m.label}
                </Chip>
              ))}
            </div>
          </div>

          <Input label="When" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          <Input
            label="Where"
            placeholder="Optional"
            value={place}
            onChange={(e) => setPlace(e.target.value)}
          />

          <Textarea
            label="One line, from both of you"
            placeholder="Ended up dancing in the kitchen."
            value={shared}
            onChange={(e) => setSharedNote(e.target.value)}
            hint="This is the line that shows on the timeline."
          />

          <Textarea
            label="And in your own words"
            placeholder="What you want to remember about it."
            value={mine}
            onChange={(e) => setMine(e.target.value)}
            hint="Your partner writes their own. Both are kept."
          />
        </div>

        <div className={s.actions}>
          <Button variant="accent" size="lg" block onClick={save}>
            Keep this memory
          </Button>
          <button type="button" className={s.skip} onClick={() => navigate(-1)}>
            Not now
          </button>
        </div>
      </Screen>
    </>
  );
}
