import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Screen, ScreenHeader } from '@/components/layout/Screen';
import { Chip, ChipRow } from '@/components/ui/Chip';
import { ButtonLink } from '@/components/ui/Button';
import { FloatingAction } from '@/components/ui/FloatingAction';
import { EmptyState } from '@/components/ui/EmptyState';
import { MemoryTimelineRow } from '@/features/MemoryCard';
import { useStore } from '@/context/store';
import { memoriesByMonth, relationshipStats } from '@/lib/selectors';
import { formatMonthYear } from '@/lib/dates';
import s from './Memories.module.css';
const FILTERS = [
    { value: 'all', label: 'Everything' },
    { value: 'day', label: '7-day moments', emoji: '🍷' },
    { value: 'week', label: 'Mini adventures', emoji: '🏔️' },
    { value: 'month', label: 'Big adventures', emoji: '✈️' },
    { value: 'milestone', label: 'Milestones', emoji: '❤️' },
    { value: 'moment', label: 'Moments', emoji: '✨' },
];
export default function MemoriesScreen() {
    const { state } = useStore();
    const [params, setParams] = useSearchParams();
    // Us links straight into a filtered timeline, so the URL owns the filter.
    const kindParam = params.get('kind');
    const month = params.get('month');
    const [filter, setFilter] = useState(kindParam ?? 'all');
    const stats = relationshipStats(state);
    const chooseFilter = (next) => {
        setFilter(next);
        // Changing the chips clears a deep link rather than fighting it.
        if (kindParam || month)
            setParams({}, { replace: true });
    };
    const groups = useMemo(() => {
        let list = filter === 'all' ? state.memories : state.memories.filter((m) => m.kind === filter);
        if (month)
            list = list.filter((m) => m.date.startsWith(month));
        return memoriesByMonth(list);
    }, [state.memories, filter, month]);
    const total = groups.reduce((n, g) => n + g.items.length, 0);
    return (_jsxs(Screen, { children: [_jsx(ScreenHeader, { eyebrow: "Memories", title: "Your 777 story", sub: month
                    ? `Showing ${formatMonthYear(`${month}-01`)}.`
                    : `${stats.memories} moments kept, and ${stats.photos} photos.` }), _jsxs("div", { className: s.stats, children: [_jsxs("div", { className: s.stat, children: [_jsx("p", { className: s.statValue, children: stats.dates }), _jsx("p", { className: s.statLabel, children: "Dates" })] }), _jsxs("div", { className: s.stat, children: [_jsx("p", { className: s.statValue, children: stats.mini }), _jsx("p", { className: s.statLabel, children: "Nearby" })] }), _jsxs("div", { className: s.stat, children: [_jsx("p", { className: s.statValue, children: stats.big }), _jsx("p", { className: s.statLabel, children: "Big trips" })] })] }), _jsx("div", { className: s.filters, children: _jsx(ChipRow, { children: FILTERS.map((f) => (_jsx(Chip, { emoji: f.emoji, selected: filter === f.value, onClick: () => chooseFilter(f.value), children: f.label }, f.value))) }) }), total === 0 ? (_jsx(EmptyState, { emoji: "\uD83D\uDCF7", title: month ? 'Nothing that month' : 'Nothing here yet', body: month
                    ? 'A quiet one. Every relationship has them.'
                    : 'Finish a date or a trip and it will land here, or write one down now.', action: month ? (_jsx(ButtonLink, { to: "/memories", variant: "secondary", size: "sm", children: "See everything" })) : (_jsx(ButtonLink, { to: "/memories/new", variant: "accent", size: "sm", children: "Write a memory" })) })) : (groups.map((group) => (_jsxs("section", { className: s.month, children: [_jsx("p", { className: s.monthLabel, children: formatMonthYear(`${group.key}-01`) }), _jsx("div", { className: s.rows, children: group.items.map((m, i) => (_jsx("div", { className: s.row, style: { animationDelay: `${i * 60}ms` }, children: _jsx(MemoryTimelineRow, { memory: m, last: i === group.items.length - 1 }) }, m.id))) })] }, group.key)))), _jsx("div", { className: s.tail }), _jsx(FloatingAction, { to: "/memories/new", label: "Write a memory" })] }));
}
