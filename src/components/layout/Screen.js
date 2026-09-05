import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useNavigate } from 'react-router-dom';
import s from './Screen.module.css';
export function Screen({ children, bleed, className, }) {
    return (_jsx("div", { className: [s.screen, bleed ? s.bleed : '', className ?? ''].filter(Boolean).join(' '), children: children }));
}
export function ScreenHeader({ eyebrow, title, sub, }) {
    return (_jsxs("header", { className: s.header, children: [eyebrow ? _jsx("p", { className: s.eyebrow, children: eyebrow }) : null, _jsx("h1", { className: s.title, children: title }), sub ? _jsx("p", { className: s.sub, children: sub }) : null] }));
}
/** Sticky back bar for pushed detail screens. */
export function BackBar({ title, actionLabel, onAction, fallbackTo = '/', bleed, }) {
    const navigate = useNavigate();
    const goBack = () => {
        // A deep link opened directly has no history to pop.
        if (window.history.length > 1)
            navigate(-1);
        else
            navigate(fallbackTo);
    };
    return (_jsxs("div", { className: [s.bar, bleed ? s.barBleed : ''].filter(Boolean).join(' '), children: [_jsx("button", { type: "button", className: s.back, onClick: goBack, "aria-label": "Back", children: _jsx("svg", { viewBox: "0 0 24 24", width: "17", height: "17", "aria-hidden": true, children: _jsx("path", { d: "M15 5l-7 7 7 7", fill: "none", stroke: "currentColor", strokeWidth: "1.9", strokeLinecap: "round", strokeLinejoin: "round" }) }) }), title ? _jsx("span", { className: s.barTitle, children: title }) : null, actionLabel && onAction ? (_jsx("button", { type: "button", className: s.barAction, onClick: onAction, children: actionLabel })) : null] }));
}
export function Section({ children, className }) {
    return _jsx("section", { className: [s.section, className ?? ''].filter(Boolean).join(' '), children: children });
}
