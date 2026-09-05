import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/context/store';
import { byPriority, notifications } from '@/lib/selectors';
import s from './NotificationBell.module.css';
const REMOTE_EMOJI = {
    plan_invite: '💌',
    invite_accepted: '❤️',
    invite_declined: '🤍',
    invite_suggested: '🕐',
    partner_joined: '🎉',
    cycle_reminder: '⏳',
    memory_reminder: '📸',
};
/**
 * The relationship inbox.
 *
 * Two sources, on purpose. Most items are still *derived* from state — a
 * derived item is always a view of something that is true right now, and can
 * never outlive what it was announcing. The rows from Supabase are the ones
 * that cannot be derived, because they are about something the other person
 * did on their own phone: they invited you, or they said yes.
 */
export function NotificationBell() {
    const { state, dispatch, me, partner, space } = useStore();
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);
    const derived = notifications(state, me.id, partner.id);
    const remote = (space?.notifications ?? []).map((n) => ({
        id: n.id,
        kind: 'from-partner',
        emoji: REMOTE_EMOJI[n.kind] ?? '💌',
        title: n.title,
        body: n.body ?? '',
        to: n.plan_id ? `/plan/${n.plan_id}` : '/',
        at: new Date(n.created_at).getTime(),
        read: Boolean(n.read_at) || state.readNotificationIds.includes(n.id),
    }));
    const relationship = [...remote, ...derived].sort(byPriority);
    /*
     * The one item that is about the app rather than about the two of you, so it
     * waits until nothing about the two of you is waiting. Anything else in the
     * list outranks it — being asked to finish your profile over the top of your
     * partner asking you out is how an app makes itself the point.
     */
    const nudge = relationship.length === 0 && !me.age
        ? [
            {
                id: 'profile-age',
                kind: 'profile',
                emoji: '\u2728',
                title: 'Help Couple777 get to know you',
                body: 'Add your age to improve your profile and recommendations.',
                to: '/us?edit=me',
                cta: 'Complete profile',
                at: Date.now(),
                read: state.readNotificationIds.includes('profile-age'),
            },
        ]
        : [];
    const items = [...relationship, ...nudge];
    const unread = items.filter((n) => !n.read);
    const openItem = (id, to) => {
        dispatch({ type: 'markNotificationsRead', ids: [id] });
        setOpen(false);
        navigate(to);
    };
    return (_jsxs("div", { className: s.wrap, children: [_jsxs("button", { type: "button", className: s.bell, "aria-label": unread.length ? `${unread.length} new notifications` : 'Notifications', "aria-expanded": open, onClick: () => setOpen((o) => !o), children: [_jsx("svg", { viewBox: "0 0 24 24", width: "19", height: "19", "aria-hidden": true, children: _jsx("path", { d: "M18 15.5V11a6 6 0 1 0-12 0v4.5L4.5 18h15zM10 20.5a2.2 2.2 0 0 0 4 0", fill: "none", stroke: "currentColor", strokeWidth: "1.6", strokeLinecap: "round", strokeLinejoin: "round" }) }), unread.length ? _jsx("span", { className: s.count, children: unread.length }) : null] }), open ? (_jsxs(_Fragment, { children: [_jsx("div", { className: s.scrim, onClick: () => setOpen(false), "aria-hidden": true }), _jsxs("div", { className: s.panel, role: "dialog", "aria-label": "Notifications", children: [_jsxs("div", { className: s.head, children: [_jsx("span", { className: s.headTitle, children: "What's waiting" }), unread.length ? (_jsx("button", { type: "button", className: s.markAll, onClick: () => dispatch({ type: 'markNotificationsRead', ids: unread.map((n) => n.id) }), children: "Mark all read" })) : null] }), items.length ? (items.map((n) => (_jsxs("button", { type: "button", className: [s.item, n.read ? '' : s.unread].filter(Boolean).join(' '), onClick: () => openItem(n.id, n.to), children: [_jsx("span", { className: s.itemEmoji, "aria-hidden": true, children: n.emoji }), _jsxs("span", { className: s.itemMain, children: [_jsx("span", { className: s.itemTitle, children: n.title }), _jsx("span", { className: s.itemBody, children: n.body }), n.cta ? _jsx("span", { className: s.itemCta, children: n.cta }) : null] }), !n.read ? _jsx("span", { className: s.dot, "aria-hidden": true }) : null] }, n.id)))) : (_jsxs("p", { className: s.empty, children: ["Nothing needs you right now.", _jsx("br", {}), "That's allowed."] }))] })] })) : null] }));
}
