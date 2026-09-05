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
/**
 * A calendar day, always as YYYY-MM-DD.
 *
 * The whole app treats a date as a plain day string and does arithmetic on it,
 * so a full timestamp arriving from the database — which happens the moment
 * anything in the chain hands back a Date rather than a date — turns into
 * NaN-NaN-NaN a few functions later, far from the cause.
 */
function day(value) {
    if (!value)
        return '';
    return value.length > 10 ? value.slice(0, 10) : value;
}
/* --------------------------------- Mapping --------------------------------- */
/* Age and occupation live in the profile's own preferences document rather
   than columns of their own — the same place the identity answer goes — so
   adding them needed no migration against a project that is already live. */
function ageFrom(prefs) {
    const raw = prefs?.age;
    return typeof raw === 'number' && Number.isFinite(raw) ? raw : undefined;
}
function occupationFrom(prefs) {
    const raw = prefs?.occupation;
    return typeof raw === 'string' && raw.trim() ? raw : undefined;
}
function personFromProfile(p) {
    const name = p.display_name || 'You';
    return {
        id: p.id,
        name,
        age: ageFrom(p.relationship_preferences),
        occupation: occupationFrom(p.relationship_preferences),
        avatarId: p.avatar_type === 'avatar' ? (p.avatar_value ?? undefined) : undefined,
        avatarUrl: p.avatar_type === 'photo' ? (p.avatar_value ?? undefined) : undefined,
        initial: name.charAt(0).toUpperCase() || '?',
    };
}
function placeholderPartner(name) {
    const label = name.trim() || 'Your partner';
    return { id: PLACEHOLDER_PARTNER_ID, name: label, initial: label.charAt(0).toUpperCase() };
}
export function cycleFromRow(r, planId, memoryId) {
    return {
        id: r.id,
        tier: r.tier,
        seq: r.seq,
        startDate: day(r.start_date),
        dueDate: day(r.due_date),
        completedAt: r.completed_at ?? undefined,
        satisfiedBy: r.satisfied_by ?? undefined,
        planId,
        memoryId,
    };
}
export function planFromRow(r, invite) {
    return {
        id: r.id,
        cycleId: r.cycle_id ?? '',
        title: r.title,
        emoji: r.emoji || '❤️',
        date: day(r.scheduled_date),
        time: r.scheduled_time ?? undefined,
        createdBy: r.created_by,
        surprise: r.surprise,
        place: r.location ?? undefined,
        note: r.description ?? undefined,
        link: r.external_link ?? undefined,
        cost: r.cost ?? undefined,
        reserved: r.reserved,
        trip: r.trip ?? undefined,
        // The app reads an invite as "sent / answered"; the row carries more, but
        // this keeps every existing screen working unchanged.
        invite: invite
            ? {
                sentAt: invite.created_at,
                message: invite.message ?? undefined,
                respondedAt: invite.responded_at ?? undefined,
                response: invite.status === 'accepted'
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
/**
 * A plan row, minus its id — the caller decides whether this is an insert or
 * an update, and passing a locally-minted id on an insert would fight Postgres
 * for it.
 *
 * `cycle_type` is derived from the cycle the plan hangs off, never chosen. The
 * rhythm decides which moment this is; the couple only decides what to do with
 * it. That is the rule the whole app is built on, so it is not something a
 * form gets to set.
 */
export function planToRow(plan, coupleId, tier, status) {
    return {
        couple_id: coupleId,
        cycle_type: tier,
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
        trip: plan.trip ?? null,
        ...(status ? { status } : {}),
    };
}
export function memoryFromRow(r, privateNote, ownerId) {
    return {
        id: r.id,
        date: day(r.happened_on),
        title: r.title,
        emoji: r.emoji || '❤️',
        kind: r.kind,
        place: r.place ?? undefined,
        photos: r.photos ?? [],
        mood: r.mood ?? undefined,
        sharedNote: r.shared_note ?? undefined,
        notes: {},
        privateNotes: privateNote && ownerId ? { [ownerId]: privateNote } : {},
        planId: r.plan_id ?? undefined,
        cycleId: r.cycle_id ?? undefined,
    };
}
function coupleFromRows(row, profiles, meId) {
    const byId = new Map(profiles.map((p) => [p.id, p]));
    const first = byId.get(row.partner_1_user_id);
    const second = row.partner_2_user_id ? byId.get(row.partner_2_user_id) : undefined;
    const a = first ? personFromProfile(first) : placeholderPartner('You');
    const b = second ? personFromProfile(second) : placeholderPartner(row.partner_2_name ?? '');
    return {
        id: row.id,
        // Whoever is holding the phone reads first, so "You and Marian" is right
        // on both devices without either screen being told which one it is.
        people: (meId === b.id ? [b, a] : [a, b]),
        togetherSince: day(row.together_since),
        homeCity: row.home_base ?? '',
        inviteCode: row.invite_code,
        currentPersonId: meId,
        partnerJoined: Boolean(row.partner_2_user_id),
        profile: row.profile ?? emptyCoupleProfile(),
    };
}
export function emptyCoupleProfile() {
    return { wishes: [], status: 'unsaid', proximity: 'together', vibes: [] };
}
/* --------------------------------- Loading --------------------------------- */
/** Everything the app needs for a signed-in member of a couple. */
export async function loadCoupleSpace(userId) {
    const coupleRow = await repo.getMyCouple(userId);
    if (!coupleRow)
        return null;
    const [profiles, cycleRows, planRows, inviteRows, memoryRows, privateNotes, notificationRows] = await Promise.all([
        repo.getProfiles([coupleRow.partner_1_user_id, coupleRow.partner_2_user_id ?? '']),
        repo.getCycles(coupleRow.id),
        repo.getPlans(coupleRow.id),
        repo.getPlanInvites(coupleRow.id),
        repo.getMemories(coupleRow.id),
        repo.getMyPrivateNotes(userId),
        repo.getNotifications(userId),
    ]);
    // The newest invitation per plan is the live one; older rows are history.
    const latestInvite = new Map();
    for (const inv of inviteRows) {
        if (!latestInvite.has(inv.plan_id))
            latestInvite.set(inv.plan_id, inv);
    }
    const plans = planRows.map((r) => planFromRow(r, latestInvite.get(r.id)));
    const planByCycle = new Map(planRows.filter((p) => p.cycle_id).map((p) => [p.cycle_id, p.id]));
    const memoryByCycle = new Map(memoryRows.filter((m) => m.cycle_id).map((m) => [m.cycle_id, m.id]));
    return {
        coupleId: coupleRow.id,
        couple: coupleFromRows(coupleRow, profiles, userId),
        rhythmStart: day(coupleRow.rhythm_start),
        cycles: cycleRows.map((r) => cycleFromRow(r, planByCycle.get(r.id), memoryByCycle.get(r.id))),
        plans,
        memories: memoryRows.map((r) => memoryFromRow(r, privateNotes[r.id], userId)),
        invites: inviteRows,
        incoming: inviteRows.find((i) => i.recipient_user_id === userId && i.status === 'pending') ?? null,
        notifications: notificationRows,
    };
}
/** Fold a loaded space into the app's state, leaving local-only slices alone. */
export function applySpace(state, space) {
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
