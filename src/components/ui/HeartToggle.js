import { jsx as _jsx } from "react/jsx-runtime";
import s from './HeartToggle.module.css';
/**
 * A drawn heart rather than an emoji: 🤍 on a white chip is close to
 * invisible, and the two emoji hearts differ in weight as well as colour.
 */
export function HeartToggle({ saved, onToggle, label, }) {
    return (_jsx("button", { type: "button", "aria-pressed": saved, "aria-label": label, onClick: onToggle, className: [s.button, saved ? s.on : ''].filter(Boolean).join(' '), children: _jsx("svg", { viewBox: "0 0 24 24", width: "19", height: "19", "aria-hidden": true, children: _jsx("path", { d: "M12 20.3s-7.4-4.6-7.4-9.7A4.2 4.2 0 0 1 12 7.6a4.2 4.2 0 0 1 7.4 3c0 5.1-7.4 9.7-7.4 9.7Z", fill: saved ? 'currentColor' : 'none', stroke: "currentColor", strokeWidth: "1.7", strokeLinejoin: "round" }) }) }));
}
