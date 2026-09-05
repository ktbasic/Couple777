import { jsxs as _jsxs, jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Field';
import { Sheet } from '@/components/ui/Sheet';
import { useStore } from '@/context/store';
import { formatPlanDate } from '@/lib/dates';
import s from './IncomingInvite.module.css';
/**
 * "Katy invited you 💌" — the other half of Ask.
 *
 * It sits at the top of Home rather than behind the bell, because an
 * unanswered invitation is the one thing in this app that is waiting on you.
 */
export function IncomingInvite() {
    const { state, space, partner, dispatch } = useStore();
    const navigate = useNavigate();
    const [suggesting, setSuggesting] = useState(false);
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const invite = space?.incoming;
    if (!invite)
        return null;
    const plan = state.plans.find((p) => p.id === invite.plan_id);
    if (!plan)
        return null;
    const when = plan.time
        ? `${formatPlanDate(plan.date)} · ${plan.time}`
        : formatPlanDate(plan.date);
    const answer = (response) => {
        dispatch({ type: 'respondToInvite', planId: plan.id, response });
        setSuggesting(false);
    };
    return (_jsxs(_Fragment, { children: [_jsxs("section", { className: s.card, "aria-label": "An invitation from your partner", children: [_jsxs("p", { className: s.from, children: [partner.name, " invited you \uD83D\uDC8C"] }), _jsxs("button", { type: "button", className: s.plan, onClick: () => navigate(`/plan/${plan.id}`), children: [_jsx("span", { className: s.emoji, "aria-hidden": true, children: plan.emoji }), _jsxs("span", { className: s.planText, children: [_jsx("span", { className: s.title, children: plan.title }), _jsx("span", { className: s.when, children: when })] })] }), invite.message ? _jsxs("p", { className: s.message, children: ["\u201C", invite.message, "\u201D"] }) : null, _jsxs("div", { className: s.actions, children: [_jsx(Button, { variant: "accent", block: true, onClick: () => answer('yes'), children: "Sounds good \u2764\uFE0F" }), _jsxs("div", { className: s.minor, children: [_jsx("button", { type: "button", className: s.link, onClick: () => setSuggesting(true), children: "Suggest another time" }), _jsx("button", { type: "button", className: s.link, onClick: () => answer('cant'), children: "Can't make it" })] })] })] }), _jsxs(Sheet, { open: suggesting, onClose: () => setSuggesting(false), title: "Suggest another time", children: [_jsxs("p", { className: s.sheetBody, children: [partner.name, " will see this instead. Nothing is booked either way."] }), _jsxs("div", { className: s.sheetForm, children: [_jsx(Input, { label: "Day", type: "date", value: date, onChange: (e) => setDate(e.target.value) }), _jsx(Input, { label: "Time", type: "time", value: time, onChange: (e) => setTime(e.target.value) }), _jsx(Button, { variant: "accent", size: "lg", block: true, onClick: () => answer('reschedule'), children: "Send it back" })] })] })] }));
}
