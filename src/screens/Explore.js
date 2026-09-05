import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Screen, ScreenHeader, Section } from '@/components/layout/Screen';
import { Segmented } from '@/components/ui/Segmented';
import { Chip, ChipRow } from '@/components/ui/Chip';
import { Button } from '@/components/ui/Button';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { IdeaCard } from '@/features/IdeaCard';
import { AdventureCard } from '@/features/AdventureCard';
import { DestinationCard, MatchReveal } from '@/features/DestinationCard';
import { DATE_IDEAS } from '@/data/dateIdeas';
import { BUDGET_OPTIONS, DAYPART_OPTIONS, DISTANCE_OPTIONS, DURATION_OPTIONS, EMPTY_FILTERS, ENERGY_OPTIONS, FEEDBACK_OPTIONS, MOOD_OPTIONS, SETTING_OPTIONS, VIBE_OPTIONS, WEATHER_OPTIONS, generateAdventures, generateDateIdeas, } from '@/lib/generator';
import { useStore } from '@/context/store';
import { TIER_META } from '@/lib/dates';
import { matches, newMatch } from '@/lib/selectors';
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
    return (_jsxs(Screen, { children: [_jsx(ScreenHeader, { eyebrow: "Explore", title: cycle ? `Ideas for your ${TIER_META[cycle.tier].cadence} moment` : 'What should we do?', sub: cycle
                    ? TIER_META[cycle.tier].hint
                    : 'Answer as much or as little as you like. The more you say, the better the suggestions.' }), cycle ? (_jsxs("p", { className: s.cycleBanner, children: [_jsx("span", { "aria-hidden": true, children: "\uD83C\uDF3F" }), _jsxs("span", { children: ["Planning your ", TIER_META[cycle.tier].cadence, " moment. Whatever you pick counts for it."] })] })) : (_jsx("div", { className: s.tabs, children: _jsx(Segmented, { value: tab, onChange: setTab, options: [
                        { value: 'day', label: 'Dates' },
                        { value: 'week', label: 'Nearby' },
                        { value: 'month', label: 'Big trips' },
                    ] }) })), tab === 'day' ? _jsx(DateIdeasTab, { cycleId: cycle?.id }) : null, tab === 'week' ? _jsx(MiniAdventuresTab, { cycleId: cycle?.id }) : null, tab === 'month' ? _jsx(BigAdventuresTab, {}) : null] }));
}
/* ------------------------------ 7 days ---------------------------------- */
function DateIdeasTab({ cycleId }) {
    const { state } = useStore();
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
    const [feedback, setFeedback] = useState([]);
    const [seen, setSeen] = useState([]);
    const [loading, setLoading] = useState(false);
    const [surprised, setSurprised] = useState(false);
    useEffect(() => {
        if (hasCue)
            setFilters(cued);
    }, [cued, hasCue]);
    /*
     * Home can ask for the surprise directly — "Get inspirations" should land on
     * an answer, not on a screen with a button that produces one. The param is
     * dropped straight away so a reload or a back-forward does not re-fire it.
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
    const ideas = useMemo(() => generateDateIdeas(filters, seed, 4, state.couple.profile, feedback, seen), [filters, seed, state.couple.profile, feedback, seen]);
    const saved = DATE_IDEAS.filter((i) => state.savedIdeaIds.includes(i.id));
    // Selecting the value that is already set clears it, so filters stay escapable.
    const set = (key, value) => setFilters((f) => ({ ...f, [key]: f[key] === value ? null : value }));
    /** The signature action: think for a beat, then bring you to the answer. */
    const surpriseUs = () => {
        setLoading(true);
        setSurprised(true);
        window.setTimeout(() => {
            setSeed((n) => n + 7);
            setLoading(false);
            window.setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
        }, 1100);
    };
    const react = (f) => {
        // "Done this before" hides what is on screen; the rest just re-weight.
        if (f === 'done')
            setSeen((prev) => [...new Set([...prev, ...ideas.map((i) => i.id)])]);
        setFeedback((prev) => (prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]));
        setSeed((n) => n + 1);
    };
    const clearAll = () => {
        setFilters(EMPTY_FILTERS);
        setFeedback([]);
        setSeen([]);
        if (hasCue)
            setParams({ tier: 'day' }, { replace: true });
    };
    return (_jsxs(_Fragment, { children: [hasCue ? (_jsxs("p", { className: s.cueBanner, children: [_jsx("span", { "aria-hidden": true, children: "\u2728" }), _jsx("span", { children: "Set up from what you both wrote today." }), _jsx("button", { type: "button", className: s.cueClear, onClick: clearAll, children: "Clear" })] })) : null, _jsx("p", { className: s.helper, children: "Pick whatever matters. Leave the rest to us." }), _jsxs("div", { className: s.filters, children: [_jsxs("div", { className: s.filterGroup, children: [_jsx("p", { className: s.filterLabel, children: "When are we doing this?" }), _jsx(ChipRow, { children: DAYPART_OPTIONS.map((o) => (_jsx(Chip, { emoji: o.emoji, selected: filters.daypart === o.value, onClick: () => set('daypart', o.value), children: o.label }, o.value))) })] }), _jsxs("div", { className: s.filterGroup, children: [_jsx("p", { className: s.filterLabel, children: "How much time?" }), _jsx(ChipRow, { children: DURATION_OPTIONS.map((o) => (_jsx(Chip, { selected: filters.duration === o.value, onClick: () => set('duration', o.value), children: o.label }, o.value))) })] }), _jsxs("div", { className: s.filterGroup, children: [_jsx("p", { className: s.filterLabel, children: "Budget" }), _jsx(ChipRow, { children: BUDGET_OPTIONS.map((o) => (_jsx(Chip, { selected: filters.budget === o.value, onClick: () => set('budget', o.value), children: o.label }, o.value))) })] }), _jsxs("div", { className: s.filterGroup, children: [_jsx("p", { className: s.filterLabel, children: "What kind of mood?" }), _jsx(ChipRow, { children: VIBE_OPTIONS.map((o) => (_jsx(Chip, { emoji: o.emoji, selected: filters.vibe === o.value, onClick: () => set('vibe', o.value), children: o.label }, o.value))) })] }), _jsxs("div", { className: s.filterGroup, children: [_jsx("p", { className: s.filterLabel, children: "Where, and how much energy?" }), _jsxs(ChipRow, { children: [SETTING_OPTIONS.map((o) => (_jsx(Chip, { emoji: o.emoji, selected: filters.setting === o.value, onClick: () => set('setting', o.value), children: o.label }, o.value))), ENERGY_OPTIONS.map((o) => (_jsx(Chip, { emoji: o.emoji, selected: filters.energy === o.value, onClick: () => set('energy', o.value), children: o.label }, o.value)))] })] }), _jsxs("div", { className: s.filterGroup, children: [_jsx("p", { className: s.filterLabel, children: "What is it doing outside?" }), _jsx(ChipRow, { children: WEATHER_OPTIONS.map((o) => (_jsx(Chip, { emoji: o.emoji, selected: filters.weather === o.value, onClick: () => set('weather', o.value), children: o.label }, o.value))) })] })] }), _jsxs("div", { className: s.surprise, children: [_jsx(Button, { variant: "accent", onClick: surpriseUs, children: "\u2728 Surprise us" }), _jsx(Button, { variant: "quiet", onClick: clearAll, children: "Clear" })] }), _jsx("div", { ref: resultsRef, className: s.resultsAnchor, children: loading ? (_jsxs("div", { className: s.loading, children: [_jsxs("span", { className: s.loadingDots, "aria-hidden": true, children: [_jsx("span", { className: s.loadingDot }), _jsx("span", { className: s.loadingDot }), _jsx("span", { className: s.loadingDot })] }), _jsx("p", { className: s.loadingText, children: "Finding something for you two\u2026" })] })) : (_jsxs(_Fragment, { children: [_jsxs("div", { className: s.resultHead, children: [_jsxs("p", { className: s.count, children: [ideas.length, " ideas for you"] }), _jsx("button", { type: "button", className: s.regen, onClick: () => setSeed((n) => n + 1), children: "Show me others" })] }), _jsx("div", { className: s.results, children: ideas.map((idea, i) => (_jsxs("div", { className: i === 0 && surprised ? s.topPick : undefined, children: [i === 0 && surprised ? _jsx("span", { className: s.topPickBadge, children: "Our pick" }) : null, _jsx("div", { className: i === 0 && surprised ? s.topPickRing : undefined, children: _jsx(IdeaCard, { idea: idea, index: i }) })] }, `${seed}-${idea.id}`))) }), _jsxs("div", { className: s.feedback, children: [_jsx("p", { className: s.feedbackLabel, children: "Not quite right?" }), _jsx("div", { className: s.feedbackRow, children: FEEDBACK_OPTIONS.map((o) => (_jsx(Chip, { selected: feedback.includes(o.value), onClick: () => react(o.value), children: o.label }, o.value))) })] })] })) }), saved.length ? (_jsxs(Section, { children: [_jsx(SectionHeader, { title: "Saved", sub: "Ideas you both liked the look of." }), _jsx("div", { className: s.results, children: saved.map((idea, i) => (_jsx(IdeaCard, { idea: idea, index: i, cycleId: cycleId }, idea.id))) })] })) : null] }));
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
