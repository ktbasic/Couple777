import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { BackBar, Screen } from '@/components/layout/Screen';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Field';
import { Chip } from '@/components/ui/Chip';
import { Photo } from '@/components/ui/Photo';
import { useToast } from '@/components/ui/Toast';
import { useStore } from '@/context/store';
import { photo } from '@/lib/photo';
import { today } from '@/lib/dates';
import { uid } from '@/lib/id';
import s from './MemoryCapture.module.css';
const MOODS = [
    { value: 'warm', label: 'Warm', emoji: '🕯️' },
    { value: 'joyful', label: 'Joyful', emoji: '☀️' },
    { value: 'calm', label: 'Calm', emoji: '🌾' },
    { value: 'silly', label: 'Silly', emoji: '🤸' },
    { value: 'proud', label: 'Proud', emoji: '🌟' },
    { value: 'tender', label: 'Tender', emoji: '🤍' },
];
const KINDS = [
    { value: 'day', label: 'A date', emoji: '🍷' },
    { value: 'week', label: 'Mini adventure', emoji: '🏔️' },
    { value: 'month', label: 'Big adventure', emoji: '✈️' },
    { value: 'milestone', label: 'Milestone', emoji: '❤️' },
    { value: 'moment', label: 'Just a moment', emoji: '✨' },
];
export default function MemoryCaptureScreen() {
    const [params] = useSearchParams();
    const navigate = useNavigate();
    const toast = useToast();
    const { state, dispatch, me } = useStore();
    // Arrives from a completed cycle, so the rhythm, plan and partner are known.
    const cycle = state.cycles.find((c) => c.id === params.get('cycle'));
    const plan = state.plans.find((p) => p.id === (cycle?.planId ?? params.get('plan'))) ?? undefined;
    const [title, setTitle] = useState(plan?.title ?? '');
    const [emoji] = useState(plan?.emoji ?? '✨');
    const [date, setDate] = useState(plan?.date ?? today());
    const [place, setPlace] = useState(plan?.place ?? '');
    const [shared, setSharedNote] = useState('');
    const [kind, setKind] = useState(cycle?.tier ?? 'moment');
    const [mood, setMood] = useState(null);
    const [mine, setMine] = useState('');
    const [selected, setSelected] = useState([]);
    // Stands in for the camera roll — a real build reads the last week of photos.
    const roll = useMemo(() => Array.from({ length: 9 }, (_, i) => photo(`roll-${plan?.id ?? 'new'}-${i}`, 600, 600)), [plan?.id]);
    const toggle = (src) => setSelected((prev) => (prev.includes(src) ? prev.filter((p) => p !== src) : [...prev, src]));
    const save = () => {
        const memory = {
            id: uid('m'),
            date,
            title: title.trim() || 'A moment together',
            emoji,
            kind,
            place: place.trim() || undefined,
            photos: selected,
            mood: mood ?? undefined,
            sharedNote: shared.trim() || undefined,
            notes: mine.trim() ? { [me.id]: mine.trim() } : {},
            privateNotes: {},
            planId: plan?.id,
            cycleId: cycle?.id,
        };
        dispatch({ type: 'upsertMemory', memory });
        if (plan)
            dispatch({ type: 'linkMemoryToPlan', planId: plan.id, memoryId: memory.id });
        toast.show({ emoji: '✓', message: 'Another memory made', actionLabel: 'See it', actionTo: `/memories/${memory.id}` });
        navigate(`/memories/${memory.id}`, { replace: true });
    };
    return (_jsxs(_Fragment, { children: [_jsx(BackBar, { title: "New memory", fallbackTo: "/memories" }), _jsxs(Screen, { children: [_jsxs("header", { className: s.head, children: [_jsx("p", { className: s.eyebrow, children: plan ? 'Another memory made' : 'Keep it' }), _jsx("h1", { className: s.title, children: plan ? `How was ${plan.title.toLowerCase()}?` : 'What do you want to remember?' }), _jsx("p", { className: s.sub, children: plan
                                    ? 'A photo and a line each is plenty. You will be glad of it in a year.'
                                    : 'It does not have to be an occasion. The small ones age best.' })] }), _jsxs("div", { className: s.form, children: [_jsx(Input, { label: "What happened", placeholder: "Pasta date at home", value: title, onChange: (e) => setTitle(e.target.value) }), _jsxs("div", { children: [_jsx("p", { className: s.label, children: "Photos" }), _jsx("div", { className: s.roll, children: roll.map((src) => (_jsx("button", { type: "button", "aria-pressed": selected.includes(src), className: [s.tile, selected.includes(src) ? s.tileOn : ''].filter(Boolean).join(' '), onClick: () => toggle(src), children: _jsx(Photo, { src: src, seed: src, className: s.tileImg, alt: "" }) }, src))) }), _jsx("p", { className: s.hint, children: selected.length
                                            ? `${selected.length} selected`
                                            : 'From the last few days. Tap the ones that belong to this.' })] }), _jsxs("div", { children: [_jsx("p", { className: s.label, children: "What kind of moment?" }), _jsx("div", { className: s.moods, children: KINDS.map((k) => (_jsx(Chip, { emoji: k.emoji, selected: kind === k.value, onClick: () => setKind(k.value), children: k.label }, k.value))) })] }), _jsxs("div", { children: [_jsx("p", { className: s.label, children: "How did it feel?" }), _jsx("div", { className: s.moods, children: MOODS.map((m) => (_jsx(Chip, { emoji: m.emoji, selected: mood === m.value, onClick: () => setMood((v) => (v === m.value ? null : m.value)), children: m.label }, m.value))) })] }), _jsx(Input, { label: "When", type: "date", value: date, onChange: (e) => setDate(e.target.value) }), _jsx(Input, { label: "Where", placeholder: "Optional", value: place, onChange: (e) => setPlace(e.target.value) }), _jsx(Textarea, { label: "One line, from both of you", placeholder: "Ended up dancing in the kitchen.", value: shared, onChange: (e) => setSharedNote(e.target.value), hint: "This is the line that shows on the timeline." }), _jsx(Textarea, { label: "And in your own words", placeholder: "What you want to remember about it.", value: mine, onChange: (e) => setMine(e.target.value), hint: "Your partner writes their own. Both are kept." })] }), _jsxs("div", { className: s.actions, children: [_jsx(Button, { variant: "accent", size: "lg", block: true, onClick: save, children: "Keep this memory" }), _jsx("button", { type: "button", className: s.skip, onClick: () => navigate(-1), children: "Not now" })] })] })] }));
}
