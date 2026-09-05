import { jsx as _jsx } from "react/jsx-runtime";
import { Link } from 'react-router-dom';
import s from './FloatingAction.module.css';
export function FloatingAction({ to, label, 
/** Screens without the tab bar sit lower. */
bare, }) {
    return (_jsx("div", { className: [s.host, bare ? s.hostBare : ''].filter(Boolean).join(' '), children: _jsx(Link, { to: to, className: s.button, "aria-label": label, title: label, children: _jsx("svg", { viewBox: "0 0 24 24", width: "22", height: "22", "aria-hidden": true, children: _jsx("path", { d: "M12 5v14M5 12h14", fill: "none", stroke: "currentColor", strokeWidth: "1.9", strokeLinecap: "round" }) }) }) }));
}
