import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Screen, ScreenHeader, Section } from '@/components/layout/Screen';
import { ButtonLink } from '@/components/ui/Button';
import { Chip, ChipRow } from '@/components/ui/Chip';
import { FloatingAction } from '@/components/ui/FloatingAction';
import { PostCard } from '@/features/PostCard';
import { useStore } from '@/context/store';
import { TOPIC_EMOJI, TOPIC_LABEL, TOPICS } from '@/data/community';
import s from './Community.module.css';
/**
 * The forum, and the tab opens straight onto it.
 *
 * There is no landing page in front of this on purpose: a page explaining what
 * a community is, in front of the community, is one tap between someone and
 * the reason they came. The filters are here rather than on a screen of their
 * own for the same reason.
 */
export default function CommunityScreen() {
    const { state } = useStore();
    const [topic, setTopic] = useState(null);
    const posts = [...state.communityPosts]
        .filter((p) => !topic || p.topic === topic)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return (_jsxs(Screen, { children: [_jsx(ScreenHeader, { eyebrow: "Community", title: "Other couples, working it out", sub: "Ask anything, with your name on it or not." }), _jsx("div", { className: s.filters, children: _jsxs(ChipRow, { children: [_jsx(Chip, { selected: topic === null, onClick: () => setTopic(null), children: "Everything" }), TOPICS.map((t) => (_jsx(Chip, { emoji: TOPIC_EMOJI[t], selected: topic === t, onClick: () => setTopic(topic === t ? null : t), children: TOPIC_LABEL[t] }, t)))] }) }), _jsx(Section, { children: posts.length ? (_jsx("div", { className: s.feed, children: posts.map((p) => (_jsx(PostCard, { post: p }, p.id))) })) : (_jsxs("div", { className: s.empty, children: [_jsx("p", { className: s.emptyTitle, children: "Nothing here yet \uD83C\uDF31" }), _jsxs("p", { className: s.emptyBody, children: ["No ", topic ? TOPIC_LABEL[topic].toLowerCase() : 'posts', " so far. Start it off."] }), _jsx(ButtonLink, { to: "/community/new", variant: "accent", size: "sm", children: "Write a post" })] })) }), _jsx(FloatingAction, { to: "/community/new", label: "Write a post" })] }));
}
