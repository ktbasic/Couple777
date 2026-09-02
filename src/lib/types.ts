/* =========================================================
   Couple777 — domain model
   ========================================================= */

export type ID = string;
export type ISODate = string; // YYYY-MM-DD
export type ISOStamp = string; // full ISO timestamp

/** The three tiers of the 777 rhythm. */
export type RitualTier = 'day' | 'week' | 'month';

export interface Person {
  id: ID;
  name: string;
  avatarUrl?: string;
  initial: string;
}

export interface Couple {
  id: ID;
  people: [Person, Person];
  /** The day they count from. */
  togetherSince: ISODate;
  /** Shared home base, used for adventure suggestions. */
  homeCity: string;
  inviteCode: string;
  /** Who is holding the phone right now (prototype: switchable). */
  currentPersonId: ID;
}

/* ---------------- Plans: one shape for all three tiers ---------------- */

export type PlanStatus = 'planned' | 'completed';

export interface Plan {
  id: ID;
  tier: RitualTier;
  title: string;
  emoji: string;
  /** Scheduled day. Big adventures may only have a month. */
  date: ISODate;
  endDate?: ISODate;
  status: PlanStatus;
  createdBy: ID;
  /** Hidden from the partner until revealed or the day arrives. */
  surprise: boolean;
  place?: string;
  budget?: string;
  notes?: string;
  /** Set when the plan has been turned into a memory. */
  memoryId?: ID;
  completedAt?: ISOStamp;
  /** Big adventures carry a planning space. */
  trip?: Trip;
}

export interface TripItem {
  id: ID;
  label: string;
  addedBy: ID;
  done?: boolean;
}

export interface Trip {
  destination: string;
  country?: string;
  heroImage?: string;
  wishlist: TripItem[];
  stays: TripItem[];
  notes: string;
  budget?: string;
}

/* ---------------- Date ideas ---------------- */

export type Vibe = 'romantic' | 'fun' | 'adventurous' | 'relaxing' | 'creative';
export type Setting = 'home' | 'out';
export type Energy = 'low' | 'medium' | 'high';
export type Weather = 'any' | 'rain' | 'sun' | 'cold' | 'warm';
export type Spontaneity = 'spontaneous' | 'planned';

export interface DateIdea {
  id: ID;
  title: string;
  emoji: string;
  description: string;
  /** Minutes. */
  duration: number;
  /** Euros. 0 means free. */
  cost: number;
  prep: string;
  /** The emotional reason this might land for a couple. */
  why: string;
  vibes: Vibe[];
  setting: Setting;
  energy: Energy;
  weather: Weather[];
  spontaneity: Spontaneity;
  image?: string;
}

export interface IdeaFilters {
  duration: number | null; // minutes available
  budget: number | null; // euro ceiling
  setting: Setting | null;
  vibe: Vibe | null;
  energy: Energy | null;
  weather: Weather | null;
}

/* ---------------- Mini adventures ---------------- */

export type Distance = 'under1' | '1to3' | 'weekend';
export type AdventureMood =
  | 'romantic'
  | 'nature'
  | 'food'
  | 'adventure'
  | 'relaxing'
  | 'culture';

export interface AdventureIdea {
  id: ID;
  title: string;
  emoji: string;
  place: string;
  travelTime: string;
  description: string;
  why: string;
  cost: string;
  distance: Distance;
  moods: AdventureMood[];
  image?: string;
}

/* ---------------- Big adventures / wishlist ---------------- */

export interface Destination {
  id: ID;
  name: string;
  country: string;
  blurb: string;
  image: string;
  bestTime: string;
  /** Who has secretly saved it. A match is both. */
  savedBy: ID[];
  /** Once revealed as a match, we stop hiding it. */
  matchSeen?: boolean;
}

/* ---------------- Daily connection ---------------- */

export type PromptKind =
  | 'question'
  | 'memory'
  | 'appreciation'
  | 'playful'
  | 'reflection'
  | 'quote';

export interface DailyPrompt {
  id: ID;
  kind: PromptKind;
  text: string;
  /** Only for kind === 'quote'. */
  quote?: string;
  quoteAuthor?: string;
}

export interface DailyEntry {
  date: ISODate;
  promptId: ID;
  answers: Record<ID, { text: string; at: ISOStamp }>;
}

/* ---------------- Memories ---------------- */

export type MemoryKind = RitualTier | 'milestone' | 'moment';
export type Mood = 'warm' | 'joyful' | 'calm' | 'silly' | 'proud' | 'tender';

export interface Memory {
  id: ID;
  date: ISODate;
  title: string;
  emoji: string;
  kind: MemoryKind;
  place?: string;
  photos: string[];
  mood?: Mood;
  /** A line both partners see. */
  sharedNote?: string;
  /** Each partner's own words on the same moment. */
  notes: Record<ID, string>;
  /** Only visible to its author. */
  privateNotes: Record<ID, string>;
  planId?: ID;
}

/* ---------------- Notes to my partner ---------------- */

export type NoteKind =
  | 'appreciation'
  | 'talk'
  | 'memory'
  | 'feeling'
  | 'request'
  | 'love'
  | 'private';

export interface Note {
  id: ID;
  kind: NoteKind;
  body: string;
  from: ID;
  createdAt: ISOStamp;
  /** Absent = deliver immediately. */
  deliverAt?: ISOStamp;
  /** A label like "Friday evening" for the scheduled note. */
  deliverLabel?: string;
  readAt?: ISOStamp;
}

/* ---------------- Relationship Room ---------------- */

export type RoomStep =
  | { kind: 'private'; prompt: string; hint?: string }
  | { kind: 'reveal'; prompt: string }
  | { kind: 'commitment'; prompt: string; hint?: string };

export interface RoomTopic {
  id: ID;
  label: string;
  emoji: string;
  blurb: string;
  minutes: number;
  depth: 'gentle' | 'open' | 'deep';
  steps: RoomStep[];
}

export interface RoomSession {
  id: ID;
  topicId: ID;
  startedAt: ISOStamp;
  completedAt?: ISOStamp;
  /** stepIndex -> personId -> answer */
  answers: Record<number, Record<ID, string>>;
  commitment?: string;
}

/* ---------------- Persisted app state ---------------- */

export interface AppState {
  onboarded: boolean;
  couple: Couple;
  plans: Plan[];
  memories: Memory[];
  notes: Note[];
  destinations: Destination[];
  daily: DailyEntry[];
  roomSessions: RoomSession[];
  savedIdeaIds: ID[];
  notificationsEnabled: boolean;
  /** Days the couple has both checked in, for the gentle streak. */
  checkInDays: number;
}
