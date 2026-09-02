import type { AppState, ID, Memory, Plan, RitualTier } from './types';
import { TIER_META, countdownLabel, cycleProgress, daysBetween, dueDate, today } from './dates';

/** The next planned item for a tier, if there is one. */
export function nextPlan(plans: Plan[], tier: RitualTier, now = today()): Plan | undefined {
  return plans
    .filter((p) => p.tier === tier && p.status === 'planned' && daysBetween(now, p.date) >= 0)
    .sort((a, b) => a.date.localeCompare(b.date))[0];
}

export function lastCompleted(plans: Plan[], tier: RitualTier): Plan | undefined {
  return plans
    .filter((p) => p.tier === tier && p.status === 'completed')
    .sort((a, b) => b.date.localeCompare(a.date))[0];
}

export interface RitualStatus {
  tier: RitualTier;
  plan?: Plan;
  /** The date the countdown is pointing at — planned, or otherwise when it is due. */
  targetDate: string;
  daysAway: number;
  label: string;
  /** True when nothing is planned and the window has already passed. */
  overdue: boolean;
  /** 0 → 1 through the current cycle. */
  progress: number;
}

export function ritualStatus(state: AppState, tier: RitualTier, now = today()): RitualStatus {
  const plan = nextPlan(state.plans, tier, now);
  const last = lastCompleted(state.plans, tier);
  const due = dueDate(tier, last?.date ?? null);
  const targetDate = plan?.date ?? due;
  const daysAway = daysBetween(now, targetDate);

  return {
    tier,
    plan,
    targetDate,
    daysAway,
    label: countdownLabel(now, targetDate),
    overdue: !plan && daysAway <= 0,
    progress: cycleProgress(tier, last?.date ?? null, now),
  };
}

/** All three, ordered by urgency — the closest ritual gets the visual weight. */
export function allRituals(state: AppState, now = today()): RitualStatus[] {
  return (['day', 'week', 'month'] as RitualTier[]).map((t) => ritualStatus(state, t, now));
}

export function mostUrgent(state: AppState, now = today()): RitualStatus {
  return [...allRituals(state, now)].sort((a, b) => {
    if (a.overdue !== b.overdue) return a.overdue ? -1 : 1;
    return a.daysAway - b.daysAway;
  })[0];
}

/* ------------------------------- Memories -------------------------------- */

export function sortedMemories(memories: Memory[]): Memory[] {
  return [...memories].sort((a, b) => b.date.localeCompare(a.date));
}

export function memoriesByMonth(memories: Memory[]): { key: string; items: Memory[] }[] {
  const groups = new Map<string, Memory[]>();
  for (const m of sortedMemories(memories)) {
    const key = m.date.slice(0, 7);
    const bucket = groups.get(key);
    if (bucket) bucket.push(m);
    else groups.set(key, [m]);
  }
  return [...groups.entries()].map(([key, items]) => ({ key, items }));
}

/** A completed plan with no memory yet — the prompt to capture one. */
export function planAwaitingMemory(state: AppState): Plan | undefined {
  return state.plans
    .filter((p) => p.status === 'completed' && !p.memoryId)
    .sort((a, b) => b.date.localeCompare(a.date))[0];
}

/* --------------------------------- Notes --------------------------------- */

export function inboxNotes(state: AppState, meId: ID) {
  const now = Date.now();
  return state.notes.filter(
    (n) =>
      n.from !== meId &&
      n.kind !== 'private' &&
      (!n.deliverAt || new Date(n.deliverAt).getTime() <= now),
  );
}

export function scheduledNotes(state: AppState, meId: ID) {
  const now = Date.now();
  return state.notes.filter(
    (n) => n.from === meId && n.deliverAt && new Date(n.deliverAt).getTime() > now,
  );
}

export function sentNotes(state: AppState, meId: ID) {
  const now = Date.now();
  return state.notes.filter(
    (n) =>
      n.from === meId &&
      n.kind !== 'private' &&
      (!n.deliverAt || new Date(n.deliverAt).getTime() <= now),
  );
}

export function privateNotes(state: AppState, meId: ID) {
  return state.notes.filter((n) => n.from === meId && n.kind === 'private');
}

export function unreadCount(state: AppState, meId: ID): number {
  return inboxNotes(state, meId).filter((n) => !n.readAt).length;
}

/* ------------------------------ Destinations ----------------------------- */

/**
 * Matches the couple has actually been shown. Anything mutual but unrevealed
 * must stay out of every list — naming it early spoils the reveal, which is
 * the entire point of saving in secret.
 */
export function matches(state: AppState) {
  return state.destinations.filter((d) => d.savedBy.length === 2 && d.matchSeen);
}

/** A match neither partner has been shown yet — the reveal moment. */
export function newMatch(state: AppState) {
  return state.destinations.find((d) => d.savedBy.length === 2 && !d.matchSeen);
}

/* --------------------------------- Daily --------------------------------- */

export function dailyEntry(state: AppState, date = today()) {
  return state.daily.find((e) => e.date === date);
}

export interface DailyStatus {
  answeredByMe: boolean;
  answeredByPartner: boolean;
  bothAnswered: boolean;
}

export function dailyStatus(state: AppState, meId: ID, partnerId: ID, date = today()): DailyStatus {
  const entry = dailyEntry(state, date);
  const answeredByMe = Boolean(entry?.answers[meId]);
  const answeredByPartner = Boolean(entry?.answers[partnerId]);
  return { answeredByMe, answeredByPartner, bothAnswered: answeredByMe && answeredByPartner };
}

/* -------------------------------- Profile -------------------------------- */

export interface RelationshipStats {
  total: number;
  dates: number;
  mini: number;
  big: number;
  memories: number;
  photos: number;
  conversations: number;
  checkInDays: number;
}

export function relationshipStats(state: AppState): RelationshipStats {
  const done = state.plans.filter((p) => p.status === 'completed');
  const count = (t: RitualTier) => done.filter((p) => p.tier === t).length;
  return {
    total: done.length + state.memories.filter((m) => !m.planId).length,
    dates: count('day'),
    mini: count('week'),
    big: count('month'),
    memories: state.memories.length,
    photos: state.memories.reduce((n, m) => n + m.photos.length, 0),
    conversations: state.roomSessions.filter((s) => s.completedAt).length,
    checkInDays: state.checkInDays,
  };
}

export { TIER_META };
