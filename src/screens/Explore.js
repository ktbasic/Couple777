import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Screen, ScreenHeader, Section } from '@/components/layout/Screen';
import { Segmented } from '@/components/ui/Segmented';
import { Chip, ChipRow } from '@/components/ui/Chip';
import { Photo } from '@/components/ui/Photo';
import { Button } from '@/components/ui/Button';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { IdeaCard } from '@/features/IdeaCard';
import { AdventureCard } from '@/features/AdventureCard';
import { DestinationCard, MatchReveal } from '@/features/DestinationCard';
import { DATE_IDEAS } from '@/data/dateIdeas';
import { DISTANCE_OPTIONS, EMPTY_FILTERS, MOOD_OPTIONS, generateAdventures, generateDateIdeas, } from '@/lib/generator';
import { useStore } from '@/context/store';
import { TIER_META } from '@/lib/dates';
import { ideaMatches, matches, newMatch, sharedIdeas } from '@/lib/selectors';
import s from './Explore.module.css';
export default function ExploreScreen() {
    const { state } = useStore();
    const [params, setParams] = useSearchParams();
    // Arriving from a 777 card carries the cycle, and the cycle already knows
    // the tier — so the couple is never asked what kind of thing they are
    // planning. Browsing without a cycle keeps the manual tabs.
    const cycle = state.cycles.find((c) => c.id === params.get('cycle'));
    const tierParam = params.get('tier');
    const tab = cycle
        ? cycle.tier
        : tierParam === 'week' || tierParam === 'month'
            ? tierParam
            : 'day';
    const setTab = (t) => {
        params.set('tier', t);
        setParams(params, { replace: true });
    };
    return (_jsxs(Screen, { children: [_jsx(ScreenHeader, { eyebrow: "Explore", title: cycle
                    ? `Ideas for your ${TIER_META[cycle.tier].cadence} moment`
                    : 'Find your next little moment', sub: cycle
                    ? TIER_META[cycle.tier].hint
                    : 'A few details, and Couple777 will suggest something that fits tonight.' }), cycle ? (_jsxs("p", { className: s.cycleBanner, children: [_jsx("span", { "aria-hidden": true, children: "\uD83C\uDF3F" }), _jsxs("span", { children: ["Planning your ", TIER_META[cycle.tier].cadence, " moment. Whatever you pick counts for it."] })] })) : (_jsx("div", { className: s.tabs, children: _jsx(Segmented, { value: tab, onChange: setTab, options: [
                        { value: 'day', label: 'Dates' },
                        { value: 'week', label: 'Nearby' },
                        { value: 'month', label: 'Big trips' },
                    ] }) })), tab === 'day' ? _jsx(DateIdeasTab, { cycleId: cycle?.id }) : null, tab === 'week' ? _jsx(MiniAdventuresTab, { cycleId: cycle?.id }) : null, tab === 'month' ? _jsx(BigAdventuresTab, {}) : null] }));
}
/* ------------------------------ 7 days ---------------------------------- */
/*
 * The four questions worth asking, in the order someone actually thinks them:
 * when, where, how much. Everything else the generator knows how to guess.
 */
const WHEN = [
    { label: 'Morning', value: 'morning' },
    { label: 'Afternoon', value: 'afternoon' },
    { label: 'Evening', value: 'evening' },
    { label: 'Night', value: 'late' },
];
const WHERE = [
    { label: 'Indoor', value: 'home' },
    { label: 'Outdoor', value: 'out' },
];
/* Shorter than the generator's own labels: in a row of four these have to fit
   without being cut in half, and "Low energy" beside "Low" budget was saying
   the word twice anyway. */
