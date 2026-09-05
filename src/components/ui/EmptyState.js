import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import s from './EmptyState.module.css';
export function EmptyState({ emoji, title, body, action, }) {
    return (_jsxs("div", { className: s.wrap, children: [_jsx("div", { className: s.emoji, "aria-hidden": true, children: emoji }), _jsx("p", { className: s.title, children: title }), body ? _jsx("p", { className: s.body, children: body }) : null, action ? _jsx("div", { className: s.action, children: action }) : null] }));
}
