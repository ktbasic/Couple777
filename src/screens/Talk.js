import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link } from 'react-router-dom';
import { Screen, ScreenHeader, Section } from '@/components/layout/Screen';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { DailyCard } from '@/features/DailyCard';
import { useStore } from '@/context/store';
import { dailyStatus, unreadCount } from '@/lib/selectors';
import { ROOM_TOPICS } from '@/data/roomTopics';
import s from './Talk.module.css';
const CHEV = (_jsx("svg", { viewBox: "0 0 24 24", width: "16", height: "16", "aria-hidden": true, children: _jsx("path", { d: "M9 5l7 7-7 7", fill: "none", stroke: "currentColor", strokeWidth: "1.8", strokeLinecap: "round", strokeLinejoin: "round" }) }));
export default function TalkScreen() {
    const { state, me, partner } = useStore();
    const daily = dailyStatus(state, me.id, partner.id);
    const unread = unreadCount(state, me.id);
    const finished = state.roomSessions.filter((r) => r.completedAt);
    return (_jsxs(Screen, { children: [_jsx(ScreenHeader, { eyebrow: "Talk", title: "The conversations worth having", sub: "Small ones every day, bigger ones when you have the evening for it." }), _jsx(DailyCard, {}), _jsxs(Section, { children: [_jsx(SectionHeader, { title: "Go deeper" }), _jsxs("div", { className: s.rows, children: [_jsxs(Link, { to: "/talk/room", className: s.row, children: [_jsx("span", { className: s.rowEmoji, "aria-hidden": true, children: "\uD83E\uDE9E" }), _jsxs("div", { className: s.rowMain, children: [_jsx("p", { className: s.rowTitle, children: "Relationship Room" }), _jsxs("p", { className: s.rowBody, children: [ROOM_TOPICS.length, " guided conversations. Answer privately, reveal together, agree on one small thing."] })] }), _jsx("span", { className: s.rowMeta, children: CHEV })] }), _jsxs(Link, { to: "/talk/notes", className: s.row, children: [_jsx("span", { className: s.rowEmoji, "aria-hidden": true, children: "\uD83D\uDC8C" }), _jsxs("div", { className: s.rowMain, children: [_jsxs("p", { className: s.rowTitle, children: ["Notes to ", partner.name] }), _jsx("p", { className: s.rowBody, children: "For the things that are easier written than said. Send now, or set them to arrive later." })] }), _jsxs("span", { className: s.rowMeta, children: [unread ? _jsx("span", { className: s.badge, children: unread }) : null, CHEV] })] }), _jsxs(Link, { to: "/talk/daily", className: s.row, children: [_jsx("span", { className: s.rowEmoji, "aria-hidden": true, children: "\uD83C\uDF3F" }), _jsxs("div", { className: s.rowMain, children: [_jsx("p", { className: s.rowTitle, children: "Today's check-in" }), _jsx("p", { className: s.rowBody, children: daily.bothAnswered
                                                    ? "You've both answered today."
                                                    : daily.answeredByMe
                                                        ? `Waiting on ${partner.name}.`
                                                        : 'One question, whenever you have a minute.' })] }), _jsx("span", { className: s.rowMeta, children: CHEV })] })] })] }), finished.length ? (_jsxs(Section, { children: [_jsx(SectionHeader, { title: "What you agreed", sub: "From your last conversations." }), _jsx("div", { className: s.recent, children: finished.slice(0, 4).map((session) => {
                            const topic = ROOM_TOPICS.find((t) => t.id === session.topicId);
                            return (_jsxs("div", { className: s.session, children: [_jsx("span", { "aria-hidden": true, children: topic?.emoji ?? '💬' }), _jsxs("div", { className: s.sessionMain, children: [_jsx("p", { className: s.sessionTitle, children: topic?.label ?? 'Conversation' }), session.commitment ? (_jsxs("p", { className: s.sessionCommit, children: ["\u201C", session.commitment, "\u201D"] })) : null] })] }, session.id));
                        }) })] })) : null, _jsx("p", { className: s.disclaimer, children: "Couple777 helps you start conversations. It is not therapy, and it does not pretend to be \u2014 if something needs more than an evening, a professional is worth the call." })] }));
}
