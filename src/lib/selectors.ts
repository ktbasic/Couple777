import type { AppState, Cycle, ID, Memory, Plan, RitualTier } from './types';
import { byAttention, viewOpenCycles, type CycleView } from './cycles';
import { TIER_META, countdownLabel, today } from './dates';

/**
 * The ritual layer is now the cycle engine — see `lib/cycles.ts`. These are
 * the read helpers screens use.
 */
export function ritualViews(state: AppState, now = today()): CycleView[] {
  return viewOpenCycles(state.cycles, state.plans, now);
}

export function ritualView(state: AppState, tier: RitualTier, now = today()): CycleView | undefined {
  return ritualViews(state, now).find((v) => v.cycle.tier === tier);
}

/** The cycle that most needs a decision. */
export function upNext(state: AppState, now = today()): CycleView | undefined {
  return byAttention(ritualViews(state, now))[0];
}

/** The other two, in 7/7/7 order. */
export function alsoAhead(state: AppState, now = today()): CycleView[] {
  const hero = upNext(state, now);
  const order: RitualTier[] = ['day', 'week', 'month'];
  return ritualViews(state, now)
    .filter((v) => v.cycle.id !== hero?.cycle.id)
    .sort((a, b) => order.indexOf(a.cycle.tier) - order.indexOf(b.cycle.tier));
}

export function planForCycle(state: AppState, cycleId: ID): Plan | undefined {
  return state.plans.find((p) => p.cycleId === cycleId);
}

export function cycleForPlan(state: AppState, plan: Plan): Cycle | undefined {
  return state.cycles.find((c) => c.id === plan.cycleId);
}

/** Completed cycles whose moment has happened but has no memory yet. */
export function cycleAwaitingMemory(state: AppState): { cycle: Cycle; plan?: Plan } | undefined {
  const c = state.cycles
    .filter((x) => x.completedAt && !x.memoryId && x.planId)
    .sort((a, b) => (b.completedAt ?? '').localeCompare(a.completedAt ?? ''))[0];
  return c ? { cycle: c, plan: state.plans.find((p) => p.id === c.planId) } : undefined;
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
  // Cycles closed by a larger overlapping moment are not counted twice —
  // a weekend away is one thing the couple did, not two.
  const done = state.cycles.filter((c) => c.completedAt && !c.satisfiedBy);
  const count = (t: RitualTier) => done.filter((c) => c.tier === t).length;
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
  | 'capture-memory'
  /* Written by the other person on their own phone, so it cannot be derived. */
  | 'from-partner'
  /* Today's question, when nobody has answered it yet — a nudge rather than
     news, so it waits until nothing about the two of you is waiting. */
  | 'daily-nudge'
  /* Optional housekeeping, and the only kind that is about the app rather
     than about the two of you. */
  | 'profile';

export interface AppNotification {
  id: ID;
  kind: NotificationKind;
  emoji: string;
  title: string;
  body: string;
  /** Where tapping it takes you. */
  to: string;
  /** Sort key, newest first, within a priority band. */
  at: number;
  read: boolean;
  /**
   * A named action, for the items where the row alone does not say what
   * tapping it will do. Relationship items never need one — "Marian said yes"
   * is its own instruction.
   */
  cta?: string;
}

/*
 * What matters, in order.
 *
 * Sorting by time alone let a two-day-old nudge about your own profile sit
 * above your partner asking you out this evening. Time only decides between
 * things of the same weight now.
 */
const PRIORITY: Record<NotificationKind, number> = {
  'from-partner': 1,
  note: 1,
  'date-soon': 2,
  'ritual-due': 2,
  'daily-answer': 3,
  'daily-nudge': 3,
  'capture-memory': 4,
  profile: 5,
};

export function byPriority(a: AppNotification, b: AppNotification): number {
  return PRIORITY[a.kind] - PRIORITY[b.kind] || b.at - a.at;
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
      /* Once both are in there is nothing to do, so no action is offered. */
      body: status.answeredByMe
        ? 'Both answers are unlocked.'
        : 'Write yours to reveal both answers.',
      to: '/talk/daily',
      cta: status.answeredByMe ? undefined : 'Write my answer',
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

  for (const v of ritualViews(state, now)) {
    if (v.plan && v.daysAway >= 0 && v.daysAway <= 3) {
      items.push({
        id: `date-${v.plan.id}`,
        kind: 'date-soon',
        emoji: v.plan.emoji,
        title:
          v.daysAway === 0
            ? `${v.plan.title} is today`
            : `${v.plan.title} — ${countdownLabel(now, v.plan.date).toLowerCase()}`,
        body: TIER_META[v.cycle.tier].label,
        to: `/plan/${v.plan.id}`,
        at: Date.now() - v.daysAway * 1000,
      });
    }
    if (v.overdue) {
      items.push({
        id: `due-${v.cycle.id}`,
        kind: 'ritual-due',
        emoji: '🌿',
        title: `Life got busy — your ${TIER_META[v.cycle.tier].cadence} is open`,
        body: TIER_META[v.cycle.tier].hint,
        to: `/plan/new?cycle=${v.cycle.id}`,
        at: Date.now() - 2000,
      });
    }
  }

  const awaiting = cycleAwaitingMemory(state);
  if (awaiting?.plan) {
    items.push({
      id: `memory-${awaiting.cycle.id}`,
      kind: 'capture-memory',
      emoji: awaiting.plan.emoji,
      title: `How was ${awaiting.plan.title.toLowerCase()}?`,
      body: 'Turn it into a memory while it is still fresh.',
      to: `/memories/new?cycle=${awaiting.cycle.id}`,
      at: new Date(awaiting.cycle.completedAt ?? Date.now()).getTime(),
    });
  }

  return items
    .map((n) => ({ ...n, read: state.readNotificationIds.includes(n.id) }))
    .sort(byPriority);
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
