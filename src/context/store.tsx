import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from 'react';
import type {
  AppState,
  DailyEntry,
  ID,
  Memory,
  Note,
  Plan,
  RoomSession,
} from '@/lib/types';
import { buildSeedState } from '@/data/seed';
import { today } from '@/lib/dates';

const STORAGE_KEY = 'couple777:v1';

/* ---------------------------------- Actions --------------------------------- */

type Action =
  | { type: 'reset' }
  | { type: 'hydrate'; state: AppState }
  | { type: 'completeOnboarding'; nameA: string; nameB: string; since: string; city: string }
  | { type: 'switchPerson'; id: ID }
  | { type: 'setNotifications'; enabled: boolean }
  | { type: 'upsertPlan'; plan: Plan }
  | { type: 'removePlan'; id: ID }
  | { type: 'completePlan'; id: ID }
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
          people: [
            { ...a, name: action.nameA, initial: action.nameA.charAt(0).toUpperCase() },
            { ...b, name: action.nameB, initial: action.nameB.charAt(0).toUpperCase() },
          ],
        },
      };
    }

    case 'switchPerson':
      return { ...state, couple: { ...state.couple, currentPersonId: action.id } };

    case 'setNotifications':
      return { ...state, notificationsEnabled: action.enabled };

    case 'upsertPlan': {
      const exists = state.plans.some((p) => p.id === action.plan.id);
      return {
        ...state,
        plans: exists
          ? state.plans.map((p) => (p.id === action.plan.id ? action.plan : p))
          : [...state.plans, action.plan],
      };
    }

    case 'removePlan':
      return { ...state, plans: state.plans.filter((p) => p.id !== action.id) };

    case 'completePlan':
      return {
        ...state,
        plans: state.plans.map((p) =>
          p.id === action.id
            ? { ...p, status: 'completed', completedAt: new Date().toISOString() }
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
        plans: state.plans.map((p) =>
          p.id === action.planId ? { ...p, memoryId: action.memoryId } : p,
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

interface StoreValue {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  /** The person currently holding the phone. */
  me: AppState['couple']['people'][number];
  partner: AppState['couple']['people'][number];
  reset: () => void;
}

const StoreContext = createContext<StoreValue | null>(null);

function loadInitial(): AppState {
  if (typeof window === 'undefined') return buildSeedState();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return buildSeedState();
    const parsed = JSON.parse(raw) as AppState;
    // Guard against a shape change between prototype builds.
    if (!parsed?.couple?.people?.length) return buildSeedState();
    return parsed;
  } catch {
    return buildSeedState();
  }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadInitial);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* Private mode, quota — the prototype still works in memory. */
    }
  }, [state]);

  const reset = useCallback(() => {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
    dispatch({ type: 'reset' });
  }, []);

  const value = useMemo<StoreValue>(() => {
    const me =
      state.couple.people.find((p) => p.id === state.couple.currentPersonId) ??
      state.couple.people[0];
    const partner = state.couple.people.find((p) => p.id !== me.id) ?? state.couple.people[1];
    return { state, dispatch, me, partner, reset };
  }, [state, reset]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
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
