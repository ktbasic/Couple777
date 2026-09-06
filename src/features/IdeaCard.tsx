import { useNavigate } from 'react-router-dom';
import { Photo } from '@/components/ui/Photo';
import { useStore } from '@/context/store';
import { useToast } from '@/components/ui/Toast';
import type { DateIdea } from '@/lib/types';
import s from './IdeaCard.module.css';

function duration(mins: number) {
  if (mins < 60) return `${mins} min`;
  const h = mins / 60;
  return Number.isInteger(h) ? `${h} hrs` : `${Math.floor(h)}–${Math.ceil(h)} hrs`;
}

function cost(euros: number) {
  return euros === 0 ? 'Free' : euros <= 30 ? '€' : euros <= 60 ? '€€' : '€€€';
}

const HEART = (filled: boolean) => (
  <svg viewBox="0 0 24 24" width="17" height="17" aria-hidden>
    <path
      d="M12 20.4C5.6 15.9 2.4 12.6 2.4 8.9 2.4 5.9 4.7 3.6 7.5 3.6c1.8 0 3.4.9 4.5 2.4 1.1-1.5 2.7-2.4 4.5-2.4 2.8 0 5.1 2.3 5.1 5.3 0 3.7-3.2 7-9.6 11.5Z"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={filled ? 0 : 1.7}
      strokeLinejoin="round"
    />
  </svg>
);

/* Two short words per idea, drawn from what it already is rather than a new
   field to keep in sync: where it happens, and what it feels like. */
function tagsFor(idea: DateIdea): string[] {
  const where = idea.setting === 'home' ? 'Indoor' : 'Outdoor';
  const vibe = idea.vibes[0];
  const feel = vibe ? vibe.charAt(0).toUpperCase() + vibe.slice(1) : null;
  return feel ? [where, feel] : [where];
}

const PLUS = (
  <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden>
    <path d="M12 5.5v13M5.5 12h13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

/**
 * One idea, compact.
 *
 * Two ways to keep it, and they are not the same thing. The heart is yours
 * and stays yours. "Add to our list" tells them. Putting both on the card is
 * the only way the difference is ever visible — a single save button would
 * have made the private one impossible to offer.
 */
export function IdeaCard({
  idea,
  index = 0,
  cycleId,
}: {
  idea: DateIdea;
  index?: number;
  /** The cycle this idea would fill, when one is being planned. */
  cycleId?: string;
}) {
  const { state, dispatch, me, partner } = useStore();
  const toast = useToast();
  const navigate = useNavigate();

  const row = state.savedIdeas.find((i) => i.id === idea.id);
  const liked = Boolean(row?.likedBy.includes(me.id));
  const shared = Boolean(row?.sharedBy.length);
  const matched = Boolean(row?.matchedAt);

  const like = () => {
    const wouldMatch = !liked && Boolean(row?.likedBy.includes(partner.id));
    dispatch({ type: 'likeIdea', id: idea.id, personId: me.id, partnerId: partner.id });
    toast.show(
      wouldMatch
        ? { emoji: '💕', message: 'You both saved this!' }
        : { emoji: liked ? '' : '❤️', message: liked ? 'Removed' : 'Liked — just for you' },
    );
  };

  const share = () => {
    dispatch({ type: 'shareIdea', id: idea.id, personId: me.id });
    toast.show({
      emoji: shared ? '' : '✨',
      message: shared ? 'Off our list' : `On our list — ${partner.name} can see it`,
    });
  };

  return (
    <article className={s.card} style={{ animationDelay: `${index * 60}ms` }}>
      <button
        type="button"
        className={s.shot}
        onClick={() => navigate(`/plan/new?idea=${idea.id}${cycleId ? `&cycle=${cycleId}` : ''}`)}
        aria-label={`Plan ${idea.title}`}
      >
        <Photo src={idea.image} seed={idea.id} ratio="1 / 1" className={s.img} alt="" />
      </button>

      <div className={s.main}>
        <div className={s.head}>
          <h3 className={s.title}>{idea.title}</h3>
          <button
            type="button"
            className={[s.heart, liked ? s.hearted : ''].filter(Boolean).join(' ')}
            aria-pressed={liked}
            aria-label={liked ? 'Liked' : 'Like this idea'}
            onClick={like}
          >
            {HEART(liked)}
          </button>
        </div>

        <p className={s.desc}>{idea.description}</p>

        <div className={s.tags}>
          {tagsFor(idea).map((t) => (
            <span key={t} className={s.tag}>
              {t}
            </span>
          ))}
          <span className={s.meta}>
            {duration(idea.duration)} · {cost(idea.cost)}
          </span>
        </div>

        {matched ? (
          <p className={s.matched}>You both saved this 💕</p>
        ) : (
          <button
            type="button"
            className={[s.add, shared ? s.added : ''].filter(Boolean).join(' ')}
            onClick={share}
          >
            {shared ? '✓ On our list' : <>{PLUS} Add to our list</>}
          </button>
        )}
      </div>
    </article>
  );
}
