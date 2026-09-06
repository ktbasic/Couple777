import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Screen } from '@/components/layout/Screen';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Field';
import { Chip } from '@/components/ui/Chip';
import { Photo } from '@/components/ui/Photo';
import { CosmicGreeter } from '@/components/ui/CosmicPair';
import { useToast } from '@/components/ui/Toast';
import { useStore } from '@/context/store';
import { MAX_PHOTOS, readPickedPhoto } from '@/lib/imageFile';
import {
  NEXT_STEP,
  OPENING,
  fallbackReason,
  readMemory,
  type Answered,
  type MemoryReading,
  type ReadingSource,
} from '@/lib/memoryAi';
import { FEELINGS, FEELING_MOOD, HARD_FEELINGS, feelingEmoji } from '@/lib/memoryRead';
import { formatStamp, today } from '@/lib/dates';
import { uid } from '@/lib/id';
import type { Memory } from '@/lib/types';
import s from './MemoryCapture.module.css';

/**
 * Keeping a memory, as a short conversation rather than a form.
 *
 * One thing is asked outright: write it down. What happens next depends on
 * what was written — read by the model behind /api/memory-read, or by the
 * phone itself when there is no key and no signal (lib/memoryAi). Either way
 * the flow is the same: at most three questions, one screen each, every one
 * skippable, and none of them about something the note already said.
 *
 * The part that has to be right is tone. "We argued again and I felt like he
 * wasn't listening" is not a lovely little moment, and meeting it with a
 * sparkle and a date-night suggestion would be worse than saying nothing. So a
 * difficult note gets a calm opening, questions about what they want to
 * remember rather than about what went wrong, private as the default, and
 * never an idea for a night out. Those rules are enforced three times over —
 * in the prompt, in the endpoint, and in lib/memoryAi — because any one layer
 * can fail and this is not a thing to be wrong about.
 *
 * This is one person's memory. Nothing here asks the other one for anything.
 */

type Step = 'write' | 'thinking' | 'ask' | 'review' | 'edit' | 'suggest' | 'done' | 'failed';

const PLACEHOLDER =
  'Write it however it comes to you…\n\ne.g. We cooked pasta tonight and somehow ended up dancing in the kitchen. I haven’t laughed like that in a while.';

/** The most questions anyone is asked, whatever the model would like. */
const MAX_ASKS = 3;