const EFFORT = [
    { label: 'Easy', value: 'low' },
    { label: 'Some', value: 'medium' },
    { label: 'Plenty', value: 'high' },
];
const SPEND = [
    { label: 'Low', value: 30 },
    { label: 'Medium', value: 60 },
    { label: 'Special', value: 150 },
];
function DateIdeasTab({ cycleId }) {
    const { state, me, partner } = useStore();
    const [params, setParams] = useSearchParams();
    const resultsRef = useRef(null);
    // A cue from Talk arrives as query params, so the generator opens already
    // pointed at what the couple just said to each other.
    const cued = useMemo(() => {
        const read = (key) => params.get(key) ?? null;
        return {
            ...EMPTY_FILTERS,
            daypart: read('daypart'),
            setting: read('setting'),
            vibe: read('vibe'),
        };
    }, [params]);
    const hasCue = Boolean(cued.daypart || cued.setting || cued.vibe);
    const [filters, setFilters] = useState(cued);
    const [seed, setSeed] = useState(1);
    const [loading, setLoading] = useState(false);
    const [surprised, setSurprised] = useState(false);
    useEffect(() => {
        if (hasCue)
            setFilters(cued);
    }, [cued, hasCue]);
    /*
     * Home can ask for the surprise directly — an inspiration button should land
     * on an answer, not on a screen with a button that produces one. The param
     * is dropped straight away so a reload does not re-fire it.
     */
    useEffect(() => {
        if (!params.get('surprise'))
            return;
        const next = new URLSearchParams(params);
        next.delete('surprise');
        setParams(next, { replace: true });
        surpriseUs();
        // surpriseUs is stable for this screen's lifetime.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [params]);
    /* Three, not four: a short list is something you read, a long one is
       something you scroll past. */
    const ideas = useMemo(() => generateDateIdeas(filters, seed, 3, state.couple.profile), [filters, seed, state.couple.profile]);
    const shared = sharedIdeas(state)
        .map((row) => ({ row, idea: DATE_IDEAS.find((i) => i.id === row.id) }))
        .filter((x) => Boolean(x.idea));
    const matched = ideaMatches(state)
        .map((row) => ({ row, idea: DATE_IDEAS.find((i) => i.id === row.id) }))
        .filter((x) => Boolean(x.idea));
    // Selecting the value that is already set clears it, so filters stay escapable.
    const set = (key, value) => setFilters((f) => ({ ...f, [key]: f[key] === value ? null : value }));
    const nameOf = (id) => (id === me.id ? 'you' : partner.name);
    /** The signature action: think for a beat, then bring you to the answer. */
    const surpriseUs = () => {
        setLoading(true);
        setSurprised(true);
        window.setTimeout(() => {
            setSeed((n) => n + 7);
            setLoading(false);
            window.setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
        }, 1000);
    };
    const generate = () => {
        setSurprised(false);
        setSeed((n) => n + 1);
        window.setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
    };
    const row = (label, options, current, onPick) => (_jsxs("div", { className: s.pickRow, children: [_jsx("span", { className: s.pickLabel, children: label }), _jsx("div", { className: s.pickChips, children: options.map((o) => (_jsx("button", { type: "button", className: [s.pick, current === o.value ? s.pickOn : ''].filter(Boolean).join(' '), "aria-pressed": current === o.value, onClick: () => onPick(o.value), children: o.label }, o.label))) })] }));
    return (_jsxs(_Fragment, { children: [hasCue ? (_jsxs("p", { className: s.cueBanner, children: [_jsx("span", { "aria-hidden": true, children: "\u2728" }), _jsx("span", { children: "Set up from what you both wrote today." }), _jsx("button", { type: "button", className: s.cueClear, onClick: () => {
                            setFilters(EMPTY_FILTERS);
                            setParams({ tier: 'day' }, { replace: true });
                        }, children: "Clear" })] })) : null, _jsxs("div", { className: s.gen, children: [_jsx("span", { className: s.genSky, "aria-hidden": true }), row('Time', WHEN, filters.daypart, (v) => set('daypart', v)), row('Setting', WHERE, filters.setting, (v) => set('setting', v)), row('Budget', SPEND, filters.budget, (v) => set('budget', v)), row('Energy', EFFORT, filters.energy, (v) => set('energy', v)), _jsxs("div", { className: s.genActions, children: [_jsx(Button, { variant: "accent", block: true, onClick: generate, children: "Find ideas" }), _jsx(Button, { variant: "quiet", block: true, onClick: surpriseUs, children: "Surprise us \uD83C\uDFB2" })] })] }), _jsx("div", { ref: resultsRef, className: s.resultsAnchor, children: loading ? (_jsxs("div", { className: s.loading, children: [_jsxs("span", { className: s.loadingDots, "aria-hidden": true, children: [_jsx("span", { className: s.loadingDot }), _jsx("span", { className: s.loadingDot }), _jsx("span", { className: s.loadingDot })] }), _jsx("p", { className: s.loadingText, children: "Finding something for you two\u2026" })] })) : (_jsxs(_Fragment, { children: [_jsxs("div", { className: s.resultHead, children: [_jsx("p", { className: s.count, children: surprised ? 'Our pick for you' : 'For you two' }), _jsx("button", { type: "button", className: s.regen, onClick: () => setSeed((n) => n + 1), children: "Show me others" })] }), _jsx("div", { className: s.results, children: ideas.map((idea, i) => (_jsx(IdeaCard, { idea: idea, index: i, cycleId: cycleId }, `${seed}-${idea.id}`))) })] })) }), matched.length ? (_jsxs(Section, { children: [_jsx(SectionHeader, { title: "Our matches", sub: "You both reached for these on your own." }), _jsx("div", { className: s.savedList, children: matched.map(({ idea }) => (_jsx(SavedRow, { idea: idea, note: "You both saved this \uD83D\uDC95", matched: true }, idea.id))) })] })) : null, _jsxs(Section, { children: [_jsx(SectionHeader, { title: "Saved together", sub: "Ideas either of you put on the list." }), shared.length ? (_jsx("div", { className: s.savedList, children: shared.map(({ idea, row: r }) => (_jsx(SavedRow, { idea: idea, note: `Added by ${r.sharedBy.map(nameOf).join(' and ')}` }, idea.id))) })) : (_jsx("p", { className: s.savedEmpty, children: "Start saving ideas you\u2019d love to do together." }))] })] }));
}
/** A saved idea, at list size: enough to recognise, one tap to open. */
function SavedRow({ idea, note, matched, }) {
    return (_jsxs(Link, { to: `/plan/new?idea=${idea.id}`, className: s.savedRow, children: [_jsx(Photo, { src: idea.image, seed: idea.id, ratio: "1 / 1", className: s.savedShot, alt: "" }), _jsxs("span", { className: s.savedMain, children: [_jsx("span", { className: s.savedTitle, children: idea.title }), _jsx("span", { className: [s.savedNote, matched ? s.savedNoteMatch : ''].filter(Boolean).join(' '), children: note })] }), _jsx("span", { className: s.savedChev, "aria-hidden": true, children: "\u203A" })] }));
}
/* ------------------------------ 7 weeks --------------------------------- */
function MiniAdventuresTab({ cycleId }) {
    const { state } = useStore();
    const [distance, setDistance] = useState(null);
    const [mood, setMood] = useState(null);
    const [seed, setSeed] = useState(1);
    const ideas = useMemo(() => generateAdventures(distance, mood, seed), [distance, mood, seed]);
    return (_jsxs(_Fragment, { children: [_jsxs("div", { className: s.filters, children: [_jsxs("div", { className: s.filterGroup, children: [_jsx("p", { className: s.filterLabel, children: "How far do you want to go?" }), _jsx(ChipRow, { children: DISTANCE_OPTIONS.map((o) => (_jsx(Chip, { emoji: o.emoji, selected: distance === o.value, onClick: () => setDistance((d) => (d === o.value ? null : o.value)), children: o.label }, o.value))) })] }), _jsxs("div", { className: s.filterGroup, children: [_jsx("p", { className: s.filterLabel, children: "What mood?" }), _jsx(ChipRow, { children: MOOD_OPTIONS.map((o) => (_jsx(Chip, { emoji: o.emoji, selected: mood === o.value, onClick: () => setMood((m) => (m === o.value ? null : o.value)), children: o.label }, o.value))) })] })] }), _jsxs("div", { className: s.surprise, children: [_jsx(Button, { variant: "accent", onClick: () => { setDistance(null); setMood(null); setSeed((n) => n + 5); }, children: "Surprise me" }), _jsx(Button, { variant: "quiet", onClick: () => setSeed((n) => n + 1), children: "Show me others" })] }), _jsxs("p", { className: s.secretNote, children: [_jsx("span", { "aria-hidden": true, children: "\uD83D\uDCCD" }), _jsxs("span", { children: ["Suggestions are from around ", state.couple.homeCity, ". Change that in Us \u2192 Settings."] })] }), _jsx("div", { className: s.results, children: ideas.map((idea, i) => (_jsx(AdventureCard, { idea: idea, index: i, cycleId: cycleId }, `${seed}-${idea.id}`))) })] }));
}
/* ------------------------------ 7 months -------------------------------- */
function BigAdventuresTab() {
    const { state, me, partner } = useStore();
    const matched = matches(state);
    // Saving something they already saved is a moment — show it here and now,
    // not only the next time they open Home.
    const pending = newMatch(state);
    const mine = state.destinations.filter((d) => d.savedBy.includes(me.id));
    const rest = state.destinations.filter((d) => !d.savedBy.includes(me.id));
    return (_jsxs(_Fragment, { children: [_jsxs("p", { className: s.secretNote, children: [_jsx("span", { "aria-hidden": true, children: "\uD83E\uDD2B" }), _jsxs("span", { children: ["What you save here is private. ", partner.name, " only finds out if they save the same place \u2014 and then you both do, at once."] })] }), pending ? (_jsx(Section, { children: _jsx(MatchReveal, { destination: pending }) })) : null, matched.length ? (_jsxs("div", { className: s.matchStrip, children: [_jsx("span", { "aria-hidden": true, children: "\u2726" }), _jsxs("p", { className: s.matchText, children: [_jsxs("span", { className: s.matchNames, children: [matched.length, " ", matched.length === 1 ? 'match' : 'matches'] }), ' ', "\u2014 ", matched.map((m) => m.name).join(', '), ". You both want to go."] })] })) : null, mine.length ? (_jsxs(Section, { children: [_jsx(SectionHeader, { title: "On your list", sub: "Only you can see this." }), _jsx("div", { className: s.grid, children: mine.map((d) => (_jsx(DestinationCard, { destination: d }, d.id))) })] })) : (_jsx(EmptyState, { emoji: "\uD83E\uDDED", title: "Nothing on your list yet", body: "Save anywhere that pulls at you. Nobody sees it unless they want it too." })), _jsxs(Section, { children: [_jsx(SectionHeader, { title: "Somewhere new", sub: "Tap the heart to add it, quietly." }), _jsx("div", { className: s.grid, children: rest.map((d) => (_jsx(DestinationCard, { destination: d }, d.id))) })] })] }));
}
