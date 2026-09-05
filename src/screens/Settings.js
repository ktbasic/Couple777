import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BackBar, Screen, ScreenHeader } from '@/components/layout/Screen';
import { Input } from '@/components/ui/Field';
import { Sheet } from '@/components/ui/Sheet';
import { Button } from '@/components/ui/Button';
import { useStore } from '@/context/store';
import { useAuth } from '@/context/auth';
import s from './Settings.module.css';
export default function SettingsScreen() {
    const { state, dispatch, partner, me, reset } = useStore();
    const { signOut, user } = useAuth();
    const navigate = useNavigate();
    const [confirmReset, setConfirmReset] = useState(false);
    return (_jsxs(_Fragment, { children: [_jsx(BackBar, { title: "Settings", fallbackTo: "/us" }), _jsxs(Screen, { children: [_jsx(ScreenHeader, { eyebrow: "Us", title: "Settings & privacy" }), _jsxs("section", { className: s.group, children: [_jsx("p", { className: s.groupLabel, children: "Daily connection" }), _jsx("div", { className: s.rows, children: _jsxs("button", { type: "button", className: s.row, onClick: () => dispatch({ type: 'setNotifications', enabled: !state.notificationsEnabled }), children: [_jsxs("div", { className: s.rowMain, children: [_jsx("p", { className: s.rowTitle, children: "One prompt a day" }), _jsx("p", { className: s.rowBody, children: "A single notification each evening. Never more than one \u2014 that is the whole design." })] }), _jsx("span", { className: [s.switch, state.notificationsEnabled ? s.switchOn : '']
                                                .filter(Boolean)
                                                .join(' '), "aria-hidden": true })] }) })] }), _jsxs("section", { className: s.group, children: [_jsx("p", { className: s.groupLabel, children: "Your couple" }), _jsxs("div", { className: s.rows, children: [_jsxs("div", { className: s.row, children: [_jsxs("div", { className: s.rowMain, children: [_jsxs("p", { className: s.rowTitle, children: ["Connected to ", partner.name] }), _jsx("p", { className: s.rowBody, children: "One space, two accounts. Nobody else can join." })] }), _jsx("span", { className: s.code, children: state.couple.inviteCode })] }), _jsx("div", { className: s.row, children: _jsx("div", { className: s.rowMain, children: _jsx(Input, { label: "Where you're based", value: state.couple.homeCity, readOnly: true, hint: "Used to suggest mini adventures you can actually reach." }) }) })] })] }), _jsxs("section", { className: s.group, children: [_jsx("p", { className: s.groupLabel, children: "What stays private" }), _jsx("div", { className: s.privacy, children: [
                                    { icon: '👥', strong: 'Shared', body: 'Plans, trips, memories, and finished conversations.' },
                                    { icon: '🔒', strong: 'Yours only', body: 'Private notes and private lines on a memory.' },
                                    { icon: '🤫', strong: 'Hidden', body: 'Surprise plans, and wishlist saves until they match.' },
                                    { icon: '⏳', strong: 'Sealed', body: 'Daily and Room answers, until you have both written one.' },
                                ].map((r) => (_jsxs("p", { className: s.privacyRow, children: [_jsx("span", { className: s.privacyIcon, "aria-hidden": true, children: r.icon }), _jsxs("span", { children: [_jsxs("span", { className: s.privacyStrong, children: [r.strong, "."] }), " ", r.body] })] }, r.strong))) })] }), _jsxs("section", { className: s.group, children: [_jsx("p", { className: s.groupLabel, children: "Your account" }), _jsx("div", { className: s.rows, children: _jsx("div", { className: s.row, children: _jsxs("div", { className: s.rowMain, children: [_jsx("p", { className: s.rowTitle, children: me.name }), _jsx("p", { className: s.rowBody, children: user?.email ? `Signed in as ${user.email}` : 'Signed in' })] }) }) })] }), _jsxs("div", { className: s.danger, children: [_jsx("button", { type: "button", className: s.dangerBtn, onClick: () => void signOut(), children: "Sign out" }), _jsx("p", { className: s.dangerNote, children: "Your account and everything in it stays where it is. Signing back in brings it all back." }), _jsx("button", { type: "button", className: s.dangerBtn, onClick: () => setConfirmReset(true), children: "Clear this device" }), _jsx("p", { className: s.dangerNote, children: "Only what this browser keeps \u2014 notes, saved ideas, the daily question. Your plans and memories live in your account." })] })] }), _jsxs(Sheet, { open: confirmReset, onClose: () => setConfirmReset(false), title: "Start over?", children: [_jsx("p", { className: s.rowBody, style: { marginBottom: 'var(--s-5)' }, children: "This clears what this browser is keeping \u2014 notes, saved ideas, daily answers. Your plans, memories and your shared space are in your account and are not touched." }), _jsx(Button, { variant: "accent", block: true, onClick: () => {
                            reset();
                            setConfirmReset(false);
                            navigate('/', { replace: true });
                        }, children: "Clear this device" })] })] }));
}
