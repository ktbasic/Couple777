import { useState } from 'react';
import type { Person } from '@/lib/types';
import { AvatarArt, avatarById } from './AvatarArt';
import s from './Avatar.module.css';

/**
 * Three fallbacks deep: an uploaded photo, then a chosen Couple777 avatar,
 * then the person's initial. A broken image never shows.
 */
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
  const art = avatarById(person.avatarId);
  const showPhoto = Boolean(person.avatarUrl) && !failed;

  return (
    <span
      className={[s.avatar, ring ? s.ring : ''].filter(Boolean).join(' ')}
      style={{ width: size, height: size, fontSize: size * 0.4 }}
      title={person.name}
    >
      {!showPhoto && art ? (
        <AvatarArt id={art.id} size={size} />
      ) : (
        <span aria-hidden={showPhoto}>{person.initial}</span>
      )}
      {showPhoto ? (
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
