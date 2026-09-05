import { requireDb } from '@/lib/supabase';
/**
 * Every query the app makes, in one place.
 *
 * Nothing here filters by couple_id for security — RLS already does that, and
 * a client-side filter would be theatre. Where couple_id does appear it is to
 * fetch less, not to protect anything.
 */
function unwrap({ data, error }) {
    if (error)
        throw new Error(error.message);
    return data;
}
/* --------------------------------- Profiles -------------------------------- */
export async function getProfile(userId) {
    const db = requireDb();
    const { data, error } = await db.from('profiles').select('*').eq('id', userId).maybeSingle();
    if (error)
        throw new Error(error.message);
    return data;
}
export async function upsertProfile(userId, patch) {
    const db = requireDb();
    // Upsert rather than update: the handle_new_user trigger normally has the
    // row waiting, but a project where the trigger was not installed would
    // otherwise strand the user with nowhere to save to.
    return unwrap(await db.from('profiles').upsert({ id: userId, ...patch }).select().single());
}
/** Both people in the couple, in one round trip. */
export async function getProfiles(ids) {
    const db = requireDb();
    const wanted = ids.filter(Boolean);
    if (!wanted.length)
        return [];
    return unwrap(await db.from('profiles').select('*').in('id', wanted));
}
/* --------------------------------- Couples --------------------------------- */
/** The couple this user belongs to, if any. */
export async function getMyCouple(userId) {
    const db = requireDb();
    const { data, error } = await db
        .from('couples')
        .select('*')
        .or(`partner_1_user_id.eq.${userId},partner_2_user_id.eq.${userId}`)
        .maybeSingle();
    if (error)
        throw new Error(error.message);
    return data;
}
/**
 * Starting a space starts the clocks. Without this a new couple has a home
 * screen with nothing on it and no way to get one — the three cycles are the
 * app, not an optional extra.
 */
export async function seedCycles(coupleId, cycles) {
    const db = requireDb();
    if (!cycles.length)
        return [];
    return unwrap(await db
        .from('cycles')
        .insert(cycles.map((c) => ({
        couple_id: coupleId,
        tier: c.tier,
        seq: c.seq,
        start_date: c.startDate,
        due_date: c.dueDate,
    })))
        .select());
}
export async function createCouple(userId, details) {
    const db = requireDb();
    const code = unwrap(await db.rpc('generate_invite_code'));
    return unwrap(await db
        .from('couples')
        .insert({
        created_by: userId,
        partner_1_user_id: userId,
        partner_2_name: details.partnerName,
        together_since: details.togetherSince || null,
        relationship_status: details.relationshipStatus || null,
        distance_setup: details.distanceSetup || null,
        home_base: details.homeBase || null,
        profile: details.profile ?? {},
        rhythm_start: details.rhythmStart,
        invite_code: code,
    })
        .select()
        .single());
}
export async function updateCouple(coupleId, patch) {
    const db = requireDb();
    return unwrap(await db.from('couples').update(patch).eq('id', coupleId).select().single());
}
/** What an invite link may show before anyone has signed in. */
export async function peekInvite(code) {
    const db = requireDb();
    const rows = unwrap(await db.rpc('peek_invite', { code }));
    return rows?.[0] ?? null;
}
/** Take the second seat. Throws with the reason if the space cannot be joined. */
export async function joinCoupleByCode(code) {
    const db = requireDb();
    const { data, error } = await db.rpc('join_couple_by_code', { code });
    if (error)
        throw new Error(error.message);
    return data;
}
/* ---------------------------------- Cycles --------------------------------- */
export async function getCycles(coupleId) {
    const db = requireDb();
    return unwrap(await db.from('cycles').select('*').eq('couple_id', coupleId).order('due_date'));
}
export async function insertCycles(rows) {
    const db = requireDb();
    if (!rows.length)
        return [];
    return unwrap(await db.from('cycles').insert(rows).select());
}
export async function updateCycle(id, patch) {
    const { error } = await requireDb().from('cycles').update(patch).eq('id', id);
    if (error)
        throw new Error(error.message);
}
/* ---------------------------------- Plans ---------------------------------- */
export async function getPlans(coupleId) {
    const db = requireDb();
    return unwrap(await db.from('plans').select('*').eq('couple_id', coupleId));
}
/** Update when given an id, insert when not. Postgres mints ids on insert. */
export async function upsertPlanRow(row, id) {
    const db = requireDb();
    if (id) {
        return unwrap(await db.from('plans').update(row).eq('id', id).select().single());
    }
    return unwrap(await db.from('plans').insert(row).select().single());
}
export async function deletePlan(id) {
    const { error } = await requireDb().from('plans').delete().eq('id', id);
    if (error)
        throw new Error(error.message);
}
/* -------------------------------- Invitations ------------------------------- */
export async function getPlanInvites(coupleId) {
    const db = requireDb();
    return unwrap(await db
        .from('plan_invites')
        .select('*')
        .eq('couple_id', coupleId)
        .order('created_at', { ascending: false }));
}
export async function createPlanInvite(row) {
    const db = requireDb();
    return unwrap(await db.from('plan_invites').insert(row).select().single());
}
export async function respondToPlanInvite(id, status, suggestion) {
    const db = requireDb();
    return unwrap(await db
        .from('plan_invites')
        .update({
        status,
        responded_at: new Date().toISOString(),
        suggested_date: suggestion?.date ?? null,
        suggested_time: suggestion?.time ?? null,
        suggested_note: suggestion?.note ?? null,
    })
        .eq('id', id)
        .select()
        .single());
}
/* --------------------------------- Memories -------------------------------- */
export async function getMemories(coupleId) {
    const db = requireDb();
    return unwrap(await db
        .from('memories')
        .select('*')
        .eq('couple_id', coupleId)
        .order('happened_on', { ascending: false }));
}
export async function upsertMemoryRow(row, id) {
    const db = requireDb();
    if (id) {
        return unwrap(await db.from('memories').update(row).eq('id', id).select().single());
    }
    return unwrap(await db.from('memories').insert(row).select().single());
}
export async function deleteMemory(id) {
    const { error } = await requireDb().from('memories').delete().eq('id', id);
    if (error)
        throw new Error(error.message);
}
/** Your own words on a shared memory. RLS makes "your own" literal. */
export async function getMyPrivateNotes(userId) {
    const db = requireDb();
    const rows = unwrap(await db.from('memory_private_notes').select('memory_id, body').eq('user_id', userId));
    return Object.fromEntries(rows.map((r) => [r.memory_id, r.body]));
}
export async function setMyPrivateNote(memoryId, userId, body) {
    const { error } = await requireDb()
        .from('memory_private_notes')
        .upsert({ memory_id: memoryId, user_id: userId, body, updated_at: new Date().toISOString() });
    if (error)
        throw new Error(error.message);
}
/* ------------------------------- Notifications ------------------------------ */
export async function getNotifications(userId) {
    const db = requireDb();
    return unwrap(await db
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50));
}
export async function notify(row) {
    const { error } = await requireDb().from('notifications').insert(row);
    // A notification failing must never take the action that caused it down
    // with it: the plan was still made, the invite was still sent.
    if (error)
        console.warn('Could not write notification:', error.message);
}
export async function markNotificationsRead(ids) {
    if (!ids.length)
        return;
    const { error } = await requireDb()
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .in('id', ids);
    if (error)
        throw new Error(error.message);
}
