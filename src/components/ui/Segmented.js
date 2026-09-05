import { jsx as _jsx } from "react/jsx-runtime";
import s from './Segmented.module.css';
export function Segmented({ value, options, onChange, }) {
    return (_jsx("div", { className: s.wrap, role: "tablist", children: options.map((o) => (_jsx("button", { type: "button", role: "tab", "aria-selected": o.value === value, className: [s.item, o.value === value ? s.on : ''].filter(Boolean).join(' '), onClick: () => onChange(o.value), children: o.label }, o.value))) }));
}
