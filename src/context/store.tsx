import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
  type ReactNode,
} from 'react';
import type {
  AppState,
  CoupleProfile,
  DailyEntry,
  ID,
  InviteResponse,
  Memory,
  Note,
  Plan,
  RoomSession,
} from '@/lib/types';
import { completeCycle } from '@/lib/cycles';
import { buildSeedState } from '@/data/seed';
import { today } from '@/lib/dates';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/auth';
import * as repo from '@/lib/db/repo';
import { applySpace, loadCoupleSpace, planToRow, type CoupleSpace } from '@/lib/db/sync';

/**
 * Local-only slices — love notes, the daily question, room sessions, saved
 * ideas — still live in the browser. They are keyed per account so two people
 * sharing a laptop never read each other's, and they are the honest scope of
 * this iteration: the two-person loop (accounts, couple, plans, invitations,
 * memories) is what moved to Supabase.
 */
const LOCAL_KEY_PREFIX = 'couple777:local:';
const LOCAL_SLICES = [
  'notes',
  'daily',
  'roomSessions',
  'destinations',
  'savedIdeaIds',
  'readNotificationIds',
  'notificationsEnabled',
  'checkInDays',
] as const;
type LocalSlice = (typeof LOCAL_SLICES)[number];
type LocalState = Pick<AppState, LocalSlice>;

function localKey(userId: string) {
  return `${LOCAL_KEY_PREFIX}${userId}`;
}

function readLocal(userId: string): Partial<LocalState> {
  try {
    const raw = window.localStorage.getItem(localKey(userId));
    return raw ? (JSON.parse(raw) as Partial<LocalState>) : {};
  } catch {
    return {};
  }
}

function writeLocal(userId: string, state: AppState) {
  try {
    const slice = Object.fromEntries(LOCAL_SLICES.map((k) => [k, state[k]]));
    window.localStorage.setItem(localKey(userId), JSON.stringify(slice));
  } catch {
    /* Private mode, quota — the app still works for this session. */
  }
}

/* ---------------------------------- Actions --------------------------------- */

