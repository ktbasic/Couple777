import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Avatar } from '@/components/ui/Avatar';
import { useStore } from '@/context/store';
import s from './NoteCard.module.css';
export const NOTE_KINDS = [
    { value: 'appreciation', label: 'Appreciation', emoji: '🕊️', blurb: 'Something they did that you noticed.' },
    { value: 'love', label: 'Love note', emoji: '💌', blurb: 'No reason needed.' },
    { value: 'memory', label: 'A memory', emoji: '📸', blurb: 'Something you were just thinking about.' },
    { value: 'feeling', label: 'How I feel', emoji: '🌊', blurb: 'Easier written than said out loud.' },
    { value: 'talk', label: 'Can we talk about…', emoji: '💬', blurb: 'Open a door without starting the conversation yet.' },
    { value: 'request', label: 'Something I need', emoji: '🤲', blurb: 'Ask plainly. It usually lands better.' },
    { value: 'private', label: 'Just for me', emoji: '🔒', blurb: 'A private reflection. Never shared.' },
];
function kindMeta(kind) {
    return NOTE_KINDS.find((k) => k.value === kind) ?? NOTE_KINDS[0];
}
function relative(iso) {
    const diff = Date.now() - new Date(iso).getTime();
    const days = Math.floor(diff / 86400000);
    if (days <= 0) {
        const hours = Math.floor(diff / 3600000);
        if (hours <= 0)
            return 'Just now';
        return `${hours}h ago`;
    }
    if (days === 1)
        return 'Yesterday';
    if (days < 7)
        return `${days} days ago`;
    return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}
export function NoteCard({ note, onRemove }) {
    const { state, me } = useStore();
    const meta = kindMeta(note.kind);
    const author = state.couple.people.find((p) => p.id === note.from);
    const fromPartner = note.from !== me.id;
    const unread = fromPartner && !note.readAt;
    const scheduled = note.deliverAt && new Date(note.deliverAt).getTime() > Date.now();
    return (_jsxs("article", { className: [s.card, unread ? s.unread : '', note.kind === 'private' ? s.private : '']
            .filter(Boolean)
            .join(' '), children: [_jsxs("div", { className: s.head, children: [author && note.kind !== 'private' ? _jsx(Avatar, { person: author, size: 22 }) : null, _jsxs("span", { className: s.kind, children: [meta.emoji, " ", meta.label] }), _jsx("span", { className: s.when, children: relative(note.createdAt) })] }), _jsx("p", { className: s.body, children: note.body }), scheduled || onRemove ? (_jsxs("div", { className: s.footer, children: [scheduled ? (_jsxs("span", { className: s.scheduled, children: ["\uD83D\uDD70 Arrives ", note.deliverLabel ?? new Date(note.deliverAt).toLocaleDateString()] })) : null, onRemove ? (_jsx("button", { type: "button", className: s.remove, onClick: onRemove, children: "Delete" })) : null] })) : null] }));
}
