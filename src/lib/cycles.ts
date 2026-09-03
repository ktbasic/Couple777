import type { Cycle, CycleStatus, ID, ISODate, Plan, RitualTier } from './types';
import { TIER_META, addDays, daysBetween, today } from './dates';
import { uid } from './id';

/**
 * The 777 engine.
 *
 * Three clocks run independently from the day the couple starts. Each turn of
 * a clock is a Cycle. The rhythm decides *when*; the couple decides *what*,
 * so nothing in here ever asks anyone to classify an activity.
 */

const TIERS: RitualTier[] = ['day', 'week', 'month'];

/** Larger moments count for the smaller cycles they overlap. */
const SATISFIES: Record<RitualTier, RitualTier[]> = {
  month: ['week', 'day'],
  week: ['day'],
  day: [],
};

export function createInitialCycles(start: ISODate = today()): Cycle[] {
  return TIERS.map((tier, i) => ({
    id: `cy-${tier}-1-${i}`,
    tier,
    seq: 1,
    startDate: start,
    dueDate: addDays(start, TIER_META[tier].intervalDays),
  }));
}

export function openCycle(cycles: Cycle[], tier: RitualTier): Cycle | undefined {
  return cycles
    .filter((c) => c.tier === tier && !c.completedAt)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0];
}

export function openCycles(cycles: Cycle[]): Cycle[] {
  return TIERS.map((t) => openCycle(cycles, t)).filter((c): c is Cycle => Boolean(c));
}

export function cycleById(cycles: Cycle[], id?: ID): Cycle | undefined {
  return cycles.find((c) => c.id === id);
}

/**
 * The next turn keeps the established rhythm: it advances from the due date,
 * not from when the moment actually happened, so having a date two days early
 * does not permanently shift the couple's schedule. Overdue cycles advance by
 * whole intervals until they land ahead of today.
 */
function nextTurn(cycle: Cycle, on: ISODate): Cycle {
  const step = TIER_META[cycle.tier].intervalDays;
  let due = addDays(cycle.dueDate, step);
  while (daysBetween(on, due) < 1) due = addDays(due, step);
  return {
    id: uid(`cy-${cycle.tier}`),
    tier: cycle.tier,
    seq: cycle.seq + 1,
    startDate: cycle.dueDate,
    dueDate: due,
  };
}

export interface CompletionResult {
  cycles: Cycle[];
  /** The cycles this moment closed — the first is the one acted on. */
  closed: Cycle[];
}

/**
 * Completing a cycle also closes the smaller open cycles it overlaps, because
 * a weekend away is plainly also this week's time together. The couple is
 * never asked to do two things to satisfy two clocks.
 */
export function completeCycle(cycles: Cycle[], cycleId: ID, on: ISODate = today()): CompletionResult {
  const target = cycles.find((c) => c.id === cycleId);
  if (!target || target.completedAt) return { cycles, closed: [] };

  const at = new Date().toISOString();
  const alsoClosed = SATISFIES[target.tier]
    .map((t) => openCycle(cycles, t))
    .filter((c): c is Cycle => Boolean(c) && c!.id !== target.id);

  const closed = [target, ...alsoClosed];
  const closedIds = new Set(closed.map((c) => c.id));

  const updated = cycles.map((c) =>
    closedIds.has(c.id)
      ? {
          ...c,
          completedAt: at,
          satisfiedBy: c.id === target.id ? undefined : target.id,
        }
      : c,
  );

  return { cycles: [...updated, ...closed.map((c) => nextTurn(c, on))], closed };
}

/* --------------------------------- Status -------------------------------- */

export function cycleStatus(cycle: Cycle, plan?: Plan): CycleStatus {
  if (cycle.completedAt) return 'completed';
  if (!plan) return 'upcoming';
  if (plan.invite?.response === 'yes') return 'confirmed';
  if (plan.invite?.sentAt) return 'invited';
  return 'planned';
}

export const STATUS_LABEL: Record<CycleStatus, string> = {
  upcoming: 'Nothing planned yet',
  planned: 'Planned',
  invited: 'Invite sent',
  confirmed: "You're on",
  completed: 'Another memory made',
};

/* ------------------------------- Attention ------------------------------- */

export interface CycleView {
  cycle: Cycle;
  plan?: Plan;
  status: CycleStatus;
  /** Days until due. Negative means the window has passed. */
  daysAway: number;
  overdue: boolean;
  /** 0 → 1 through this turn. */
  progress: number;
}

export function viewCycle(cycle: Cycle, plans: Plan[], now: ISODate = today()): CycleView {
  const plan = plans.find((p) => p.id === cycle.planId);
  const span = Math.max(1, daysBetween(cycle.startDate, cycle.dueDate));
  const elapsed = daysBetween(cycle.startDate, now);
  return {
    cycle,
    plan,
    status: cycleStatus(cycle, plan),
    daysAway: daysBetween(now, cycle.dueDate),
    overdue: !cycle.completedAt && daysBetween(now, cycle.dueDate) < 0,
    progress: Math.min(1, Math.max(0, elapsed / span)),
  };
}

export function viewOpenCycles(cycles: Cycle[], plans: Plan[], now: ISODate = today()): CycleView[] {
  return openCycles(cycles).map((c) => viewCycle(c, plans, now));
}

/**
 * Which cycle deserves the hero slot. Time remaining leads, but a cycle with
 * nothing planned pulls forward and a confirmed one steps back — attention
 * should go where a decision is still needed, not simply to whatever is soonest.
 */
export function attentionScore(view: CycleView): number {
  let score = view.daysAway;
  if (view.status === 'upcoming') score -= 5;
  if (view.status === 'planned') score -= 1;
  if (view.status === 'invited') score += 3;
  if (view.status === 'confirmed') score += 7;
  return score;
}

export function byAttention(views: CycleView[]): CycleView[] {
  return [...views].sort((a, b) => attentionScore(a) - attentionScore(b));
}

/* --------------------------------- Copy ---------------------------------- */

export const CYCLE_NOUN: Record<RitualTier, string> = {
  day: 'moment together',
  week: 'little adventure',
  month: 'big adventure',
};

/** Gentle, never a scold. */
export function cycleHeadline(view: CycleView): string {
  const noun = CYCLE_NOUN[view.cycle.tier];
  if (view.overdue) return `Life got busy. Ready for your next ${noun}?`;
  if (view.daysAway === 0) return `Your ${noun} is today`;
  if (view.daysAway === 1) return `Your ${noun} is tomorrow`;
  return `${view.daysAway} days to your next ${noun}`;
}
