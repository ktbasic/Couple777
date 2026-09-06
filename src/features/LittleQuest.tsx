import { useStore } from '@/context/store';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { QUEST_WEEK_AVERAGE, QUEST_WEEK_GOAL, questForDate } from '@/data/quests';
import { today } from '@/lib/dates';
import { starsThisWeek } from '@/lib/selectors';
import s from './LittleQuest.module.css';

/**
 * One small thing, worth one star.
 *
 * There is no streak here on purpose. A streak makes the seventh good week
 * feel like an obligation and the first missed day feel like a failure, which
 * is the opposite of what this is for. The week's stars reset on their own and
 * nothing carries a penalty into the next one.
 */
export function LittleQuest() {
  const { state, dispatch } = useStore();
  const toast = useToast();
  const date = today();

  const doneIds = state.questsDone.map((q) => q.questId);
  const quest = questForDate(date, state.couple.profile.wishes ?? [], doneIds, state.questsSkipped);
  const stars = starsThisWeek(state);
  const reached = stars >= QUEST_WEEK_GOAL;

  if (!quest) return null;

  const done = () => {
    dispatch({ type: 'completeQuest', questId: quest.id });
    toast.show({
      emoji: '⭐',
      message: stars + 1 >= QUEST_WEEK_GOAL ? `${QUEST_WEEK_GOAL} stars this week` : 'One star',
    });
  };

  return (
    <div className={s.card}>
      <div className={s.top}>
        <p className={s.eyebrow}>Little quest</p>
        <span className={s.count}>
          {stars}/{QUEST_WEEK_GOAL} ★
        </span>
      </div>

      <div className={s.main}>
        <span className={s.emoji} aria-hidden>
          {quest.emoji}
        </span>
        <div>
          <p className={s.title}>{quest.title}</p>
          <p className={s.body}>{quest.body}</p>
        </div>
      </div>

      {/* Seven small lamps rather than a progress bar: a bar that is one
          seventh full reads as "behind", and seven of anything reads as a
          collection you are adding to. */}
      <div className={s.stars} aria-label={`${stars} of ${QUEST_WEEK_GOAL} stars this week`}>
        {Array.from({ length: QUEST_WEEK_GOAL }, (_, i) => (
          <span key={i} className={[s.star, i < stars ? s.starOn : ''].filter(Boolean).join(' ')} aria-hidden>
            ★
          </span>
        ))}
      </div>

      <p className={s.scale}>
        {reached
          ? `That's the week. Anything else is a bonus.`
          : `${quest.minutes} min · most couples get about ${QUEST_WEEK_AVERAGE} a week.`}
      </p>

      <div className={s.actions}>
        <Button variant="accent" size="sm" onClick={done}>
          We did it ⭐
        </Button>
        <Button
          variant="quiet"
          size="sm"
          onClick={() => dispatch({ type: 'skipQuest', questId: quest.id })}
        >
          Another one
        </Button>
      </div>
    </div>
  );
}
