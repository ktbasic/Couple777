import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { BackBar, Screen } from '@/components/layout/Screen';
import { Button, ButtonLink } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { useStore } from '@/context/store';
import { topicById } from '@/data/roomTopics';
import { uid } from '@/lib/id';
import s from './RoomSession.module.css';
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
    const [turn, setTurn] = useState(me.id);
    const [phase, setPhase] = useState('answer');
    const [draft, setDraft] = useState('');
    const [answers, setAnswers] = useState({});
    const [commitment, setCommitment] = useState('');
    if (!topic)
        return _jsx(Navigate, { to: "/talk/room", replace: true });
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
        if (!text)
            return;
        setAnswers((prev) => ({
            ...prev,
            [stepIndex]: { ...(prev[stepIndex] ?? {}), [turn]: text },
        }));
        setDraft('');
        if (turn === me.id) {
            setTurn(partner.id);
            setPhase('handover');
        }
        else {
            advance();
        }
    };
    const finish = () => {
        const session = {
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
            if (topic.steps[i].kind === 'private')
                return i;
        }
        return -1;
    })();
    const revealed = answers[lastPrivateIndex] ?? {};
    return (_jsxs(_Fragment, { children: [_jsx(BackBar, { title: topic.label, fallbackTo: "/talk/room" }), _jsxs(Screen, { children: [_jsx("div", { className: s.progress, "aria-hidden": true, children: topic.steps.map((_, i) => (_jsx("span", { className: [s.tick, i <= stepIndex || phase === 'done' ? s.tickOn : '']
                                .filter(Boolean)
                                .join(' ') }, i))) }), phase === 'answer' && step.kind === 'private' ? (_jsxs("div", { className: s.stage, children: [_jsxs("span", { className: s.who, children: [_jsx(Avatar, { person: currentPerson, size: 22 }), turn === me.id ? 'Your turn' : `${partner.name}'s turn`] }), _jsx("h1", { className: s.prompt, children: step.prompt }), step.hint ? _jsx("p", { className: s.hint, children: step.hint }) : null, _jsx("textarea", { className: s.area, autoFocus: true, placeholder: "Take your time. Nobody sees this until you both have.", value: draft, onChange: (e) => setDraft(e.target.value) }), _jsx("div", { className: s.actions, children: _jsx(Button, { variant: "accent", size: "lg", block: true, disabled: !draft.trim(), onClick: submitAnswer, children: turn === me.id ? `Save and pass to ${partner.name}` : 'Save and open both' }) })] }, `${stepIndex}-${turn}`)) : null, phase === 'handover' ? (_jsxs("div", { className: s.stage, children: [_jsxs("div", { className: s.handover, children: [_jsx("div", { className: s.handoverAvatar, children: _jsx(Avatar, { person: partner, size: 56, ring: true }) }), _jsxs("p", { className: s.handoverTitle, children: ["Pass the phone to ", partner.name, "."] }), _jsx("p", { className: s.handoverBody, children: "Your answer is sealed. They will not see it until they have written their own." })] }), _jsx("div", { className: s.actions, children: _jsxs(Button, { variant: "primary", size: "lg", block: true, onClick: () => setPhase('answer'), children: ["I'm ", partner.name] }) })] })) : null, phase === 'reveal' && step.kind === 'reveal' ? (_jsxs("div", { className: s.stage, children: [_jsx("h1", { className: s.prompt, children: step.prompt }), _jsx("div", { className: s.answers, children: [me, partner].map((p, i) => (_jsxs("div", { className: s.answer, style: { animationDelay: `${i * 120}ms` }, children: [_jsxs("div", { className: s.answerHead, children: [_jsx(Avatar, { person: p, size: 24 }), _jsx("span", { className: s.answerName, children: p.id === me.id ? 'You' : p.name })] }), _jsx("p", { className: s.answerBody, children: revealed[p.id] ?? '—' })] }, p.id))) }), _jsx("p", { className: s.talkNow, children: "Read them out loud before you move on. The point is not the writing, it is what you say after it." }), _jsx("div", { className: s.actions, children: _jsx(Button, { variant: "accent", size: "lg", block: true, onClick: advance, children: "We've talked about it" }) })] })) : null, phase === 'commit' && step.kind === 'commitment' ? (_jsxs("div", { className: s.stage, children: [_jsx("h1", { className: s.prompt, children: step.prompt }), step.hint ? _jsx("p", { className: s.hint, children: step.hint }) : null, _jsx("textarea", { className: s.area, autoFocus: true, placeholder: "This week we want to\u2026", value: commitment, onChange: (e) => setCommitment(e.target.value) }), _jsx("div", { className: s.actions, children: _jsx(Button, { variant: "accent", size: "lg", block: true, disabled: !commitment.trim(), onClick: finish, children: "Agree on it" }) })] })) : null, phase === 'done' ? (_jsxs("div", { className: s.stage, children: [_jsxs("div", { className: s.done, children: [_jsx("span", { className: s.doneEmoji, "aria-hidden": true, children: topic.emoji }), _jsx("p", { className: s.doneTitle, children: "That is the hard part done." }), commitment.trim() ? _jsxs("p", { className: s.doneCommit, children: ["\u201C", commitment.trim(), "\u201D"] }) : null] }), _jsxs("div", { className: s.actions, children: [_jsx(Button, { variant: "accent", size: "lg", block: true, onClick: () => navigate('/plan/new/day'), children: "Put something in the diary" }), _jsx(ButtonLink, { to: "/talk", variant: "quiet", block: true, children: "Back to Talk" })] })] })) : null, state.roomSessions.length && phase === 'done' ? null : null] })] }));
}
