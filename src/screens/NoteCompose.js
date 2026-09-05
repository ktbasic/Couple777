import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BackBar, Screen, ScreenHeader } from '@/components/layout/Screen';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { useToast } from '@/components/ui/Toast';
import { useStore } from '@/context/store';
import { NOTE_KINDS } from '@/features/NoteCard';
import { uid } from '@/lib/id';
import s from './NoteCompose.module.css';
/** "Send later" options, in the language people actually use. */
const WHEN = [
    { label: 'Now', hours: 0 },
    { label: 'Tonight', hours: 8 },
    { label: 'Tomorrow morning', hours: 16 },
    { label: 'Friday evening', hours: 72 },
    { label: 'Next week', hours: 168 },
];
export default function NoteComposeScreen() {
    const navigate = useNavigate();
    const toast = useToast();
    const { dispatch, me, partner } = useStore();
    const [kind, setKind] = useState('appreciation');
    const [body, setBody] = useState('');
    const [when, setWhen] = useState(0);
    const isPrivate = kind === 'private';
    const send = () => {
        const text = body.trim();
        if (!text)
            return;
        const delay = isPrivate ? 0 : when;
        const note = {
            id: uid('n'),
            kind,
            body: text,
            from: me.id,
            createdAt: new Date().toISOString(),
            deliverAt: delay ? new Date(Date.now() + delay * 3600_000).toISOString() : undefined,
            deliverLabel: delay ? WHEN.find((w) => w.hours === delay)?.label : undefined,
        };
        dispatch({ type: 'addNote', note });
        toast.show({
            emoji: isPrivate ? '🔒' : delay ? '🕰' : '💌',
            message: isPrivate
                ? 'Kept for you alone'
                : delay
                    ? `${partner.name} will get it ${WHEN.find((w) => w.hours === delay)?.label.toLowerCase()}`
                    : `Sent to ${partner.name}`,
        });
        navigate('/talk/notes', { replace: true });
    };
    return (_jsxs(_Fragment, { children: [_jsx(BackBar, { title: "New note", fallbackTo: "/talk/notes" }), _jsxs(Screen, { children: [_jsx(ScreenHeader, { eyebrow: "Notes", title: "What do you want to say?", sub: "Pick the shape of it first \u2014 it changes how it lands." }), _jsx("div", { className: s.kinds, children: NOTE_KINDS.map((k) => (_jsxs("button", { type: "button", "aria-pressed": kind === k.value, className: [s.kind, kind === k.value ? s.kindOn : ''].filter(Boolean).join(' '), onClick: () => setKind(k.value), children: [_jsx("span", { className: s.kindEmoji, "aria-hidden": true, children: k.emoji }), _jsxs("span", { className: s.kindMain, children: [_jsx("span", { className: s.kindLabel, children: k.label }), _jsx("span", { className: s.kindBlurb, children: k.blurb })] })] }, k.value))) }), _jsx("textarea", { className: s.area, placeholder: isPrivate
                            ? 'Only you will ever read this.'
                            : `Write it the way you would say it to ${partner.name}.`, value: body, onChange: (e) => setBody(e.target.value) }), !isPrivate ? (_jsxs("div", { className: s.section, children: [_jsx("p", { className: s.label, children: "When should it arrive?" }), _jsx("div", { className: s.when, children: WHEN.map((w) => (_jsx(Chip, { selected: when === w.hours, onClick: () => setWhen(w.hours), children: w.label }, w.hours))) }), _jsxs("p", { className: s.privacyNote, children: [_jsx("span", { "aria-hidden": true, children: "\uD83D\uDD70" }), _jsxs("span", { children: ["A note set for later stays invisible to ", partner.name, " until then. You can still delete it before it lands."] })] })] })) : (_jsxs("p", { className: s.privacyNote, children: [_jsx("span", { "aria-hidden": true, children: "\uD83D\uDD12" }), _jsxs("span", { children: ["Private notes are never shared, and ", partner.name, " cannot see that they exist."] })] })), _jsx("div", { className: s.actions, children: _jsx(Button, { variant: "accent", size: "lg", block: true, disabled: !body.trim(), onClick: send, children: isPrivate ? 'Keep it' : when ? 'Schedule it' : 'Send it' }) })] })] }));
}
