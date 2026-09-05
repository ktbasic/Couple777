import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
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
export function DailyCard({ compact }) {
    const { state, me, partner } = useStore();
    const date = today();
    const prompt = promptForDate(date);
    const entry = dailyEntry(state, date);
    const status = dailyStatus(state, me.id, partner.id, date);
    return (_jsxs("div", { className: s.card, children: [_jsx("p", { className: s.kind, children: PROMPT_KIND_LABEL[prompt.kind] }), prompt.kind === 'quote' && prompt.quote ? (_jsxs("blockquote", { className: s.quote, children: [prompt.quote, prompt.quoteAuthor ? _jsx("cite", { className: s.attrib, children: prompt.quoteAuthor }) : null] })) : null, _jsx("p", { className: s.prompt, children: prompt.text }), status.bothAnswered && entry ? (_jsx("div", { className: s.answers, children: [me, partner].map((p) => (_jsxs("div", { className: s.answer, children: [_jsxs("div", { className: s.answerHead, children: [_jsx(Avatar, { person: p, size: 22 }), _jsx("span", { className: s.answerName, children: p.id === me.id ? 'You' : p.name })] }), _jsx("p", { className: s.answerBody, children: entry.answers[p.id]?.text })] }, p.id))) })) : status.answeredByMe ? (_jsxs("div", { className: s.locked, children: [_jsx("span", { className: s.lockedIcon, "aria-hidden": true, children: "\uD83D\uDD12" }), _jsxs("p", { className: s.lockedText, children: ["Your answer is saved. It unlocks the moment ", partner.name, " writes theirs."] })] })) : (_jsxs(_Fragment, { children: [_jsxs("div", { className: s.status, children: [_jsx("span", { className: s.statusDot, "data-on": status.answeredByPartner, "aria-hidden": true }), _jsx("span", { children: status.answeredByPartner
                                    ? `${partner.name} has answered. Yours unlocks it.`
                                    : `Neither of you has answered yet.` })] }), _jsx("div", { className: s.cta, children: _jsx(ButtonLink, { to: "/talk/daily", variant: "accent", block: !compact, children: "Answer privately" }) })] })), !compact && state.checkInDays > 0 ? (_jsxs("p", { className: s.streak, children: [_jsx("span", { "aria-hidden": true, children: "\uD83C\uDF3F" }), state.checkInDays, " days of checking in with each other."] })) : null] }));
}
