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
/* The compass is the one the Explore tab already uses — "Find an idea" goes
   to Explore, so the button and the destination wear the same mark. Both are
   drawn here at the size the buttons need rather than scaled down from 22px,
   which would have thinned their strokes. */
const COMPASS = (_jsxs("svg", { viewBox: "0 0 24 24", width: "17", height: "17", "aria-hidden": true, children: [_jsx("circle", { cx: "12", cy: "12", r: "8.2", fill: "none", stroke: "currentColor", strokeWidth: "1.7" }), _jsx("path", { d: "m15 9-2 4.2-4 1.8 2-4.2z", fill: "none", stroke: "currentColor", strokeWidth: "1.7", strokeLinecap: "round", strokeLinejoin: "round" })] }));
const PLUS = (_jsx("svg", { viewBox: "0 0 24 24", width: "17", height: "17", "aria-hidden": true, children: _jsx("path", { d: "M12 5.2v13.6M5.2 12h13.6", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round" }) }));
/*
 * The orbit, in the one place the drawn ellipse and the heart's track both
 * read it from. The track is a circle of ORBIT_RX squashed to
 * ORBIT_RY/ORBIT_RX and tilted, so these three numbers decide both.
 *
 * The tilt is what keeps the heart off the type. A shallow ellipse puts its
 * highest and lowest points near the middle of the card, straight through the
 * kicker and the sub-line; steepening it swings those points out to roughly
 * ±115px, where there is nothing to collide with.
 */
const ORBIT_RX = 186;
const ORBIT_RY = 76;
const ORBIT_TILT = -20;
/* The ellipse's own major-axis ends, where the near half meets the far half —
   the silhouette of the ring, and so where the two arcs are cut. */
const T = (ORBIT_TILT * Math.PI) / 180;
const END_X = ORBIT_RX * Math.cos(T);
const END_Y = ORBIT_RX * Math.sin(T);
const ORBIT_CX = 180;
const ORBIT_CY = 130;
const A = `${(ORBIT_CX + END_X).toFixed(1)} ${(ORBIT_CY + END_Y).toFixed(1)}`;
const B = `${(ORBIT_CX - END_X).toFixed(1)} ${(ORBIT_CY - END_Y).toFixed(1)}`;
const ARC = `A ${ORBIT_RX} ${ORBIT_RY} ${ORBIT_TILT} 0 1`;
/** Sweeping clockwise from the right-hand end goes down: the near half. */
const ORBIT_FRONT = `M ${A} ${ARC} ${B}`;
const ORBIT_BACK = `M ${B} ${ARC} ${A}`;
/* Shown only while the heart is crossing type, where it turns white. */
const SPARK_DOT = (_jsx("svg", { viewBox: "0 0 16 16", width: "9", height: "9", "aria-hidden": true, children: _jsx("path", { d: "M8 0.8c.9 5.2 1.5 5.9 6.4 6.4v.2c-4.9.5-5.5 1.2-6.4 6.4h-.2C6.9 8.6 6.3 7.9 1.4 7.4v-.2C6.3 6.7 6.9 6 7.8.8Z", fill: "currentColor" }) }));
const HEART = (_jsx("svg", { viewBox: "0 0 16 16", width: "11", height: "11", "aria-hidden": true, children: _jsx("path", { d: "M8 13.6C3.7 10.6 1.6 8.4 1.6 5.9 1.6 3.9 3.1 2.4 5 2.4c1.2 0 2.3.6 3 1.6.7-1 1.8-1.6 3-1.6 1.9 0 3.4 1.5 3.4 3.5 0 2.5-2.1 4.7-6.4 7.7Z", fill: "currentColor" }) }));
/**
 * The countdown, as two words rather than a sentence.
 *
 * A number is the one thing on this screen worth reading from across the
 * room, so it gets to be a number and "days left" gets to be the whole
 * caption. The days that have no number — today, tomorrow, and a cycle that
 * has slipped — say the word on its own, at a size that keeps the block the
 * same shape. The cadence above already says what is being counted to.
 */
function countdown(view) {
    if (view.overdue)
        return { big: 'Now', unit: null };
    if (view.daysAway === 0)
        return { big: 'Today', unit: null };
    if (view.daysAway === 1)
        return { big: 'Tomorrow', unit: null };
    return { big: String(view.daysAway), unit: 'days left' };
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
    return (_jsxs("div", { className: s.hero, "data-tier": view.cycle.tier, style: {
            '--orbit-rx': `${ORBIT_RX}px`,
            '--orbit-squash': ORBIT_RY / ORBIT_RX,
            '--orbit-tilt': `${ORBIT_TILT}deg`,
        }, children: [_jsxs("div", { className: s.sky, "aria-hidden": true, children: [_jsx("svg", { className: s.orbitBack, viewBox: "0 0 360 260", preserveAspectRatio: "xMidYMid meet", children: _jsx("path", { d: ORBIT_BACK, fill: "none", stroke: "var(--edge)", strokeWidth: "1" }) }), _jsx("span", { className: s.planet }), _jsx("svg", { className: s.orbitFront, viewBox: "0 0 360 260", preserveAspectRatio: "xMidYMid meet", children: _jsx("path", { d: ORBIT_FRONT, fill: "none", stroke: "var(--edge)", strokeWidth: "1.1" }) }), _jsx("div", { className: s.track, children: _jsx("div", { className: s.spin, children: _jsx("span", { className: s.node, children: _jsxs("span", { className: s.nodeInner, children: [HEART, _jsx("span", { className: s.nodeSpark, children: SPARK_DOT })] }) }) }) }), _jsx(CosmicAccent, { className: s.moteA, tone: "warm" }), _jsx(CosmicAccent, { className: s.moteB, tone: "cool", flip: true, delay: "-3.4s" })] }), _jsxs("div", { className: s.heroBody, children: [_jsxs("p", { className: s.heroCadence, children: ["Every ", meta.cadence] }), _jsx("p", { className: s.count, "data-word": count.unit ? undefined : '', children: count.big }), count.unit ? _jsx("p", { className: s.unit, children: count.unit }) : null, plan ? (_jsxs(_Fragment, { children: [_jsxs(Link, { to: `/plan/${plan.id}`, className: s.heroPlan, children: [_jsx("span", { className: s.heroEmoji, "aria-hidden": true, children: isHidden ? '🎁' : plan.emoji }), _jsxs("div", { className: s.heroPlanMain, children: [_jsx("p", { className: s.heroPlanTitle, children: isHidden ? 'A surprise, from them' : plan.title }), _jsxs("p", { className: s.heroPlanMeta, children: [formatPlanDate(plan.date), plan.time ? ` · ${plan.time}` : '', !isHidden && plan.place ? ` · ${plan.place}` : ''] })] })] }), _jsxs("div", { className: s.actions, children: [_jsx(StatusChip, { view: view }), view.status === 'planned' && !isHidden ? (_jsxs(ButtonLink, { to: `/plan/${plan.id}?ask=1`, variant: "accent", size: "sm", children: ["Ask ", partner.name, " \uD83D\uDC8C"] })) : (_jsx(ButtonLink, { to: `/plan/${plan.id}`, variant: "secondary", size: "sm", children: "See plan" }))] })] })) : (_jsx(_Fragment, { children: _jsxs("div", { className: s.actions, children: [_jsx(ButtonLink, { to: `/explore?cycle=${view.cycle.id}`, variant: "accent", size: "sm", icon: COMPASS, children: "Find an idea" }), _jsx(ButtonLink, { to: `/plan/new?cycle=${view.cycle.id}`, variant: "quiet", size: "sm", icon: PLUS, children: "Create my own" })] }) }))] })] }));
}
export { CYCLE_NOUN };
