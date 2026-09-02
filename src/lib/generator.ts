import { DATE_IDEAS } from '@/data/dateIdeas';
import { ADVENTURE_IDEAS } from '@/data/adventures';
import type { AdventureIdea, AdventureMood, DateIdea, Distance, IdeaFilters } from './types';

/**
 * Soft scoring rather than hard filtering: an over-constrained set should still
 * return the closest three ideas instead of an empty screen. Only duration and
 * budget are treated as near-hard limits, because ignoring those is annoying.
 */
function scoreIdea(idea: DateIdea, f: IdeaFilters): number {
  let score = 0;

  if (f.duration != null) {
    if (idea.duration <= f.duration) score += 3;
    else if (idea.duration <= f.duration * 1.35) score += 1;
    else score -= 4;
  }

  if (f.budget != null) {
    if (idea.cost <= f.budget) score += 3;
    else if (idea.cost <= f.budget * 1.25) score += 1;
    else score -= 4;
  }

  if (f.setting) score += idea.setting === f.setting ? 3 : -2;
  if (f.vibe) score += idea.vibes.includes(f.vibe) ? 3 : -1;
  if (f.energy) score += idea.energy === f.energy ? 2 : -1;
  if (f.weather && f.weather !== 'any') {
    score += idea.weather.includes(f.weather) || idea.weather.includes('any') ? 2 : -2;
  }

  return score;
}

export const EMPTY_FILTERS: IdeaFilters = {
  duration: null,
  budget: null,
  setting: null,
  vibe: null,
  energy: null,
  weather: null,
};

export function hasFilters(f: IdeaFilters): boolean {
  return Object.values(f).some((v) => v !== null);
}

/**
 * `seed` lets "regenerate" reshuffle without changing the filters — ties are
 * broken pseudo-randomly so the same filters can surface different ideas.
 */
export function generateDateIdeas(f: IdeaFilters, seed = 0, count = 4): DateIdea[] {
  const jitter = (id: string) => {
    let h = seed;
    for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
    return (h % 100) / 100;
  };

  return [...DATE_IDEAS]
    .map((idea) => ({ idea, score: scoreIdea(idea, f) + jitter(idea.id) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, count)
    .map((r) => r.idea);
}

export function surpriseIdea(seed: number): DateIdea {
  return DATE_IDEAS[Math.abs(seed) % DATE_IDEAS.length];
}

export function generateAdventures(
  distance: Distance | null,
  mood: AdventureMood | null,
  seed = 0,
  count = 4,
): AdventureIdea[] {
  const jitter = (id: string) => {
    let h = seed;
    for (let i = 0; i < id.length; i++) h = (h * 37 + id.charCodeAt(i)) >>> 0;
    return (h % 100) / 100;
  };

  return [...ADVENTURE_IDEAS]
    .map((idea) => {
      let score = 0;
      if (distance) score += idea.distance === distance ? 4 : -3;
      if (mood) score += idea.moods.includes(mood) ? 4 : -2;
      return { idea, score: score + jitter(idea.id) };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, count)
    .map((r) => r.idea);
}

export const DURATION_OPTIONS = [
  { label: '1 hour', value: 60 },
  { label: '2 hours', value: 120 },
  { label: 'An evening', value: 240 },
  { label: 'All day', value: 600 },
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
] as const;

export const SETTING_OPTIONS = [
  { label: 'At home', value: 'home', emoji: '🏠' },
  { label: 'Out', value: 'out', emoji: '🚪' },
] as const;

export const ENERGY_OPTIONS = [
  { label: 'Low energy', value: 'low', emoji: '🌙' },
  { label: 'Some energy', value: 'medium', emoji: '🌤' },
  { label: 'Plenty', value: 'high', emoji: '⚡' },
] as const;

export const WEATHER_OPTIONS = [
  { label: 'Rainy', value: 'rain', emoji: '🌧' },
  { label: 'Sunny', value: 'sun', emoji: '☀️' },
  { label: 'Cold', value: 'cold', emoji: '❄️' },
  { label: 'Warm', value: 'warm', emoji: '🌡' },
] as const;

export const DISTANCE_OPTIONS = [
  { label: 'Under an hour', value: 'under1', emoji: '🚌' },
  { label: '1–3 hours', value: '1to3', emoji: '🚆' },
  { label: 'A weekend', value: 'weekend', emoji: '🧳' },
] as const;

export const MOOD_OPTIONS = [
  { label: 'Romantic', value: 'romantic', emoji: '🌹' },
  { label: 'Nature', value: 'nature', emoji: '🌲' },
  { label: 'Food', value: 'food', emoji: '🍽' },
  { label: 'Adventure', value: 'adventure', emoji: '🧭' },
  { label: 'Relaxing', value: 'relaxing', emoji: '♨️' },
  { label: 'Culture', value: 'culture', emoji: '🏛' },
] as const;