type Action =
  | { type: 'reset' }
  | { type: 'hydrate'; state: AppState }
  | {
      type: 'completeOnboarding';
      nameA: string;
      nameB: string;
      since: string;
      city: string;
      profile: CoupleProfile;
      partnerJoined: boolean;
    }
  | { type: 'setPartnerJoined'; joined: boolean }
  | { type: 'setPersonAvatar'; personId: ID; avatarId?: string; avatarUrl?: string }
  | { type: 'setPersonAge'; personId: ID; age?: number }
  | { type: 'renamePerson'; personId: ID; name: string }
  | { type: 'markNotificationsRead'; ids: ID[] }
  | { type: 'setNotifications'; enabled: boolean }
  | { type: 'upsertPlan'; plan: Plan }
  | { type: 'removePlan'; id: ID }
  | { type: 'completeCycle'; cycleId: ID }
  | { type: 'sendInvite'; planId: ID; message?: string }
  | { type: 'respondToInvite'; planId: ID; response: InviteResponse }
  | { type: 'upsertMemory'; memory: Memory }
  | { type: 'removeMemory'; id: ID }
  | { type: 'linkMemoryToPlan'; planId: ID; memoryId: ID }
  | { type: 'answerDaily'; date: string; promptId: string; personId: ID; text: string }
  | { type: 'addNote'; note: Note }
  | { type: 'removeNote'; id: ID }
  | { type: 'markNoteRead'; id: ID }
  | { type: 'toggleSavedIdea'; id: ID }
  | { type: 'toggleDestination'; id: ID; personId: ID }
  | { type: 'markMatchSeen'; id: ID }
  | { type: 'saveRoomSession'; session: RoomSession };

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'reset':
      return buildSeedState();

    case 'hydrate':
      return action.state;

    case 'completeOnboarding': {
      const [a, b] = state.couple.people;
      return {
        ...state,
        onboarded: true,
        couple: {
          ...state.couple,
          togetherSince: action.since || state.couple.togetherSince,
          homeCity: action.city || state.couple.homeCity,
          partnerJoined: action.partnerJoined,
          profile: action.profile,
          people: [
            { ...a, name: action.nameA, initial: action.nameA.charAt(0).toUpperCase() },
            { ...b, name: action.nameB, initial: action.nameB.charAt(0).toUpperCase() },
          ],
        },
      };
    }

    case 'setPartnerJoined':
      return { ...state, couple: { ...state.couple, partnerJoined: action.joined } };

    case 'setPersonAvatar':
      return {
        ...state,
        couple: {
          ...state.couple,
          people: state.couple.people.map((p) =>
            p.id === action.personId
              ? // A photo and a drawn avatar are alternatives, so setting one
                // clears the other rather than leaving a stale fallback.
                { ...p, avatarId: action.avatarId, avatarUrl: action.avatarUrl }
              : p,
          ) as AppState['couple']['people'],
        },
      };

    case 'setPersonAge':
      return {
        ...state,
        couple: {
          ...state.couple,
          people: state.couple.people.map((p) =>
            p.id === action.personId ? { ...p, age: action.age } : p,
          ) as AppState['couple']['people'],
        },
      };

    case 'renamePerson':
      return {
        ...state,
        couple: {
          ...state.couple,
          people: state.couple.people.map((p) =>
            p.id === action.personId
              ? { ...p, name: action.name, initial: action.name.charAt(0).toUpperCase() || '?' }
              : p,
          ) as AppState['couple']['people'],
        },
      };

    case 'markNotificationsRead':
      return {
        ...state,
        readNotificationIds: [...new Set([...state.readNotificationIds, ...action.ids])],
      };

    case 'setNotifications':
      return { ...state, notificationsEnabled: action.enabled };

    case 'upsertPlan': {
      const exists = state.plans.some((p) => p.id === action.plan.id);
      return {
        ...state,
        plans: exists
          ? state.plans.map((p) => (p.id === action.plan.id ? action.plan : p))
          : [...state.plans, action.plan],
        // A plan is only ever reachable through its cycle.
        cycles: state.cycles.map((c) =>
          c.id === action.plan.cycleId ? { ...c, planId: action.plan.id } : c,
        ),
      };
    }

    case 'removePlan':
      return {
        ...state,
        plans: state.plans.filter((p) => p.id !== action.id),
        cycles: state.cycles.map((c) => (c.planId === action.id ? { ...c, planId: undefined } : c)),
      };

    case 'completeCycle': {
      // The engine also closes any smaller cycles this moment overlapped.
      const { cycles } = completeCycle(state.cycles, action.cycleId);
      return { ...state, cycles };
    }

    case 'sendInvite':
      return {
        ...state,
        plans: state.plans.map((p) =>
          p.id === action.planId
            ? {
                ...p,
                invite: {
                  ...p.invite,
                  sentAt: new Date().toISOString(),
                  message: action.message,
                },
              }
            : p,
        ),
      };

    case 'respondToInvite':
      return {
        ...state,
        plans: state.plans.map((p) =>
          p.id === action.planId && p.invite
            ? {
                ...p,
                invite: {
                  ...p.invite,
                  respondedAt: new Date().toISOString(),
                  response: action.response,
                },
              }
            : p,
        ),
      };

    case 'upsertMemory': {
      const exists = state.memories.some((m) => m.id === action.memory.id);
      return {
        ...state,
        memories: exists
          ? state.memories.map((m) => (m.id === action.memory.id ? action.memory : m))
          : [action.memory, ...state.memories],
      };
    }

    case 'removeMemory':
      return { ...state, memories: state.memories.filter((m) => m.id !== action.id) };

    case 'linkMemoryToPlan':
      return {
        ...state,
        cycles: state.cycles.map((c) =>
          c.planId === action.planId ? { ...c, memoryId: action.memoryId } : c,
        ),
      };

    case 'answerDaily': {
      const entry = state.daily.find((e) => e.date === action.date);
      const answer = { text: action.text, at: new Date().toISOString() };
      let daily: DailyEntry[];
      let checkInDays = state.checkInDays;

      if (entry) {
        const answers = { ...entry.answers, [action.personId]: answer };
        // The streak counts days both partners showed up, not days one did.
        if (Object.keys(entry.answers).length === 1 && Object.keys(answers).length === 2) {
          checkInDays += 1;
        }
        daily = state.daily.map((e) => (e.date === action.date ? { ...e, answers } : e));
      } else {
        daily = [
          ...state.daily,
          { date: action.date, promptId: action.promptId, answers: { [action.personId]: answer } },
        ];
      }
      return { ...state, daily, checkInDays };
    }

    case 'addNote':
      return { ...state, notes: [action.note, ...state.notes] };

    case 'removeNote':
      return { ...state, notes: state.notes.filter((n) => n.id !== action.id) };

    case 'markNoteRead':
      return {
        ...state,
        notes: state.notes.map((n) =>
          n.id === action.id && !n.readAt ? { ...n, readAt: new Date().toISOString() } : n,
        ),
      };

    case 'toggleSavedIdea':
      return {
        ...state,
        savedIdeaIds: state.savedIdeaIds.includes(action.id)
          ? state.savedIdeaIds.filter((i) => i !== action.id)
          : [...state.savedIdeaIds, action.id],
      };

    case 'toggleDestination':
      return {
        ...state,
        destinations: state.destinations.map((d) => {
          if (d.id !== action.id) return d;
          const saved = d.savedBy.includes(action.personId);
          return {
            ...d,
            savedBy: saved
              ? d.savedBy.filter((p) => p !== action.personId)
              : [...d.savedBy, action.personId],
            matchSeen: saved ? d.matchSeen : d.matchSeen,
          };
        }),
      };

    case 'markMatchSeen':
      return {
        ...state,
        destinations: state.destinations.map((d) =>
          d.id === action.id ? { ...d, matchSeen: true } : d,
        ),
      };

    case 'saveRoomSession': {
      const exists = state.roomSessions.some((s) => s.id === action.session.id);
      return {
        ...state,
        roomSessions: exists
          ? state.roomSessions.map((s) => (s.id === action.session.id ? action.session : s))
          : [action.session, ...state.roomSessions],
      };
    }

    default:
      return state;
  }
}

