import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Photo } from '@/components/ui/Photo';
import { HeartToggle } from '@/components/ui/HeartToggle';
import { useStore } from '@/context/store';
import { useToast } from '@/components/ui/Toast';
import type { DateIdea } from '@/lib/types';
import s from './IdeaCard.module.css';

function duration(mins: number) {
  if (mins < 60) return `${mins} min`;
  const h = mins / 60;
  return Number.isInteger(h) ? `${h} hours` : `${Math.floor(h)}h ${mins % 60}m`;
}

function cost(euros: number) {
  return euros === 0 ? 'Free' : `~€${euros}`;
}

export function IdeaCard({ idea, index = 0 }: { idea: DateIdea; index?: number }) {
  const { state, dispatch } = useStore();
  const toast = useToast();
  const navigate = useNavigate();
  const saved = state.savedIdeaIds.includes(idea.id);

  return (
    <article className={s.card} style={{ animationDelay: `${index * 70}ms` }}>
      <div className={s.hero}>
        <Photo src={idea.image} seed={idea.id} ratio="16 / 9" className={s.img} alt="" />
        <HeartToggle
          saved={saved}
          label={saved ? 'Saved' : 'Save this idea'}
          onToggle={() => {
            dispatch({ type: 'toggleSavedIdea', id: idea.id });
            toast.show({
              message: saved ? 'Removed from saved' : 'Saved to your ideas',
            });
          }}
        />
      </div>

      <div className={s.body}>
        <h3 className={s.title}>
          <span className={s.emoji} aria-hidden>
            {idea.emoji}
          </span>
          {idea.title}
        </h3>
        <p className={s.desc}>{idea.description}</p>

        <div className={s.facts}>
          <span className={s.fact}>🕰 {duration(idea.duration)}</span>
          <span className={s.fact}>💶 {cost(idea.cost)}</span>
          <span className={s.fact}>🧺 {idea.prep}</span>
        </div>

        <div className={s.why}>
          <p className={s.whyLabel}>Why this one</p>
          <p className={s.whyBody}>{idea.why}</p>
        </div>

        <div className={s.actions}>
          <Button
            variant="accent"
            size="sm"
            onClick={() => navigate(`/plan/new/day?idea=${idea.id}`)}
          >
            Add to our next date
          </Button>
          <Button
            variant="quiet"
            size="sm"
            onClick={() => navigate(`/plan/new/day?idea=${idea.id}&surprise=1`)}
          >
            Surprise them
          </Button>
        </div>
      </div>
    </article>
  );
}
