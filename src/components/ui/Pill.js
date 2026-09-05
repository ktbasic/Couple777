import { jsx as _jsx } from "react/jsx-runtime";
import s from './Pill.module.css';
export function Pill({ tone = 'neutral', children }) {
    return _jsx("span", { className: [s.pill, s[tone] ?? ''].filter(Boolean).join(' '), children: children });
}
