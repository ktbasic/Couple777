import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef, useState } from 'react';
import { Logo777 } from '../components/ui/Logo777';
import s from './Splash.module.css';
/**
 * The opening moment. The mark assembles — 7, 77, 777, the two rings drawing
 * themselves around it, then the heart — and the wordmark settles underneath.
 *
 * Timings here are the *handoff* only; the choreography inside the mark lives
 * in Logo777.module.css. LEAVE_AT is when the splash starts lifting away and
 * the app underneath begins fading up, so the two overlap into one move rather
 * than cutting. It plays on every open, for everyone.
 */
const LEAVE_AT = 2380;
const HANDOFF = 460;
export function Splash({ onLeave, onDone }) {
    const [leaving, setLeaving] = useState(false);
    /*
     * These two timers are the splash's whole life, so they are set once and
     * read the callbacks through a ref. Depending on the callbacks themselves
     * would restart them on any re-render — and the parent re-renders the
     * instant onLeave fires, which pushed the handoff out by a second half of
     * the splash and left the frame lying invisibly over the app.
     */
    const latest = useRef({ onLeave, onDone });
    latest.current = { onLeave, onDone };
    useEffect(() => {
        const timers = [
            window.setTimeout(() => {
                setLeaving(true);
                latest.current.onLeave?.();
            }, LEAVE_AT),
            window.setTimeout(() => latest.current.onDone(), LEAVE_AT + HANDOFF),
        ];
        return () => timers.forEach(window.clearTimeout);
    }, []);
    return (_jsxs("div", { className: [s.frame, leaving ? s.leaving : ''].filter(Boolean).join(' '), "aria-hidden": leaving, children: [_jsx("div", { className: s.glow }), _jsxs("div", { className: s.inner, children: [_jsx(Logo777, { animated: true, className: s.mark }), _jsx("p", { className: s.wordmark, children: "Couple777" }), _jsx("p", { className: s.tag, children: "Make time for us." })] })] }));
}
/**
 * Open on every load, for every account — opening Couple777 starts with the
 * mark, whether it is a first sign-up or the thousandth morning.
 *
 * The state lives above the router, so this is once per *open*: navigating
 * between screens does not bring it back, and nothing is remembered between
 * one open and the next.
 */
export function useSplash() {
    const [open, setOpen] = useState(true);
    return [open, () => setOpen(false)];
}
