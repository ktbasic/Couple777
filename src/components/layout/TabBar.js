import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { NavLink, useLocation } from 'react-router-dom';
import { useStore } from '@/context/store';
import { dailyStatus, unreadCount } from '@/lib/selectors';
import { IconCommunity, IconExplore, IconHomeSolid, IconMemories, IconUs, } from './icons';
import s from './TabBar.module.css';
/**
 * Five destinations with Home in the middle, raised out of the bar.
 *
 * Home is not one of five equal things — it is the screen the app is for, and
 * the other four are where you go when you want something specific. So it gets
 * the centre and the only piece of colour down here, and the bar splits around
 * it rather than making room for a sixth-of-the-width tab.
 */
const LEFT = [
    { to: '/explore', label: 'Explore', Icon: IconExplore },
    { to: '/memories', label: 'Memories', Icon: IconMemories },
];
const RIGHT = [
    { to: '/community', label: 'Community', Icon: IconCommunity },
    { to: '/us', label: 'Us', Icon: IconUs },
];
export function TabBar() {
    const { state, me, partner } = useStore();
    const { pathname } = useLocation();
    /* The conversation lives under Us now, so its dot moved with it. */
    const daily = dailyStatus(state, me.id, partner.id);
    const usDot = !daily.answeredByMe || unreadCount(state, me.id) > 0;
    const tab = ({ to, label, Icon }, dot) => {
        const active = pathname.startsWith(to);
        return (_jsxs(NavLink, { to: to, className: [s.tab, active ? s.on : ''].filter(Boolean).join(' '), "aria-current": active ? 'page' : undefined, children: [_jsx("span", { className: s.icon, children: _jsx(Icon, { active: active }) }), _jsx("span", { className: s.label, children: label }), active ? _jsx("span", { className: s.activeDot, "aria-hidden": true }) : null, dot ? _jsx("span", { className: s.dot, "aria-label": "Something is waiting" }) : null] }, to));
    };
    const home = pathname === '/';
    return (_jsxs("nav", { className: s.bar, "aria-label": "Main", children: [_jsxs("div", { className: s.pill, children: [LEFT.map((t) => tab(t)), _jsxs("div", { className: s.centre, children: [_jsx("span", { className: [s.homeLabel, home ? s.homeLabelOn : ''].filter(Boolean).join(' '), children: "Home" }), home ? _jsx("span", { className: s.activeDot, "aria-hidden": true }) : null] }), RIGHT.map((t) => tab(t, t.to === '/us' && usDot))] }), _jsx(NavLink, { to: "/", className: [s.home, home ? s.homeOn : ''].filter(Boolean).join(' '), "aria-current": home ? 'page' : undefined, "aria-label": "Home", children: _jsx(IconHomeSolid, {}) })] }));
}
