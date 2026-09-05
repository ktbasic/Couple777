import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { BackBar, Screen } from '@/components/layout/Screen';
import { Photo } from '@/components/ui/Photo';
import { Avatar } from '@/components/ui/Avatar';
import { Pill } from '@/components/ui/Pill';
import { ButtonLink } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { useStore } from '@/context/store';
import { formatPlanDate } from '@/lib/dates';
import s from './MemoryDetail.module.css';
const KIND = {
    day: { label: 'Date', tone: 'day' },
    week: { label: 'Mini adventure', tone: 'week' },
    month: { label: 'Big adventure', tone: 'month' },
    milestone: { label: 'Milestone', tone: 'gold' },
    moment: { label: 'A moment', tone: 'neutral' },
};
const MOOD_LABEL = {
    warm: '🕯️ Warm',
    joyful: '☀️ Joyful',
    calm: '🌾 Calm',
    silly: '🤸 Silly',
    proud: '🌟 Proud',
    tender: '🤍 Tender',
};
export default function MemoryDetailScreen() {
    const { memoryId } = useParams();
    const navigate = useNavigate();
    const toast = useToast();
    const { state, dispatch, me, partner } = useStore();
    const memory = state.memories.find((m) => m.id === memoryId);
    if (!memory)
        return _jsx(Navigate, { to: "/memories", replace: true });
    const kind = KIND[memory.kind];
    const setMyNote = (text) => dispatch({ type: 'upsertMemory', memory: { ...memory, notes: { ...memory.notes, [me.id]: text } } });
    const setMyPrivate = (text) => dispatch({
        type: 'upsertMemory',
        memory: { ...memory, privateNotes: { ...memory.privateNotes, [me.id]: text } },
    });
    const remove = () => {
        dispatch({ type: 'removeMemory', id: memory.id });
        toast.show({ message: 'Memory removed' });
        navigate('/memories', { replace: true });
    };
    return (_jsxs(_Fragment, { children: [_jsx(BackBar, { title: "Memory", fallbackTo: "/memories", bleed: true }), _jsxs(Screen, { children: [memory.photos.length ? (_jsx("div", { className: `${s.gallery} no-scrollbar`, children: memory.photos.map((src, i) => (_jsx("div", { className: [s.slide, memory.photos.length === 1 ? s.single : ''].filter(Boolean).join(' '), children: _jsx(Photo, { src: src, seed: `${memory.id}-${i}`, ratio: "4 / 3", alt: "" }) }, src))) })) : null, _jsxs("header", { className: s.head, children: [_jsx("p", { className: s.date, children: formatPlanDate(memory.date) }), _jsxs("h1", { className: s.title, children: [memory.emoji, " ", memory.title] }), _jsxs("div", { className: s.meta, children: [_jsx(Pill, { tone: kind.tone, children: kind.label }), memory.place ? _jsx(Pill, { children: memory.place }) : null, memory.mood ? _jsx(Pill, { children: MOOD_LABEL[memory.mood] }) : null] })] }), memory.sharedNote ? _jsxs("p", { className: s.shared, children: ["\u201C", memory.sharedNote, "\u201D"] }) : null, _jsxs("div", { className: s.notes, children: [[me, partner].map((p) => {
                                const isMe = p.id === me.id;
                                const text = memory.notes[p.id];
                                return (_jsxs("div", { className: s.note, children: [_jsxs("div", { className: s.noteHead, children: [_jsx(Avatar, { person: p, size: 22 }), _jsx("span", { className: s.noteName, children: isMe ? 'You' : p.name })] }), isMe ? (_jsx("textarea", { className: s.editArea, placeholder: "What do you want to remember about this?", value: text ?? '', onChange: (e) => setMyNote(e.target.value) })) : text ? (_jsx("p", { className: s.noteBody, children: text })) : (_jsxs("p", { className: `${s.noteBody} ${s.noteEmpty}`, children: [p.name, " hasn't written anything here yet."] }))] }, p.id));
                            }), _jsxs("div", { className: `${s.note} ${s.privateNote}`, children: [_jsxs("div", { className: s.noteHead, children: [_jsx("span", { className: s.noteName, children: "\uD83D\uDD12 Just for you" }), _jsx("span", { className: s.privateLabel, children: "Never shared" })] }), _jsx("textarea", { className: s.editArea, placeholder: "Anything you want to keep to yourself.", value: memory.privateNotes[me.id] ?? '', onChange: (e) => setMyPrivate(e.target.value) })] })] }), _jsxs("div", { className: s.actions, children: [_jsx(ButtonLink, { to: "/explore", variant: "secondary", block: true, children: "Plan the next one" }), _jsx("button", { type: "button", className: s.delete, onClick: remove, children: "Remove this memory" })] })] })] }));
}
