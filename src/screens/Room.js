import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { Link } from 'react-router-dom';
import { BackBar, Screen, ScreenHeader } from '@/components/layout/Screen';
import { ROOM_TOPICS } from '@/data/roomTopics';
import s from './Room.module.css';
const DEPTH_LABEL = {
    gentle: 'Gentle',
    open: 'Open',
    deep: 'Goes deep',
};
export default function RoomScreen() {
    return (_jsxs(_Fragment, { children: [_jsx(BackBar, { title: "Relationship Room", fallbackTo: "/talk" }), _jsxs(Screen, { children: [_jsx(ScreenHeader, { eyebrow: "Talk together", title: "Pick something to talk about", sub: "Twelve conversations most couples mean to have and never quite start." }), _jsxs("div", { className: s.intro, children: [_jsx("p", { className: s.introTitle, children: "How it works" }), _jsx("div", { className: s.steps, children: [
                                    'You each answer privately, on your own phone.',
                                    'Both answers unlock at once. Nobody reads first.',
                                    'You respond to what you actually read, not what you assumed.',
                                    'You finish with one small thing you both agree to try.',
                                ].map((step, i) => (_jsxs("p", { className: s.step, children: [_jsx("span", { className: s.stepNum, children: i + 1 }), _jsx("span", { children: step })] }, step))) })] }), _jsx("div", { className: s.grid, children: ROOM_TOPICS.map((topic, i) => (_jsxs(Link, { to: `/talk/room/${topic.id}`, className: s.topic, style: { animationDelay: `${i * 45}ms` }, children: [_jsx("span", { className: s.topicEmoji, "aria-hidden": true, children: topic.emoji }), _jsxs("div", { className: s.topicMain, children: [_jsx("p", { className: s.topicTitle, children: topic.label }), _jsx("p", { className: s.topicBlurb, children: topic.blurb }), _jsxs("div", { className: s.topicMeta, children: [_jsxs("span", { className: s.tag, children: ["~", topic.minutes, " min"] }), _jsx("span", { className: s.tag, "data-depth": topic.depth, children: DEPTH_LABEL[topic.depth] })] })] })] }, topic.id))) })] })] }));
}
