import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { BackBar, Screen } from '@/components/layout/Screen';
import { Button, ButtonLink } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { useToast } from '@/components/ui/Toast';
import { useStore } from '@/context/store';
import { DAILY_LABEL, partnerReplyFor, promptForDate } from '@/data/prompts';
import { dailyEntry, dailyStatus } from '@/lib/selectors';
import { cueFromText, cueToParams } from '@/lib/generator';
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
    // Their own words choose the starting filters over in Explore.
    const cue = status.bothAnswered && entry
        ? cueFromText(Object.values(entry.answers).map((a) => a.text).join(' '))
        : null;
    const submit = () => {
        const text = draft.trim();
        if (!text)
            return;
        dispatch({ type: 'answerDaily', date, promptId: prompt.id, personId: me.id, text });
        setDraft('');
        toast.show({
            emoji: status.answeredByPartner ? '🔓' : '🔒',
            message: status.answeredByPartner
                ? 'Both in. Answers unlocked.'
                : `Saved. It unlocks when ${partner.name} answers.`,
        });
        // Stands in for the partner's device. Without it the reveal — the whole
        // point of the mechanic — could never be seen on a single phone.
        if (!status.answeredByPartner) {
            window.setTimeout(() => {
                dispatch({
                    type: 'answerDaily',
                    date,
                    promptId: prompt.id,
                    personId: partner.id,
                    text: partnerReplyFor(prompt.id),
                });
                toast.show({ emoji: '🔓', message: `${partner.name} answered. Both unlocked.` });
            }, 3600);
        }
    };
    return (_jsxs(_Fragment, { children: [_jsx(BackBar, { title: "Back", fallbackTo: "/talk" }), _jsxs(Screen, { children: [_jsxs("header", { className: s.head, children: [_jsx("p", { className: s.kind, children: DAILY_LABEL }), prompt.kind === 'quote' && prompt.quote ? (_jsxs("blockquote", { className: s.quote, children: [prompt.quote, prompt.quoteAuthor ? _jsx("cite", { className: s.attrib, children: prompt.quoteAuthor }) : null] })) : null, _jsx("h1", { className: s.prompt, children: prompt.text })] }), status.bothAnswered && entry ? (_jsxs(_Fragment, { children: [_jsx("div", { className: s.answers, children: [me, partner].map((p, i) => (_jsxs("div", { className: s.answer, style: { animationDelay: `${i * 110}ms` }, children: [_jsxs("div", { className: s.answerHead, children: [_jsx(Avatar, { person: p, size: 24 }), _jsx("span", { className: s.answerName, children: p.id === me.id ? 'You' : p.name })] }), _jsx("p", { className: s.answerBody, children: entry.answers[p.id]?.text })] }, p.id))) }), _jsxs("p", { className: s.streak, children: ["\uD83C\uDF3F ", state.checkInDays, " days of checking in with each other."] }), _jsxs("div", { className: s.next, children: [_jsx(ButtonLink, { to: cue ? `/explore?${cueToParams(cue)}` : '/explore?tier=day', variant: "secondary", block: true, children: cue ? `Find something ${cue.label}` : 'Turn this into a plan' }), _jsx(ButtonLink, { to: "/talk/room", variant: "quiet", block: true, children: "Take it further in the Relationship Room" })] })] })) : status.answeredByMe ? (_jsxs(_Fragment, { children: [_jsxs("div", { className: s.waiting, children: [_jsx("span", { className: s.waitingEmoji, "aria-hidden": true, children: "\uD83D\uDD12" }), _jsx("p", { className: s.waitingTitle, children: "Your answer is sealed." }), _jsxs("p", { className: s.waitingBody, children: ["It opens the moment ", partner.name, " writes theirs \u2014 neither of you gets to read first."] })] }), _jsxs("p", { className: s.streak, children: ["\uD83C\uDF3F ", state.checkInDays, " days of checking in with each other."] })] })) : (_jsxs("div", { className: s.compose, children: [_jsx("textarea", { className: s.area, autoFocus: true, placeholder: "However it comes out. Nobody is marking it.", value: draft, onChange: (e) => setDraft(e.target.value) }), _jsxs("p", { className: s.privacy, children: [_jsx("span", { "aria-hidden": true, children: "\uD83D\uDD12" }), _jsx("span", { children: status.answeredByPartner
                                            ? `${partner.name} has already answered. Writing yours opens both.`
                                            : 'Hidden until you have both answered.' })] }), _jsx("div", { className: s.actions, children: _jsx(Button, { variant: "accent", size: "lg", block: true, disabled: !draft.trim(), onClick: submit, children: "Save my answer" }) })] }))] })] }));
}
