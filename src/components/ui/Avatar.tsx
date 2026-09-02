import { useState } from 'react';
import type { Person } from '@/lib/types';
import s from './Avatar.module.css';

export function Avatar({
  person,
  size = 32,
  ring,
}: {
  person: Person;
  size?: number;
  ring?: boolean;
}) {
  const [failed, setFailed] = useState(false);

  return (
    <span
      className={[s.avatar, ring ? s.ring : ''].filter(Boolean).join(' ')}
      style={{ width: size, height: size, fontSize: size * 0.4 }}
      title={person.name}
    >
      {person.initial}
      {/* A missing photo falls back to the initial underneath, never a broken glyph. */}
      {person.avatarUrl && !failed ? (
        <img
          className={s.img}
          src={person.avatarUrl}
          alt=""
          loading="lazy"
          onError={() => setFailed(true)}
        />
      ) : null}
    </span>
  );
}

export function AvatarPair({ people, size = 30 }: { people: Person[]; size?: number }) {
  return (
    <span className={s.pair}>
      {people.map((p) => (
        <Avatar key={p.id} person={p} size={size} />
      ))}
    </span>
  );
}
