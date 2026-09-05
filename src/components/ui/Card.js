import { jsx as _jsx } from "react/jsx-runtime";
import { Link } from 'react-router-dom';
import s from './Card.module.css';
export function Card({ pad = true, flat, children, className, ...rest }) {
    return (_jsx("div", { className: [s.card, pad ? s.pad : '', flat ? s.flat : '', className ?? '']
            .filter(Boolean)
            .join(' '), ...rest, children: children }));
}
export function CardLink({ to, pad = true, flat, children, className, }) {
    return (_jsx(Link, { to: to, className: [s.card, s.tappable, pad ? s.pad : '', flat ? s.flat : '', className ?? '']
            .filter(Boolean)
            .join(' '), children: children }));
}
export function CardButton({ onClick, pad = true, flat, children, className, }) {
    return (_jsx("button", { type: "button", onClick: onClick, className: [s.card, s.tappable, pad ? s.pad : '', flat ? s.flat : '', className ?? '']
            .filter(Boolean)
            .join(' '), children: children }));
}
