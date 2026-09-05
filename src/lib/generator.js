import { DATE_IDEAS } from '@/data/dateIdeas';
import { ADVENTURE_IDEAS } from '@/data/adventures';
/**
 * Soft scoring rather than hard filtering: an over-constrained set should still
 * return the closest three ideas instead of an empty screen. Only duration and
 * budget are treated as near-hard limits, because ignoring those is annoying.
 */
/** Onboarding answers map onto the same vibe axis the ideas are tagged with. */
const WISH_VIBES = {
    romance: ['romantic'],
    conversation: ['romantic', 'relaxing'],
    fun: ['fun'],
    adventure: ['adventurous'],
    'quality-time': ['relaxing', 'romantic'],
    spontaneity: ['fun', 'adventurous'],
};
const COUPLE_VIBE_VIBES = {
    cozy: ['relaxing'],
    romantic: ['romantic'],
    playful: ['fun'],
    creative: ['creative'],
    adventurous: ['adventurous'],
    exploring: ['adventurous', 'creative'],
};
/**
 * What the couple told us at onboarding, as a gentle thumb on the scale. It is
 * deliberately weaker than an explicit filter — a stated preference should
 * colour the results, never override what someone just tapped.
 */
function profileBoost(idea, profile) {
    if (!profile)
        return 0;
    let boost = 0;
    for (const wish of profile.wishes) {
        if (WISH_VIBES[wish].some((v) => idea.vibes.includes(v)))
            boost += 1.1;
    }
    for (const vibe of profile.vibes) {
        if (COUPLE_VIBE_VIBES[vibe].some((v) => idea.vibes.includes(v)))
            boost += 0.7;
    }
    // Couples who are rarely in the same place get more out of going somewhere.
    if (profile.proximity === 'long-distance' || profile.proximity === 'different-cities') {
        if (idea.setting === 'out')
            boost += 0.6;
    }
    if (profile.wishes.includes('spontaneity') && idea.spontaneity === 'spontaneous')
        boost += 0.8;
    return boost;
}
/** "Not this one, because…" — the feedback chips under the results. */
function feedbackPenalty(idea, feedback) {
    let penalty = 0;
    for (const f of feedback) {
        if (f === 'expensive' && idea.cost > 20)
            penalty += 3 + idea.cost / 25;
        if (f === 'far' && idea.setting === 'out')
            penalty += 3.5;
        if (f === 'effort' && (idea.energy === 'high' || idea.prep !== 'None'))
            penalty += 3;
        if (f === 'mood')
            penalty += 1.2; // shuffles the mix without banning anything
    }
    return penalty;
}
function scoreIdea(idea, f) {
    let score = 0;
    if (f.daypart) {
        if (idea.dayparts.includes(f.daypart))
            score += 3;
        else if (f.daypart === 'wholeday' && idea.duration >= 240)
            score += 1;
        else
            score -= 3;
    }
    if (f.duration != null) {
        if (idea.duration <= f.duration)
            score += 3;
        else if (idea.duration <= f.duration * 1.35)
            score += 1;
        else
            score -= 4;
    }
    if (f.budget != null) {
        if (idea.cost <= f.budget)
            score += 3;
        else if (idea.cost <= f.budget * 1.25)
            score += 1;
        else
            score -= 4;
    }
    if (f.setting)
        score += idea.setting === f.setting ? 3 : -2;
    if (f.vibe)
        score += idea.vibes.includes(f.vibe) ? 3 : -1;
    if (f.energy)
        score += idea.energy === f.energy ? 2 : -1;
    if (f.weather && f.weather !== 'any') {
        score += idea.weather.includes(f.weather) || idea.weather.includes('any') ? 2 : -2;
    }
    return score;
}
export const EMPTY_FILTERS = {
    daypart: null,
    duration: null,
    budget: null,
    setting: null,
    vibe: null,
    energy: null,
    weather: null,
};
export function hasFilters(f) {
    return Object.values(f).some((v) => v !== null);
}
/**
 * `seed` lets "regenerate" reshuffle without changing the filters — ties are
 * broken pseudo-randomly so the same filters can surface different ideas.
 */
