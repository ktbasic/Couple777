import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useLayoutEffect, useRef, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useStore } from '@/context/store';
import { dailyStatus, unreadCount } from '@/lib/selectors';
import { IconCommunity, IconExplore, IconHomeSolid, IconMemories, IconUs, } from './icons';
import s from './TabBar.module.css';
const LEFT = [
    { to: '/explore', label: 'Explore', Icon: IconExplore },
    { to: '/memories', label: 'Memories', Icon: IconMemories },
];
const RIGHT = [
    { to: '/community', label: 'Community', Icon: IconCommunity },
    { to: '/us', label: 'Us', Icon: IconUs },
];
/* The pill, in numbers. The notch's centre sits above the pill's top edge, so
   the bar only dips around the button rather than swallowing it. */
const H = 68; // pill height
const RC = 34; // corner radius — fully rounded ends
const RN = 33; // notch radius: the button's 25 plus 8 of air
const RF = 12; // fillet radius, where the notch eases back into the flat edge
const CY = -6; // the notch centre, above the top edge
/**
 * The pill's outline, including the notch.
 *
 * A radial-gradient mask can only bite a circle out of the edge, which leaves
 * two corners where the arc meets the flat top. The reference eases in and out
 * instead, so the shape is drawn: a fillet tangent to both the flat edge and
 * the notch on each side, which is the difference between a hole and a notch.
 *
 * The two circles touch externally, so the distance between their centres is
 * RN + RF — that fixes where the fillet sits and where the arcs meet.
 */
function pillPath(w) {
    const cx = w / 2;
    const span = RN + RF;
    const dx = Math.sqrt(Math.max(0, span * span - (CY - RF) ** 2));
    // Where the fillet hands over to the notch, along the line joining centres.
    const tx = dx - (RF * dx) / span;
    const ty = RF + (RF * (CY - RF)) / span;
    return [
        `M ${RC} 0`,
        `H ${(cx - dx).toFixed(2)}`,
        `A ${RF} ${RF} 0 0 1 ${(cx - tx).toFixed(2)} ${ty.toFixed(2)}`,
        `A ${RN} ${RN} 0 0 0 ${(cx + tx).toFixed(2)} ${ty.toFixed(2)}`,
        `A ${RF} ${RF} 0 0 1 ${(cx + dx).toFixed(2)} 0`,
        `H ${w - RC}`,
        `A ${RC} ${RC} 0 0 1 ${w} ${RC}`,
        `V ${H - RC}`,
        `A ${RC} ${RC} 0 0 1 ${w - RC} ${H}`,
        `H ${RC}`,
        `A ${RC} ${RC} 0 0 1 0 ${H - RC}`,
        `V ${RC}`,
        `A ${RC} ${RC} 0 0 1 ${RC} 0`,
        'Z',
    ].join(' ');
}
/**
 * Five destinations with Home in the middle, raised out of the bar.
 *
 * Home is not one of five equal things — it is the screen the app is for, and
 * the other four are where you go when you want something specific. So it gets
 * the centre and the only piece of colour down here, and the bar dips around
 * it rather than making room for a fifth-of-the-width tab.
 */
export function TabBar() {
    const { state, me, partner } = useStore();
    const { pathname } = useLocation();
    const pillRef = useRef(null);
    const [w, setW] = useState(0);
    /* The shape is drawn at real pixel sizes, so it has to be measured rather
       than stretched — a scaled viewBox would flatten the corners and the notch
       by different amounts. */
    useLayoutEffect(() => {
        const el = pillRef.current;
        if (!el)
            return;
        setW(el.getBoundingClientRect().width);
        const ro = new ResizeObserver(([entry]) => setW(entry.contentRect.width));
        ro.observe(el);
        return () => ro.disconnect();
    }, []);
    /* The conversation lives under Us now, so its dot moved with it. */
    const daily = dailyStatus(state, me.id, partner.id);
    const usDot = !daily.answeredByMe || unreadCount(state, me.id) > 0;
    const tab = ({ to, label, Icon }, dot) => {
        const active = pathname.startsWith(to);
        return (_jsxs(NavLink, { to: to, className: [s.tab, active ? s.on : ''].filter(Boolean).join(' '), "aria-current": active ? 'page' : undefined, children: [_jsx("span", { className: s.icon, children: _jsx(Icon, { active: active }) }), _jsx("span", { className: s.label, children: label }), dot ? _jsx("span", { className: s.dot, "aria-label": "Something is waiting" }) : null] }, to));
    };
    const home = pathname === '/';
    return (_jsxs("nav", { className: s.bar, "aria-label": "Main", children: [_jsxs("div", { className: s.pill, ref: pillRef, children: [w > 0 ? (_jsx("svg", { className: s.plate, width: w, height: H, viewBox: `0 0 ${w} ${H}`, "aria-hidden": true, focusable: "false", children: _jsx("path", { d: pillPath(w), fill: "var(--c-surface)" }) })) : null, LEFT.map((t) => tab(t)), _jsx("div", { className: s.centre, children: _jsx("span", { className: [s.homeLabel, home ? s.homeLabelOn : ''].filter(Boolean).join(' '), children: "Home" }) }), RIGHT.map((t) => tab(t, t.to === '/us' && usDot))] }), _jsx(NavLink, { to: "/", className: [s.home, home ? s.homeOn : ''].filter(Boolean).join(' '), "aria-current": home ? 'page' : undefined, "aria-label": "Home", children: _jsx(IconHomeSolid, {}) })] }));
}
