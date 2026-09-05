import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { Link } from 'react-router-dom';
import { ButtonLink } from '@/components/ui/Button';
import { CosmicAccent } from '@/components/ui/CosmicPair';
import { formatPlanDate, TIER_META } from '@/lib/dates';
import { CYCLE_NOUN } from '@/lib/cycles';
import { useStore } from '@/context/store';
import s from './CycleCard.module.css';
const CHEV = (_jsx("svg", { viewBox: "0 0 24 24", width: "16", height: "16", "aria-hidden": true, children: _jsx("path", { d: "M9 5l7 7-7 7", fill: "none", stroke: "currentColor", strokeWidth: "1.8", strokeLinecap: "round", strokeLinejoin: "round" }) }));
const STATUS_CHIP = {
    upcoming: null,
    planned: { label: 'Planned' },
    invited: { label: 'Invite sent', emoji: '💌' },
    confirmed: { label: "You're on", emoji: '❤️' },
    completed: { label: 'Made', emoji: '✓' },
};
/** A partner's surprise stays hidden — you see that something exists, not what. */
function hidden(view, meId) {
    return Boolean(view.plan?.surprise && view.plan.createdBy !== meId);
}
function StatusChip({ view }) {
    const chip = STATUS_CHIP[view.status];
    if (!chip)
        return null;
    return (_jsxs("span", { className: s.status, "data-state": view.status, children: [chip.emoji ? _jsx("span", { "aria-hidden": true, children: chip.emoji }) : null, chip.label] }));
}
export function CycleCardCompact({ view }) {
    const { me } = useStore();
    const meta = TIER_META[view.cycle.tier];
    const isHidden = hidden(view, me.id);
    const plan = view.plan;
    return (_jsx(Link, { to: plan ? `/plan/${plan.id}` : `/plan/new?cycle=${view.cycle.id}`, className: s.card, "data-tier": view.cycle.tier, children: _jsxs("div", { className: s.compact, children: [_jsx("span", { className: s.dot, "aria-hidden": true }), _jsxs("div", { className: s.compactMain, children: [_jsx("p", { className: s.cadence, children: meta.cadence }), _jsx("p", { className: [s.compactTitle, !plan ? s.compactEmpty : ''].filter(Boolean).join(' '), children: isHidden ? '🎁 A surprise, from them' : plan ? `${plan.emoji} ${plan.title}` : 'Nothing planned yet' })] }), view.status === 'confirmed' || view.status === 'invited' ? (_jsx("span", { className: s.compactStatus, children: _jsx(StatusChip, { view: view }) })) : (_jsx("span", { className: s.compactCount, children: view.overdue ? 'Open' : `${view.daysAway} days` })), _jsx("span", { className: s.chev, children: CHEV })] }) }));
}
const HEART = (_jsx("svg", { viewBox: "0 0 16 16", width: "9", height: "9", "aria-hidden": true, children: _jsx("path", { d: "M8 13.6C3.7 10.6 1.6 8.4 1.6 5.9 1.6 3.9 3.1 2.4 5 2.4c1.2 0 2.3.6 3 1.6.7-1 1.8-1.6 3-1.6 1.9 0 3.4 1.5 3.4 3.5 0 2.5-2.1 4.7-6.4 7.7Z", fill: "currentColor" }) }));
/**
 * The countdown, as an editorial line rather than a sentence.
 *
 * A number is the one thing on this screen worth reading from across the
 * room, so it gets to be a number. The days that have no number — today,
 * tomorrow, and a cycle that has slipped — say the word instead, at a size
 * that keeps the block the same shape.
 */
function countdown(view) {
    const noun = CYCLE_NOUN[view.cycle.tier];
    if (view.overdue)
        return { big: 'Now', unit: null, sub: `is a good time for your next ${noun}.` };
    if (view.daysAway === 0)
        return { big: 'Today', unit: null, sub: `your ${noun} is here.` };
    if (view.daysAway === 1)
        return { big: 'Tomorrow', unit: null, sub: `your ${noun} is almost here.` };
    return { big: String(view.daysAway), unit: 'days', sub: `to your next ${noun}.` };
}
/**
 * The hero. Which cycle gets it is decided by attention, not by tier — see
 * `attentionScore` — so a confirmed date steps aside for an unplanned getaway.
 */
export function CycleCardHero({ view }) {
    const { me, partner } = useStore();
    const meta = TIER_META[view.cycle.tier];
    const plan = view.plan;
    const isHidden = hidden(view, me.id);
    const count = countdown(view);
    return (_jsxs("div", { className: `${s.card} ${s.hero}`, "data-tier": view.cycle.tier, children: [_jsxs("div", { className: s.decor, "aria-hidden": true, children: [_jsx("span", { className: s.aura }), _jsx("span", { className: s.orbit, children: _jsx("span", { className: s.orbitNode, children: HEART }) }), _jsx(CosmicAccent, { className: s.moteA, tone: "warm" }), _jsx(CosmicAccent, { className: s.moteB, tone: "cool", flip: true })] }), _jsxs("div", { className: s.heroBody, children: [_jsxs("p", { className: s.heroCadence, children: ["Every ", meta.cadence] }), _jsx("p", { className: s.count, "data-word": count.unit ? undefined : '', children: count.big }), count.unit ? _jsx("p", { className: s.unit, children: count.unit }) : null, _jsx("p", { className: s.sub, children: count.sub }), plan ? (_jsxs(_Fragment, { children: [_jsxs(Link, { to: `/plan/${plan.id}`, className: s.heroPlan, children: [_jsx("span", { className: s.heroEmoji, "aria-hidden": true, children: isHidden ? '🎁' : plan.emoji }), _jsxs("div", { className: s.heroPlanMain, children: [_jsx("p", { className: s.heroPlanTitle, children: isHidden ? 'A surprise, from them' : plan.title }), _jsxs("p", { className: s.heroPlanMeta, children: [formatPlanDate(plan.date), plan.time ? ` · ${plan.time}` : '', !isHidden && plan.place ? ` · ${plan.place}` : ''] })] })] }), _jsxs("div", { className: s.actions, children: [_jsx(StatusChip, { view: view }), view.status === 'planned' && !isHidden ? (_jsxs(ButtonLink, { to: `/plan/${plan.id}?ask=1`, variant: "accent", size: "sm", children: ["Ask ", partner.name, " \uD83D\uDC8C"] })) : (_jsx(ButtonLink, { to: `/plan/${plan.id}`, variant: "secondary", size: "sm", children: "See plan" }))] })] })) : (_jsx(_Fragment, { children: _jsxs("div", { className: s.actions, children: [_jsx(ButtonLink, { to: `/explore?cycle=${view.cycle.id}`, variant: "accent", size: "sm", children: "Find an idea" }), _jsx(ButtonLink, { to: `/plan/new?cycle=${view.cycle.id}`, variant: "quiet", size: "sm", children: "Create my own" })] }) }))] })] }));
}
export { CYCLE_NOUN };
