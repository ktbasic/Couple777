export const DAY_MS = 86_400_000;
/** Today, as a local YYYY-MM-DD string. */
export function today() {
    return toISODate(new Date());
}
export function toISODate(d) {
    const y = d.getFullYear();
    const m = `${d.getMonth() + 1}`.padStart(2, '0');
    const day = `${d.getDate()}`.padStart(2, '0');
    return `${y}-${m}-${day}`;
}
/** Parse a YYYY-MM-DD as local midnight, avoiding UTC drift. */
export function fromISODate(iso) {
    const [y, m, d] = iso.split('-').map(Number);
    return new Date(y, (m ?? 1) - 1, d ?? 1);
}
export function addDays(iso, days) {
    const d = fromISODate(iso);
    d.setDate(d.getDate() + days);
    return toISODate(d);
}
export function addMonths(iso, months) {
    const d = fromISODate(iso);
    const day = d.getDate();
    d.setDate(1);
    d.setMonth(d.getMonth() + months);
    // Clamp to the last valid day of the target month.
    const last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    d.setDate(Math.min(day, last));
    return toISODate(d);
}
/** Whole days from a to b. Negative means b is in the past. */
export function daysBetween(a, b) {
    return Math.round((fromISODate(b).getTime() - fromISODate(a).getTime()) / DAY_MS);
}
/* ---------------- Formatting ---------------- */
const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
];
const MONTHS_SHORT = MONTHS.map((m) => m.slice(0, 3));
const DAYS = [
    'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday',
];
/** "Saturday · Sep 5" */
export function formatPlanDate(iso) {
    const d = fromISODate(iso);
    return `${DAYS[d.getDay()]} · ${MONTHS_SHORT[d.getMonth()]} ${d.getDate()}`;
}
/** "Sep 5" */
export function formatShort(iso) {
    const d = fromISODate(iso);
    return `${MONTHS_SHORT[d.getMonth()]} ${d.getDate()}`;
}
/** "SEP 05" — timeline gutter. */
export function formatGutter(iso) {
    const d = fromISODate(iso);
    return {
        month: MONTHS_SHORT[d.getMonth()].toUpperCase(),
        day: `${d.getDate()}`.padStart(2, '0'),
    };
}
/** "September 2026" */
export function formatMonthYear(iso) {
    const d = fromISODate(iso);
    return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}
/**
 * Human countdown copy. Deliberately soft — "3 days", not "3d 4h 22m".
 */
export function countdownLabel(from, to) {
    const days = daysBetween(from, to);
    if (days < 0) {
        const past = Math.abs(days);
        if (past === 1)
            return 'Yesterday';
        if (past < 7)
            return `${past} days ago`;
        return formatShort(to);
    }
    if (days === 0)
        return 'Today';
    if (days === 1)
        return 'Tomorrow';
    if (days < 21)
        return `${days} days`;
    if (days < 60)
        return `${Math.round(days / 7)} weeks`;
    const months = Math.round(days / 30.44);
    return months === 1 ? '1 month' : `${months} months`;
}
/** "2 years 4 months" — for the relationship profile. */
export function durationTogether(since, now = today()) {
    const a = fromISODate(since);
    const b = fromISODate(now);
    let months = (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth());
    if (b.getDate() < a.getDate())
        months -= 1;
    months = Math.max(0, months);
    const years = Math.floor(months / 12);
    const rem = months % 12;
    const parts = [];
    if (years)
        parts.push(`${years} year${years === 1 ? '' : 's'}`);
    if (rem)
        parts.push(`${rem} month${rem === 1 ? '' : 's'}`);
    if (!parts.length) {
        const days = daysBetween(since, now);
        return `${days} day${days === 1 ? '' : 's'}`;
    }
    return parts.join(' ');
}
/* ---------------- The 777 rhythm ---------------- */
export const TIER_META = {
    day: {
        cadence: '7 days',
        label: 'Your next date',
        plural: 'Dates',
        intervalDays: 7,
        verb: 'Plan a date',
        hint: 'An evening that belongs to the two of you.',
    },
    week: {
        cadence: '7 weeks',
        label: 'Your next mini adventure',
        plural: 'Mini adventures',
        intervalDays: 49,
        verb: 'Plan a mini adventure',
        hint: 'Somewhere close, but away from the everyday.',
    },
    month: {
        cadence: '7 months',
        label: 'Your next big adventure',
        plural: 'Big adventures',
        intervalDays: 213,
        verb: 'Plan a big adventure',
        hint: 'Somewhere neither of you has been.',
    },
};
/** When the next one is due, given the last completed one. */
export function dueDate(tier, lastCompleted) {
    const base = lastCompleted ?? today();
    return addDays(base, TIER_META[tier].intervalDays);
}
/**
 * How far through the current cycle the couple is, 0 → 1.
 * Used for the rhythm rings; clamped so an overdue tier reads as full.
 */
export function cycleProgress(tier, lastCompleted, now = today()) {
    const span = TIER_META[tier].intervalDays;
    if (!lastCompleted)
        return 1;
    const elapsed = daysBetween(lastCompleted, now);
    return Math.min(1, Math.max(0, elapsed / span));
}
