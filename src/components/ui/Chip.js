import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import s from './Chip.module.css';
export function Chip({ selected, onClick, emoji, children, }) {
    return (_jsxs("button", { type: "button", "aria-pressed": selected, onClick: onClick, className: [s.chip, selected ? s.on : ''].filter(Boolean).join(' '), children: [emoji ? _jsx("span", { className: s.emoji, children: emoji }) : null, children] }));
}
/** Horizontally scrolling row that bleeds to the screen edges. */
export function ChipRow({ children }) {
    return (_jsx("div", { className: `${s.row} no-scrollbar`, children: children }));
}
export function ChipWrap({ children }) {
    return _jsx("div", { className: s.wrapRow, children: children });
}
