import { jsxs as _jsxs, jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
import { Link } from 'react-router-dom';
import { Screen, Section } from '@/components/layout/Screen';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { AvatarPair } from '@/components/ui/Avatar';
import { Button, ButtonLink } from '@/components/ui/Button';
import { CycleCardCompact, CycleCardHero } from '@/features/CycleCard';
import { DailyCard } from '@/features/DailyCard';
import { MemoryCard } from '@/features/MemoryCard';
import { MatchReveal } from '@/features/DestinationCard';
import { NotificationBell } from '@/features/NotificationBell';
import { IncomingInvite } from '@/features/IncomingInvite';
import { useStore } from '@/context/store';
import { alsoAhead, cycleAwaitingMemory, dailyEntry, dailyStatus, newMatch, sortedMemories, upNext, } from '@/lib/selectors';
import { quoteForDate } from '@/data/prompts';
import { cueFromText, cueToParams } from '@/lib/generator';
import { today } from '@/lib/dates';
import s from './Home.module.css';
function greetingFor(hour) {
    if (hour < 5)
        return 'Still up';
    if (hour < 12)
        return 'Good morning';
    if (hour < 17)
        return 'Good afternoon';
    return 'Good evening';
}
export default function HomeScreen() {
    const { state, me, partner } = useStore();
    const now = today();
    // Attention decides the hero, not tier — see `attentionScore`.
    const hero = upNext(state, now);
    const ahead = alsoAhead(state, now);
    const memories = sortedMemories(state.memories).slice(0, 4);
    const awaiting = cycleAwaitingMemory(state);
    const match = newMatch(state);
    // Once both have answered, their own words seed the date generator.
    const daily = dailyStatus(state, me.id, partner.id, now);
    const entry = dailyEntry(state, now);
    const cue = daily.bothAnswered && entry
        ? cueFromText(Object.values(entry.answers).map((a) => a.text).join(' '))
        : null;
    return (_jsxs(Screen, { children: [_jsxs("header", { className: s.top, children: [_jsxs("div", { className: s.headMain, children: [_jsxs("h1", { className: s.greeting, children: [greetingFor(new Date().getHours()), ", ", me.name, " & ", partner.name] }), _jsxs("p", { className: s.quote, children: ["\u201C", quoteForDate(now), "\u201D"] })] }), _jsxs("div", { className: s.headActions, children: [_jsx(Link, { to: "/us", className: s.avatars, "aria-label": "Our relationship and settings", children: _jsx(AvatarPair, { people: state.couple.people, size: 34 }) }), _jsx(NotificationBell, {})] })] }), _jsx(IncomingInvite, {}), awaiting?.plan ? (_jsxs("div", { className: s.nudge, children: [_jsx("span", { className: s.nudgeEmoji, "aria-hidden": true, children: awaiting.plan.emoji }), _jsxs("div", { className: s.nudgeMain, children: [_jsxs("p", { className: s.nudgeTitle, children: ["How was ", awaiting.plan.title.toLowerCase(), "?"] }), _jsx("p", { className: s.nudgeBody, children: "Turn it into a memory while it is still fresh." })] }), _jsx(ButtonLink, { to: `/memories/new?cycle=${awaiting.cycle.id}`, variant: "secondary", size: "sm", children: "Add" })] })) : null, hero ? (_jsxs("section", { className: s.hero, children: [_jsx("div", { className: s.ritual, children: _jsx(CycleCardHero, { view: hero }) }), ahead.length ? (_jsxs(_Fragment, { children: [_jsx("p", { className: `${s.sectionKicker} ${s.aheadKicker}`, children: "What's ahead" }), _jsx("div", { className: s.rituals, children: ahead.map((v, i) => (_jsx("div", { className: s.ritual, style: { animationDelay: `${(i + 1) * 80}ms` }, children: _jsx(CycleCardCompact, { view: v }) }, v.cycle.id))) })] })) : null] })) : null, _jsx(Section, { children: _jsx(DailyCard, {}) }), match ? (_jsx(Section, { children: _jsx(MatchReveal, { destination: match }) })) : null, cue ? (_jsx(Section, { children: _jsxs("div", { className: s.cue, children: [_jsx("p", { className: s.cueLabel, children: "From what you both wrote" }), _jsxs("p", { className: s.cueText, children: ["Sounds like something ", cue.label, ". Want to make it a plan?"] }), _jsxs(ButtonLink, { to: `/explore?${cueToParams(cue)}`, variant: "accent", size: "sm", children: ["Find something ", cue.label] })] }) })) : (_jsx(Section, { children: _jsxs("div", { className: s.inspire, children: [_jsx("span", { className: s.inspireMark, "aria-hidden": true }), _jsx("p", { className: s.inspireText, children: "Your next date does not need to be extraordinary. It just needs to be intentional." }), _jsx("div", { className: s.inspireCta, children: _jsx(ButtonLink, { to: "/explore", variant: "secondary", size: "sm", children: "Find a date idea" }) })] }) })), memories.length ? (_jsxs(Section, { children: [_jsx(SectionHeader, { title: "Recently", actionLabel: "All memories", actionTo: "/memories" }), _jsx("div", { className: `${s.recent} no-scrollbar`, children: memories.map((m) => (_jsx("div", { className: s.recentItem, children: _jsx(MemoryCard, { memory: m }) }, m.id))) })] })) : (_jsxs(Section, { children: [_jsx(SectionHeader, { title: "Recently" }), _jsx(Button, { variant: "secondary", block: true, onClick: () => undefined, children: "Nothing captured yet" })] }))] }));
}
