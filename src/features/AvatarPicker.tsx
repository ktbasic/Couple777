import { useRef, useState } from 'react';
import { Sheet } from '@/components/ui/Sheet';
import { Segmented } from '@/components/ui/Segmented';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { AVATARS, AVATAR_GROUPS, AvatarArt } from '@/components/ui/AvatarArt';
import type { AvatarGroup } from '@/components/ui/AvatarArt';
import { useStore } from '@/context/store';
import { useToast } from '@/components/ui/Toast';
import type { Person } from '@/lib/types';
import s from './AvatarPicker.module.css';

/**
 * Downscale before storing. A phone photo is several megabytes and this all
 * lives in localStorage, so anything bigger than a thumbnail would blow the
 * quota and take the whole app's state down with it.
 */
function downscale(file: File, edge = 240): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('read failed'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('decode failed'));
      img.onload = () => {
        const side = Math.min(img.width, img.height);
        const canvas = document.createElement('canvas');
        canvas.width = edge;
        canvas.height = edge;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('no canvas'));
        // Centre-crop to a square so it fills the circular frame.
        ctx.drawImage(
          img,
          (img.width - side) / 2,
          (img.height - side) / 2,
          side,
          side,
          0,
          0,
          edge,
          edge,
        );
        resolve(canvas.toDataURL('image/jpeg', 0.82));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

