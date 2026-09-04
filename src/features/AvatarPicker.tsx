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
  const [renaming, setRenaming] = useState(false);
  const [draft, setDraft] = useState(person.name);

  /*
   * You can change your own name and face. You can change what your partner
   * is called only until they have an account of their own — after that the
   * name and the avatar are theirs, on their row, behind a policy that only
   * lets a person edit their own. Offering the control anyway would produce a
   * change that looks saved and is gone on the next load.
   */
  const isMe = person.id === me.id;
  const editable = isMe || !state.couple.partnerJoined;

  const saveName = () => {
    const next = draft.trim();
    if (next && next !== person.name) {
      dispatch({ type: 'renamePerson', personId: person.id, name: next });
      toast.show({ emoji: '\u270F\uFE0F', message: 'Name updated' });
    }
    setRenaming(false);
  };

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
      <div className={s.current}>
        <Avatar person={person} size={54} />
        <div className={s.currentMain}>
          {renaming ? (
            <form
              className={s.nameForm}
              onSubmit={(e) => {
                e.preventDefault();
                saveName();
              }}
            >
              <input
                className={s.nameInput}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                maxLength={40}
                autoFocus
                aria-label="Name"
                onKeyDown={(e) => {
                  if (e.key === 'Escape') setRenaming(false);
                }}
              />
              <button type="submit" className={s.nameSave} disabled={!draft.trim()}>
                Save
              </button>
              <button
                type="button"
                className={s.nameCancel}
                onClick={() => setRenaming(false)}
              >
                Cancel
              </button>
            </form>
          ) : (
            <>
              <div className={s.nameRow}>
                <p className={s.currentName}>{person.name}</p>
                {editable ? (
                  <button
                    type="button"
                    className={s.editName}
                    aria-label={`Change ${isMe ? 'your' : `${person.name}'s`} name`}
                    onClick={() => {
                      setDraft(person.name);
                      setRenaming(true);
                    }}
                  >
                    <PencilIcon />
                  </button>
                ) : null}
              </div>
              <p className={s.currentHint}>
                {person.avatarUrl ? 'Using a photo' : 'Using a Couple777 avatar'}
              </p>
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
