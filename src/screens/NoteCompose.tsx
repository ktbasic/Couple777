import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BackBar, Screen, ScreenHeader } from '@/components/layout/Screen';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { useToast } from '@/components/ui/Toast';
import { useStore } from '@/context/store';
import { NOTE_KINDS } from '@/features/NoteCard';
import { uid } from '@/lib/id';
import type { Note } from '@/lib/types';
import s from './NoteCompose.module.css';

/** "Send later" options, in the language people actually use. */
const WHEN = [
  { label: 'Now', hours: 0 },
  { label: 'Tonight', hours: 8 },
  { label: 'Tomorrow morning', hours: 16 },
  { label: 'Friday evening', hours: 72 },
  { label: 'Next week', hours: 168 },
];

export default function NoteComposeScreen() {
  const navigate = useNavigate();
  const toast = useToast();
  const { dispatch, me, partner } = useStore();

  const [kind, setKind] = useState<Note['kind']>('appreciation');
  const [body, setBody] = useState('');
  const [when, setWhen] = useState(0);

  const isPrivate = kind === 'private';

  const send = () => {
    const text = body.trim();
    if (!text) return;
    const delay = isPrivate ? 0 : when;

    const note: Note = {
      id: uid('n'),
      kind,
      body: text,
      from: me.id,
      createdAt: new Date().toISOString(),
      deliverAt: delay ? new Date(Date.now() + delay * 3600_000).toISOString() : undefined,
      deliverLabel: delay ? WHEN.find((w) => w.hours === delay)?.label : undefined,
    };

    dispatch({ type: 'addNote', note });
    toast.show({
      emoji: isPrivate ? '🔒' : delay ? '🕰' : '💌',
      message: isPrivate
        ? 'Kept for you alone'
        : delay
          ? `${partner.name} will get it ${WHEN.find((w) => w.hours === delay)?.label.toLowerCase()}`
          : `Sent to ${partner.name}`,
    });
    navigate('/talk/notes', { replace: true });
  };

  return (
    <>
      <BackBar title="New note" fallbackTo="/talk/notes" />
      <Screen>
        <ScreenHeader
          eyebrow="Notes"
          title="What do you want to say?"
          sub="Pick the shape of it first — it changes how it lands."
        />

        <div className={s.kinds}>
          {NOTE_KINDS.map((k) => (
            <button
              key={k.value}
              type="button"
              aria-pressed={kind === k.value}
              className={[s.kind, kind === k.value ? s.kindOn : ''].filter(Boolean).join(' ')}
              onClick={() => setKind(k.value)}
            >
              <span className={s.kindEmoji} aria-hidden>
                {k.emoji}
              </span>
              <span className={s.kindMain}>
                <span className={s.kindLabel}>{k.label}</span>
                <span className={s.kindBlurb}>{k.blurb}</span>
              </span>
            </button>
          ))}
        </div>

        <textarea
          className={s.area}
          placeholder={
            isPrivate
              ? 'Only you will ever read this.'
              : `Write it the way you would say it to ${partner.name}.`
          }
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />

        {!isPrivate ? (
          <div className={s.section}>
            <p className={s.label}>When should it arrive?</p>
            <div className={s.when}>
              {WHEN.map((w) => (
                <Chip key={w.hours} selected={when === w.hours} onClick={() => setWhen(w.hours)}>
                  {w.label}
                </Chip>
              ))}
            </div>
            <p className={s.privacyNote}>
              <span aria-hidden>🕰</span>
              <span>
                A note set for later stays invisible to {partner.name} until then. You can still
                delete it before it lands.
              </span>
            </p>
          </div>
        ) : (
          <p className={s.privacyNote}>
            <span aria-hidden>🔒</span>
            <span>Private notes are never shared, and {partner.name} cannot see that they exist.</span>
          </p>
        )}

        <div className={s.actions}>
          <Button variant="accent" size="lg" block disabled={!body.trim()} onClick={send}>
            {isPrivate ? 'Keep it' : when ? 'Schedule it' : 'Send it'}
          </Button>
        </div>
      </Screen>
    </>
  );
}
