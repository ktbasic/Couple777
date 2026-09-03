import type {
  AppState,
  Couple,
  CoupleProfile,
  Cycle,
  Memory,
  Person,
  Plan,
  RitualTier,
  Trip,
} from '@/lib/types';
import type {
  CoupleRow,
  CycleRow,
  Json,
  MemoryRow,
  NotificationRow,
  PlanInviteRow,
  PlanRow,
  ProfileRow,
} from './schema';
import * as repo from './repo';

/**
 * Remote rows in, the app's existing read model out.
 *
 * The screens all speak AppState, and this iteration is not the moment to
 * rewrite them, so Supabase is mapped into that shape rather than replacing
 * it. Two things are worth knowing about the translation:
 *
 *   - A Person's id is now the Supabase user id. Everything keyed by person —
 *     who planned this, whose words these are — therefore survives sign-out
 *     and reaches the other phone meaning the same thing.
 *   - Until a partner joins there is no second account, so people[1] is a
 *     placeholder built from the name the first partner typed. `partnerJoined`
 *     is simply whether the second seat is filled, which is the only honest
 *     definition of it.
 */

export const PLACEHOLDER_PARTNER_ID = 'partner-not-joined';

export interface CoupleSpace {
  coupleId: string;
  couple: Couple;
  rhythmStart: string;
  cycles: Cycle[];
  plans: Plan[];
  memories: Memory[];
  invites: PlanInviteRow[];
  /** The invitation waiting on this user right now, if there is one. */
  incoming: PlanInviteRow | null;
  /** This user's own notification rows. RLS makes "own" literal. */
  notifications: NotificationRow[];
}

/* --------------------------------- Mapping --------------------------------- */

function personFromProfile(p: ProfileRow): Person {
  const name = p.display_name || 'You';
  return {
    id: p.id,
    name,
    avatarId: p.avatar_type === 'avatar' ? (p.avatar_value ?? undefined) : undefined,
    avatarUrl: p.avatar_type === 'photo' ? (p.avatar_value ?? undefined) : undefined,
    initial: name.charAt(0).toUpperCase() || '?',
  };
}

function placeholderPartner(name: string): Person {
  const label = name.trim() || 'Your partner';
  return { id: PLACEHOLDER_PARTNER_ID, name: label, initial: label.charAt(0).toUpperCase() };
}

export function cycleFromRow(r: CycleRow, planId?: string, memoryId?: string): Cycle {
  return {
    id: r.id,
    tier: r.tier as RitualTier,
    seq: r.seq,
    startDate: r.start_date,
    dueDate: r.due_date,
    completedAt: r.completed_at ?? undefined,
    satisfiedBy: r.satisfied_by ?? undefined,
    planId,
    memoryId,
  };
}

export function planFromRow(r: PlanRow, invite?: PlanInviteRow): Plan {
  return {
    id: r.id,
    cycleId: r.cycle_id ?? '',
    title: r.title,
    emoji: r.emoji || '❤️',
    date: r.scheduled_date ?? '',
    time: r.scheduled_time ?? undefined,
    createdBy: r.created_by,
    surprise: r.surprise,
    place: r.location ?? undefined,
    note: r.description ?? undefined,
    link: r.external_link ?? undefined,
    cost: r.cost ?? undefined,
    reserved: r.reserved,
    trip: (r.trip as Trip | null) ?? undefined,
    // The app reads an invite as "sent / answered"; the row carries more, but
    // this keeps every existing screen working unchanged.
    invite: invite
      ? {
          sentAt: invite.created_at,
          message: invite.message ?? undefined,
          respondedAt: invite.responded_at ?? undefined,
          response:
            invite.status === 'accepted'
              ? 'yes'
              : invite.status === 'declined'
                ? 'cant'
                : invite.status === 'suggested_change'
                  ? 'reschedule'
                  : undefined,
        }
      : undefined,
  };
}

export function planToRow(
  plan: Plan,
  coupleId: string,
  status?: PlanRow['status'],
): Partial<PlanRow> {
  return {
    id: plan.id.startsWith('pl-') ? undefined : plan.id,
    couple_id: coupleId,
    cycle_id: plan.cycleId || null,
    created_by: plan.createdBy,
    title: plan.title,
    emoji: plan.emoji,
    description: plan.note ?? null,
    scheduled_date: plan.date || null,
    scheduled_time: plan.time ?? null,
    location: plan.place ?? null,
    external_link: plan.link ?? null,
    cost: plan.cost ?? null,
    reserved: Boolean(plan.reserved),
    surprise: plan.surprise,
    trip: (plan.trip as unknown as Json) ?? null,
    ...(status ? { status } : {}),
  };
}

