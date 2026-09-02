import { useNavigate } from 'react-router-dom';
import { Photo } from '@/components/ui/Photo';
import { Button } from '@/components/ui/Button';
import { useStore } from '@/context/store';
import { useToast } from '@/components/ui/Toast';
import type { Destination } from '@/lib/types';
import s from './DestinationCard.module.css';

/**
 * Saving is secret. You can see that *you* saved something, never that your
 * partner did — until you both have, which is the whole point of the feature.
 */
export function DestinationCard({ destination }: { destination: Destination }) {
  const { me, dispatch } = useStore();
  const toast = useToast();
  const savedByMe = destination.savedBy.includes(me.id);
  const isMatch = destination.savedBy.length === 2 && destination.matchSeen;

  return (
    <article className={s.card}>
      <Photo src={destination.image} seed={destination.id} className={s.img} alt="" />
      <span className={s.scrim} aria-hidden />

      {isMatch ? <span className={s.match}>✦ Match</span> : null}

      <button
        type="button"
        className={s.save}
        aria-pressed={savedByMe}
        aria-label={savedByMe ? 'Remove from your list' : 'Add to your list, privately'}
        onClick={() => {
          dispatch({ type: 'toggleDestination', id: destination.id, personId: me.id });
          if (!savedByMe) {
            toast.show({ emoji: '🤫', message: `${destination.name} added, privately` });
          }
        }}
      >
        {savedByMe ? '❤️' : '🤍'}
      </button>

      <div className={s.body}>
        <h3 className={s.name}>{destination.name}</h3>
        <p className={s.country}>{destination.country}</p>
      </div>
    </article>
  );
}

/** Shown once, when a secret save turns out to be mutual. */
export function MatchReveal({ destination }: { destination: Destination }) {
  const { dispatch, partner } = useStore();
  const navigate = useNavigate();

  return (
    <div className={s.reveal}>
      <Photo src={destination.image} seed={`${destination.id}-reveal`} className={s.revealImg} alt="" />
      <span className={s.revealScrim} aria-hidden />
      <p className={s.revealEyebrow}>Our matches</p>
      <h3 className={s.revealTitle}>You both want to go to {destination.name} ❤️</h3>
      <p className={s.revealBody}>
        You and {partner.name} added this separately, without knowing. {destination.bestTime} is
        the time to go.
      </p>
      <div className={s.revealActions}>
        <Button
          variant="accent"
          size="sm"
          onClick={() => {
            dispatch({ type: 'markMatchSeen', id: destination.id });
            navigate(`/plan/new/month?destination=${destination.id}`);
          }}
        >
          Start planning it
        </Button>
        <Button
          variant="quiet"
          size="sm"
          onClick={() => dispatch({ type: 'markMatchSeen', id: destination.id })}
        >
          Not yet
        </Button>
      </div>
    </div>
  );
}
