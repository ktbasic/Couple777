import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link } from 'react-router-dom';
import { useStore } from '@/context/store';
import { TOPIC_EMOJI, TOPIC_LABEL } from '@/data/community';
import s from './PostCard.module.css';
/** "3h", "2d" — a forum needs the age of a thread, not its date. */
export function since(iso) {
    const mins = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
    if (mins < 60)
        return `${mins}m`;
    const hours = Math.round(mins / 60);
    if (hours < 24)
        return `${hours}h`;
    return `${Math.round(hours / 24)}d`;
}
const HEART = (_jsx("svg", { viewBox: "0 0 24 24", width: "15", height: "15", "aria-hidden": true, children: _jsx("path", { d: "M12 20.4C5.6 15.9 2.4 12.6 2.4 8.9 2.4 5.9 4.7 3.6 7.5 3.6c1.8 0 3.4.9 4.5 2.4 1.1-1.5 2.7-2.4 4.5-2.4 2.8 0 5.1 2.3 5.1 5.3 0 3.7-3.2 7-9.6 11.5Z", fill: "currentColor" }) }));
const REPLY = (_jsx("svg", { viewBox: "0 0 24 24", width: "15", height: "15", "aria-hidden": true, children: _jsx("path", { d: "M20 12.4c0 3.5-3.4 6.3-7.6 6.3-.9 0-1.8-.1-2.6-.4L5 20l1.2-3.1C4.9 15.7 4 14.2 4 12.4 4 8.9 7.6 6 11.9 6S20 8.9 20 12.4Z", fill: "none", stroke: "currentColor", strokeWidth: "1.7", strokeLinejoin: "round" }) }));
export function PostCard({ post, full }) {
    const { dispatch } = useStore();
    const body = full || post.body.length <= 220 ? post.body : `${post.body.slice(0, 220).trimEnd()}…`;
    return (_jsxs("article", { className: s.card, children: [_jsxs("div", { className: s.head, children: [_jsx("span", { className: s.avatar, "aria-hidden": true, children: post.anonymous ? '🫥' : post.author.charAt(0).toUpperCase() }), _jsxs("div", { className: s.who, children: [_jsxs("p", { className: s.name, children: [post.author, post.mine ? _jsx("span", { className: s.you, children: "you" }) : null] }), _jsxs("p", { className: s.meta, children: [TOPIC_EMOJI[post.topic], " ", TOPIC_LABEL[post.topic], " \u00B7 ", since(post.createdAt)] })] })] }), full ? (_jsx("p", { className: s.body, children: body })) : (_jsx(Link, { to: `/community/${post.id}`, className: s.bodyLink, children: _jsx("p", { className: s.body, children: body }) })), _jsxs("div", { className: s.foot, children: [_jsxs("button", { type: "button", className: [s.act, post.heartedByMe ? s.acted : ''].filter(Boolean).join(' '), onClick: () => dispatch({ type: 'toggleHeart', postId: post.id }), "aria-pressed": Boolean(post.heartedByMe), children: [HEART, post.hearts] }), full ? (_jsxs("span", { className: s.act, children: [REPLY, post.replies.length] })) : (_jsxs(Link, { to: `/community/${post.id}`, className: s.act, children: [REPLY, post.replies.length ? post.replies.length : 'Reply'] }))] })] }));
}
