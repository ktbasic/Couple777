import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { ButtonLink } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { DAILY_LABEL, promptForDate } from '@/data/prompts';
import { useStore } from '@/context/store';
import { dailyEntry, dailyStatus } from '@/lib/selectors';
import { today } from '@/lib/dates';
import s from './DailyCard.module.css';
/* A four-point sparkle, the same mark the app uses elsewhere for "today". */
const SPARK = (_jsx("svg", { viewBox: "0 0 16 16", width: "12", height: "12", "aria-hidden": true, children: _jsx("path", { d: "M8 0.6c.5 3.6 1.2 4.3 4.8 4.8v.2C9.2 6.1 8.5 6.8 8 10.4h-.2C7.3 6.8 6.6 6.1 3 5.6v-.2C6.6 4.9 7.3 4.2 7.8.6Z", fill: "currentColor", transform: "translate(0 2.4)" }) }));
const ARROW = (_jsx("svg", { viewBox: "0 0 24 24", width: "17", height: "17", "aria-hidden": true, children: _jsx("path", { d: "M5 12h13m-5.4-5.6L18.2 12l-5.6 5.6", fill: "none", stroke: "currentColor", strokeWidth: "1.9", strokeLinecap: "round", strokeLinejoin: "round" }) }));
/**
 * A speech bubble, waiting to be filled in. Decorative only — it says what
 * the card is about without taking a line of its own: it floats, so it only
 * narrows the lines beside it and the rest of the question runs full width.
 *
 * Drawn in the same soft-gradient way as the travellers rather than as a flat
 * outline, so it belongs to the same illustration set.
 */
function Bubble() {
    return (_jsxs("svg", { className: s.bubble, viewBox: "0 0 76 62", "aria-hidden": true, focusable: "false", children: [_jsx("defs", { children: _jsxs("linearGradient", { id: "dq-bubble", x1: "0.2", y1: "0", x2: "0.8", y2: "1", children: [_jsx("stop", { offset: "0%", stopColor: "#FFFFFF", stopOpacity: "0.95" }), _jsx("stop", { offset: "100%", stopColor: "#FBDCE6", stopOpacity: "0.95" })] }) }), _jsx("path", { d: "M12 4h52a8 8 0 0 1 8 8v22a8 8 0 0 1-8 8H36l-12 12 2.4-12H12a8 8 0 0 1-8-8V12a8 8 0 0 1 8-8Z", fill: "url(#dq-bubble)" }), _jsxs("g", { fill: "#E9A8C0", children: [_jsx("circle", { cx: "26", cy: "23", r: "3.6" }), _jsx("circle", { cx: "38", cy: "23", r: "3.6" }), _jsx("circle", { cx: "50", cy: "23", r: "3.6" })] })] }));
}
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
    return (_jsxs("div", { className: s.card, children: [_jsx(Bubble, {}), _jsxs("p", { className: s.kind, children: [_jsx("span", { className: s.kindMark, "aria-hidden": true, children: SPARK }), DAILY_LABEL] }), prompt.kind === 'quote' && prompt.quote ? (_jsxs("blockquote", { className: s.quote, children: [prompt.quote, prompt.quoteAuthor ? _jsx("cite", { className: s.attrib, children: prompt.quoteAuthor }) : null] })) : null, _jsx("p", { className: s.prompt, children: prompt.text }), status.bothAnswered && entry ? (_jsx("div", { className: s.answers, children: [me, partner].map((p) => (_jsxs("div", { className: s.answer, children: [_jsxs("div", { className: s.answerHead, children: [_jsx(Avatar, { person: p, size: 22 }), _jsx("span", { className: s.answerName, children: p.id === me.id ? 'You' : p.name })] }), _jsx("p", { className: s.answerBody, children: entry.answers[p.id]?.text })] }, p.id))) })) : status.answeredByMe ? (_jsxs("div", { className: s.locked, children: [_jsx("span", { className: s.lockedIcon, "aria-hidden": true, children: "\uD83D\uDD12" }), _jsxs("p", { className: s.lockedText, children: ["Your answer is saved. It unlocks the moment ", partner.name, " writes theirs."] })] })) : (_jsxs(_Fragment, { children: [_jsxs("div", { className: s.status, children: [_jsx("span", { className: s.statusDot, "data-on": status.answeredByPartner, "aria-hidden": true }), _jsx("span", { children: status.answeredByPartner
                                    ? `${partner.name} has answered. Yours unlocks it.`
                                    : `Neither of you has answered yet.` })] }), _jsx("div", { className: s.cta, children: _jsx(ButtonLink, { to: "/talk/daily", variant: "accent", block: !compact, trailingIcon: ARROW, children: "Write my answer" }) })] })), !compact && state.checkInDays > 0 ? (_jsxs("p", { className: s.streak, children: [_jsx("span", { "aria-hidden": true, children: "\uD83C\uDF3F" }), state.checkInDays, " days of checking in with each other."] })) : null] }));
}
