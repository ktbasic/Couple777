import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/** A single hand-drawn icon set keeps the nav feeling like one product. */
const base = {
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.6,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
};
export function IconHome({ active }) {
    return (_jsx("svg", { viewBox: "0 0 24 24", width: "22", height: "22", "aria-hidden": true, children: _jsx("path", { ...base, fill: active ? 'currentColor' : 'none', fillOpacity: active ? 0.12 : 0, d: "M4 10.5 12 4l8 6.5V19a1 1 0 0 1-1 1h-4v-5.5h-6V20H5a1 1 0 0 1-1-1z" }) }));
}
export function IconExplore({ active }) {
    return (_jsxs("svg", { viewBox: "0 0 24 24", width: "22", height: "22", "aria-hidden": true, children: [_jsx("circle", { ...base, cx: "12", cy: "12", r: "8.2", fill: active ? 'currentColor' : 'none', fillOpacity: active ? 0.12 : 0 }), _jsx("path", { ...base, d: "m15 9-2 4.2-4 1.8 2-4.2z", fill: active ? 'currentColor' : 'none' })] }));
}
export function IconMemories({ active }) {
    return (_jsxs("svg", { viewBox: "0 0 24 24", width: "22", height: "22", "aria-hidden": true, children: [_jsx("rect", { ...base, x: "3.5", y: "5.5", width: "17", height: "13.5", rx: "2.4", fill: active ? 'currentColor' : 'none', fillOpacity: active ? 0.12 : 0 }), _jsx("path", { ...base, d: "M3.7 16l4.1-3.6 3.3 2.7 3.2-3.6 5.6 4.8" }), _jsx("circle", { ...base, cx: "9", cy: "9.6", r: "1.3" })] }));
}
export function IconTalk({ active }) {
    return (_jsx("svg", { viewBox: "0 0 24 24", width: "22", height: "22", "aria-hidden": true, children: _jsx("path", { ...base, fill: active ? 'currentColor' : 'none', fillOpacity: active ? 0.12 : 0, d: "M20 12.4c0 3.5-3.4 6.3-7.6 6.3-.9 0-1.8-.1-2.6-.4L5 20l1.2-3.1C4.9 15.7 4 14.2 4 12.4 4 8.9 7.6 6 11.9 6S20 8.9 20 12.4Z" }) }));
}
/* The speech bubble from Talk, with the three dots a forum thread implies. */
export function IconCommunity({ active }) {
    return (_jsxs("svg", { viewBox: "0 0 24 24", width: "22", height: "22", "aria-hidden": true, children: [_jsx("path", { ...base, fill: active ? 'currentColor' : 'none', fillOpacity: active ? 0.12 : 0, d: "M20 12.4c0 3.5-3.4 6.3-7.6 6.3-.9 0-1.8-.1-2.6-.4L5 20l1.2-3.1C4.9 15.7 4 14.2 4 12.4 4 8.9 7.6 6 11.9 6S20 8.9 20 12.4Z" }), _jsx("circle", { cx: "9", cy: "12.3", r: "1.05", fill: "currentColor" }), _jsx("circle", { cx: "12", cy: "12.3", r: "1.05", fill: "currentColor" }), _jsx("circle", { cx: "15", cy: "12.3", r: "1.05", fill: "currentColor" })] }));
}
/* Solid, because it sits on the raised gradient button rather than beside it. */
export function IconHomeSolid() {
    return (_jsx("svg", { viewBox: "0 0 24 24", width: "24", height: "24", "aria-hidden": true, children: _jsx("path", { d: "M4.2 10.6 12 4.3l7.8 6.3V19a1.2 1.2 0 0 1-1.2 1.2h-3.9v-5.6H9.3v5.6H5.4A1.2 1.2 0 0 1 4.2 19z", fill: "currentColor" }) }));
}
export function IconUs({ active }) {
    return (_jsxs("svg", { viewBox: "0 0 24 24", width: "22", height: "22", "aria-hidden": true, children: [_jsx("circle", { ...base, cx: "9.4", cy: "12", r: "5.3", fill: active ? 'currentColor' : 'none', fillOpacity: active ? 0.14 : 0 }), _jsx("circle", { ...base, cx: "14.6", cy: "12", r: "5.3" })] }));
}