/* ---------------------------------- Context --------------------------------- */

/**
 * Where this device stands, which is what the shell routes on.
 *
 *   unconfigured — this build has no Supabase credentials
 *   loading      — still asking Supabase who is signed in
 *   signed-out   — nobody is signed in
 *   no-couple    — signed in, but not in a Couple777 space yet
 *   ready        — signed in, and in a space
 */
export type StoreStatus = 'unconfigured' | 'loading' | 'signed-out' | 'no-couple' | 'ready';

interface StoreValue {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  /** The person currently holding the phone. */
  me: AppState['couple']['people'][number];
  partner: AppState['couple']['people'][number];
  reset: () => void;
  status: StoreStatus;
  coupleId: string | null;
  space: CoupleSpace | null;
  /** Re-read everything from Supabase. Cheap, and the reliable fallback. */
  refresh: () => Promise<void>;
  error: string | null;
}

const StoreContext = createContext<StoreValue | null>(null);

/**
 * The starting shape. The seed's sample couple is never shown to a signed-in
 * user — applySpace overwrites every shared slice as soon as the space loads —
 * but it keeps the reducer total, so no screen has to cope with a half-built
 * AppState while the first fetch is in flight.
 */
function emptyState(userId?: string): AppState {
  const base = buildSeedState();
  const local = userId ? readLocal(userId) : {};
  return { ...base, ...local, onboarded: false, cycles: [], plans: [], memories: [] };
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading, configured } = useAuth();
  const userId = user?.id ?? null;

  const [state, dispatch] = useReducer(reducer, undefined, () => emptyState());
  const [space, setSpace] = useState<CoupleSpace | null>(null);
  const [error, setError] = useState<string | null>(null);
  /*
   * Which user the loaded state belongs to, or null if nothing has been
   * fetched yet.
   *
   * A plain `loading` boolean is not enough. Between "we know who is signed
   * in" and "we have their couple", space is null and loading has not been set
   * yet, so status computed 'no-couple' for a tick — long enough to redirect a
   * deep link or a refresh to couple setup, which then bounced it home. Anyone
   * opening a link to a plan, or just reloading, lost their place.
   */
  const [hydratedFor, setHydratedFor] = useState<string | null>(null);

  const load = useCallback(async (uid: string) => {
    setError(null);
    try {
      const next = await loadCoupleSpace(uid);
      setSpace(next);
      const blank = emptyState(uid);
      dispatch({
        type: 'hydrate',
        state: next
          ? applySpace(blank, next)
          : { ...blank, couple: { ...blank.couple, currentPersonId: uid } },
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setHydratedFor(uid);
    }
  }, []);

  useEffect(() => {
    if (!configured) return;
    if (!userId) {
      setSpace(null);
      setHydratedFor(null);
      dispatch({ type: 'hydrate', state: emptyState() });
      return;
    }
    void load(userId);
  }, [userId, configured, load]);

  const refresh = useCallback(async () => {
    if (userId) await load(userId);
  }, [userId, load]);

  /*
   * Realtime is a convenience, not the mechanism: every path that matters also
   * re-reads on navigation and on refresh(). If the channel never connects —
   * a locked-down network, Realtime switched off on the project — the app is
   * merely a pull-to-refresh slower, not wrong. Reliability over sophistication.
   */
  const coupleId = space?.coupleId ?? null;
  useEffect(() => {
    const db = supabase;
    if (!db || !coupleId || !userId) return;
    const channel = db
      .channel(`couple:${coupleId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'plans', filter: `couple_id=eq.${coupleId}` },
        () => void load(userId),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'plan_invites', filter: `couple_id=eq.${coupleId}` },
        () => void load(userId),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'couples', filter: `id=eq.${coupleId}` },
        () => void load(userId),
      )
      .subscribe();
    return () => {
      void db.removeChannel(channel);
    };
  }, [coupleId, userId, load]);

  useEffect(() => {
    if (userId) writeLocal(userId, state);
  }, [state, userId]);

  /**
   * Every action still runs through the reducer, so the screen updates at
   * once. Actions that touch shared data additionally write to Supabase and
   * then re-read, because the server is the truth and a silent divergence
   * between two phones is the one failure this feature cannot have.
   */
  const remoteDispatch = useCallback(
    (action: Action) => {
      dispatch(action);
      if (!userId || !space) return;
      void persist(action, { userId, space, state }).then(
        (changed) => {
          if (changed) void load(userId);
        },
        (e: unknown) => {
          setError(e instanceof Error ? e.message : String(e));
          // Put the screen back in step with the server rather than leaving an
          // optimistic update standing for something that never happened.
          void load(userId);
        },
      );
    },
    [userId, space, state, load],
  );

  const reset = useCallback(() => {
    if (userId) {
      try {
        window.localStorage.removeItem(localKey(userId));
      } catch {
        /* ignore */
      }
    }
    void refresh();
  }, [userId, refresh]);

  const status: StoreStatus = !configured
    ? 'unconfigured'
    : authLoading
      ? 'loading'
      : !userId
        ? 'signed-out'
        : // Not "no space" until we have actually looked for one.
          hydratedFor !== userId
          ? 'loading'
          : !space
            ? 'no-couple'
            : 'ready';

  const value = useMemo<StoreValue>(() => {
    const me =
      state.couple.people.find((p) => p.id === state.couple.currentPersonId) ??
      state.couple.people[0];
    const partner = state.couple.people.find((p) => p.id !== me.id) ?? state.couple.people[1];
    return {
      state,
      dispatch: remoteDispatch,
      me,
      partner,
      reset,
      status,
      coupleId,
      space,
      refresh,
      error,
    };
  }, [state, remoteDispatch, reset, status, space, coupleId, refresh, error]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

/* ------------------------------ Remote effects ------------------------------ */

interface PersistContext {
  userId: string;
  space: CoupleSpace;
  state: AppState;
}

/**
 * The remote half of an action. Returns whether anything was written, so the
 * caller only re-reads when there is something new to read.
 */
async function persist(action: Action, ctx: PersistContext): Promise<boolean> {
  const { userId, space, state } = ctx;
  const coupleId = space.coupleId;
  const partner = space.couple.people.find((p) => p.id !== userId);
  const me = space.couple.people.find((p) => p.id === userId);

  switch (action.type) {
    case 'upsertPlan': {
      const known = state.plans.some((p) => p.id === action.plan.id);
      // The tier comes from the cycle this plan belongs to, so the rhythm
      // decides which moment it is and the person only decides what to do.
      const cycle = state.cycles.find((c) => c.id === action.plan.cycleId);
      if (!cycle) throw new Error('That plan is not attached to a 777 moment.');
      // On insert the client's own id goes in as the primary key, so the plan
      // keeps the id the screen already navigated to.
      await repo.upsertPlanRow(
        {
          ...planToRow(action.plan, coupleId, cycle.tier, known ? undefined : 'planned'),
          ...(known ? {} : { id: action.plan.id }),
        },
        known ? action.plan.id : undefined,
      );
      return true;
    }

    case 'removePlan':
      await repo.deletePlan(action.id);
      return true;

    case 'completeCycle': {
      // Run the same pure engine the reducer ran, so the rows written are
      // exactly the cycles it closed and opened — including any smaller ones
      // this moment satisfied.
      const before = state.cycles;
      const { cycles, closed } = completeCycle(before, action.cycleId);
      const knownIds = new Set(before.map((c) => c.id));
      const now = new Date().toISOString();

      for (const c of closed) {
        await repo.updateCycle(c.id, {
          completed_at: now,
          satisfied_by: c.id === action.cycleId ? null : action.cycleId,
        });
      }
      const fresh = cycles.filter((c) => !knownIds.has(c.id));
      if (fresh.length) {
        await repo.insertCycles(
          fresh.map((c) => ({
            // Postgres mints the id. The engine's local one is a key for this
            // render only, and two phones completing at once must not collide.
            couple_id: coupleId,
            tier: c.tier,
            seq: c.seq,
            start_date: c.startDate,
            due_date: c.dueDate,
            completed_at: null,
            satisfied_by: null,
          })) as never,
        );
      }
      const plan = state.plans.find((p) => p.cycleId === action.cycleId);
      if (plan) await repo.upsertPlanRow({ status: 'completed' }, plan.id);
      return true;
    }

    /*
     * Asking your partner is the point of the feature, so it is a real row
     * addressed to a real account rather than a flag on the plan. Which also
     * means it cannot happen until there is somebody to ask.
     */
    case 'sendInvite': {
      if (!partner || !space.couple.partnerJoined) {
        throw new Error(
          `${partner?.name ?? 'Your partner'} has not joined your Couple777 space yet.`,
        );
      }
      const plan = state.plans.find((p) => p.id === action.planId);
      await repo.createPlanInvite({
        plan_id: action.planId,
        couple_id: coupleId,
        sender_user_id: userId,
        recipient_user_id: partner.id,
        message: action.message ?? null,
      });
      await repo.upsertPlanRow({ status: 'invite_sent' }, action.planId);
      await repo.notify({
        couple_id: coupleId,
        user_id: partner.id,
        kind: 'plan_invite',
        title: `${me?.name ?? 'Your partner'} invited you`,
        body: plan?.title ?? null,
        plan_id: action.planId,
      });
      return true;
    }

    /*
     * Answering it. RLS makes "only the person who was asked" literal, so a
     * sender cannot mark their own invitation accepted.
     */
    case 'respondToInvite': {
      const invite = space.invites.find(
        (i) => i.plan_id === action.planId && i.status === 'pending',
      );
      if (!invite) return false;
      const status =
        action.response === 'yes'
          ? 'accepted'
          : action.response === 'cant'
            ? 'declined'
            : 'suggested_change';
      await repo.respondToPlanInvite(invite.id, status);
      await repo.upsertPlanRow(
        {
          status:
            action.response === 'yes'
              ? 'confirmed'
              : action.response === 'cant'
                ? 'declined'
                : 'planned',
        },
        action.planId,
      );
      const plan = state.plans.find((p) => p.id === action.planId);
      await repo.notify({
        couple_id: coupleId,
        user_id: invite.sender_user_id,
        kind:
          action.response === 'yes'
            ? 'invite_accepted'
            : action.response === 'cant'
              ? 'invite_declined'
              : 'invite_suggested',
        title:
          action.response === 'yes'
            ? `${me?.name ?? 'Your partner'} said yes`
            : action.response === 'cant'
              ? `${me?.name ?? 'Your partner'} can't make it`
              : `${me?.name ?? 'Your partner'} suggested another time`,
        body: plan?.title ?? null,
        plan_id: action.planId,
      });
      return true;
    }

    case 'upsertMemory': {
      const known = state.memories.some((m) => m.id === action.memory.id);
      const m = action.memory;
      const cycle = state.cycles.find((c) => c.planId === m.planId);
      const row = await repo.upsertMemoryRow({
        couple_id: coupleId,
        plan_id: m.planId ?? null,
        cycle_id: m.cycleId ?? cycle?.id ?? null,
        created_by: userId,
        happened_on: m.date,
        title: m.title,
        emoji: m.emoji,
        kind: m.kind,
        place: m.place ?? null,
        mood: m.mood ?? null,
        shared_note: m.sharedNote ?? null,
        photos: m.photos ?? [],
        ...(known ? {} : { id: m.id }),
      }, known ? m.id : undefined);
      const mine = m.privateNotes?.[userId];
      if (mine !== undefined) await repo.setMyPrivateNote(row.id, userId, mine);
      return true;
    }

    case 'removeMemory':
      await repo.deleteMemory(action.id);
      return true;

    case 'setPersonAvatar': {
      if (action.personId !== userId) return false;
      await repo.upsertProfile(userId, {
        avatar_type: action.avatarUrl ? 'photo' : 'avatar',
        avatar_value: action.avatarUrl ?? action.avatarId ?? null,
      });
      return true;
    }

    case 'setPersonAge': {
      if (action.personId !== userId) return false;
      /*
       * Read, merge, write. The preferences document also holds the identity
       * answer from onboarding, and upsert replaces a jsonb column whole — so
       * writing { age } on its own would quietly take the rest with it.
       */
      const profile = await repo.getProfile(userId);
      const prefs = { ...((profile?.relationship_preferences as Record<string, unknown>) ?? {}) };
      if (action.age == null) delete prefs.age;
      else prefs.age = action.age;
      await repo.upsertProfile(userId, { relationship_preferences: prefs as never });
      return true;
    }

    case 'renamePerson': {
      if (action.personId === userId) {
        await repo.upsertProfile(userId, { display_name: action.name });
        return true;
      }
      /*
       * A partner who has joined owns their own name — the profiles policy
       * only lets you update your own row, and that is right. Before they
       * join there is no account and no row: the name on screen is simply
       * what the first person called them, and that lives on the couple.
       */
      if (!space.couple.partnerJoined) {
        await repo.updateCouple(space.coupleId, { partner_2_name: action.name });
        return true;
      }
      return false;
    }

    default:
      // Local-only slices: notes, the daily question, room sessions, saved
      // ideas. Nothing to write.
      return false;
  }
}

// eslint-disable-next-line react-refresh/only-export-components
export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside <StoreProvider>');
  return ctx;
}

/** Convenience for the very common "what is today" read. */
// eslint-disable-next-line react-refresh/only-export-components
export function useToday(): string {
  return useMemo(() => today(), []);
}
