import { ButtonLink } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { PROMPT_KIND_LABEL, promptForDate } from '@/data/prompts';
import { useStore } from '@/context/store';
import { dailyEntry, dailyStatus } from '@/lib/selectors';
import { today } from '@/lib/dates';
import s from './DailyCard.module.css';

/**
 * The daily prompt, in its three states: unanswered, waiting on the partner,
 * and revealed. The double-blind reveal is the whole mechanic — an answer is
 * never visible until both people have written one.
 */
export function DailyCard({ compact }: { compact?: boolean }) {
  const { state, me, partner } = useStore();
  const date = today();
  const prompt = promptForDate(date);
  const entry = dailyEntry(state, date);
  const status = dailyStatus(state, me.id, partner.id, date);

  return (
    <div className={s.card}>
      <p className={s.kind}>{PROMPT_KIND_LABEL[prompt.kind]}</p>

      {prompt.kind === 'quote' && prompt.quote ? (
        <blockquote className={s.quote}>
          {prompt.quote}
          {prompt.quoteAuthor ? <cite className={s.attrib}>{prompt.quoteAuthor}</cite> : null}
        </blockquote>
      ) : null}

      <p className={s.prompt}>{prompt.text}</p>

      {status.bothAnswered && entry ? (
        <div className={s.answers}>
          {[me, partner].map((p) => (
            <div key={p.id} className={s.answer}>
              <div className={s.answerHead}>
                <Avatar person={p} size={22} />
                <span className={s.answerName}>{p.id === me.id ? 'You' : p.name}</span>
              </div>
              <p className={s.answerBody}>{entry.answers[p.id]?.text}</p>
            </div>
          ))}
        </div>
      ) : status.answeredByMe ? (
        <div className={s.locked}>
          <span className={s.lockedIcon} aria-hidden>
            🔒
          </span>
          <p className={s.lockedText}>
            Your answer is saved. It unlocks the moment {partner.name} writes theirs.
          </p>
        </div>
      ) : (
        <>
          <div className={s.status}>
            <span className={s.statusDot} data-on={status.answeredByPartner} aria-hidden />
            <span>
              {status.answeredByPartner
                ? `${partner.name} has answered. Yours unlocks it.`
                : `Neither of you has answered yet.`}
            </span>
          </div>
          <div className={s.cta}>
            <ButtonLink to="/talk/daily" variant="accent" block={!compact}>
              Answer privately
            </ButtonLink>
          </div>
        </>
      )}

      {!compact && state.checkInDays > 0 ? (
        <p className={s.streak}>
          <span aria-hidden>🌿</span>
          {state.checkInDays} days of checking in with each other.
        </p>
      ) : null}
    </div>
  );
}
