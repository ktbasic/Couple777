import { requireDb } from '@/lib/supabase';
import type {
  CoupleRow,
  Json,
  CycleRow,
  InviteStatus,
  MemoryRow,
  NotificationKind,
  NotificationRow,
  PlanInviteRow,
  PlanRow,
  ProfileRow,
} from './schema';

/**
 * Every query the app makes, in one place.
 *
 * Nothing here filters by couple_id for security — RLS already does that, and
 * a client-side filter would be theatre. Where couple_id does appear it is to
 * fetch less, not to protect anything.
 */

function unwrap<T>({ data, error }: { data: T | null; error: { message: string } | null }): T {
  if (error) throw new Error(error.message);
  return data as T;
}

/* --------------------------------- Profiles -------------------------------- */

export async function getProfile(userId: string): Promise<ProfileRow | null> {
  const db = requireDb();
  const { data, error } = await db.from('profiles').select('*').eq('id', userId).maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export async function upsertProfile(
  userId: string,
  patch: Partial<Omit<ProfileRow, 'id' | 'created_at'>>,
): Promise<ProfileRow> {
  const db = requireDb();
  // Upsert rather than update: the handle_new_user trigger normally has the
  // row waiting, but a project where the trigger was not installed would
  // otherwise strand the user with nowhere to save to.
  return unwrap(
    await db.from('profiles').upsert({ id: userId, ...patch }).select().single(),
  );
}

/** Both people in the couple, in one round trip. */
export async function getProfiles(ids: string[]): Promise<ProfileRow[]> {
  const db = requireDb();
  const wanted = ids.filter(Boolean);
  if (!wanted.length) return [];
  return unwrap(await db.from('profiles').select('*').in('id', wanted));
}

/* --------------------------------- Couples --------------------------------- */

/** The couple this user belongs to, if any. */
export async function getMyCouple(userId: string): Promise<CoupleRow | null> {
  const db = requireDb();
  const { data, error } = await db
    .from('couples')
    .select('*')
    .or(`partner_1_user_id.eq.${userId},partner_2_user_id.eq.${userId}`)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export async function createCouple(
  userId: string,
  details: {
    partnerName: string;
    togetherSince?: string;
    relationshipStatus?: string;
    distanceSetup?: string;
    homeBase?: string;
    profile?: Json;
    rhythmStart: string;
  },
): Promise<CoupleRow> {
  const db = requireDb();
  const code = unwrap(await db.rpc('generate_invite_code'));
  return unwrap(
    await db
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
      .single(),
  );
}

export async function updateCouple(
  coupleId: string,
  patch: Partial<Omit<CoupleRow, 'id' | 'created_by' | 'partner_1_user_id' | 'partner_2_user_id'>>,
): Promise<CoupleRow> {
  const db = requireDb();
  return unwrap(await db.from('couples').update(patch).eq('id', coupleId).select().single());
}

/** What an invite link may show before anyone has signed in. */
export async function peekInvite(code: string) {
  const db = requireDb();
  const rows = unwrap(await db.rpc('peek_invite', { code }));
  return rows?.[0] ?? null;
}

/** Take the second seat. Throws with the reason if the space cannot be joined. */
export async function joinCoupleByCode(code: string): Promise<string> {
  const db = requireDb();
  const { data, error } = await db.rpc('join_couple_by_code', { code });
  if (error) throw new Error(error.message);
  return data as string;
}

/* ---------------------------------- Cycles --------------------------------- */

export async function getCycles(coupleId: string): Promise<CycleRow[]> {
  const db = requireDb();
  return unwrap(
    await db.from('cycles').select('*').eq('couple_id', coupleId).order('due_date'),
  );
}

export async function insertCycles(rows: Omit<CycleRow, 'created_at'>[]): Promise<CycleRow[]> {
  const db = requireDb();
  if (!rows.length) return [];
  return unwrap(await db.from('cycles').insert(rows).select());
}

export async function updateCycle(id: string, patch: Partial<CycleRow>): Promise<void> {
  const { error } = await requireDb().from('cycles').update(patch).eq('id', id);
  if (error) throw new Error(error.message);
}

/* ---------------------------------- Plans ---------------------------------- */

export async function getPlans(coupleId: string): Promise<PlanRow[]> {
  const db = requireDb();
  return unwrap(await db.from('plans').select('*').eq('couple_id', coupleId));
}

export async function upsertPlanRow(row: Partial<PlanRow> & { id?: string }): Promise<PlanRow> {
  const db = requireDb();
  if (row.id) {
    return unwrap(await db.from('plans').update(row).eq('id', row.id).select().single());
  }
  return unwrap(await db.from('plans').insert(row).select().single());
}

export async function deletePlan(id: string): Promise<void> {
  const { error } = await requireDb().from('plans').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

/* -------------------------------- Invitations ------------------------------- */

export async function getPlanInvites(coupleId: string): Promise<PlanInviteRow[]> {
  const db = requireDb();
  return unwrap(
    await db
      .from('plan_invites')
      .select('*')
      .eq('couple_id', coupleId)
      .order('created_at', { ascending: false }),
  );
}

export async function createPlanInvite(row: {
  plan_id: string;
  couple_id: string;
  sender_user_id: string;
  recipient_user_id: string;
  message?: string | null;
}): Promise<PlanInviteRow> {
  const db = requireDb();
  return unwrap(await db.from('plan_invites').insert(row).select().single());
}

export async function respondToPlanInvite(
  id: string,
  status: Exclude<InviteStatus, 'pending'>,
  suggestion?: { date?: string | null; time?: string | null; note?: string | null },
): Promise<PlanInviteRow> {
  const db = requireDb();
  return unwrap(
    await db
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
      .single(),
  );
}

/* --------------------------------- Memories -------------------------------- */

export async function getMemories(coupleId: string): Promise<MemoryRow[]> {
  const db = requireDb();
  return unwrap(
    await db
      .from('memories')
      .select('*')
      .eq('couple_id', coupleId)
      .order('happened_on', { ascending: false }),
  );
}

export async function upsertMemoryRow(row: Partial<MemoryRow> & { id?: string }): Promise<MemoryRow> {
  const db = requireDb();
  if (row.id) {
    return unwrap(await db.from('memories').update(row).eq('id', row.id).select().single());
  }
  return unwrap(await db.from('memories').insert(row).select().single());
}

export async function deleteMemory(id: string): Promise<void> {
  const { error } = await requireDb().from('memories').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

/** Your own words on a shared memory. RLS makes "your own" literal. */
export async function getMyPrivateNotes(userId: string): Promise<Record<string, string>> {
  const db = requireDb();
  const rows = unwrap(
    await db.from('memory_private_notes').select('memory_id, body').eq('user_id', userId),
  );
  return Object.fromEntries(rows.map((r) => [r.memory_id, r.body]));
}

export async function setMyPrivateNote(
  memoryId: string,
  userId: string,
  body: string,
): Promise<void> {
  const { error } = await requireDb()
    .from('memory_private_notes')
    .upsert({ memory_id: memoryId, user_id: userId, body, updated_at: new Date().toISOString() });
  if (error) throw new Error(error.message);
}

/* ------------------------------- Notifications ------------------------------ */

export async function getNotifications(userId: string): Promise<NotificationRow[]> {
  const db = requireDb();
  return unwrap(
    await db
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50),
  );
}

export async function notify(row: {
  couple_id: string;
  user_id: string;
  kind: NotificationKind;
  title: string;
  body?: string | null;
  plan_id?: string | null;
}): Promise<void> {
  const { error } = await requireDb().from('notifications').insert(row);
  // A notification failing must never take the action that caused it down
  // with it: the plan was still made, the invite was still sent.
  if (error) console.warn('Could not write notification:', error.message);
}

export async function markNotificationsRead(ids: string[]): Promise<void> {
  if (!ids.length) return;
  const { error } = await requireDb()
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .in('id', ids);
  if (error) throw new Error(error.message);
}
