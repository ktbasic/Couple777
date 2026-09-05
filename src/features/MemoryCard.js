import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link } from 'react-router-dom';
import { Photo } from '@/components/ui/Photo';
import { formatGutter } from '@/lib/dates';
import s from './MemoryCard.module.css';
/** The rhythm that produced it — the couple's story, not analytics. */
const KIND_LABEL = {
    day: '7 day',
    week: '7 week',
    month: '7 month',
    milestone: 'Milestone',
    moment: 'A moment',
};
export function MemoryCard({ memory }) {
    const shown = memory.photos.slice(0, 3);
    const extra = memory.photos.length - shown.length;
    return (_jsxs(Link, { to: `/memories/${memory.id}`, className: s.card, children: [shown.length ? (_jsx("div", { className: s.photos, "data-count": shown.length, children: shown.map((src, i) => (_jsxs("div", { className: s.photoWrap, children: [_jsx(Photo, { src: src, className: s.photo, seed: `${memory.id}-${i}`, ratio: shown.length === 1 ? '16 / 10' : shown.length === 2 ? '1 / 1' : undefined, alt: "" }), i === shown.length - 1 && extra > 0 ? (_jsxs("span", { className: s.more, children: ["+", extra] })) : null] }, src))) })) : null, _jsxs("div", { className: s.body, children: [_jsxs("h3", { className: s.title, children: [_jsx("span", { className: s.emoji, "aria-hidden": true, children: memory.emoji }), memory.title] }), _jsxs("p", { className: s.meta, children: [_jsx("span", { className: s.rhythm, "data-kind": memory.kind, children: KIND_LABEL[memory.kind] }), memory.place ? _jsx("span", { children: memory.place }) : null, memory.photos.length ? (_jsxs("span", { children: ["\u00B7 ", memory.photos.length, " photo", memory.photos.length === 1 ? '' : 's'] })) : null] }), memory.sharedNote ? _jsxs("p", { className: s.note, children: ["\u201C", memory.sharedNote, "\u201D"] }) : null] })] }));
}
/** The timeline variant, with the date gutter and the connecting thread. */
export function MemoryTimelineRow({ memory, last }) {
    const { month, day } = formatGutter(memory.date);
    return (_jsxs("div", { className: s.row, children: [_jsxs("div", { className: s.gutter, children: [_jsx("p", { className: s.month, children: month }), _jsx("p", { className: s.day, children: day }), _jsx("span", { className: s.node, "data-kind": memory.kind, "aria-hidden": true }), !last ? _jsx("span", { className: s.line, "aria-hidden": true }) : null] }), _jsx(MemoryCard, { memory: memory })] }));
}
