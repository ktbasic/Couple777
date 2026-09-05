import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { BackBar, Screen, Section } from '@/components/layout/Screen';
import { Button, ButtonLink } from '@/components/ui/Button';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Photo } from '@/components/ui/Photo';
import { Avatar } from '@/components/ui/Avatar';
import { useToast } from '@/components/ui/Toast';
import { InviteSheet } from '@/features/InviteSheet';
import { PlanningHelpers } from '@/features/PlanningHelpers';
import { useStore } from '@/context/store';
import { TIER_META, countdownLabel, formatPlanDate, today } from '@/lib/dates';
import { CYCLE_CADENCE, CYCLE_NOUN, completeCycle, cycleStatus, listOut } from '@/lib/cycles';
import { uid } from '@/lib/id';
import s from './PlanDetail.module.css';
export default function PlanDetailScreen() {
    const { planId } = useParams();
    const [params, setParams] = useSearchParams();
    const navigate = useNavigate();
    const toast = useToast();
    const { state, dispatch, me, partner } = useStore();
    const plan = state.plans.find((p) => p.id === planId);
    const cycle = state.cycles.find((c) => c.id === plan?.cycleId);
    const [asking, setAsking] = useState(false);
    // The hero card links straight here with the invite open.
    useEffect(() => {
        if (params.get('ask') === '1') {
            setAsking(true);
            params.delete('ask');
            setParams(params, { replace: true });
        }
    }, [params, setParams]);
    if (!plan || !cycle)
        return _jsx(Navigate, { to: "/", replace: true });
    const tier = cycle.tier;
    const meta = TIER_META[tier];
    const status = cycleStatus(cycle, plan);
    const hidden = plan.surprise && plan.createdBy !== me.id && !cycle.completedAt;
    const onPhoto = Boolean(plan.trip?.heroImage);
    const destination = plan.trip?.destination ?? plan.place ?? plan.title;
    const complete = () => {
        // The engine closes the smaller cycles this one overlapped, so say which.
        // Asking it rather than assuming from the tier matters: a 7-week moment
        // already completed this turn is not closed again, and claiming it was
        // would be a lie on the one screen that is meant to explain itself.
        const alsoClosed = completeCycle(state.cycles, cycle.id).closed.slice(1);
        dispatch({ type: 'completeCycle', cycleId: cycle.id });
        const covered = listOut(alsoClosed.map((c) => CYCLE_CADENCE[c.tier]));
        const noun = alsoClosed.length > 1 ? 'moments' : 'moment';
        toast.show({
            emoji: '✓',
            message: covered ? `Made — this covered your ${covered} ${noun} too` : 'Another memory made',
        });
        navigate(`/memories/new?cycle=${cycle.id}`);
    };
    if (hidden) {
        return (_jsxs(_Fragment, { children: [_jsx(BackBar, { title: "A surprise" }), _jsx(Screen, { children: _jsxs("div", { className: s.hidden, children: [_jsx("span", { className: s.hiddenEmoji, "aria-hidden": true, children: "\uD83C\uDF81" }), _jsxs("p", { className: s.hiddenTitle, children: [partner.name, " has planned something."] }), _jsxs("p", { className: s.hiddenBody, children: ["It is ", countdownLabel(today(), plan.date).toLowerCase(), " away. That is all you get for now."] })] }) })] }));
    }
    return (_jsxs(_Fragment, { children: [_jsx(BackBar, { title: `Your ${meta.cadence} moment`, actionLabel: cycle.completedAt ? undefined : 'Edit', onAction: () => navigate(`/plan/${plan.id}/edit`), bleed: true }), _jsxs(Screen, { children: [_jsxs("div", { className: s.hero, "data-tier": tier, children: [plan.trip?.heroImage ? (_jsxs(_Fragment, { children: [_jsx(Photo, { src: plan.trip.heroImage, seed: plan.id, className: s.heroImg, alt: "" }), _jsx("span", { className: s.heroScrim, "aria-hidden": true })] })) : null, _jsxs("div", { className: [s.heroInner, onPhoto ? s.onPhoto : ''].filter(Boolean).join(' '), children: [_jsx("span", { className: s.emoji, "aria-hidden": true, children: plan.emoji }), _jsxs("p", { className: s.cadence, children: ["Every ", meta.cadence] }), _jsx("h1", { className: s.title, children: plan.title }), _jsxs("p", { className: s.when, children: [_jsxs("span", { children: [formatPlanDate(plan.date), plan.time ? ` · ${plan.time}` : ''] }), _jsx("span", { className: s.countdown, children: cycle.completedAt ? 'Done ✓' : countdownLabel(today(), plan.date) })] })] })] }), !cycle.completedAt ? (_jsx("div", { className: s.inviteRow, "data-state": status, children: status === 'planned' ? (_jsxs(_Fragment, { children: [_jsxs("p", { className: s.inviteText, children: [partner.name, " doesn't know about this yet."] }), _jsxs(Button, { variant: "accent", size: "sm", onClick: () => setAsking(true), children: ["Ask ", partner.name, " \uD83D\uDC8C"] })] })) : status === 'invited' ? (_jsxs(_Fragment, { children: [_jsxs("p", { className: s.inviteText, children: ["\uD83D\uDC8C Invite sent \u2014 waiting on ", partner.name, "."] }), _jsxs("div", { className: s.inviteActions, children: [_jsx(Button, { variant: "quiet", size: "sm", onClick: () => setAsking(true), children: "Share again" }), _jsx(Button, { variant: "secondary", size: "sm", onClick: () => {
                                                dispatch({ type: 'respondToInvite', planId: plan.id, response: 'yes' });
                                                toast.show({ emoji: '❤️', message: `${partner.name} said yes` });
                                            }, children: "Simulate yes" })] })] })) : (_jsxs("p", { className: s.inviteText, children: ["\u2764\uFE0F You're on. ", partner.name, " said yes."] })) })) : null, _jsxs("div", { className: s.details, children: [plan.place ? (_jsxs("div", { className: s.detail, children: [_jsx("span", { className: s.detailLabel, children: "Where" }), _jsx("span", { className: s.detailValue, children: plan.place })] })) : null, plan.trip?.transport ? (_jsxs("div", { className: s.detail, children: [_jsx("span", { className: s.detailLabel, children: "Getting there" }), _jsx("span", { className: s.detailValue, children: plan.trip.transport })] })) : null, plan.cost ? (_jsxs("div", { className: s.detail, children: [_jsx("span", { className: s.detailLabel, children: tier === 'month' ? 'Budget' : 'Cost' }), _jsxs("span", { className: s.detailValue, children: [plan.cost, plan.reserved ? ' · reserved ✓' : ''] })] })) : null, plan.note ? (_jsxs("div", { className: s.detail, children: [_jsx("span", { className: s.detailLabel, children: "Notes" }), _jsx("span", { className: s.detailValue, children: plan.note })] })) : null, plan.link ? (_jsxs("div", { className: s.detail, children: [_jsx("span", { className: s.detailLabel, children: "Link" }), _jsx("a", { className: s.detailLink, href: plan.link, target: "_blank", rel: "noopener noreferrer", children: "Open" })] })) : null, _jsxs("div", { className: s.detail, children: [_jsx("span", { className: s.detailLabel, children: "Planned by" }), _jsxs("span", { className: s.detailValue, children: [plan.createdBy === me.id ? 'You' : partner.name, plan.surprise ? ' · kept hidden' : ''] })] })] }), _jsx(PlanningHelpers, { tier: tier, destination: destination }), !cycle.completedAt ? (_jsxs("div", { className: s.actions, children: [_jsx(Button, { variant: "accent", size: "lg", block: true, onClick: complete, children: "We did this" }), _jsx(ButtonLink, { to: `/explore?cycle=${cycle.id}`, variant: "secondary", block: true, children: "Browse other ideas" })] })) : cycle.memoryId ? (_jsxs("div", { className: s.done, children: [_jsx("p", { className: s.doneTitle, children: "Another memory made \u2713" }), _jsx("p", { className: s.doneBody, children: "This one is in your 777 story." }), _jsx(ButtonLink, { to: `/memories/${cycle.memoryId}`, variant: "secondary", size: "sm", children: "Open the memory" })] })) : (_jsxs("div", { className: s.done, children: [_jsx("p", { className: s.doneTitle, children: "How was it?" }), _jsx("p", { className: s.doneBody, children: "Add a photo and a line each, while it is still fresh." }), _jsx(ButtonLink, { to: `/memories/new?cycle=${cycle.id}`, variant: "accent", size: "sm", children: "Turn this into a memory" })] })), plan.trip ? _jsx(TripSpace, { plan: plan }) : null] }), _jsx(InviteSheet, { plan: plan, tier: tier, open: asking, onClose: () => setAsking(false) })] }));
}
/* ------------------------- Bigger-adventure space ------------------------- */
function TripSpace({ plan }) {
    const { state, dispatch, me } = useStore();
    const trip = plan.trip;
    const [wishDraft, setWishDraft] = useState('');
    const [stayDraft, setStayDraft] = useState('');
    const update = (patch) => {
        dispatch({ type: 'upsertPlan', plan: { ...plan, trip: { ...trip, ...patch } } });
    };
    const addTo = (key, label) => {
        const text = label.trim();
        if (!text)
            return;
        const item = { id: uid('ti'), label: text, addedBy: me.id };
        update({ [key]: [...trip[key], item] });
    };
    const removeFrom = (key, id) => {
        update({ [key]: trip[key].filter((i) => i.id !== id) });
    };
    const renderList = (key) => trip[key].map((item) => {
        const person = state.couple.people.find((p) => p.id === item.addedBy);
        return (_jsxs("li", { className: s.listItem, children: [_jsx("span", { children: item.label }), person ? (_jsx("span", { className: s.listWho, children: _jsx(Avatar, { person: person, size: 20 }) })) : null, _jsx("button", { type: "button", className: s.listRemove, "aria-label": `Remove ${item.label}`, onClick: () => removeFrom(key, item.id), children: "\u2715" })] }, item.id));
    });
    return (_jsxs("div", { className: s.trip, children: [_jsxs(Section, { children: [_jsx(SectionHeader, { title: "What we want to do", sub: "Add anything. No order, no pressure." }), _jsx("ul", { className: s.list, children: renderList('wishlist') }), _jsxs("form", { className: s.add, onSubmit: (e) => {
                            e.preventDefault();
                            addTo('wishlist', wishDraft);
                            setWishDraft('');
                        }, children: [_jsx("input", { className: s.addInput, placeholder: "Add something\u2026", value: wishDraft, onChange: (e) => setWishDraft(e.target.value) }), _jsx(Button, { variant: "secondary", size: "sm", type: "submit", children: "Add" })] })] }), _jsxs(Section, { children: [_jsx(SectionHeader, { title: "Where we might stay" }), _jsx("ul", { className: s.list, children: renderList('stays') }), _jsxs("form", { className: s.add, onSubmit: (e) => {
                            e.preventDefault();
                            addTo('stays', stayDraft);
                            setStayDraft('');
                        }, children: [_jsx("input", { className: s.addInput, placeholder: "Add a place\u2026", value: stayDraft, onChange: (e) => setStayDraft(e.target.value) }), _jsx(Button, { variant: "secondary", size: "sm", type: "submit", children: "Add" })] })] }), _jsxs(Section, { children: [_jsx(SectionHeader, { title: "Notes" }), _jsx("textarea", { className: s.addInput, style: { width: '100%', minHeight: 120, lineHeight: 1.6, resize: 'vertical' }, placeholder: "Flights, routes, anything you keep forgetting\u2026", value: trip.notes, onChange: (e) => update({ notes: e.target.value }) })] })] }));
}
export { CYCLE_NOUN };