export default function MemoryCaptureScreen() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { state, dispatch, me, error } = useStore();

  // Arriving from a finished plan means the when and where are already known.
  const cycle = state.cycles.find((c) => c.id === params.get('cycle'));
  const plan = state.plans.find((p) => p.id === (cycle?.planId ?? params.get('plan')));

  const [step, setStep] = useState<Step>('write');
  const [note, setNote] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [busyPhotos, setBusyPhotos] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);

  const [reading, setReading] = useState<MemoryReading | null>(null);
  const [answers, setAnswers] = useState<Answered[]>([]);

  const [title, setTitle] = useState('');
  const [emoji, setEmoji] = useState('✨');
  const [date, setDate] = useState<string | null>(plan?.date ?? null);
  const [place, setPlace] = useState(plan?.place ?? '');
  const [feelings, setFeelings] = useState<string[]>([]);
  const [extra, setExtra] = useState('');
  const [visibility, setVisibility] = useState<'private' | 'shared'>('shared');
  const [saved, setSaved] = useState<Memory | null>(null);
  const [source, setSource] = useState<ReadingSource | null>(null);

  const fileInput = useRef<HTMLInputElement>(null);
  /*
   * Saving is optimistic — the reducer runs, then the write goes out. When the
   * write fails the store reloads from the server and the memory quietly
   * disappears, so this watches for that: being told "Kept" about something
   * that was not kept is the one outcome this screen must never produce.
   */
  const errorBefore = useRef<string | null>(null);
  const waitingOnSave = useRef(false);

  useEffect(() => {
    if (!waitingOnSave.current || error === errorBefore.current) return;
    if (error) {
      waitingOnSave.current = false;
      setSaveError(error);
      setStep('failed');
    }
  }, [error]);

  const [saveError, setSaveError] = useState<string | null>(null);
  const hard = reading?.tone === 'difficult' || reading?.type === 'conflict';
  /*
   * Anything but a plainly good note gets the quiet treatment. Mixed is the
   * case that matters: "the wedding was beautiful, but I felt lonely" is not
   * an occasion for a sparkle and a "beautiful moment", and gating only on
   * `hard` would have handed it one.
   */
  const celebratory = reading?.tone === 'positive';

  /* ------------------------------- Photos -------------------------------- */

  const pick = async (files: FileList | null) => {
    if (!files?.length) return;
    setPhotoError(null);
    setBusyPhotos(true);
    const room = MAX_PHOTOS - photos.length;
    const chosen = Array.from(files).slice(0, room);
    try {
      const added = await Promise.all(chosen.map(readPickedPhoto));
      setPhotos((prev) => [...prev, ...added].slice(0, MAX_PHOTOS));
      if (files.length > room) setPhotoError(`${MAX_PHOTOS} photos is the most one memory keeps.`);
    } catch {
      setPhotoError('One of those would not open. Try another?');
    } finally {
      setBusyPhotos(false);
      if (fileInput.current) fileInput.current.value = '';
    }
  };

  /* ------------------------------ The reading ----------------------------- */

  /**
   * What comes back is a starting point, never an overwrite: once someone has
   * answered something themselves, their answer is the answer.
   */
  const apply = (next: MemoryReading, asked: Answered[]) => {
    setReading(next);
    setTitle((current) => current || next.title);
    setEmoji(plan?.emoji ?? emojiFor(next));
    if (next.date && !date) setDate(next.date);
    if (next.place && !place) setPlace(next.place);
    if (!asked.some((a) => a.field === 'feelings') && next.feelings.length) {
      setFeelings(next.feelings.map(titleCase));
    }
    if (!asked.length) setVisibility(next.defaultVisibility);
    setStep(next.needsFollowUp && asked.length < MAX_ASKS ? 'ask' : 'review');
  };

  const ask = async (asked: Answered[]) => {
    setStep('thinking');
    setAnswers(asked);
    const { reading: next, source: from } = await readMemory(note.trim(), asked);
    setSource(from);
    apply(next, asked);
  };

  const begin = () => {
    /* What the plan already told us counts as answered — it is conversation
       state like any other, and it stops the flow asking where someone was on
       an evening it arranged itself. */
    const known: Answered[] = [];
    if (plan?.date) known.push({ question: 'When was this?', field: 'date', answer: plan.date });
    if (plan?.place) known.push({ question: 'Where was this?', field: 'place', answer: plan.place });
    void ask(known);
  };

  /** One answer, then straight back for whatever is worth asking next. */
  const answer = (value: string) => {
    if (!reading?.nextQuestion) return;
    void ask([
      ...answers,
      { question: reading.nextQuestion, field: reading.questionField, answer: value },
    ]);
  };

  const back = () => {
    setPhotoError(null);
    if (step === 'write') {
      navigate(-1);
    } else if (step === 'ask' || step === 'thinking') {
      setStep('write');
    } else if (step === 'review') {
      setStep(reading?.nextQuestion ? 'ask' : 'write');
    } else if (step === 'edit') {
      setStep('review');
    } else {
      navigate(saved ? `/memories/${saved.id}` : '/memories', { replace: true });
    }
  };

  /* -------------------------------- Saving -------------------------------- */

  const keep = () => {
    const written = note.trim();
    const memory: Memory = {
      id: uid('m'),
      date: date ?? today(),
      title: title.trim() || 'A moment worth keeping',
      emoji,
      kind: cycle?.tier ?? 'moment',
      place: place.trim() || undefined,
      photos,
      mood: feelings.length ? FEELING_MOOD[feelings[0]] : undefined,
      feelings: feelings.length ? feelings : undefined,
      visibility,
      sharedNote: written || undefined,
      notes: {},
      /* The last answer is a note to yourself, and it is kept as one — it is
         also the only per-person text on a memory that survives a reload. */
      privateNotes: extra.trim() ? { [me.id]: extra.trim() } : {},
      planId: plan?.id,
      cycleId: cycle?.id,
    };

    errorBefore.current = error;
    waitingOnSave.current = true;
    setSaveError(null);

    dispatch({ type: 'upsertMemory', memory });
    if (plan) dispatch({ type: 'linkMemoryToPlan', planId: plan.id, memoryId: memory.id });
    setSaved(memory);
    toast.show({ emoji: '✓', message: 'Kept', actionLabel: 'See it', actionTo: `/memories/${memory.id}` });
    setStep(reading?.offerNextSteps && reading.nextSteps.length ? 'suggest' : 'done');
  };

  const restart = () => {
    setNote('');
    setPhotos([]);
    setReading(null);
    setAnswers([]);
    setTitle('');
    setEmoji('✨');
    setDate(null);
    setPlace('');
    setFeelings([]);
    setExtra('');
    setVisibility('shared');
    setSaved(null);
    setStep('write');
  };

  /* ------------------------------- Rendering ------------------------------ */

  const dateLabel = date ? formatStamp(date) : null;

  return (
    <>
      <div className={s.bar}>
        <button type="button" className={s.back} onClick={back} aria-label="Back">
          <Chevron />
        </button>
        {step === 'write' ? <span className={s.barTitle}>New memory</span> : null}
      </div>

      <Screen className={s.screen}>
        {debugOn() && source ? <ReaderBadge source={source} reading={reading} /> : null}

        {step === 'write' ? (
          <>
            <header className={s.head}>
              <span className={s.sparkle} aria-hidden>
                ✨
              </span>
              <h1 className={s.title}>What do you want to remember?</h1>
              <p className={s.sub}>
                An occasion, a grateful thought, a small moment, or something you’ve been
                reflecting on.
              </p>
            </header>

            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={PLACEHOLDER}
              maxLength={500}
              showCount
              rows={7}
              autoFocus
            />

            <div className={s.photos}>
              {photos.length ? (
                <div className={s.thumbs}>
                  {photos.map((src, i) => (
                    <div key={src.slice(-24) + i} className={s.thumb}>
                      <Photo src={src} seed={`pick-${i}`} className={s.thumbImg} alt="" />
                      <button
                        type="button"
                        className={s.remove}
                        aria-label="Remove this photo"
                        onClick={() => setPhotos(photos.filter((p) => p !== src))}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              ) : null}

              <input
                ref={fileInput}
                type="file"
                accept="image/*"
                multiple
                className={s.file}
                onChange={(e) => void pick(e.target.files)}
              />
              <Button
                variant="secondary"
                size="lg"
                block
                icon={<PhotoIcon />}
                disabled={busyPhotos || photos.length >= MAX_PHOTOS}
                onClick={() => fileInput.current?.click()}
              >
                {busyPhotos ? 'Adding…' : photos.length ? 'Add more photos' : 'Add photos'}
              </Button>
              {photoError ? <p className={s.hint}>{photoError}</p> : null}
            </div>

            <div className={s.foot}>
              <Button
                variant="accent"
                size="lg"
                block
                disabled={!note.trim()}
                trailingIcon={<Arrow />}
                onClick={begin}
              >
                Continue
              </Button>
            </div>
          </>
        ) : null}

        {step === 'thinking' ? (
          <div className={s.chat}>
            <div className={s.greeter}>
              <CosmicGreeter />
            </div>
            <p className={`${s.bubble} ${s.thinking}`}>
              <span aria-hidden>·</span>
              <span aria-hidden>·</span>
              <span aria-hidden>·</span>
              <span className={s.sr}>Reading what you wrote</span>
            </p>
          </div>
        ) : null}

        {step === 'ask' && reading?.nextQuestion ? (
          <AskStep
            reading={reading}
            first={answers.length === 0}
            onAnswer={answer}
            onSkip={() => answer('')}
            onDate={(value) => {
              setDate(value);
              answer(value ? formatStamp(value) : 'Doesn’t matter');
            }}
            onPlace={(value) => {
              setPlace(value ?? '');
              answer(value ?? '');
            }}
            feelings={feelings}
            onFeelings={setFeelings}
            extra={extra}
            onExtra={setExtra}
          />
        ) : null}

        {step === 'review' && (
          <>
            <header className={s.head}>
              <h1 className={s.title}>{celebratory ? 'Your memory ✨' : 'Your memory'}</h1>
              <p className={s.sub}>Here’s what we’ve captured.</p>
            </header>

            <article className={s.card}>
              {photos.length ? (
                <div className={s.strip}>
                  {photos.slice(0, 2).map((src, i) => (
                    <Photo key={i} src={src} seed={`rev-${i}`} className={s.stripImg} alt="" />
                  ))}
                  {photos.length > 2 ? <span className={s.more}>+{photos.length - 2}</span> : null}
                </div>
              ) : null}

              <h2 className={s.cardTitle}>
                <span aria-hidden>{emoji}</span> {title}
              </h2>

              {dateLabel || place ? (
                <p className={s.meta}>
                  {dateLabel ? <span>🗓 {dateLabel}</span> : null}
                  {place ? <span>📍 {place}</span> : null}
                </p>
              ) : null}

              {note.trim() ? <p className={s.quote}>“{note.trim()}”</p> : null}
              {extra.trim() ? (
                <p className={s.extra}>
                  <span className={s.extraLabel}>🔒 Just for you</span>
                  {extra.trim()}
                </p>
              ) : null}

              {feelings.length ? (
                <div className={s.tags}>
                  {feelings.map((f) => (
                    <span key={f} className={s.tag}>
                      <span aria-hidden>{feelingEmoji(f)}</span> {f}
                    </span>
                  ))}
                </div>
              ) : null}

              <Visibility value={visibility} onChange={setVisibility} />
            </article>

            <div className={s.foot}>
              <Button variant="accent" size="lg" block onClick={keep}>
                Keep this memory
              </Button>
              <Button variant="secondary" size="lg" block onClick={() => setStep('edit')}>
                Edit details
              </Button>
            </div>
          </>
        )}

        {step === 'edit' && (
          <>
            <header className={s.head}>
              <h1 className={s.title}>Edit details</h1>
              <p className={s.sub}>Change anything. It is your memory.</p>
            </header>

            <div className={s.form}>
              <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={80} />
              <Input
                label="When"
                type="date"
                value={date ?? ''}
                onChange={(e) => setDate(e.target.value || null)}
              />
              <Input
                label="Where"
                placeholder="Optional"
                value={place}
                onChange={(e) => setPlace(e.target.value)}
              />
              <Textarea
                label="What you wrote"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                maxLength={500}
                showCount
                rows={5}
              />
              <div>
                <p className={s.label}>How it felt</p>
                <div className={s.chips}>
                  {feelingChoices(hard, feelings).map((f) => (
                    <Chip
                      key={f}
                      emoji={feelingEmoji(f)}
                      selected={feelings.includes(f)}
                      onClick={() =>
                        setFeelings(
                          feelings.includes(f) ? feelings.filter((v) => v !== f) : [...feelings, f],
                        )
                      }
                    >
                      {f}
                    </Chip>
                  ))}
                </div>
              </div>
            </div>

            <div className={s.foot}>
              <Button variant="accent" size="lg" block onClick={() => setStep('review')}>
                Done
              </Button>
            </div>
          </>
        )}

        {step === 'suggest' && reading && (
          <>
            <header className={s.headCentre}>
              {celebratory ? (
                <span className={s.sparkle} aria-hidden>
                  ✨
                </span>
              ) : null}
              <h1 className={s.title}>
                {celebratory ? 'Want to turn this into something more?' : 'Would any of this help?'}
              </h1>
              <p className={s.sub}>
                {celebratory
                  ? 'Here are a few ideas based on this memory.'
                  : 'No rush, and no wrong answer.'}
              </p>
            </header>

            <div className={s.options}>
              {reading.nextSteps.map((id) => (
                <button
                  key={id}
                  type="button"
                  className={s.option}
                  onClick={() => navigate(NEXT_STEP[id].to)}
                >
                  <span className={s.optionIcon} aria-hidden>
                    {NEXT_STEP[id].icon}
                  </span>
                  <span className={s.optionLabel}>{NEXT_STEP[id].label}</span>
                  <span className={s.plus} aria-hidden>
                    +
                  </span>
                </button>
              ))}
            </div>

            <button type="button" className={s.skip} onClick={() => setStep('done')}>
              Maybe later
            </button>
          </>
        )}

        {step === 'failed' && (
          <div className={s.done}>
            <span className={s.moon} aria-hidden>
              🌧
            </span>
            <h1 className={s.title}>That didn’t save</h1>
            <p className={s.sub}>
              Your words are still here — nothing is lost. This is what came back:
            </p>
            <p className={s.error}>{saveError}</p>

            <div className={s.foot}>
              <Button variant="accent" size="lg" block onClick={keep}>
                Try again
              </Button>
              <Button variant="secondary" size="lg" block onClick={() => setStep('review')}>
                Back to the memory
              </Button>
            </div>
          </div>
        )}

        {step === 'done' && (
          <div className={s.done}>
            <span className={s.moon} aria-hidden>
              🌙
            </span>
            <h1 className={s.title}>{celebratory ? 'Saved ✨' : 'Kept'}</h1>
            <p className={s.sub}>
              {celebratory
                ? 'Another beautiful moment in your 777 universe.'
                : visibility === 'private'
                  ? 'This one is just for you. It will be here when you want it.'
                  : 'It is written down, and it will be here when you want it.'}
            </p>

            <div className={s.foot}>
              <Button
                variant="accent"
                size="lg"
                block
                onClick={() => navigate(`/memories/${saved?.id ?? ''}`, { replace: true })}
              >
                View memory
              </Button>
              <Button variant="secondary" size="lg" block onClick={restart}>
                Add another
              </Button>
            </div>

            {celebratory ? <p className={s.hand}>More moments. A closer us. ♡</p> : null}
          </div>
        )}
      </Screen>
    </>
  );
}

/* ------------------------------- One question ------------------------------ */

function AskStep({
  reading,
  first,
  feelings,
  extra,
  onAnswer,
  onSkip,
  onDate,
  onPlace,
  onFeelings,
  onExtra,
}: {
  reading: MemoryReading;
  first: boolean;
  feelings: string[];
  extra: string;
  onAnswer: (value: string) => void;
  onSkip: () => void;
  onDate: (value: string | null) => void;
  onPlace: (value: string | null) => void;
  onFeelings: (value: string[]) => void;
  onExtra: (value: string) => void;
}) {
  const [typing, setTyping] = useState<'date' | 'place' | 'feeling' | null>(null);
  const [typed, setTyped] = useState('');
  const hard = reading.tone === 'difficult' || reading.type === 'conflict';
  const field = reading.questionField;

  // Only a plainly good note gets a chirpy aside.
  const hand = reading.tone !== 'positive'
    ? 'Whatever you need to keep. ♡'
    : field === 'date'
      ? 'Little moments make a big love story. ♡'
      : field === 'place'
        ? 'Same place, now memories. ♡'
        : field === 'feelings'
          ? 'Feel it. Keep it. ♡'
          : 'A kinder you for future you. ♡';

  /* A tapped reply is words, not a value — the model writes them — so each one
     is read for what it means before it is acted on, and anything
     unrecognised is still recorded as the answer it was. */
  const tapDate = (reply: string) => {
    if (/toda|tonight|this (morning|afternoon|evening)|^yes/i.test(reply)) return onDate(today());
    if (/choose|another|different|pick|date/i.test(reply)) return setTyping('date');
    if (/matter|skip|sure|remember/i.test(reply)) return onDate(null);
    return onAnswer(reply);
  };

  const tapPlace = (reply: string) => {
    if (/^(at )?home$/i.test(reply.trim())) return onPlace('Home');
    if (/add|another|somewhere|else|choose|where/i.test(reply)) return setTyping('place');
    if (/skip|rather not|doesn|matter/i.test(reply)) return onPlace(null);
    return onPlace(reply);
  };

  const toggle = (f: string) =>
    onFeelings(feelings.includes(f) ? feelings.filter((v) => v !== f) : [...feelings, f]);

  const replies = reading.quickReplies.length
    ? reading.quickReplies
    : field === 'feelings'
      ? [...(hard ? HARD_FEELINGS : FEELINGS)]
      : [];

  return (
    <div className={s.chat}>
      <div className={s.greeter}>
        <CosmicGreeter />
      </div>

      {/*
        Said once, in words written for this note by whatever read it. The
        fallback deliberately says the same plain thing to everybody: it is
        pattern matching, not comprehension, and a wrong guess dressed as an
        emotional response is worse than no response at all.
      */}
      {first ? (
        <p className={s.bubble}>{reading.acknowledgement || OPENING[reading.tone]}</p>
      ) : null}
      <p className={s.bubble}>{reading.nextQuestion}</p>

      {field === 'date' && (
        <div className={s.options}>
          {typing === 'date' ? (
            <>
              <Input
                type="date"
                autoFocus
                onChange={(e) => (e.target.value ? onDate(e.target.value) : undefined)}
              />
              <button type="button" className={s.skip} onClick={() => setTyping(null)}>
                Back to the quick answers
              </button>
            </>
          ) : (
            <>
              {replies.map((r) => (
                <Option key={r} icon={dateIcon(r)} label={r} onClick={() => tapDate(r)} />
              ))}
              <button type="button" className={s.skip} onClick={onSkip}>
                Skip
              </button>
            </>
          )}
        </div>
      )}

      {field === 'place' && (
        <div className={s.options}>
          {typing === 'place' ? (
            <form
              className={s.inline}
              onSubmit={(e) => {
                e.preventDefault();
                onPlace(typed.trim() || null);
              }}
            >
              <Input
                autoFocus
                placeholder="Where were you?"
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
              />
              <Button type="submit" variant="accent" size="lg" block disabled={!typed.trim()}>
                Save this place
              </Button>
            </form>
          ) : (
            <>
              {replies.map((r) => (
                <Option key={r} icon={placeIcon(r)} label={r} onClick={() => tapPlace(r)} />
              ))}
              <button type="button" className={s.skip} onClick={onSkip}>
                Skip
              </button>
            </>
          )}
        </div>
      )}

      {field === 'feelings' && (
        <>
          <div className={s.feelings}>
            {replies.map((f) => (
              <Chip
                key={f}
                emoji={feelingEmoji(f)}
                selected={feelings.includes(titleCase(f))}
                onClick={() => toggle(titleCase(f))}
              >
                {titleCase(f)}
              </Chip>
            ))}
            <Chip
              emoji="✏️"
              selected={typing === 'feeling'}
              onClick={() => setTyping(typing === 'feeling' ? null : 'feeling')}
            >
              Add my own
            </Chip>
          </div>

          {typing === 'feeling' ? (
            <form
              className={s.own}
              onSubmit={(e) => {
                e.preventDefault();
                const word = titleCase(typed.trim());
                if (!word) return;
                if (!feelings.includes(word)) onFeelings([...feelings, word]);
                setTyped('');
                setTyping(null);
              }}
            >
              <Input
                autoFocus
                placeholder="In your own word"
                maxLength={24}
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
              />
              <Button type="submit" variant="secondary" size="md" disabled={!typed.trim()}>
                Add
              </Button>
            </form>
          ) : null}

          <div className={s.foot}>
            {feelings.length ? (
              <Button variant="accent" size="lg" block onClick={() => onAnswer(feelings.join(', '))}>
                Continue
              </Button>
            ) : (
              <button type="button" className={s.skip} onClick={onSkip}>
                Skip
              </button>
            )}
          </div>
        </>
      )}

      {(field === 'context' || field === null) && (
        <>
          <Textarea
            value={extra}
            onChange={(e) => onExtra(e.target.value)}
            placeholder="Add a note, just for you (optional)"
            maxLength={500}
            showCount
            rows={5}
            autoFocus
          />
          <div className={s.foot}>
            {extra.trim() ? (
              <Button variant="accent" size="lg" block onClick={() => onAnswer(extra.trim())}>
                Continue
              </Button>
            ) : (
              <button type="button" className={s.skip} onClick={onSkip}>
                Skip
              </button>
            )}
          </div>
        </>
      )}

      <p className={s.hand}>{hand}</p>
    </div>
  );
}

/* ---------------------------------- Debug ---------------------------------- */

const DEBUG_KEY = 'couple777:debug';

/**
 * Off unless asked for. Open any screen with ?debug=1 to switch it on and
 * ?debug=0 to switch it off; it is remembered in between so it survives the
 * steps of the flow. Nothing about it is on for anybody else.
 */
function debugOn(): boolean {
  try {
    const param = new URLSearchParams(window.location.search).get('debug');
    if (param === '1') window.localStorage.setItem(DEBUG_KEY, '1');
    if (param === '0') window.localStorage.removeItem(DEBUG_KEY);
    return window.localStorage.getItem(DEBUG_KEY) === '1';
  } catch {
    return false;
  }
}

/** Which reader answered, and what it said. Only ever shown in debug. */
function ReaderBadge({
  source,
  reading,
}: {
  source: ReadingSource;
  reading: MemoryReading | null;
}) {
  const model = source === 'model';
  return (
    <p className={[s.badge, model ? s.badgeModel : s.badgeLocal].join(' ')}>
      <span>{model ? '● Reading with Claude' : '● Using local fallback'}</span>
      {reading ? (
        <span className={s.badgeDetail}>
          tone: {reading.tone} · type: {reading.type}
          {reading.questionField ? ` · asking: ${reading.questionField}` : ''}
        </span>
      ) : null}
      {!model && fallbackReason() ? (
        <span className={s.badgeDetail}>why: {fallbackReason()}</span>
      ) : null}
    </p>
  );
}

/* --------------------------------- Pieces ---------------------------------- */

function Visibility({
  value,
  onChange,
}: {
  value: 'private' | 'shared';
  onChange: (v: 'private' | 'shared') => void;
}) {
  return (
    <div className={s.visibility}>
      <div className={s.visRow}>
        <button
          type="button"
          className={s.vis}
          aria-pressed={value === 'private'}
          onClick={() => onChange('private')}
        >
          🔒 Private
        </button>
        <button
          type="button"
          className={s.vis}
          aria-pressed={value === 'shared'}
          onClick={() => onChange('shared')}
        >
          💞 Shared
        </button>
      </div>
      <p className={s.visNote}>
        {value === 'private'
          ? 'Only you can see this one.'
          : 'This goes on the timeline you both see.'}
      </p>
    </div>
  );
}

function Option({ icon, label, onClick }: { icon: string; label: string; onClick: () => void }) {
  return (
    <button type="button" className={s.option} onClick={onClick}>
      <span className={s.optionIcon} aria-hidden>
        {icon}
      </span>
      <span className={s.optionLabel}>{label}</span>
    </button>
  );
}

function titleCase(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

/** The set on the edit screen: the right six, plus anything already chosen. */
function feelingChoices(hard: boolean, chosen: string[]): string[] {
  const base: string[] = hard ? [...HARD_FEELINGS] : [...FEELINGS];
  return [...base, ...chosen.filter((f) => !base.includes(f))];
}

function dateIcon(reply: string): string {
  if (/toda|tonight|^yes/i.test(reply)) return '💗';
  if (/matter|skip|sure/i.test(reply)) return '···';
  return '🗓';
}

function placeIcon(reply: string): string {
  if (/home/i.test(reply)) return '🏠';
  if (/skip|matter|rather not/i.test(reply)) return '···';
  return '📍';
}

/** Something small at the top of the card, chosen by what kind of note it is. */
function emojiFor(reading: MemoryReading): string {
  if (reading.tone === 'difficult') return '🤍';
  switch (reading.type) {
    case 'gratitude':
      return '🌿';
    case 'milestone':
      return '🎉';
    case 'reflection':
      return '💭';
    case 'conflict':
      return '🤍';
    default:
      return '✨';
  }
}

/* --------------------------------- Marks ---------------------------------- */

function Chevron() {
  return (
    <svg viewBox="0 0 24 24" width="17" height="17" aria-hidden>
      <path
        d="M15 5l-7 7 7 7"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Arrow() {
  return (
    <svg viewBox="0 0 24 24" width="17" height="17" aria-hidden>
      <path
        d="M5 12h13m-5-6 6 6-6 6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PhotoIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden>
      <rect
        x="3"
        y="5"
        width="18"
        height="14"
        rx="3.4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <circle cx="9" cy="10" r="1.6" fill="currentColor" />
      <path
        d="M4.5 17.5 9.5 12l3.2 3 2.4-2 4.4 4.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
