import { useState } from 'react';
import { BackBar, Screen } from '@/components/layout/Screen';
import { Button, ButtonLink } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { useToast } from '@/components/ui/Toast';
import { useStore } from '@/context/store';
import { PROMPT_KIND_LABEL, promptForDate } from '@/data/prompts';
import { dailyEntry, dailyStatus } from '@/lib/selectors';
import { today } from '@/lib/dates';
import s from './DailyQuestion.module.css';

export default function DailyQuestionScreen() {
  const { state, dispatch, me, partner } = useStore();
  const toast = useToast();
  const date = today();
  const prompt = promptForDate(date);
  const entry = dailyEntry(state, date);
  const status = dailyStatus(state, me.id, partner.id, date);
  const [draft, setDraft] = useState('');

  const submit = () => {
    const text = draft.trim();
    if (!text) return;
    dispatch({ type: 'answerDaily', date, promptId: prompt.id, personId: me.id, text });
    setDraft('');
    toast.show({
      emoji: status.answeredByPartner ? '🔓' : '🔒',
      message: status.answeredByPartner
        ? 'Both in. Answers unlocked.'
        : `Saved. It unlocks when ${partner.name} answers.`,
    });
  };

  return (
    <>
      <BackBar title="Today" fallbackTo="/talk" />
      <Screen>
        <header className={s.head}>
          <p className={s.kind}>{PROMPT_KIND_LABEL[prompt.kind]}</p>
          {prompt.kind === 'quote' && prompt.quote ? (
            <blockquote className={s.quote}>
              {prompt.quote}
              {prompt.quoteAuthor ? <cite className={s.attrib}>{prompt.quoteAuthor}</cite> : null}
            </blockquote>
          ) : null}
          <h1 className={s.prompt}>{prompt.text}</h1>
        </header>

        {status.bothAnswered && entry ? (
          <>
            <div className={s.answers}>
              {[me, partner].map((p, i) => (
                <div key={p.id} className={s.answer} style={{ animationDelay: `${i * 110}ms` }}>
                  <div className={s.answerHead}>
                    <Avatar person={p} size={24} />
                    <span className={s.answerName}>{p.id === me.id ? 'You' : p.name}</span>
                  </div>
                  <p className={s.answerBody}>{entry.answers[p.id]?.text}</p>
                </div>
              ))}
            </div>
            <p className={s.streak}>
              🌿 {state.checkInDays} days of checking in with each other.
            </p>
            <div className={s.next}>
              <ButtonLink to="/explore" variant="secondary" block>
                Turn this into a plan
              </ButtonLink>
              <ButtonLink to="/talk/room" variant="quiet" block>
                Take it further in the Relationship Room
              </ButtonLink>
            </div>
          </>
        ) : status.answeredByMe ? (
          <>
            <div className={s.waiting}>
              <span className={s.waitingEmoji} aria-hidden>
                🔒
              </span>
              <p className={s.waitingTitle}>Your answer is sealed.</p>
              <p className={s.waitingBody}>
                It opens the moment {partner.name} writes theirs — neither of you gets to read
                first.
              </p>
            </div>
            <p className={s.streak}>🌿 {state.checkInDays} days of checking in with each other.</p>
          </>
        ) : (
          <div className={s.compose}>
            <textarea
              className={s.area}
              autoFocus
              placeholder="However it comes out. Nobody is marking it."
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
            />
            <p className={s.privacy}>
              <span aria-hidden>🔒</span>
              <span>
                {status.answeredByPartner
                  ? `${partner.name} has already answered. Writing yours opens both.`
                  : 'Hidden until you have both answered.'}
              </span>
            </p>
            <div className={s.actions}>
              <Button variant="accent" size="lg" block disabled={!draft.trim()} onClick={submit}>
                Save my answer
              </Button>
            </div>
          </div>
        )}
      </Screen>
    </>
  );
}
