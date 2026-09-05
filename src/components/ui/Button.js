import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link } from 'react-router-dom';
import s from './Button.module.css';
function classes({ variant = 'primary', size = 'md', block, glow, className }) {
    return [s.base, s[variant], s[size], block ? s.block : '', glow ? s.glow : '', className ?? '']
        .filter(Boolean)
        .join(' ');
}
export function Button({ variant, size, block, glow, icon, trailingIcon, children, className, ...rest }) {
    return (_jsxs("button", { type: "button", className: classes({ variant, size, block, glow, children, className }), ...rest, children: [icon ? _jsx("span", { className: s.icon, children: icon }) : null, children, trailingIcon ? _jsx("span", { className: s.icon, children: trailingIcon }) : null] }));
}
export function ButtonLink({ to, variant, size, block, glow, icon, trailingIcon, children, className, state, }) {
    return (_jsxs(Link, { to: to, state: state, className: classes({ variant, size, block, glow, children, className }), children: [icon ? _jsx("span", { className: s.icon, children: icon }) : null, children, trailingIcon ? _jsx("span", { className: s.icon, children: trailingIcon }) : null] }));
}
