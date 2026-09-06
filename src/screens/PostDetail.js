import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { BackBar, Screen, Section } from '@/components/layout/Screen';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { PostCard, since } from '@/features/PostCard';
import { useStore } from '@/context/store';
import s from './PostDetail.module.css';
export default function PostDetailScreen() {
    const { postId } = useParams();
    const { state, me, dispatch } = useStore();
    const toast = useToast();
    const [draft, setDraft] = useState('');
    const [anon, setAnon] = useState(false);
    const post = state.communityPosts.find((p) => p.id === postId);
    if (!post)
        return _jsx(Navigate, { to: "/community", replace: true });
    const send = () => {
        const body = draft.trim();
        if (!body)
            return;
        dispatch({
            type: 'addReply',
            postId: post.id,
            reply: {
                id: `cr-${Date.now().toString(36)}`,
                author: anon ? 'Anonymous' : me.name,
                anonymous: anon,
                mine: true,
                body,
                createdAt: new Date().toISOString(),
            },
        });
        setDraft('');
        toast.show({ emoji: '💬', message: 'Replied' });
    };
    return (_jsxs(_Fragment, { children: [_jsx(BackBar, { title: "Back", fallbackTo: "/community" }), _jsxs(Screen, { children: [_jsx(PostCard, { post: post, full: true }), _jsx(Section, { children: post.replies.length ? (_jsx("div", { className: s.replies, children: post.replies.map((r) => (_jsxs("div", { className: s.reply, children: [_jsxs("div", { className: s.replyHead, children: [_jsxs("span", { className: s.replyName, children: [r.author, r.mine ? _jsx("span", { className: s.you, children: "you" }) : null] }), _jsx("span", { className: s.replyAge, children: since(r.createdAt) })] }), _jsx("p", { className: s.replyBody, children: r.body })] }, r.id))) })) : (_jsx("p", { className: s.none, children: "No replies yet. Yours would be the first." })) }), _jsxs(Section, { children: [_jsx("textarea", { className: s.area, value: draft, onChange: (e) => setDraft(e.target.value), placeholder: "Say something useful, or something kind.", rows: 3 }), _jsxs("div", { className: s.send, children: [_jsx("button", { type: "button", className: [s.anon, anon ? s.anonOn : ''].filter(Boolean).join(' '), "aria-pressed": anon, onClick: () => setAnon((a) => !a), children: "\uD83E\uDEE5 Anonymously" }), _jsx(Button, { variant: "accent", size: "sm", disabled: !draft.trim(), onClick: send, children: "Reply" })] })] })] })] }));
}
