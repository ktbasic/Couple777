import { useRef, useState } from 'react';
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
  FEELINGS,
  FEELING_EMOJI,
  FEELING_MOOD,
  asksFor,
  readNote,
  suggestionsFor,
  type Ask,
  type Suggestion,
} from '@/lib/memoryRead';
import { formatStamp, today } from '@/lib/dates';
import { uid } from '@/lib/id';
import type { Memory } from '@/lib/types';
import s from './MemoryCapture.module.css';

/**
 * Keeping a memory, as a short conversation rather than a form.
 *
 * One thing is asked outright: write it down. Everything else — when, where,
 * how it felt — is read out of those words first (see lib/memoryRead) and only
 * asked when the words did not already say. Two or three questions, one at a
 * time, each with an answer that is one tap and each skippable.
 *
 * This is one person's memory. Nothing here waits on the other one, asks them
 * to fill anything in, or shows them a half-finished thing: it is written,
 * kept, and only then does it appear on the shared timeline.
 */

type Step = 'write' | 'ask' | 'review' | 'edit' | 'suggest' | 'done';

const PLACEHOLDER =
  'Write it however it comes to you…\n\ne.g. We cooked pasta tonight and somehow ended up dancing in the kitchen. I haven’t laughed like that in a while.';

export default function MemoryCaptureScreen() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { state, dispatch, me, partner } = useStore();

  // Arriving from a finished plan means the when and where are already known,
  // so those questions are never asked.
  const cycle = state.cycles.find((c) => c.id === params.get('cycle'));
  const plan = state.plans.find((p) => p.id === (cycle?.planId ?? params.get('plan')));

  const [step, setStep] = useState<Step>('write');
  const [note, setNote] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [busyPhotos, setBusyPhotos] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [emoji, setEmoji] = useState('✨');
  const [date, setDate] = useState<string | null>(plan?.date ?? null);
  const [place, setPlace] = useState(plan?.place ?? '');
  const [feelings, setFeelings] = useState<string[]>([]);
  const [extra, setExtra] = useState('');
  const [ownFeeling, setOwnFeeling] = useState(false);

  const [asks, setAsks] = useState<Ask[]>([]);
  const [asked, setAsked] = useState(0);
  const [saved, setSaved] = useState<Memory | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);

  const fileInput = useRef<HTMLInputElement>(null);

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

  /* -------------------------- Reading, then asking ------------------------ */

  const begin = () => {
    const reading = readNote(note);
    setTitle(reading.title);
    setEmoji(plan?.emoji ?? reading.emoji);
    if (reading.date && !date) setDate(reading.date);
    if (reading.place && !place) setPlace(reading.place);
    setFeelings(reading.feelings);

    const queue = asksFor(reading, { date: Boolean(date), place: Boolean(place) });
    setAsks(queue);
    setAsked(0);
    setStep(queue.length ? 'ask' : 'review');
  };

  const nextAsk = () => {
    if (asked + 1 < asks.length) setAsked(asked + 1);
    else setStep('review');
  };

  const back = () => {
    setPhotoError(null);
    if (step === 'write') {
      navigate(-1);
    } else if (step === 'ask') {
      if (asked > 0) setAsked(asked - 1);
      else setStep('write');
    } else if (step === 'review') {
      if (asks.length) {
        setAsked(asks.length - 1);
        setStep('ask');
      } else {
        setStep('write');
      }
    } else if (step === 'edit') {
      setStep('review');
    } else {
      // Saved already — there is nothing behind this but the memory itself.
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
      sharedNote: written || undefined,
      notes: {},
      /*
       * "Anything else you want to remember" is a note to yourself — the
       * screen says as much — so it is kept as one. It is also the only
       * per-person text on a memory that survives a reload: the shared
       * per-person note has no column behind it.
       */
      privateNotes: extra.trim() ? { [me.id]: extra.trim() } : {},
      planId: plan?.id,
      cycleId: cycle?.id,
    };

    dispatch({ type: 'upsertMemory', memory });
    if (plan) dispatch({ type: 'linkMemoryToPlan', planId: plan.id, memoryId: memory.id });
    setSaved(memory);
    /* Said here rather than on the last screen, because a suggestion can carry
       someone off to the plan editor without ever seeing it. */
    toast.show({ emoji: '✓', message: 'Kept', actionLabel: 'See it', actionTo: `/memories/${memory.id}` });

    const next = suggestionsFor(`${written} ${extra}`, place || undefined, partner.name);
    setSuggestions(next);
    setStep(next.length ? 'suggest' : 'done');
  };

  /* ------------------------------- Rendering ------------------------------ */

  const dateLabel = date ? formatStamp(date) : null;
  const ask = step === 'ask' ? asks[asked] : null;

  return (
    <>
      <div className={s.bar}>
        <button type="button" className={s.back} onClick={back} aria-label="Back">
          <Chevron />
        </button>
        {step === 'write' ? <span className={s.barTitle}>New memory</span> : null}
      </div>

      <Screen className={s.screen}>
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
                {busyPhotos
                  ? 'Adding…'
                  : photos.length
                    ? 'Add more photos'
                    : 'Add photos'}
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

        {ask ? (
          <AskStep
            ask={ask}
            first={asked === 0}
            partnerName={partner.name}
            onDate={(value) => {
              setDate(value);
              nextAsk();
            }}
            onPlace={(value) => {
              if (value !== null) setPlace(value);
              nextAsk();
            }}
            feelings={feelings}
            ownFeeling={ownFeeling}
            onFeeling={setFeelings}
            onOwnFeeling={setOwnFeeling}
            extra={extra}
            onExtra={setExtra}
            onNext={nextAsk}
          />
        ) : null}

        {step === 'review' && (
          <>
            <header className={s.head}>
              <h1 className={s.title}>
                Your memory <span aria-hidden>✨</span>
              </h1>
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
                      <span aria-hidden>{FEELING_EMOJI[f] ?? '✨'}</span> {f}
                    </span>
                  ))}
                </div>
              ) : null}
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
                  {FEELINGS.map((f) => (
                    <Chip
                      key={f}
                      emoji={FEELING_EMOJI[f]}
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

        {step === 'suggest' && (
          <>
            <header className={s.headCentre}>
              <span className={s.sparkle} aria-hidden>
                ✨
              </span>
              <h1 className={s.title}>Want to turn this into something more?</h1>
              <p className={s.sub}>Here are a few ideas based on this memory.</p>
            </header>

            <div className={s.options}>
              {suggestions.map((sug) => (
                <button
                  key={sug.id}
                  type="button"
                  className={s.option}
                  onClick={() => navigate(sug.to)}
                >
                  <span className={s.optionIcon} aria-hidden>
                    {sug.icon}
                  </span>
                  <span className={s.optionLabel}>{sug.label}</span>
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

        {step === 'done' && (
          <div className={s.done}>
            <span className={s.moon} aria-hidden>
              🌙
            </span>
            <h1 className={s.title}>
              Saved <span aria-hidden>✨</span>
            </h1>
            <p className={s.sub}>Another beautiful moment in your 777 universe.</p>

            <div className={s.foot}>
              <Button
                variant="accent"
                size="lg"
                block
                onClick={() => navigate(`/memories/${saved?.id ?? ''}`, { replace: true })}
              >
                View memory
              </Button>
              <Button variant="secondary" size="lg" block onClick={() => restart()}>
                Add another
              </Button>
            </div>

            <p className={s.hand}>More moments. A closer us. ♡</p>
          </div>
        )}
      </Screen>
    </>
  );

  function restart() {
    setNote('');
    setPhotos([]);
    setTitle('');
    setEmoji('✨');
    setDate(null);
    setPlace('');
    setFeelings([]);
    setExtra('');
    setOwnFeeling(false);
    setAsks([]);
    setAsked(0);
    setSaved(null);
    setSuggestions([]);
    setStep('write');
  }
}

/* ------------------------------- One question ------------------------------ */

function AskStep({
  ask,
  first,
  feelings,
  ownFeeling,
  extra,
  onDate,
  onPlace,
  onFeeling,
  onOwnFeeling,
  onExtra,
  onNext,
}: {
  ask: Ask;
  first: boolean;
  partnerName: string;
  feelings: string[];
  ownFeeling: boolean;
  extra: string;
  onDate: (value: string | null) => void;
  onPlace: (value: string | null) => void;
  onFeeling: (value: string[]) => void;
  onOwnFeeling: (value: boolean) => void;
  onExtra: (value: string) => void;
  onNext: () => void;
}) {
  const [picking, setPicking] = useState(false);
  const [typedPlace, setTypedPlace] = useState('');
  const [typedFeeling, setTypedFeeling] = useState('');

  const question = {
    date: 'Was this today?',
    place: 'Do you want to remember where this happened?',
    feeling: 'How did this moment leave you feeling?',
    more: 'Anything else you want to remember about this?',
  }[ask];

  const hand = {
    date: 'Little moments make a big love story. ♡',
    place: 'Same place, now memories. ♡',
    feeling: 'Feel it. Keep it. ♡',
    more: 'A kinder you for future you. ♡',
  }[ask];

  const toggle = (f: string) =>
    onFeeling(feelings.includes(f) ? feelings.filter((v) => v !== f) : [...feelings, f]);

  return (
    <div className={s.chat}>
      <div className={s.greeter}>
        <CosmicGreeter />
      </div>

      {/* The reaction is said once, on the way in, and then it gets out of the
          way — three screens of enthusiasm is not warmth, it is noise. */}
      {first ? <p className={s.bubble}>That sounds like a lovely little moment ✨</p> : null}
      <p className={s.bubble}>{question}</p>

      {ask === 'date' && (
        <div className={s.options}>
          {picking ? (
            <>
              <Input
                type="date"
                autoFocus
                onChange={(e) => (e.target.value ? onDate(e.target.value) : undefined)}
              />
              <button type="button" className={s.skip} onClick={() => setPicking(false)}>
                Back to the quick answers
              </button>
            </>
          ) : (
            <>
              <Option icon="💗" label="Yes, today" onClick={() => onDate(today())} />
              <Option icon="🗓" label="Choose another date" onClick={() => setPicking(true)} />
              <Option icon="···" label="Doesn’t matter" onClick={() => onDate(null)} />
            </>
          )}
        </div>
      )}

      {ask === 'place' && (
        <div className={s.options}>
          {picking ? (
            <form
              className={s.inline}
              onSubmit={(e) => {
                e.preventDefault();
                onPlace(typedPlace.trim() || null);
              }}
            >
              <Input
                autoFocus
                placeholder="Where were you?"
                value={typedPlace}
                onChange={(e) => setTypedPlace(e.target.value)}
              />
              <Button type="submit" variant="accent" size="lg" block disabled={!typedPlace.trim()}>
                Save this place
              </Button>
            </form>
          ) : (
            <>
              <Option icon="🏠" label="At home" onClick={() => onPlace('Home')} />
              <Option icon="📍" label="Add a place" onClick={() => setPicking(true)} />
              <Option icon="···" label="Skip" onClick={() => onPlace(null)} />
            </>
          )}
        </div>
      )}

      {ask === 'feeling' && (
        <>
          <div className={s.feelings}>
            {FEELINGS.map((f) => (
              <Chip
                key={f}
                emoji={FEELING_EMOJI[f]}
                selected={feelings.includes(f)}
                onClick={() => toggle(f)}
              >
                {f}
              </Chip>
            ))}
            <Chip emoji="✏️" selected={ownFeeling} onClick={() => onOwnFeeling(!ownFeeling)}>
              Add my own
            </Chip>
          </div>

          {ownFeeling ? (
            <form
              className={s.own}
              onSubmit={(e) => {
                e.preventDefault();
                const word = typedFeeling.trim();
                if (!word) return;
                if (!feelings.includes(word)) onFeeling([...feelings, word]);
                setTypedFeeling('');
                onOwnFeeling(false);
              }}
            >
              <Input
                autoFocus
                placeholder="In your own word"
                maxLength={24}
                value={typedFeeling}
                onChange={(e) => setTypedFeeling(e.target.value)}
              />
              <Button type="submit" variant="secondary" size="md" disabled={!typedFeeling.trim()}>
                Add
              </Button>
            </form>
          ) : null}

          {/* One way on, whichever it is: a second button that does the same
              thing under a different word only makes people wonder which one
              keeps their answer. */}
          <div className={s.foot}>
            {feelings.length ? (
              <Button variant="accent" size="lg" block onClick={onNext}>
                Continue
              </Button>
            ) : (
              <button type="button" className={s.skip} onClick={onNext}>
                Skip
              </button>
            )}
          </div>
        </>
      )}

      {ask === 'more' && (
        <>
          <Textarea
            value={extra}
            onChange={(e) => onExtra(e.target.value)}
            placeholder={'Add a note, just for you (optional)\n\ne.g. I loved how spontaneous it was. We should do this more often!'}
            maxLength={500}
            showCount
            rows={5}
            autoFocus
          />
          <div className={s.foot}>
            {extra.trim() ? (
              <Button variant="accent" size="lg" block onClick={onNext}>
                Continue
              </Button>
            ) : (
              <button type="button" className={s.skip} onClick={onNext}>
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
