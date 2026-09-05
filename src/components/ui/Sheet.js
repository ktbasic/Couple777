import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import s from './Sheet.module.css';
export function Sheet({ open, onClose, title, children, }) {
    useEffect(() => {
        if (!open)
            return;
        const onKey = (e) => {
            if (e.key === 'Escape')
                onClose();
        };
        document.addEventListener('keydown', onKey);
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.removeEventListener('keydown', onKey);
            document.body.style.overflow = prev;
        };
    }, [open, onClose]);
    if (!open)
        return null;
    return createPortal(_jsxs(_Fragment, { children: [_jsx("div", { className: s.scrim, onClick: onClose, "aria-hidden": true }), _jsxs("div", { className: s.sheet, role: "dialog", "aria-modal": "true", "aria-label": title, children: [_jsx("div", { className: s.grip, "aria-hidden": true }), _jsxs("div", { className: s.head, children: [_jsx("h2", { className: s.title, children: title }), _jsx("button", { type: "button", className: s.close, onClick: onClose, "aria-label": "Close", children: "\u2715" })] }), _jsx("div", { className: s.body, children: children })] })] }), document.body);
}
