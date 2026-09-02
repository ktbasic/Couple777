import { useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { BackBar, Screen } from '@/components/layout/Screen';
import { Button, ButtonLink } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { useStore } from '@/context/store';
import { topicById } from '@/data/roomTopics';
import { uid } from '@/lib/id';
import type { ID, RoomSession } from '@/lib/types';
import s from './RoomSession.module.css';

type Phase = 'answer' | 'handover' | 'reveal' | 'commit' | 'done';

/**
 * A two-person flow on one device: you answer, hand the phone over, they
 * answer, then both open at once. On a real two-device build the handover
 * step becomes a "waiting for them" state — the rest is identical.
 */
export default function RoomSessionScreen() {
  const { topicId } = useParams();
  const navigate = useNavigate();
  const { state, dispatch, me, partner } = useStore();

  const topic = topicById(topicId ?? '');
  const [stepIndex, setStepIndex] = useState(0);
  const [turn, setTurn] = useState<ID>(me.id);
  const [phase, setPhase] = useState<Phase>('answer');
  const [draft, setDraft] = useState('');
  const [answers, setAnswers] = useState<Record<number, Record<ID, string>>>({});
  const [commitment, setCommitment] = useState('');

  if (!topic) return <Navigate to="/talk/room" replace />;

  const step = topic.steps[stepIndex];
  const total = topic.steps.length;

  const advance = () => {
    if (stepIndex + 1 >= total) {
      setPhase('done');
      return;
    }
    const next = topic.steps[stepIndex + 1];
    setStepIndex(stepIndex + 1);
    setTurn(me.id);
    setDraft('');
    setPhase(next.kind === 'private' ? 'answer' : next.kind === 'reveal' ? 'reveal' : 'commit');
  };

  const submitAnswer = () => {
    const text = draft.trim();
    if (!text) return;
    setAnswers((prev) => ({
      ...prev,
      [stepIndex]: { ...(prev[stepIndex] ?? {}), [turn]: text },
    }));
    setDraft('');

    if (turn === me.id) {
      setTurn(partner.id);
      setPhase('handover');
    } else {
      advance();
    }
  };

  const finish = () => {
    const session: RoomSession = {
      id: uid('rs'),
      topicId: topic.id,
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      answers,
      commitment: commitment.trim() || undefined,
    };
    dispatch({ type: 'saveRoomSession', session });
    setPhase('done');
  };

  const currentPerson = turn === me.id ? me : partner;

  /* The reveal shows the most recent private step's two answers. */
  const lastPrivateIndex = (() => {
    for (let i = stepIndex - 1; i >= 0; i--) {
      if (topic.steps[i].kind === 'private') return i;
    }
    return -1;
  })();
  const revealed = answers[lastPrivateIndex] ?? {};

  return (
    <>
      <BackBar title={topic.label} fallbackTo="/talk/room" />
      <Screen>
        <div className={s.progress} aria-hidden>
          {topic.steps.map((_, i) => (
            <span
              key={i}
              className={[s.tick, i <= stepIndex || phase === 'done' ? s.tickOn : '']
                .filter(Boolean)
                .join(' ')}
            />
          ))}
        </div>

        {phase === 'answer' && step.kind === 'private' ? (
          <div className={s.stage} key={`${stepIndex}-${turn}`}>
            <span className={s.who}>
              <Avatar person={currentPerson} size={22} />
              {turn === me.id ? 'Your turn' : `${partner.name}'s turn`}
            </span>
            <h1 className={s.prompt}>{step.prompt}</h1>
            {step.hint ? <p className={s.hint}>{step.hint}</p> : null}
            <textarea
              className={s.area}
              autoFocus
              placeholder="Take your time. Nobody sees this until you both have."
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
            />
            <div className={s.actions}>
              <Button variant="accent" size="lg" block disabled={!draft.trim()} onClick={submitAnswer}>
                {turn === me.id ? `Save and pass to ${partner.name}` : 'Save and open both'}
              </Button>
            </div>
          </div>
        ) : null}

        {phase === 'handover' ? (
          <div className={s.stage}>
            <div className={s.handover}>
              <div className={s.handoverAvatar}>
                <Avatar person={partner} size={56} ring />
              </div>
              <p className={s.handoverTitle}>Pass the phone to {partner.name}.</p>
              <p className={s.handoverBody}>
                Your answer is sealed. They will not see it until they have written their own.
              </p>
            </div>
            <div className={s.actions}>
              <Button variant="primary" size="lg" block onClick={() => setPhase('answer')}>
                I'm {partner.name}
              </Button>
            </div>
          </div>
        ) : null}

        {phase === 'reveal' && step.kind === 'reveal' ? (
          <div className={s.stage}>
            <h1 className={s.prompt}>{step.prompt}</h1>
            <div className={s.answers}>
              {[me, partner].map((p, i) => (
                <div key={p.id} className={s.answer} style={{ animationDelay: `${i * 120}ms` }}>
                  <div className={s.answerHead}>
                    <Avatar person={p} size={24} />
                    <span className={s.answerName}>{p.id === me.id ? 'You' : p.name}</span>
                  </div>
                  <p className={s.answerBody}>{revealed[p.id] ?? '—'}</p>
                </div>
              ))}
            </div>
            <p className={s.talkNow}>
              Read them out loud before you move on. The point is not the writing, it is what you
              say after it.
            </p>
            <div className={s.actions}>
              <Button variant="accent" size="lg" block onClick={advance}>
                We've talked about it
              </Button>
            </div>
          </div>
        ) : null}

        {phase === 'commit' && step.kind === 'commitment' ? (
          <div className={s.stage}>
            <h1 className={s.prompt}>{step.prompt}</h1>
            {step.hint ? <p className={s.hint}>{step.hint}</p> : null}
            <textarea
              className={s.area}
              autoFocus
              placeholder="This week we want to…"
              value={commitment}
              onChange={(e) => setCommitment(e.target.value)}
            />
            <div className={s.actions}>
              <Button variant="accent" size="lg" block disabled={!commitment.trim()} onClick={finish}>
                Agree on it
              </Button>
            </div>
          </div>
        ) : null}

        {phase === 'done' ? (
          <div className={s.stage}>
            <div className={s.done}>
              <span className={s.doneEmoji} aria-hidden>
                {topic.emoji}
              </span>
              <p className={s.doneTitle}>That is the hard part done.</p>
              {commitment.trim() ? <p className={s.doneCommit}>“{commitment.trim()}”</p> : null}
            </div>
            <div className={s.actions}>
              <Button
                variant="accent"
                size="lg"
                block
                onClick={() => navigate('/plan/new/day')}
              >
                Put something in the diary
              </Button>
              <ButtonLink to="/talk" variant="quiet" block>
                Back to Talk
              </ButtonLink>
            </div>
          </div>
        ) : null}

        {state.roomSessions.length && phase === 'done' ? null : null}
      </Screen>
    </>
  );
}
