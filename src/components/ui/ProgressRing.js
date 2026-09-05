import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import s from './ProgressRing.module.css';
export function ProgressRing({ progress, size = 46, stroke = 3, children, className, }) {
    const r = (size - stroke) / 2;
    const c = 2 * Math.PI * r;
    const clamped = Math.min(1, Math.max(0, progress));
    return (_jsxs("span", { className: [s.wrap, className ?? ''].filter(Boolean).join(' '), style: { width: size, height: size }, children: [_jsxs("svg", { className: s.svg, width: size, height: size, "aria-hidden": true, children: [_jsx("circle", { className: s.track, cx: size / 2, cy: size / 2, r: r, fill: "none", strokeWidth: stroke }), _jsx("circle", { className: s.value, cx: size / 2, cy: size / 2, r: r, fill: "none", strokeWidth: stroke, strokeDasharray: c, strokeDashoffset: c * (1 - clamped) })] }), children ? _jsx("span", { className: s.center, children: children }) : null] }));
}