export function generateDateIdeas(f, seed = 0, count = 4, profile, feedback = [], exclude = []) {
    const jitter = (id) => {
        let h = seed;
        for (let i = 0; i < id.length; i++)
            h = (h * 31 + id.charCodeAt(i)) >>> 0;
        return (h % 100) / 100;
    };
    const pool = feedback.includes('done')
        ? DATE_IDEAS.filter((i) => !exclude.includes(i.id))
        : DATE_IDEAS;
    return (pool.length ? pool : DATE_IDEAS)
        .map((idea) => ({
        idea,
        score: scoreIdea(idea, f) +
            profileBoost(idea, profile) -
            feedbackPenalty(idea, feedback) +
            jitter(idea.id),
    }))
        .sort((a, b) => b.score - a.score)
        .slice(0, count)
        .map((r) => r.idea);
}
export function surpriseIdea(seed) {
    return DATE_IDEAS[Math.abs(seed) % DATE_IDEAS.length];
}
export function generateAdventures(distance, mood, seed = 0, count = 4) {
    const jitter = (id) => {
        let h = seed;
        for (let i = 0; i < id.length; i++)
            h = (h * 37 + id.charCodeAt(i)) >>> 0;
        return (h % 100) / 100;
    };
    return [...ADVENTURE_IDEAS]
        .map((idea) => {
        let score = 0;
        if (distance)
            score += idea.distance === distance ? 4 : -3;
        if (mood)
            score += idea.moods.includes(mood) ? 4 : -2;
        return { idea, score: score + jitter(idea.id) };
    })
        .sort((a, b) => b.score - a.score)
        .slice(0, count)
        .map((r) => r.idea);
}
export const DAYPART_OPTIONS = [
    { label: 'Morning', value: 'morning', emoji: '\u{1F305}' },
    { label: 'Brunch', value: 'brunch', emoji: '\u{1F950}' },
    { label: 'Afternoon', value: 'afternoon', emoji: '\u{2600}\u{FE0F}' },
    { label: 'Evening', value: 'evening', emoji: '\u{1F319}' },
    { label: 'Late night', value: 'late', emoji: '\u{2728}' },
    { label: 'Whole day', value: 'wholeday', emoji: '\u{1F5D3}\u{FE0F}' },
];
export const DURATION_OPTIONS = [
    { label: '1 hour', value: 60 },
    { label: '2\u20133 hours', value: 180 },
    { label: 'Half day', value: 300 },
    { label: 'Whole day', value: 600 },
];
export const FEEDBACK_OPTIONS = [
    { label: 'Too expensive', value: 'expensive' },
    { label: 'Too far', value: 'far' },
    { label: 'Too much effort', value: 'effort' },
    { label: 'Done this before', value: 'done' },
    { label: 'Different mood', value: 'mood' },
];
export const BUDGET_OPTIONS = [
    { label: 'Free', value: 0 },
    { label: 'Under €30', value: 30 },
    { label: 'Under €60', value: 60 },
    { label: 'Under €150', value: 150 },
];
export const VIBE_OPTIONS = [
    { label: 'Romantic', value: 'romantic', emoji: '🌹' },
    { label: 'Fun', value: 'fun', emoji: '🎲' },
    { label: 'Adventurous', value: 'adventurous', emoji: '🧗' },
    { label: 'Relaxing', value: 'relaxing', emoji: '🛁' },
    { label: 'Creative', value: 'creative', emoji: '🎨' },
];
export const SETTING_OPTIONS = [
    { label: 'At home', value: 'home', emoji: '🏠' },
    { label: 'Out', value: 'out', emoji: '🚪' },
];
export const ENERGY_OPTIONS = [
    { label: 'Low energy', value: 'low', emoji: '🌙' },
    { label: 'Some energy', value: 'medium', emoji: '🌤' },
    { label: 'Plenty', value: 'high', emoji: '⚡' },
];
export const WEATHER_OPTIONS = [
    { label: 'Rainy', value: 'rain', emoji: '🌧' },
    { label: 'Sunny', value: 'sun', emoji: '☀️' },
    { label: 'Cold', value: 'cold', emoji: '❄️' },
    { label: 'Warm', value: 'warm', emoji: '🌡' },
];
export const DISTANCE_OPTIONS = [
    { label: 'Under an hour', value: 'under1', emoji: '🚌' },
    { label: '1–3 hours', value: '1to3', emoji: '🚆' },
    { label: 'A weekend', value: 'weekend', emoji: '🧳' },
];
export const MOOD_OPTIONS = [
    { label: 'Romantic', value: 'romantic', emoji: '🌹' },
    { label: 'Nature', value: 'nature', emoji: '🌲' },
    { label: 'Food', value: 'food', emoji: '🍽' },
    { label: 'Adventure', value: 'adventure', emoji: '🧭' },
    { label: 'Relaxing', value: 'relaxing', emoji: '♨️' },
    { label: 'Culture', value: 'culture', emoji: '🏛' },
];
/**
 * The bridge between Talk and Explore. When both partners have answered
 * today's question, their own words pick the starting filters — so "we should
 * do a breakfast thing" opens the generator on morning and cozy rather than
 * on nothing. Deliberately shallow keyword matching: it only ever pre-selects
 * chips the user can see and change.
 */
