import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { Sheet } from '@/components/ui/Sheet';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { useStore } from '@/context/store';
import { formatPlanDate } from '@/lib/dates';
import { canShareNatively, inviteText, shareInvite } from '@/lib/share';
import s from './InviteSheet.module.css';
const PLACEHOLDER = {
    day: 'I thought we could have a proper dinner together this week ❤️',
    week: 'Want to get out of town together?',
    month: 'I want to take you somewhere.',
};
/**
 * Asking your partner is an action inside a plan, not a feature of its own.
 * The share itself goes through the native sheet, which is what puts WhatsApp
 * and the rest in front of the user without integrating any of them.
 */
export function InviteSheet({ plan, tier, open, onClose, }) {
    const { dispatch, me, partner } = useStore();
    const toast = useToast();
    const [message, setMessage] = useState(plan.invite?.message ?? '');
    const [sent, setSent] = useState(false);
    const text = inviteText(plan, tier, me.name, message);
    const when = plan.time ? `${formatPlanDate(plan.date)} · ${plan.time}` : formatPlanDate(plan.date);
    /*
     * The main way to ask, now that both people have accounts: a real
     * invitation addressed to the other one, which appears on their Home and
     * which only they can answer.
     */
    const ask = () => {
        dispatch({ type: 'sendInvite', planId: plan.id, message: message.trim() || undefined });
        setSent(true);
    };
    /*
     * Secondary, and deliberately so. Sharing to WhatsApp or Messages still
     * works and always will, but it is not what makes the invitation real —
     * nothing about the plan depends on the other person having WhatsApp.
     */
    const shareOutside = async () => {
        const outcome = await shareInvite(text, `${me.name} · Couple777`);
        if (outcome.method === 'clipboard') {
            toast.show({ emoji: '📋', message: 'Invite copied — paste it anywhere' });
        }
        else if (outcome.method === 'failed') {
            toast.show({ message: "Couldn't open sharing on this device." });
        }
    };
    const close = () => {
        setSent(false);
        onClose();
    };
    return (_jsx(Sheet, { open: open, onClose: close, title: sent ? 'Sent' : `Ask ${partner.name}`, children: sent ? (_jsxs("div", { className: s.sent, children: [_jsx("span", { className: s.sentIcon, "aria-hidden": true, children: "\uD83D\uDC8C" }), _jsxs("p", { className: s.sentTitle, children: ["On its way to ", partner.name] }), _jsxs("p", { className: s.sentBody, children: ["It is on ", partner.name, "'s Home now. You'll see it here as soon as they say yes \u2014 no nagging in the meantime."] }), _jsx("div", { className: s.actions, children: _jsx(Button, { variant: "accent", block: true, onClick: close, children: "Done" }) })] })) : (_jsxs(_Fragment, { children: [_jsxs("div", { className: s.summary, children: [_jsx("span", { className: s.emoji, "aria-hidden": true, children: plan.emoji }), _jsxs("div", { children: [_jsx("p", { className: s.title, children: plan.title }), _jsx("p", { className: s.when, children: when })] })] }), _jsx("p", { className: s.label, children: "Add a message (optional)" }), _jsx("textarea", { className: s.area, placeholder: PLACEHOLDER[tier], value: message, onChange: (e) => setMessage(e.target.value) }), _jsxs("div", { className: s.preview, children: [_jsx("p", { className: s.previewLabel, children: "They'll see" }), text] }), _jsxs("div", { className: s.actions, children: [_jsxs(Button, { variant: "accent", size: "lg", block: true, onClick: ask, children: ["Ask ", partner.name, " \uD83D\uDC8C"] }), _jsx("button", { type: "button", className: s.outside, onClick: () => void shareOutside(), children: canShareNatively() ? 'Share outside Couple777' : 'Copy the invite text' }), _jsx("button", { type: "button", className: s.cancel, onClick: close, children: "Cancel" })] })] })) }));
}
