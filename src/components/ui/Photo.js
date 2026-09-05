import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { gradientFor } from '@/lib/photo';
import s from './Photo.module.css';
/**
 * Images fail — offline, blocked, or a dead placeholder host. A warm gradient
 * underneath means a card never renders as a grey hole.
 */
export function Photo({ src, alt = '', seed, className, style, ratio, rounded }) {
    const [loaded, setLoaded] = useState(false);
    const key = seed ?? src ?? alt ?? 'c777';
    return (_jsxs("div", { className: [s.wrap, className ?? ''].filter(Boolean).join(' '), style: { aspectRatio: ratio, borderRadius: rounded, ...style }, children: [_jsx("div", { className: s.fallback, style: { background: gradientFor(key) }, "aria-hidden": true }), src ? (_jsx("img", { src: src, alt: alt, loading: "lazy", decoding: "async", className: [s.img, loaded ? s.loaded : ''].join(' '), onLoad: () => setLoaded(true) })) : null] }));
}