const CUES = [
    { match: /\b(breakfast|sunrise|early|morning|coffee)\b/i, filters: { daypart: 'morning' }, label: 'morning' },
    { match: /\b(brunch|pastry|pastries|bakery)\b/i, filters: { daypart: 'brunch' }, label: 'brunch' },
    { match: /\b(lunch|afternoon|daytime)\b/i, filters: { daypart: 'afternoon' }, label: 'afternoon' },
    { match: /\b(dinner|evening|tonight|supper)\b/i, filters: { daypart: 'evening' }, label: 'evening' },
    { match: /\b(late|midnight|stars?|stargaz\w*)\b/i, filters: { daypart: 'late' }, label: 'late night' },
    { match: /\b(weekend|all day|whole day)\b/i, filters: { daypart: 'wholeday' }, label: 'a whole day' },
    { match: /\b(cozy|cosy|blanket|sofa|couch|home|indoors|pyjamas|pajamas)\b/i, filters: { setting: 'home', vibe: 'relaxing' }, label: 'cozy' },
    { match: /\b(walk|hike|outside|outdoors|park|beach|lake|mountain)\b/i, filters: { setting: 'out' }, label: 'outdoors' },
    { match: /\b(danc\w+|laugh\w*|silly|game|play\w*|fun)\b/i, filters: { vibe: 'fun' }, label: 'playful' },
    { match: /\b(cook\w*|bak\w*|paint\w*|draw\w*|build\w*|make|creat\w+|craft)\b/i, filters: { vibe: 'creative' }, label: 'creative' },
    { match: /\b(travel|trip|drive|road|explor\w+|adventur\w+|somewhere new)\b/i, filters: { vibe: 'adventurous' }, label: 'adventurous' },
    { match: /\b(quiet|slow|rest\w*|relax\w*|calm|nothing)\b/i, filters: { vibe: 'relaxing' }, label: 'slow' },
    { match: /\b(romanc\w*|romantic|kiss\w*|close|intimate)\b/i, filters: { vibe: 'romantic' }, label: 'romantic' },
];
export function cueFromText(text) {
    const hits = CUES.filter((c) => c.match.test(text));
    if (!hits.length)
        return null;
    const filters = {};
    const labels = [];
    for (const hit of hits) {
        // First cue of each kind wins, so one sentence cannot set daypart twice.
        for (const [k, v] of Object.entries(hit.filters)) {
            if (filters[k] == null)
                filters[k] = v;
        }
        if (labels.length < 2 && !labels.includes(hit.label))
            labels.push(hit.label);
    }
    return Object.keys(filters).length ? { filters, label: labels.join(' · ') } : null;
}
/** Encodes a cue as Explore query params. */
export function cueToParams(cue) {
    const p = new URLSearchParams({ tier: 'day' });
    for (const [k, v] of Object.entries(cue.filters)) {
        if (v != null)
            p.set(k, String(v));
    }
    return p.toString();
}
