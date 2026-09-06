import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BackBar, Screen, Section } from '@/components/layout/Screen';
import { Button } from '@/components/ui/Button';
import { Chip, ChipRow } from '@/components/ui/Chip';
import { useToast } from '@/components/ui/Toast';
import { useStore } from '@/context/store';
import { TOPIC_EMOJI, TOPIC_LABEL, TOPICS } from '@/data/community';
import s from './PostCompose.module.css';
export default function PostComposeScreen() {
    const { me, dispatch } = useStore();
    const navigate = useNavigate();
    const toast = useToast();
    const [topic, setTopic] = useState('question');
    const [body, setBody] = useState('');
    const [anon, setAnon] = useState(false);
    const post = () => {
        const text = body.trim();
        if (!text)
            return;
        dispatch({
            type: 'addPost',
            post: {
                id: `cp-${Date.now().toString(36)}`,
                author: anon ? 'Anonymous' : me.name,
                anonymous: anon,
                mine: true,
                topic,
                body: text,
                createdAt: new Date().toISOString(),
                hearts: 0,
                replies: [],
            },
        });
        toast.show({ emoji: '✨', message: anon ? 'Posted anonymously' : 'Posted' });
        navigate('/community', { replace: true });
    };
    return (_jsxs(_Fragment, { children: [_jsx(BackBar, { title: "Back", fallbackTo: "/community" }), _jsxs(Screen, { children: [_jsxs(Section, { children: [_jsx("p", { className: s.label, children: "What is this?" }), _jsx(ChipRow, { children: TOPICS.map((t) => (_jsx(Chip, { emoji: TOPIC_EMOJI[t], selected: topic === t, onClick: () => setTopic(t), children: TOPIC_LABEL[t] }, t))) })] }), _jsx(Section, { children: _jsx("textarea", { className: s.area, autoFocus: true, value: body, onChange: (e) => setBody(e.target.value), placeholder: "However it comes out. Other couples have been here." }) }), _jsxs(Section, { children: [_jsx("p", { className: s.label, children: "Post as" }), _jsxs("div", { className: s.who, children: [_jsxs("button", { type: "button", className: [s.pick, !anon ? s.pickOn : ''].filter(Boolean).join(' '), "aria-pressed": !anon, onClick: () => setAnon(false), children: [_jsx("span", { className: s.pickTitle, children: me.name }), _jsx("span", { className: s.pickBody, children: "Your display name, as on your profile." })] }), _jsxs("button", { type: "button", className: [s.pick, anon ? s.pickOn : ''].filter(Boolean).join(' '), "aria-pressed": anon, onClick: () => setAnon(true), children: [_jsx("span", { className: s.pickTitle, children: "\uD83E\uDEE5 Anonymous" }), _jsx("span", { className: s.pickBody, children: "Nobody sees who wrote it, including replies." })] })] })] }), _jsx(Section, { children: _jsx(Button, { variant: "accent", size: "lg", block: true, disabled: !body.trim(), onClick: post, children: "Post" }) })] })] }));
}
