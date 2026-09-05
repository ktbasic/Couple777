import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useId } from 'react';
import s from './Field.module.css';
function Wrapper({ label, hint, htmlFor, children, }) {
    return (_jsxs("div", { className: s.field, children: [_jsxs("div", { className: s.shell, children: [label ? (_jsx("label", { className: s.label, htmlFor: htmlFor, children: label })) : null, children] }), hint ? _jsx("p", { className: s.hint, children: hint }) : null] }));
}
export function Input({ label, hint, ...rest }) {
    const id = useId();
    return (_jsx(Wrapper, { label: label, hint: hint, htmlFor: id, children: _jsx("input", { id: id, className: s.control, ...rest }) }));
}
export function Textarea({ label, hint, showCount, ...rest }) {
    const id = useId();
    const len = typeof rest.value === 'string' ? rest.value.length : 0;
    return (_jsxs(Wrapper, { label: label, hint: hint, htmlFor: id, children: [_jsx("textarea", { id: id, className: `${s.control} ${s.textarea}`, ...rest }), showCount ? _jsx("span", { className: s.counter, children: len }) : null] }));
}
export function Select({ label, hint, children, ...rest }) {
    const id = useId();
    return (_jsx(Wrapper, { label: label, hint: hint, htmlFor: id, children: _jsx("select", { id: id, className: `${s.control} ${s.select}`, ...rest, children: children }) }));
}
