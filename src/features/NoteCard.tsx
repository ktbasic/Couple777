import { Avatar } from '@/components/ui/Avatar';
import { useStore } from '@/context/store';
import type { Note } from '@/lib/types';
import s from './NoteCard.module.css';

export const NOTE_KINDS: { value: Note['kind']; label: string; emoji: string; blurb: string }[] = [
  { value: 'appreciation', label: 'Appreciation', emoji: '🕊️', blurb: 'Something they did that you noticed.' },
  { value: 'love', label: 'Love note', emoji: '💌', blurb: 'No reason needed.' },
  { value: 'memory', label: 'A memory', emoji: '📸', blurb: 'Something you were just thinking about.' },
  { value: 'feeling', label: 'How I feel', emoji: '🌊', blurb: 'Easier written than said out loud.' },
  { value: 'talk', label: 'Can we talk about…', emoji: '💬', blurb: 'Open a door without starting the conversation yet.' },
  { value: 'request', label: 'Something I need', emoji: '🤲', blurb: 'Ask plainly. It usually lands better.' },
  { value: 'private', label: 'Just for me', emoji: '🔒', blurb: 'A private reflection. Never shared.' },
];

function kindMeta(kind: Note['kind']) {
  return NOTE_KINDS.find((k) => k.value === kind) ?? NOTE_KINDS[0];
}

function relative(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86400000);
  if (days <= 0) {
    const hours = Math.floor(diff / 3600000);
    if (hours <= 0) return 'Just now';
    return `${hours}h ago`;
  }
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function NoteCard({ note, onRemove }: { note: Note; onRemove?: () => void }) {
  const { state, me } = useStore();
  const meta = kindMeta(note.kind);
  const author = state.couple.people.find((p) => p.id === note.from);
  const fromPartner = note.from !== me.id;
  const unread = fromPartner && !note.readAt;
  const scheduled = note.deliverAt && new Date(note.deliverAt).getTime() > Date.now();

  return (
    <article
      className={[s.card, unread ? s.unread : '', note.kind === 'private' ? s.private : '']
        .filter(Boolean)
        .join(' ')}
    >
      <div className={s.head}>
        {author && note.kind !== 'private' ? <Avatar person={author} size={22} /> : null}
        <span className={s.kind}>
          {meta.emoji} {meta.label}
        </span>
        <span className={s.when}>{relative(note.createdAt)}</span>
      </div>

      <p className={s.body}>{note.body}</p>

      {scheduled || onRemove ? (
        <div className={s.footer}>
          {scheduled ? (
            <span className={s.scheduled}>
              🕰 Arrives {note.deliverLabel ?? new Date(note.deliverAt!).toLocaleDateString()}
            </span>
          ) : null}
          {onRemove ? (
            <button type="button" className={s.remove} onClick={onRemove}>
              Delete
            </button>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}
