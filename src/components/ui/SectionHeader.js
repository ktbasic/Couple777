import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link } from 'react-router-dom';
import s from './SectionHeader.module.css';
export function SectionHeader({ title, sub, actionLabel, actionTo, onAction, }) {
    return (_jsxs("div", { className: s.wrap, children: [_jsxs("div", { className: s.titles, children: [_jsx("h2", { className: s.title, children: title }), sub ? _jsx("p", { className: s.sub, children: sub }) : null] }), actionLabel && actionTo ? (_jsx(Link, { className: s.action, to: actionTo, children: actionLabel })) : actionLabel && onAction ? (_jsx("button", { type: "button", className: s.action, onClick: onAction, children: actionLabel })) : null] }));
}