export function memoryFromRow(r: MemoryRow, privateNote?: string, ownerId?: string): Memory {
  return {
    id: r.id,
    date: r.happened_on,
    title: r.title,
    emoji: r.emoji || '❤️',
    kind: r.kind as Memory['kind'],
    place: r.place ?? undefined,
    photos: r.photos ?? [],
    mood: (r.mood as Memory['mood']) ?? undefined,
    sharedNote: r.shared_note ?? undefined,
    notes: {},
    privateNotes: privateNote && ownerId ? { [ownerId]: privateNote } : {},
    planId: r.plan_id ?? undefined,
    cycleId: r.cycle_id ?? undefined,
  };
}

function coupleFromRows(
  row: CoupleRow,
  profiles: ProfileRow[],
  meId: string,
): Couple {
  const byId = new Map(profiles.map((p) => [p.id, p]));
  const first = byId.get(row.partner_1_user_id);
  const second = row.partner_2_user_id ? byId.get(row.partner_2_user_id) : undefined;

  const a = first ? personFromProfile(first) : placeholderPartner('You');
  const b = second ? personFromProfile(second) : placeholderPartner(row.partner_2_name ?? '');

  return {
    id: row.id,
    // Whoever is holding the phone reads first, so "You and Marian" is right
    // on both devices without either screen being told which one it is.
    people: (meId === b.id ? [b, a] : [a, b]) as [Person, Person],
    togetherSince: row.together_since ?? '',
    homeCity: row.home_base ?? '',
    inviteCode: row.invite_code,
    currentPersonId: meId,
    partnerJoined: Boolean(row.partner_2_user_id),
    profile: (row.profile as unknown as CoupleProfile) ?? emptyCoupleProfile(),
  };
}

export function emptyCoupleProfile(): CoupleProfile {
  return { wishes: [], status: 'unsaid', proximity: 'together', vibes: [] };
}

/* --------------------------------- Loading --------------------------------- */

/** Everything the app needs for a signed-in member of a couple. */
export async function loadCoupleSpace(userId: string): Promise<CoupleSpace | null> {
  const coupleRow = await repo.getMyCouple(userId);
  if (!coupleRow) return null;

  const [profiles, cycleRows, planRows, inviteRows, memoryRows, privateNotes, notificationRows] =
    await Promise.all([
      repo.getProfiles([coupleRow.partner_1_user_id, coupleRow.partner_2_user_id ?? '']),
      repo.getCycles(coupleRow.id),
      repo.getPlans(coupleRow.id),
      repo.getPlanInvites(coupleRow.id),
      repo.getMemories(coupleRow.id),
      repo.getMyPrivateNotes(userId),
      repo.getNotifications(userId),
    ]);

  // The newest invitation per plan is the live one; older rows are history.
  const latestInvite = new Map<string, PlanInviteRow>();
  for (const inv of inviteRows) {
    if (!latestInvite.has(inv.plan_id)) latestInvite.set(inv.plan_id, inv);
  }

  const plans = planRows.map((r) => planFromRow(r, latestInvite.get(r.id)));
  const planByCycle = new Map(planRows.filter((p) => p.cycle_id).map((p) => [p.cycle_id!, p.id]));
  const memoryByCycle = new Map(
    memoryRows.filter((m) => m.cycle_id).map((m) => [m.cycle_id!, m.id]),
  );

  return {
    coupleId: coupleRow.id,
    couple: coupleFromRows(coupleRow, profiles, userId),
    rhythmStart: coupleRow.rhythm_start,
    cycles: cycleRows.map((r) =>
      cycleFromRow(r, planByCycle.get(r.id), memoryByCycle.get(r.id)),
    ),
    plans,
    memories: memoryRows.map((r) => memoryFromRow(r, privateNotes[r.id], userId)),
    invites: inviteRows,
    incoming:
      inviteRows.find((i) => i.recipient_user_id === userId && i.status === 'pending') ?? null,
    notifications: notificationRows,
  };
}

/** Fold a loaded space into the app's state, leaving local-only slices alone. */
export function applySpace(state: AppState, space: CoupleSpace): AppState {
  return {
    ...state,
    onboarded: true,
    couple: space.couple,
    rhythmStart: space.rhythmStart,
    cycles: space.cycles,
    plans: space.plans,
    memories: space.memories,
  };
}
