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

/* ------------------------------ Notifications ----------------------------- */

export type NotificationKind =
  | 'daily-answer'
  | 'note'
  | 'date-soon'
  | 'ritual-due'
  | 'capture-memory';

export interface AppNotification {
  id: ID;
  kind: NotificationKind;
  emoji: string;
  title: string;
  body: string;
  /** Where tapping it takes you. */
  to: string;
  /** Sort key, newest first. */
  at: number;
  read: boolean;
}

/**
 * Notifications are derived from state on every read rather than stored, so
 * they cannot drift out of sync with the thing they describe — a note that
 * gets deleted takes its notification with it. Only the read set is persisted.
 */
export function notifications(state: AppState, meId: ID, partnerId: ID, now = today()): AppNotification[] {
  const items: Omit<AppNotification, 'read'>[] = [];
  const partner = state.couple.people.find((p) => p.id === partnerId);
  const partnerName = partner?.name ?? 'Your partner';

  const status = dailyStatus(state, meId, partnerId, now);
  if (status.answeredByPartner) {
    items.push({
      id: `daily-${now}`,
      kind: 'daily-answer',
      emoji: '💬',
      title: `${partnerName} answered today's question`,
      body: status.answeredByMe
        ? 'Both answers are unlocked.'
        : 'Yours unlocks it for both of you.',
      to: '/talk/daily',
      at: Date.now(),
    });
  }

  for (const note of inboxNotes(state, meId)) {
    if (note.readAt) continue;
    items.push({
      id: `note-${note.id}`,
      kind: 'note',
      emoji: '💌',
      title: `A note from ${partnerName}`,
      body: note.body.length > 62 ? `${note.body.slice(0, 62)}…` : note.body,
      to: '/talk/notes',
      at: new Date(note.createdAt).getTime(),
    });
  }

  for (const tier of ['day', 'week', 'month'] as RitualTier[]) {
    const r = ritualStatus(state, tier, now);
    if (r.plan && r.daysAway >= 0 && r.daysAway <= 3) {
      items.push({
        id: `date-${r.plan.id}`,
        kind: 'date-soon',
        emoji: r.plan.emoji,
        title:
          r.daysAway === 0
            ? `${r.plan.title} is today`
            : `${r.plan.title} — ${countdownLabel(now, r.plan.date).toLowerCase()}`,
        body: TIER_META[tier].label,
        to: `/plan/${r.plan.id}`,
        at: Date.now() - r.daysAway * 1000,
      });
    }
    if (r.overdue) {
      items.push({
        id: `due-${tier}-${now.slice(0, 7)}`,
        kind: 'ritual-due',
        emoji: '🌿',
        title: `Your ${TIER_META[tier].cadence} is due`,
        body: TIER_META[tier].hint,
        to: `/plan/new/${tier}`,
        at: Date.now() - 2000,
      });
    }
  }

  const awaiting = planAwaitingMemory(state);
  if (awaiting) {
    items.push({
      id: `memory-${awaiting.id}`,
      kind: 'capture-memory',
      emoji: '📷',
      title: `Turn ${awaiting.title.toLowerCase()} into a memory`,
      body: 'Add a photo and a line each, while it is still fresh.',
      to: `/memories/new?plan=${awaiting.id}`,
      at: new Date(awaiting.completedAt ?? Date.now()).getTime(),
    });
  }

  return items
    .map((n) => ({ ...n, read: state.readNotificationIds.includes(n.id) }))
    .sort((a, b) => b.at - a.at);
}

export function unreadNotificationCount(state: AppState, meId: ID, partnerId: ID): number {
  return notifications(state, meId, partnerId).filter((n) => !n.read).length;
}

/* ------------------------------- Milestones ------------------------------- */

export interface Milestone {
  id: string;
  emoji: string;
  label: string;
  /** Reached, or still ahead. */
  done: boolean;
  progress: string;
  to?: string;
}

/**
 * Deliberately not a score. These mark things that actually happened, and none
 * of them rate the relationship — there is no "streak lost" and no league.
 */
export function milestones(state: AppState): Milestone[] {
  const stats = relationshipStats(state);
  const fullCycle = stats.dates > 0 && stats.mini > 0 && stats.big > 0;

  return [
    {
      id: 'cycle',
      emoji: '🔄',
      label: 'First full 777 cycle',
      done: fullCycle,
      progress: fullCycle ? 'Done' : 'One of each to go',
      to: '/memories',
    },
    {
      id: 'checkins',
      emoji: '🌿',
      label: '25 days of checking in',
      done: stats.checkInDays >= 25,
      progress: `${stats.checkInDays} days`,
      to: '/talk/daily',
    },
    {
      id: 'dates',
      emoji: '🍷',
      label: '10 dates made time for',
      done: stats.dates >= 10,
      progress: `${stats.dates} kept`,
      to: '/memories?kind=day',
    },
    {
      id: 'mini',
      emoji: '🏔️',
      label: '3 mini adventures',
      done: stats.mini >= 3,
      progress: `${stats.mini} so far`,
      to: '/memories?kind=week',
    },
  ];
}

/** Memories per month for the last 12 months — the year strip on Us. */
export function memoryYear(state: AppState, now = today()): { key: string; count: number }[] {
  const out: { key: string; count: number }[] = [];
  const [y, m] = now.split('-').map(Number);
  for (let i = 11; i >= 0; i--) {
    const d = new Date(y, m - 1 - i, 1);
    const key = `${d.getFullYear()}-${`${d.getMonth() + 1}`.padStart(2, '0')}`;
    out.push({ key, count: state.memories.filter((mem) => mem.date.startsWith(key)).length });
  }
  return out;
}
