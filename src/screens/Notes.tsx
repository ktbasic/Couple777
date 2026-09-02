import { useEffect, useState } from 'react';
import { BackBar, Screen, ScreenHeader } from '@/components/layout/Screen';
import { Segmented } from '@/components/ui/Segmented';
import { ButtonLink } from '@/components/ui/Button';
import { FloatingAction } from '@/components/ui/FloatingAction';
import { EmptyState } from '@/components/ui/EmptyState';
import { NoteCard } from '@/features/NoteCard';
import { useStore } from '@/context/store';
import { inboxNotes, privateNotes, scheduledNotes, sentNotes } from '@/lib/selectors';
import s from './Notes.module.css';

type Tab = 'inbox' | 'sent' | 'private';

export default function NotesScreen() {
  const { state, dispatch, me, partner } = useStore();
  const [tab, setTab] = useState<Tab>('inbox');

  const inbox = inboxNotes(state, me.id);
  const sent = sentNotes(state, me.id);
  const scheduled = scheduledNotes(state, me.id);
  const mine = privateNotes(state, me.id);

  // Opening the inbox is the read receipt.
  useEffect(() => {
    if (tab !== 'inbox') return;
    inbox.filter((n) => !n.readAt).forEach((n) => dispatch({ type: 'markNoteRead', id: n.id }));
    // Runs on tab change; the note list itself is stable enough here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  return (
    <>
      <BackBar title="Notes" fallbackTo="/talk" />
      <Screen>
        <ScreenHeader
          eyebrow="Notes"
          title={`Notes to ${partner.name}`}
          sub="Some things land better written down. Send now, or set them to arrive later."
        />

        <div className={s.tabs}>
          <Segmented<Tab>
            value={tab}
            onChange={setTab}
            options={[
              { value: 'inbox', label: `From ${partner.name}` },
              { value: 'sent', label: 'Sent' },
              { value: 'private', label: 'Private' },
            ]}
          />
        </div>

        {tab === 'inbox' ? (
          inbox.length ? (
            <div className={s.list}>
              {inbox.map((n, i) => (
                <div key={n.id} className={s.item} style={{ animationDelay: `${i * 60}ms` }}>
                  <NoteCard note={n} />
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              emoji="📭"
              title="Nothing waiting"
              body={`When ${partner.name} writes you something, it turns up here.`}
            />
          )
        ) : null}

        {tab === 'sent' ? (
          sent.length || scheduled.length ? (
            <div className={s.list}>
              {scheduled.map((n, i) => (
                <div key={n.id} className={s.item} style={{ animationDelay: `${i * 60}ms` }}>
                  <NoteCard note={n} onRemove={() => dispatch({ type: 'removeNote', id: n.id })} />
                </div>
              ))}
              {sent.map((n, i) => (
                <div
                  key={n.id}
                  className={s.item}
                  style={{ animationDelay: `${(scheduled.length + i) * 60}ms` }}
                >
                  <NoteCard note={n} onRemove={() => dispatch({ type: 'removeNote', id: n.id })} />
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              emoji="✉️"
              title="You haven't written one yet"
              body="Appreciation, a request, or something you have been meaning to say."
              action={
                <ButtonLink to="/talk/notes/new" variant="accent" size="sm">
                  Write a note
                </ButtonLink>
              }
            />
          )
        ) : null}

        {tab === 'private' ? (
          mine.length ? (
            <div className={s.list}>
              {mine.map((n, i) => (
                <div key={n.id} className={s.item} style={{ animationDelay: `${i * 60}ms` }}>
                  <NoteCard note={n} onRemove={() => dispatch({ type: 'removeNote', id: n.id })} />
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              emoji="🔒"
              title="Just for you"
              body={`Reflections only you can see. ${partner.name} never sees this tab, or that it has anything in it.`}
            />
          )
        ) : null}

        <div className={s.tail} />
        <FloatingAction to="/talk/notes/new" label="Write a note" bare />
      </Screen>
    </>
  );
}
