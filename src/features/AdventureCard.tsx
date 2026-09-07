import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Photo } from '@/components/ui/Photo';
import type { AdventureIdea } from '@/lib/types';
import s from './AdventureCard.module.css';

export function AdventureCard({
  idea,
  index = 0,
  cycleId,
}: {
  idea: AdventureIdea;
  index?: number;
  cycleId?: string;
}) {
  const navigate = useNavigate();
  return (
    <article className={s.card} style={{ animationDelay: `${index * 70}ms` }}>
      <Photo src={idea.image} seed={idea.id} ratio="16 / 9" alt="" />
      <div className={s.body}>
        <p className={s.place}>{idea.place}</p>
        <h3 className={s.title}>
          {idea.emoji} {idea.title}
        </h3>
        <p className={s.desc}>{idea.description}</p>
        <p className={s.why}>{idea.why}</p>
        <div className={s.facts}>
          <span className={s.fact}>🚆 {idea.travelTime}</span>
          <span className={s.fact}>💶 {idea.cost}</span>
        </div>
        <div className={s.actions}>
          <Button
            variant="secondary"
            size="sm"
            block
            onClick={() =>
              navigate(`/plan/new?adventure=${idea.id}${cycleId ? `&cycle=${cycleId}` : ''}`)
            }
          >
            Make this the plan
          </Button>
        </div>
      </div>
    </article>
  );
}
