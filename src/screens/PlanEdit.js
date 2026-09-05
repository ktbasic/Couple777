import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { BackBar, Screen } from '@/components/layout/Screen';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Field';
import { useToast } from '@/components/ui/Toast';
import { useStore } from '@/context/store';
import { DATE_IDEAS } from '@/data/dateIdeas';
import { ADVENTURE_IDEAS } from '@/data/adventures';
import { TIER_META, addDays, today } from '@/lib/dates';
import { CYCLE_NOUN } from '@/lib/cycles';
import { uid } from '@/lib/id';
import s from './PlanEdit.module.css';
const EMOJI = {
    day: ['🍷', '🍝', '🎬', '🌙', '☕', '🎨', '🕯️', '🎧', '🥐', '💬'],
    week: ['🏔️', '🏞️', '♨️', '🎄', '🚆', '🥾', '🍇', '🏛️', '🎢', '🧳'],
    month: ['✈️', '🗼', '🏝️', '🏜️', '🌋', '🎌', '🚗', '🧭', '🌌', '⛩️'],
};
export default function PlanEditScreen() {
    const { planId } = useParams();
    const [params] = useSearchParams();
    const navigate = useNavigate();
    const toast = useToast();
    const { state, dispatch, me, partner } = useStore();
    const existing = planId ? state.plans.find((p) => p.id === planId) : undefined;
    // The cycle is the context. Nobody picks a tier — the rhythm already knows.
    const cycle = state.cycles.find((c) => c.id === (existing?.cycleId ?? params.get('cycle'))) ??
        state.cycles.find((c) => !c.completedAt && c.tier === 'day');
    if (!cycle)
        return _jsx(Navigate, { to: "/", replace: true });
    const tier = cycle.tier;
    const meta = TIER_META[tier];
    const rich = tier !== 'day';
    const sourceIdea = DATE_IDEAS.find((i) => i.id === params.get('idea'));
    const sourceAdventure = ADVENTURE_IDEAS.find((a) => a.id === params.get('adventure'));
    const sourceDestination = state.destinations.find((d) => d.id === params.get('destination'));
    const [title, setTitle] = useState(existing?.title ?? sourceIdea?.title ?? sourceAdventure?.title ?? sourceDestination?.name ?? '');
    const [emoji, setEmoji] = useState(existing?.emoji ?? sourceIdea?.emoji ?? sourceAdventure?.emoji ?? EMOJI[tier][0]);
    const [date, setDate] = useState(existing?.date ?? (cycle.dueDate < today() ? addDays(today(), 3) : cycle.dueDate));
    const [time, setTime] = useState(existing?.time ?? '');
    const [place, setPlace] = useState(existing?.place ?? sourceAdventure?.place ?? sourceDestination?.country ?? '');
    const [cost, setCost] = useState(existing?.cost ??
        (sourceIdea ? (sourceIdea.cost ? `€${sourceIdea.cost}` : 'Free') : (sourceAdventure?.cost ?? '')));
    const [note, setNote] = useState(existing?.note ?? sourceIdea?.description ?? sourceAdventure?.description ?? '');
    const [link, setLink] = useState(existing?.link ?? '');
    const [transport, setTransport] = useState(existing?.trip?.transport ?? '');
    const [reserved, setReserved] = useState(existing?.reserved ?? false);
    const [surprise, setSurprise] = useState(existing?.surprise ?? params.get('surprise') === '1');
    const save = () => {
        const plan = {
            id: existing?.id ?? uid('pl'),
            cycleId: cycle.id,
            title: title.trim() || meta.label,
            emoji,
            date,
            time: time.trim() || undefined,
            endDate: existing?.endDate,
            createdBy: existing?.createdBy ?? me.id,
            surprise,
            place: place.trim() || undefined,
            note: note.trim() || undefined,
            link: link.trim() || undefined,
            cost: cost.trim() || undefined,
            reserved,
            invite: existing?.invite,
            trip: rich
                ? {
                    ...(existing?.trip ?? {
                        destination: '',
                        wishlist: [],
                        stays: [],
                        notes: '',
                    }),
                    destination: title.trim() || place.trim() || 'Somewhere new',
                    country: place.trim() || undefined,
                    heroImage: existing?.trip?.heroImage ?? sourceDestination?.image,
                    transport: transport.trim() || undefined,
                    budget: cost.trim() || undefined,
                }
                : undefined,
        };
        dispatch({ type: 'upsertPlan', plan });
        toast.show({
            emoji: surprise ? '🤫' : '✓',
            message: surprise ? `Hidden from ${partner.name} until the day` : "That's your plan",
        });
        navigate(`/plan/${plan.id}`, { replace: true });
    };
    const remove = () => {
        if (!existing)
            return;
        dispatch({ type: 'removePlan', id: existing.id });
        toast.show({ message: 'Plan removed' });
        navigate('/', { replace: true });
    };
    return (_jsxs(_Fragment, { children: [_jsx(BackBar, { title: existing ? 'Edit plan' : 'Plan something' }), _jsxs(Screen, { children: [_jsxs("header", { className: s.head, children: [_jsxs("p", { className: s.eyebrow, "data-tier": tier, children: ["Your ", meta.cadence, " moment"] }), _jsx("h1", { className: s.title, children: existing ? 'Change the plan' : `What shall we do for this ${CYCLE_NOUN[tier]}?` }), _jsx("p", { className: s.sub, children: meta.hint }), sourceIdea || sourceAdventure || sourceDestination ? (_jsxs("p", { className: s.fromIdea, children: [_jsx("span", { "aria-hidden": true, children: "\u2728" }), _jsxs("span", { children: ["Started from", ' ', _jsx("strong", { children: sourceIdea?.title ?? sourceAdventure?.title ?? sourceDestination?.name }), ". Change anything you like."] })] })) : null] }), _jsxs("div", { className: s.form, children: [_jsx(Input, { label: "What are you doing?", placeholder: tier === 'day' ? 'Dinner at the place on the corner' : 'Somewhere new', value: title, onChange: (e) => setTitle(e.target.value) }), _jsxs("div", { children: [_jsx("p", { className: s.label, children: "Pick something to remember it by" }), _jsx("div", { className: `${s.emojiRow} no-scrollbar`, children: EMOJI[tier].map((e) => (_jsx("button", { type: "button", "aria-label": `Use ${e}`, "aria-pressed": emoji === e, className: [s.emoji, emoji === e ? s.emojiOn : ''].filter(Boolean).join(' '), onClick: () => setEmoji(e), children: e }, e))) })] }), _jsxs("div", { className: s.pair, children: [_jsx(Input, { label: "When", type: "date", value: date, onChange: (e) => setDate(e.target.value) }), _jsx(Input, { label: "Time", type: "time", value: time, onChange: (e) => setTime(e.target.value) })] }), _jsx(Input, { label: tier === 'day' ? 'Where' : 'Destination', placeholder: "Optional", value: place, onChange: (e) => setPlace(e.target.value) }), rich ? (_jsx(Input, { label: "Getting there", placeholder: "Train from Munich, about 2 hours", value: transport, onChange: (e) => setTransport(e.target.value) })) : null, _jsx(Input, { label: tier === 'month' ? 'Rough budget' : 'Rough cost', placeholder: "Optional", value: cost, onChange: (e) => setCost(e.target.value) }), _jsx(Input, { label: "Link", placeholder: "Restaurant page, listing, tickets\u2026", value: link, onChange: (e) => setLink(e.target.value), hint: "Optional. Anything you want to find again quickly." }), _jsx(Textarea, { label: "Anything worth noting", placeholder: "Bookings, times, who is driving\u2026", value: note, onChange: (e) => setNote(e.target.value) }), _jsxs("label", { className: s.toggle, children: [_jsxs("div", { className: s.toggleMain, children: [_jsx("p", { className: s.toggleTitle, children: "Already reserved" }), _jsx("p", { className: s.toggleBody, children: "Marks it as booked so neither of you wonders." })] }), _jsx("input", { type: "checkbox", checked: reserved, onChange: (e) => setReserved(e.target.checked), style: { position: 'absolute', opacity: 0, pointerEvents: 'none' } }), _jsx("span", { className: [s.switch, reserved ? s.switchOn : ''].filter(Boolean).join(' '), "aria-hidden": true })] }), _jsxs("label", { className: s.toggle, children: [_jsxs("div", { className: s.toggleMain, children: [_jsx("p", { className: s.toggleTitle, children: "Keep it a surprise" }), _jsxs("p", { className: s.toggleBody, children: [partner.name, " will see that something is planned, but not what it is."] })] }), _jsx("input", { type: "checkbox", checked: surprise, onChange: (e) => setSurprise(e.target.checked), style: { position: 'absolute', opacity: 0, pointerEvents: 'none' } }), _jsx("span", { className: [s.switch, surprise ? s.switchOn : ''].filter(Boolean).join(' '), "aria-hidden": true })] })] }), _jsxs("div", { className: s.actions, children: [_jsx(Button, { variant: "accent", size: "lg", block: true, onClick: save, children: existing ? 'Save changes' : 'Save plan' }), existing ? (_jsx("button", { type: "button", className: s.delete, onClick: remove, children: "Remove this plan" })) : null] })] })] }));
}
