import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Screen, Section } from '@/components/layout/Screen';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { useToast } from '@/components/ui/Toast';
import { AvatarPicker } from '@/features/AvatarPicker';
import { useStore } from '@/context/store';
import { matches, memoryYear, milestones, relationshipStats, ritualViews, } from '@/lib/selectors';
import { TIER_META, countdownLabel, durationTogether, formatMonthYear, today } from '@/lib/dates';
import s from './Us.module.css';
const CHEV = (_jsx("svg", { viewBox: "0 0 24 24", width: "16", height: "16", "aria-hidden": true, children: _jsx("path", { d: "M9 5l7 7-7 7", fill: "none", stroke: "currentColor", strokeWidth: "1.8", strokeLinecap: "round", strokeLinejoin: "round" }) }));
export default function UsScreen() {
    const { state, dispatch, me, partner } = useStore();
    const navigate = useNavigate();
    const toast = useToast();
    const [editingId, setEditingId] = useState(null);
    const [params, setParams] = useSearchParams();
    /* ?edit=me opens your own profile straight away, so the nudge in the bell
       lands on the thing it is asking for rather than near it. */
    useEffect(() => {
        if (params.get('edit') !== 'me')
            return;
        setEditingId(me.id);
        const next = new URLSearchParams(params);
        next.delete('edit');
        setParams(next, { replace: true });
    }, [params, setParams, me.id]);
    const editing = state.couple.people.find((p) => p.id === editingId) ?? null;
    const stats = relationshipStats(state);
    const rituals = ritualViews(state);
    const matched = matches(state);
    const marks = milestones(state);
    const year = memoryYear(state);
    const peak = Math.max(1, ...year.map((m) => m.count));
    const now = today();
    return (_jsxs(Screen, { children: [_jsxs("header", { className: s.hero, children: [_jsx("div", { className: s.pair, children: [me, partner].map((p, i) => (_jsxs("span", { style: { display: 'contents' }, children: [i === 1 ? (_jsx("span", { className: s.heart, "aria-hidden": true, children: "\u2764\uFE0F" })) : null, _jsxs("button", { type: "button", className: s.avatarButton, onClick: () => setEditingId(p.id), "aria-label": `Change ${p.name}'s avatar`, children: [_jsx(Avatar, { person: p, size: 76 }), _jsx("span", { className: s.edit, "aria-hidden": true, children: "\u270E" })] })] }, p.id))) }), _jsxs("h1", { className: s.names, children: [me.name, " & ", partner.name] }), _jsxs("p", { className: s.together, children: ["Together for ", durationTogether(state.couple.togetherSince, now)] }), !state.couple.partnerJoined ? (_jsxs("div", { className: s.inviteStrip, children: [_jsx("span", { "aria-hidden": true, children: "\uD83D\uDC8C" }), _jsxs("p", { className: s.inviteText, children: [partner.name, " hasn't joined yet. Until they do, this space is just yours."] }), _jsx(Button, { size: "sm", variant: "accent", onClick: () => {
                                    toast.show({ emoji: '🔗', message: 'Invite link copied' });
                                    window.setTimeout(() => {
                                        dispatch({ type: 'setPartnerJoined', joined: true });
                                        toast.show({ emoji: '🎉', message: `${partner.name} joined` });
                                    }, 1400);
                                }, children: "Invite" })] })) : null] }), _jsxs(Section, { children: [_jsx(SectionHeader, { title: "Look what you've made together" }), _jsxs("div", { className: s.summary, children: [_jsx("p", { className: s.summaryNumber, children: stats.total }), _jsx("p", { className: s.summaryLabel, children: "moments intentionally made" }), _jsxs("div", { className: s.breakdown, children: [_jsxs("button", { type: "button", className: s.chip, onClick: () => navigate('/memories?kind=day'), children: [_jsx("span", { className: s.chipCount, children: stats.dates }), " dates"] }), _jsxs("button", { type: "button", className: s.chip, onClick: () => navigate('/memories?kind=week'), children: [_jsx("span", { className: s.chipCount, children: stats.mini }), " mini adventures"] }), _jsxs("button", { type: "button", className: s.chip, onClick: () => navigate('/memories?kind=month'), children: [_jsx("span", { className: s.chipCount, children: stats.big }), " big adventures"] })] })] })] }), _jsxs(Section, { children: [_jsx(SectionHeader, { title: "Your year", sub: "Tap a month to see what happened." }), _jsx("div", { className: `${s.year} no-scrollbar`, children: year.map((m) => (_jsxs("button", { type: "button", className: s.month, "aria-label": `${formatMonthYear(`${m.key}-01`)}: ${m.count} memories`, onClick: () => navigate(`/memories?month=${m.key}`), children: [_jsx("span", { className: [s.bar, m.count ? s.barOn : ''].filter(Boolean).join(' '), style: { height: `${14 + (m.count / peak) * 52}px` } }), _jsx("span", { className: s.monthLabel, children: formatMonthYear(`${m.key}-01`).slice(0, 3) })] }, m.key))) }), _jsxs("p", { className: s.yearHint, children: [stats.memories, " memories kept \u00B7 ", stats.photos, " photos"] })] }), _jsxs(Section, { children: [_jsx(SectionHeader, { title: "Worth marking", sub: "Things that actually happened." }), _jsx("div", { className: s.milestones, children: marks.map((m) => (_jsxs("button", { type: "button", className: [s.milestone, m.done ? s.milestoneDone : ''].filter(Boolean).join(' '), onClick: () => m.to && navigate(m.to), children: [_jsx("span", { className: s.milestoneIcon, "aria-hidden": true, children: m.emoji }), _jsxs("span", { className: s.milestoneMain, children: [_jsx("span", { className: s.milestoneLabel, children: m.label }), _jsx("span", { className: s.milestoneProgress, children: m.progress })] }), m.done ? (_jsx("span", { className: s.check, "aria-label": "Reached", children: "\u2713" })) : (CHEV)] }, m.id))) })] }), _jsxs(Section, { children: [_jsx(SectionHeader, { title: "Your rhythm", sub: "Where each of the three stands right now." }), _jsx("div", { className: s.rhythm, children: rituals.map((r) => (_jsxs("button", { type: "button", className: s.rhythmRow, "data-tier": r.cycle.tier, onClick: () => navigate(r.plan ? `/plan/${r.plan.id}` : `/plan/new?cycle=${r.cycle.id}`), children: [_jsx(ProgressRing, { progress: r.progress, size: 38, stroke: 3 }), _jsxs("span", { className: s.rhythmMain, children: [_jsx("span", { className: s.rhythmTitle, children: TIER_META[r.cycle.tier].plural }), _jsx("span", { className: s.rhythmBody, children: r.plan
                                                ? `Next one ${countdownLabel(now, r.cycle.dueDate).toLowerCase()}`
                                                : r.overdue
                                                    ? 'Open — nothing planned'
                                                    : `Due in ${countdownLabel(now, r.cycle.dueDate).toLowerCase()}` })] }), CHEV] }, r.cycle.id))) })] }), _jsxs(Section, { children: [_jsx(SectionHeader, { title: "The two of you" }), _jsxs("div", { className: s.rows, children: [_jsxs(Link, { to: "/explore?tier=month", className: s.row, children: [_jsx("span", { className: s.rowEmoji, "aria-hidden": true, children: "\u2726" }), "Our matches", _jsx("span", { className: s.rowValue, children: matched.length ? matched.map((m) => m.name).join(', ') : 'None yet' }), CHEV] }), _jsxs(Link, { to: "/talk/notes", className: s.row, children: [_jsx("span", { className: s.rowEmoji, "aria-hidden": true, children: "\uD83D\uDC8C" }), "Notes", _jsx("span", { className: s.rowValue, children: state.notes.length }), CHEV] }), _jsxs(Link, { to: "/memories", className: s.row, children: [_jsx("span", { className: s.rowEmoji, "aria-hidden": true, children: "\uD83D\uDCF7" }), "Memory timeline", _jsx("span", { className: s.rowValue, children: stats.memories }), CHEV] }), _jsxs(Link, { to: "/us/settings", className: s.row, children: [_jsx("span", { className: s.rowEmoji, "aria-hidden": true, children: "\u2699\uFE0F" }), "Settings & privacy", CHEV] })] })] }), editing ? (_jsx(AvatarPicker, { person: editing, open: true, onClose: () => setEditingId(null) })) : null] }));
}
