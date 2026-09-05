import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { TabBar } from './TabBar';
import s from './AppShell.module.css';
/**
 * A phone-shaped frame on desktop, edge-to-edge on mobile. The scroll
 * container lives here so the tab bar stays pinned.
 */
export function AppShell({ tabs = true }) {
    const { pathname } = useLocation();
    const main = useRef(null);
    // Every route change starts at the top, the way a native push does.
    useEffect(() => {
        main.current?.scrollTo({ top: 0 });
    }, [pathname]);
    return (_jsx("div", { className: s.frame, children: _jsxs("div", { className: s.app, children: [_jsx("main", { className: s.main, ref: main, children: _jsx(Outlet, {}) }), tabs ? _jsx(TabBar, {}) : null] }) }));
}
