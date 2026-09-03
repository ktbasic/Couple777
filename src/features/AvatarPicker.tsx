import { useRef, useState } from 'react';
import { Sheet } from '@/components/ui/Sheet';
import { Avatar } from '@/components/ui/Avatar';
import { AVATARS, AVATAR_GROUPS, AvatarArt } from '@/components/ui/AvatarArt';
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
  const { dispatch } = useStore();
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [picked, setPicked] = useState<string | null>(null);

  // The sheet lingers for a beat after a tap so the selection animation is
  // actually seen — closing instantly threw away the reward.
  const choose = (avatarId: string) => {
    setPicked(avatarId);
    dispatch({ type: 'setPersonAvatar', personId: person.id, avatarId });
    window.setTimeout(() => {
      toast.show({ message: `${person.name}'s avatar updated` });
      onClose();
    }, 480);
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
          <p className={s.currentName}>{person.name}</p>
          <p className={s.currentHint}>
            {person.avatarUrl ? 'Using a photo' : 'Using a Couple777 avatar'}
          </p>
        </div>
      </div>

      {error ? <p className={s.error}>{error}</p> : null}

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

      {AVATAR_GROUPS.map((group) => {
        const items = AVATARS.filter((a) => a.group === group);
        if (!items.length) return null;
        return (
          <div key={group}>
            <p className={s.groupLabel}>{group}</p>
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
    </Sheet>
  );
}