export function AvatarPicker({
  person,
  open,
  onClose,
}: {
  person: Person;
  open: boolean;
  onClose: () => void;
}) {
  const { dispatch, me, state } = useStore();
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [picked, setPicked] = useState<string | null>(null);
  const [tab, setTab] = useState<AvatarGroup>(
    () => AVATARS.find((a) => a.id === person.avatarId)?.group ?? 'People',
  );
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(person.name);
  const [ageDraft, setAgeDraft] = useState(person.age ? String(person.age) : '');
  const [jobDraft, setJobDraft] = useState(person.occupation ?? '');

  /*
   * You can change your own name and face. You can change what your partner
   * is called only until they have an account of their own — after that the
   * name and the avatar are theirs, on their row, behind a policy that only
   * lets a person edit their own. Offering the control anyway would produce a
   * change that looks saved and is gone on the next load.
   */
  const isMe = person.id === me.id;
  const editable = isMe || !state.couple.partnerJoined;

  /*
   * Age and occupation are optional, so an empty one is an answer: it clears
   * what was there. A number that could not be an age is not an answer,
   * though — that is a typo, and saving it would be worse than keeping the
   * form open.
   */
  const parsedAge = Number.parseInt(ageDraft, 10);
  const ageValid = Number.isFinite(parsedAge) && parsedAge >= 13 && parsedAge <= 120;
  const ageBad = Boolean(ageDraft.trim()) && !ageValid;

  /* One editor for the whole of who you are here — the pencil and the line
     under your name open the same thing, because they were only ever two
     halves of "edit my profile". */
  const openEditor = () => {
    setDraft(person.name);
    setAgeDraft(person.age ? String(person.age) : '');
    setJobDraft(person.occupation ?? '');
    setEditing(true);
  };

  const saveEditor = () => {
    const name = draft.trim();
    if (!name || ageBad) return;
    if (name !== person.name) {
      dispatch({ type: 'renamePerson', personId: person.id, name });
    }
    // Age and occupation are yours alone — there is no row to put a partner's
    // on until they have an account of their own.
    if (isMe) {
      dispatch({
        type: 'setPersonDetails',
        personId: person.id,
        age: ageValid ? parsedAge : undefined,
        occupation: jobDraft.trim() || undefined,
      });
    }
    toast.show({ emoji: '\u2728', message: 'Profile updated' });
    setEditing(false);
  };

  /* Age and what you do, on one line, in that order, and only what exists. */
  const summary =
    person.age && person.occupation
      ? `${person.age} \u00B7 ${person.occupation}`
      : person.age
        ? `${person.age} years old`
        : (person.occupation ?? null);

  // The sheet stays open so the preview at the top updates under your thumb
  // and you can try a few. Closing on the first tap made it a one-shot guess.
  const choose = (avatarId: string) => {
    setPicked(avatarId);
    dispatch({ type: 'setPersonAvatar', personId: person.id, avatarId });
    window.setTimeout(() => setPicked(null), 500);
  };

  const upload = async (file: File) => {
    setError(null);
    try {
      const avatarUrl = await downscale(file);
      dispatch({ type: 'setPersonAvatar', personId: person.id, avatarUrl });
      toast.show({ emoji: '📷', message: 'Photo saved' });
      onClose();
    } catch {
      setError("That image couldn't be read. Try a different one.");
    }
  };

  return (
    <Sheet open={open} onClose={onClose} title={`${person.name}'s avatar`}>
      <div className={[s.current, editing ? s.currentEditing : ''].filter(Boolean).join(' ')}>
        <Avatar person={person} size={54} />
        <div className={s.currentMain}>
          {editing ? (
            <form
              className={s.detailsForm}
              onSubmit={(e) => {
                e.preventDefault();
                saveEditor();
              }}
              onKeyDown={(e) => {
                if (e.key === 'Escape') setEditing(false);
              }}
            >
              <label className={s.field}>
                <span className={s.fieldLabel}>Name</span>
                <input
                  className={s.nameInput}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  maxLength={40}
                  autoFocus
                  placeholder="Your name"
                />
              </label>

              {isMe ? (
                <>
                  <label className={s.field}>
                    <span className={s.fieldLabel}>Age</span>
                    <input
                      className={s.ageInput}
                      value={ageDraft}
                      onChange={(e) => setAgeDraft(e.target.value.replace(/[^0-9]/g, ''))}
                      inputMode="numeric"
                      maxLength={3}
                      placeholder="Age"
                    />
                  </label>

                  <label className={s.field}>
                    <span className={s.fieldLabel}>What do you do?</span>
                    <input
                      className={s.jobInput}
                      value={jobDraft}
                      onChange={(e) => setJobDraft(e.target.value)}
                      maxLength={60}
                      autoComplete="organization-title"
                      placeholder="Designer, student, doctor…"
                    />
                  </label>
                </>
              ) : null}

              <div className={s.detailsActions}>
                <button type="submit" className={s.nameSave} disabled={!draft.trim() || ageBad}>
                  Save
                </button>
                <button type="button" className={s.nameCancel} onClick={() => setEditing(false)}>
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <>
              <div className={s.nameRow}>
                <p className={s.currentName}>{person.name}</p>
                {editable ? (
                  <button
                    type="button"
                    className={s.editName}
                    aria-label={`Edit ${isMe ? 'your' : `${person.name}'s`} profile`}
                    onClick={openEditor}
                  >
                    <PencilIcon />
                  </button>
                ) : null}
              </div>
              {isMe ? (
                <button
                  type="button"
                  className={summary ? s.currentHint : s.addAge}
                  onClick={openEditor}
                >
                  {summary ?? 'Add your age'}
                </button>
              ) : (
                <p className={s.currentHint}>{summary ?? 'Nothing shared yet'}</p>
              )}
            </>
          )}
        </div>
      </div>

      {!editable ? (
        <p className={s.theirs}>
          {person.name} picks their own name and avatar on their phone. Yours is the
          one you can change here.
        </p>
      ) : null}

      {error ? <p className={s.error}>{error}</p> : null}

      {editable ? (
        <>
      <label className={s.upload}>
        <span aria-hidden>📷</span>
        Upload a photo
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void upload(file);
            e.target.value = '';
          }}
        />
      </label>

      <div className={s.tabs}>
        <Segmented<AvatarGroup>
          value={tab}
          onChange={setTab}
          options={AVATAR_GROUPS.map((g) => ({ value: g, label: g }))}
        />
      </div>

      {AVATAR_GROUPS.filter((g) => g === tab).map((group) => {
        const items = AVATARS.filter((a) => a.group === group);
        return (
          <div key={group}>
            <div className={s.grid}>
              {items.map((a) => {
                const selected = !person.avatarUrl && person.avatarId === a.id;
                return (
                  <button
                    key={a.id}
                    type="button"
                    aria-label={a.label}
                    title={a.label}
                    aria-pressed={selected}
                    className={[
                      s.option,
                      selected ? s.optionOn : '',
                      picked === a.id ? s.optionPop : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    onClick={() => choose(a.id)}
                  >
                    <AvatarArt id={a.id} size={54} />
                    {selected ? (
                      <span className={s.tick} aria-hidden>
                        ✓
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

        </>
      ) : null}

      <div className={s.done}>
        <Button variant="accent" block onClick={onClose}>
          Done
        </Button>
      </div>
    </Sheet>
  );
}

/** A small pencil, drawn so it takes the ink colour around it. */
function PencilIcon() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden>
      <path
        d="M10.6 2.4a1.6 1.6 0 0 1 2.3 2.3L5.6 12 2.5 13.5 4 10.4z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}
