import { ButtonLink } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { DAILY_LABEL, promptForDate } from '@/data/prompts';
import { useStore } from '@/context/store';
import { dailyEntry, dailyStatus } from '@/lib/selectors';
import { today } from '@/lib/dates';
import s from './DailyCard.module.css';

/* A four-point sparkle, the same mark the app uses elsewhere for "today". */
const SPARK = (
  <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden>
    <path
      d="M8 0.6c.5 3.6 1.2 4.3 4.8 4.8v.2C9.2 6.1 8.5 6.8 8 10.4h-.2C7.3 6.8 6.6 6.1 3 5.6v-.2C6.6 4.9 7.3 4.2 7.8.6Z"
      fill="currentColor"
      transform="translate(0 2.4)"
    />
  </svg>
);

const ARROW = (
  <svg viewBox="0 0 24 24" width="17" height="17" aria-hidden>
    <path
      d="M5 12h13m-5.4-5.6L18.2 12l-5.6 5.6"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/**
 * A speech bubble, waiting to be filled in. Decorative only — it says what
 * the card is about without taking a line of its own: it floats, so it only
 * narrows the lines beside it and the rest of the question runs full width.
 *
 * Drawn in the same soft-gradient way as the travellers rather than as a flat
 * outline, so it belongs to the same illustration set.
 */
function Bubble() {
  return (
    <svg className={s.bubble} viewBox="0 0 76 62" aria-hidden focusable="false">
      <defs>
        <linearGradient id="dq-bubble" x1="0.2" y1="0" x2="0.8" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#FBDCE6" stopOpacity="0.95" />
        </linearGradient>
      </defs>
      <path
        d="M12 4h52a8 8 0 0 1 8 8v22a8 8 0 0 1-8 8H36l-12 12 2.4-12H12a8 8 0 0 1-8-8V12a8 8 0 0 1 8-8Z"
        fill="url(#dq-bubble)"
      />
      <g fill="#E9A8C0">
        <circle cx="26" cy="23" r="3.6" />
        <circle cx="38" cy="23" r="3.6" />
        <circle cx="50" cy="23" r="3.6" />
      </g>
    </svg>
  );
}

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
      <Bubble />

      <p className={s.kind}>
        <span className={s.kindMark} aria-hidden>
          {SPARK}
        </span>
        {DAILY_LABEL}
      </p>

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
            <ButtonLink
              to="/talk/daily"
              variant="accent"
              block={!compact}
              trailingIcon={ARROW}
            >
              Write my answer
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
