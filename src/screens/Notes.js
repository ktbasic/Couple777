import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { BackBar, Screen, ScreenHeader } from '@/components/layout/Screen';
import { Segmented } from '@/components/ui/Segmented';
import { ButtonLink } from '@/components/ui/Button';
import { FloatingAction } from '@/components/ui/FloatingAction';
import { EmptyState } from '@/components/ui/EmptyState';
import { NoteCard } from '@/features/NoteCard';
import { useStore } from '@/context/store';
import { inboxNotes, privateNotes, scheduledNotes, sentNotes } from '@/lib/selectors';
import s from './Notes.module.css';
export default function NotesScreen() {
    const { state, dispatch, me, partner } = useStore();
    const [tab, setTab] = useState('inbox');
    const inbox = inboxNotes(state, me.id);
    const sent = sentNotes(state, me.id);
    const scheduled = scheduledNotes(state, me.id);
    const mine = privateNotes(state, me.id);
    // Opening the inbox is the read receipt.
    useEffect(() => {
        if (tab !== 'inbox')
            return;
        inbox.filter((n) => !n.readAt).forEach((n) => dispatch({ type: 'markNoteRead', id: n.id }));
        // Runs on tab change; the note list itself is stable enough here.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tab]);
    return (_jsxs(_Fragment, { children: [_jsx(BackBar, { title: "Notes", fallbackTo: "/talk" }), _jsxs(Screen, { children: [_jsx(ScreenHeader, { eyebrow: "Notes", title: `Notes to ${partner.name}`, sub: "Some things land better written down. Send now, or set them to arrive later." }), _jsx("div", { className: s.tabs, children: _jsx(Segmented, { value: tab, onChange: setTab, options: [
                                { value: 'inbox', label: `From ${partner.name}` },
                                { value: 'sent', label: 'Sent' },
                                { value: 'private', label: 'Private' },
                            ] }) }), tab === 'inbox' ? (inbox.length ? (_jsx("div", { className: s.list, children: inbox.map((n, i) => (_jsx("div", { className: s.item, style: { animationDelay: `${i * 60}ms` }, children: _jsx(NoteCard, { note: n }) }, n.id))) })) : (_jsx(EmptyState, { emoji: "\uD83D\uDCED", title: "Nothing waiting", body: `When ${partner.name} writes you something, it turns up here.` }))) : null, tab === 'sent' ? (sent.length || scheduled.length ? (_jsxs("div", { className: s.list, children: [scheduled.map((n, i) => (_jsx("div", { className: s.item, style: { animationDelay: `${i * 60}ms` }, children: _jsx(NoteCard, { note: n, onRemove: () => dispatch({ type: 'removeNote', id: n.id }) }) }, n.id))), sent.map((n, i) => (_jsx("div", { className: s.item, style: { animationDelay: `${(scheduled.length + i) * 60}ms` }, children: _jsx(NoteCard, { note: n, onRemove: () => dispatch({ type: 'removeNote', id: n.id }) }) }, n.id)))] })) : (_jsx(EmptyState, { emoji: "\u2709\uFE0F", title: "You haven't written one yet", body: "Appreciation, a request, or something you have been meaning to say.", action: _jsx(ButtonLink, { to: "/talk/notes/new", variant: "accent", size: "sm", children: "Write a note" }) }))) : null, tab === 'private' ? (mine.length ? (_jsx("div", { className: s.list, children: mine.map((n, i) => (_jsx("div", { className: s.item, style: { animationDelay: `${i * 60}ms` }, children: _jsx(NoteCard, { note: n, onRemove: () => dispatch({ type: 'removeNote', id: n.id }) }) }, n.id))) })) : (_jsx(EmptyState, { emoji: "\uD83D\uDD12", title: "Just for you", body: `Reflections only you can see. ${partner.name} never sees this tab, or that it has anything in it.` }))) : null, _jsx("div", { className: s.tail }), _jsx(FloatingAction, { to: "/talk/notes/new", label: "Write a note", bare: true })] })] }));
}
