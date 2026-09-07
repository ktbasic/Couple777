import { useNavigate } from 'react-router-dom';
import { Photo } from '@/components/ui/Photo';
import type { AdventureIdea } from '@/lib/types';
import s from './AdventureCard.module.css';

/**
 * One somewhere-to-go, as a row: a fixed thumbnail, then the four things
 * someone actually compares between options — where it is, what it is, how
 * long it takes and what it costs.
 *
 * `why` is not among them. It is the best sentence on the card and the wrong
 * one for a list; it is on the plan screen, which is where the decision is
 * made rather than narrowed.
 */
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
  const open = () =>
    navigate(`/plan/new?adventure=${idea.id}${cycleId ? `&cycle=${cycleId}` : ''}`);

  return (
    <article className={s.card} style={{ animationDelay: `${index * 70}ms` }}>
      <button type="button" className={s.shot} onClick={open} aria-label={`Plan ${idea.title}`}>
        <Photo src={idea.image} seed={idea.id} ratio="3 / 4" className={s.img} alt="" />
      </button>

      <div className={s.main}>
        <p className={s.place}>{idea.place}</p>
        <h3 className={s.title}>
          {idea.emoji} {idea.title}
        </h3>
        <p className={s.desc}>{idea.description}</p>
        <div className={s.facts}>
          <span className={s.fact}>🚆 {idea.travelTime}</span>
          <span className={s.fact}>💶 {idea.cost}</span>
        </div>
        <button type="button" className={s.go} onClick={open}>
          Make this the plan <span aria-hidden>→</span>
        </button>
      </div>
    </article>
  );
}
