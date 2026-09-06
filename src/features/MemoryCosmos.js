import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link } from 'react-router-dom';
import { ButtonLink } from '@/components/ui/Button';
import { Photo } from '@/components/ui/Photo';
import { formatStamp } from '@/lib/dates';
import s from './MemoryCosmos.module.css';
const PLUS = (_jsx("svg", { viewBox: "0 0 24 24", width: "17", height: "17", "aria-hidden": true, children: _jsx("path", { d: "M12 5.2v13.6M5.2 12h13.6", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round" }) }));
const CHEV = (_jsx("svg", { viewBox: "0 0 24 24", width: "18", height: "18", "aria-hidden": true, children: _jsx("path", { d: "M9 5l7 7-7 7", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }) }));
/**
 * The sky this section sits in.
 *
 * Drawn rather than assembled from divs so the orbits stay thin and true at
 * any width, and sliced rather than stretched so nothing turns into an oval
 * on a wide phone. Everything here is scenery: no aliens, nothing that moves
 * fast, and the whole layer is well under half the contrast of the type.
 */
function Sky() {
    return (_jsxs("svg", { className: s.sky, viewBox: "0 0 390 268", preserveAspectRatio: "xMidYMid slice", "aria-hidden": true, focusable: "false", children: [_jsxs("defs", { children: [_jsxs("radialGradient", { id: "mc-p1", cx: "0.34", cy: "0.3", r: "0.75", children: [_jsx("stop", { offset: "0%", stopColor: "#FBD3E0" }), _jsx("stop", { offset: "100%", stopColor: "#F3A9C4" })] }), _jsxs("radialGradient", { id: "mc-p2", cx: "0.34", cy: "0.3", r: "0.75", children: [_jsx("stop", { offset: "0%", stopColor: "#E2D6F6" }), _jsx("stop", { offset: "100%", stopColor: "#C3B0E8" })] }), _jsxs("radialGradient", { id: "mc-p3", cx: "0.34", cy: "0.3", r: "0.75", children: [_jsx("stop", { offset: "0%", stopColor: "#FBDCC6" }), _jsx("stop", { offset: "100%", stopColor: "#F5B99A" })] })] }), _jsx("ellipse", { cx: "195", cy: "124", rx: "188", ry: "66", transform: "rotate(-13 195 124)", fill: "none", stroke: "#F3CBDC", strokeWidth: "1", opacity: "0.7" }), _jsx("ellipse", { cx: "205", cy: "140", rx: "160", ry: "52", transform: "rotate(9 205 140)", fill: "none", stroke: "#E3D3F0", strokeWidth: "1", opacity: "0.6" }), _jsx("circle", { cx: "30", cy: "42", r: "26", fill: "url(#mc-p1)", opacity: "0.55" }), _jsx("circle", { cx: "366", cy: "196", r: "21", fill: "url(#mc-p1)", opacity: "0.4" }), _jsx("circle", { cx: "352", cy: "74", r: "9", fill: "url(#mc-p2)", opacity: "0.6" }), _jsx("circle", { cx: "18", cy: "206", r: "30", fill: "url(#mc-p2)", opacity: "0.32" }), _jsx("circle", { cx: "330", cy: "238", r: "7", fill: "url(#mc-p3)", opacity: "0.5" }), _jsx("circle", { cx: "74", cy: "248", r: "5", fill: "url(#mc-p1)", opacity: "0.45" }), _jsxs("g", { fill: "#F7D8A8", children: [_jsx("path", { d: "M92 66c.8 4.6 1.5 5.3 6.1 6.1-4.6.8-5.3 1.5-6.1 6.1-.8-4.6-1.5-5.3-6.1-6.1 4.6-.8 5.3-1.5 6.1-6.1Z", opacity: "0.85" }), _jsx("path", { d: "M316 108c.6 3.6 1.2 4.2 4.8 4.8-3.6.6-4.2 1.2-4.8 4.8-.6-3.6-1.2-4.2-4.8-4.8 3.6-.6 4.2-1.2 4.8-4.8Z", opacity: "0.7" })] }), _jsxs("g", { fill: "#F4C4D8", children: [_jsx("path", { d: "M56 158c.6 3.6 1.2 4.2 4.8 4.8-3.6.6-4.2 1.2-4.8 4.8-.6-3.6-1.2-4.2-4.8-4.8 3.6-.6 4.2-1.2 4.8-4.8Z", opacity: "0.8" }), _jsx("path", { d: "M348 152c.5 3 1 3.5 4 4-3 .5-3.5 1-4 4-.5-3-1-3.5-4-4 3-.5 3.5-1 4-4Z", opacity: "0.75" }), _jsx("path", { d: "M270 44c.5 3 1 3.5 4 4-3 .5-3.5 1-4 4-.5-3-1-3.5-4-4 3-.5 3.5-1 4-4Z", opacity: "0.6" })] })] }));
}
/**
 * The last thing on Home: either the most recent memory, or an invitation to
 * make the first one.
 *
 * Not a card. Everything above it on this screen is a panel with an edge, and
 * a fifth one at the bottom reads as a list that ran out rather than as an
 * ending — so this bleeds the full width and the page just becomes sky.
 */
export function MemoryCosmos({ memory }) {
    return (_jsxs("section", { className: s.wrap, children: [_jsx(Sky, {}), memory ? (_jsxs("div", { className: s.row, children: [_jsx(Link, { to: `/memories/${memory.id}`, className: s.shot, "aria-hidden": true, tabIndex: -1, children: _jsx(Photo, { src: memory.photos[0], seed: memory.id, className: s.photo, ratio: "1 / 1", alt: "" }) }), _jsxs("div", { className: s.main, children: [_jsx("p", { className: s.stamp, children: formatStamp(memory.date) }), _jsx("p", { className: s.title, children: memory.title }), memory.sharedNote ? _jsx("p", { className: s.note, children: memory.sharedNote }) : null] }), _jsx(Link, { to: `/memories/${memory.id}`, className: s.open, "aria-label": `Open ${memory.title}`, children: CHEV })] })) : (_jsxs("div", { className: s.empty, children: [_jsx("p", { className: s.emptyTitle, children: "Your story starts here \uD83D\uDC97" }), _jsx("p", { className: s.emptyBody, children: "Save a photo, note, or anything you want to remember." }), _jsx(ButtonLink, { to: "/memories/new", variant: "accent", icon: PLUS, children: "Capture a moment" })] }))] }));
}
