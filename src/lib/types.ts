/* =========================================================
   Couple777 — domain model
   ========================================================= */

export type ID = string;
export type ISODate = string; // YYYY-MM-DD
export type ISOStamp = string; // full ISO timestamp

/** The three tiers of the 777 rhythm. */
export type RitualTier = 'day' | 'week' | 'month';

/* ---------------- Cycles: the system of record ---------------- */

/**
 * A cycle is one turn of one clock. Three run independently from the day the
 * couple starts, and each keeps its own rhythm — completing early advances the
 * next due date from the *due* date, not from when it happened.
 *
 * Nothing here is classified by the user. Whatever they do lands in whichever
 * cycle is currently open for that tier.
 */
export interface Cycle {
  id: ID;
  tier: RitualTier;
  /** 1-based turn number for this tier, used for copy like "your 4th". */
  seq: number;
  /** When this turn opened — the previous turn's due date. */
  startDate: ISODate;
  dueDate: ISODate;
  planId?: ID;
  completedAt?: ISOStamp;
  memoryId?: ID;
  /** Set when a larger cycle's moment counted for this one too. */
  satisfiedBy?: ID;
}

/**
 * Derived from the cycle and its plan rather than stored, so it cannot drift
 * out of step with the thing it describes.
 */
export type CycleStatus = 'upcoming' | 'planned' | 'invited' | 'confirmed' | 'completed';

export type InviteResponse = 'yes' | 'reschedule' | 'cant';

export interface Invite {
  sentAt: ISOStamp;
  message?: string;
  respondedAt?: ISOStamp;
  response?: InviteResponse;
}

export interface Person {
  id: ID;
  name: string;
  /** An uploaded photo, stored as a downscaled data URL. */
  avatarUrl?: string;
  /** A chosen Couple777 avatar, used when there is no photo. */
  avatarId?: string;
  /** Optional, and never asked for during onboarding. */
  age?: number;
  /** Free text — "UX designer", "student", "between things". Also optional. */
  occupation?: string;
  initial: string;
}

/* ---------------- Personalization, captured at onboarding ---------------- */

/** What the couple said they want more of. Up to two. */
export type Wish =
  | 'romance'
  | 'conversation'
  | 'fun'
  | 'adventure'
  | 'quality-time'
  | 'spontaneity';

export type RelationshipStatus = 'dating' | 'engaged' | 'married' | 'unsaid';

/** How near each other they live. Distinct from adventure travel distance. */
export type Proximity = 'together' | 'same-area' | 'different-cities' | 'long-distance';

/** Only asked of long-distance couples. */
export type SeeFrequency = 'weekly' | 'monthly' | 'few-months' | 'varies';

/** How the couple describes themselves. Up to three. */
export type CoupleVibe =
  | 'cozy'
  | 'romantic'
  | 'playful'
  | 'creative'
  | 'adventurous'
  | 'exploring';

/**
 * Answers from onboarding. Everything here feeds the recommendation system —
 * see `lib/generator.ts`, which scores ideas against these before filters.
 */
export interface CoupleProfile {
  wishes: Wish[];
  status: RelationshipStatus;
  proximity: Proximity;
  seeFrequency?: SeeFrequency;
  vibes: CoupleVibe[];
  /**
   * How the partner identifies, if the first person said. Optional, and kept
   * here in the couple's own document rather than in a column, because the
   * partner has no account of their own yet to hold it — and once they do,
   * what they say about themselves on their profile is the better answer.
   */
  partnerGender?: string;
  partnerGenderNote?: string;
}

export interface Couple {
  id: ID;
  people: [Person, Person];
  /** The day they count from. */
  togetherSince: ISODate;
  /** Shared home base, used for adventure suggestions. */
  homeCity: string;
  inviteCode: string;
  /** Who is holding the phone. */
  currentPersonId: ID;
  /** False until the partner actually accepts the invite. */
  partnerJoined: boolean;
  profile: CoupleProfile;
}

/* ---------------- Plans: one shape for all three tiers ---------------- */

/**
 * What the couple decided to do with a cycle. The plan never states which
 * tier it is — that comes from the cycle it belongs to, which is the whole
 * point: the rhythm says when, the couple says what.
 */
export interface Plan {
  id: ID;
  cycleId: ID;
  title: string;
  emoji: string;
  date: ISODate;
  /** "19:00". Optional — not every moment has a clock time. */
  time?: string;
  endDate?: ISODate;
  createdBy: ID;
  /** Hidden from the partner until revealed or the day arrives. */
  surprise: boolean;
  place?: string;
  note?: string;
  /** A link the couple pasted — a restaurant page, a listing, anything. */
  link?: string;
  cost?: string;
  reserved?: boolean;
  invite?: Invite;
  /** Only mini and big adventures carry the extra planning space. */
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
  /** Free text — "train from Munich, 1h50". */
  transport?: string;
}

/* ---------------- Date ideas ---------------- */

/*
 * Defined in `shared/`, not here, and re-exported so every existing import of
 * `@/lib/types` keeps working. The corpus and its vocabulary have to be
 * readable by the serverless recommender as well as by the browser, and
 * anything under `src/` is browser-only as far as a function in `api/` is
 * concerned.
 */
export type {
  Vibe,
  Setting,
  Energy,
  Weather,
  Spontaneity,
  Daypart,
  IdeaCategory,
  IdeaMode,
  BaseIdea,
  IdeaFilters,
} from '@shared/ideaTypes';

import type { BaseIdea } from '@shared/ideaTypes';

/** An idea as the screens use it: the shared data, plus a picture. */
export interface DateIdea extends BaseIdea {
  image?: string;
}

/** Why a suggestion missed, fed back into the next round. */
export type IdeaFeedback = 'expensive' | 'far' | 'effort' | 'done' | 'mood';

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
  /**
   * How it felt, in the words the capture flow offers — and in the writer's
   * own, when none of them fit. `mood` is the nearest of the six the rest of
   * the app draws with; this is what was actually said.
   */
  feelings?: string[];
  /**
   * Who this is for. 'private' means the author only — enforced by the row
   * policy in migration 0002, not by this field, which is why the flow can
   * offer it honestly. Absent means shared, which is what every memory kept
   * before this existed was.
   */
  visibility?: 'private' | 'shared';
  /** A line both partners see. */
  sharedNote?: string;
  /** Each partner's own words on the same moment. */
  notes: Record<ID, string>;
  /** Only visible to its author. */
  privateNotes: Record<ID, string>;
  planId?: ID;
  /** Which rhythm produced this, for the 777 story on the timeline. */
  cycleId?: ID;
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

/**
 * A saved idea, in the two different senses of "saved".
 *
 * Adding something to the shared list is an act of telling: it shows up for
 * both of you straight away, with whose idea it was. A heart is not — it is
 * private, and stays private, until the other person happens to press the
 * same one. That coincidence is the whole point: a match has to be something
 * neither of you steered, or it is just agreeing with each other.
 */
export interface SavedIdea {
  id: ID;
  /** Put on the couple's shared list. Visible to both, attributed. */
  sharedBy: ID[];
  /** Personal hearts. Never shown to the other person on their own. */
  likedBy: ID[];
  /** Set the moment the second heart lands. */
  matchedAt?: string;
  /** Announced already, so it is not announced again. */
  matchSeen?: boolean;
}

/* ------------------------------- Community ------------------------------- */

/**
 * What the post is *about*. This is what someone filters by, and it is the
 * only one of the two they are asked for.
 *
 * It used to be the list below — question, experience, advice, reflection —
 * which is what a post *is*, not what it is about. That made the filter
 * useless for the thing people actually come here to do: find someone else's
 * long-distance thread, not someone else's question.
 */
export type CommunityTopic =
  | 'communication'
  | 'conflict'
  | 'intimacy'
  | 'long_distance'
  | 'life_together'
  | 'kids';

/**
 * What the post *is*, inferred from what was written rather than asked for.
 *
 * Metadata only: nothing filters by it and nothing shows it. It is here
 * because the old selector proved the shape is worth knowing and disproved
 * that anyone wants to fill it in — a question mark at the end of a paragraph
 * is a better signal than a chip somebody tapped to get past the screen.
 */
export type CommunityPostKind = 'question' | 'experience' | 'advice' | 'reflection';

export interface CommunityReply {
  id: ID;
  /** The display name shown, already resolved — 'Anonymous' when anonymous. */
  author: string;
  anonymous: boolean;
  /** Written on this device, so it can be shown as yours. */
  mine?: boolean;
  body: string;
  createdAt: string;
}

export interface CommunityPost {
  id: ID;
  author: string;
  anonymous: boolean;
  mine?: boolean;
  topic: CommunityTopic;
  /** Inferred from the body. Never asked for, never shown. */
  kind: CommunityPostKind;
  /** Optional. Plenty of posts are one paragraph and want no headline. */
  title?: string;
  body: string;
  createdAt: string;
  hearts: number;
  heartedByMe?: boolean;
  replies: CommunityReply[];
}

/**
 * One unfinished post, kept per account so leaving the screen does not throw
 * away what was written. One rather than many: this is a compose box someone
 * stepped away from, not a folder.
 */
export interface PostDraft {
  topic: CommunityTopic;
  anonymous: boolean;
  title: string;
  body: string;
  savedAt: string;
}

/* ------------------------------ Little Quest ------------------------------ */

/**
 * One tiny shared thing at a time, five to twenty minutes, worth a star.
 * Stars are counted per week against a gentle goal — there is no streak to
 * break, and a missed week costs nothing but the week.
 */
export interface Quest {
  id: string;
  emoji: string;
  title: string;
  body: string;
  /** Roughly how long, in minutes. */
  minutes: number;
  /** Which onboarding wishes this leans toward, for the light personalisation. */
  vibes: Wish[];
}

export interface QuestDone {
  questId: string;
  at: string;
}

export interface AppState {
  onboarded: boolean;
  couple: Couple;
  /** The day all three clocks started. */
  rhythmStart: ISODate;
  cycles: Cycle[];
  plans: Plan[];
  memories: Memory[];
  notes: Note[];
  destinations: Destination[];
  daily: DailyEntry[];
  roomSessions: RoomSession[];
  savedIdeas: SavedIdea[];
  /** The forum, local for now — see `data/community.ts`. */
  communityPosts: CommunityPost[];
  /** An unfinished post, if one was saved. Browser-local, per account. */
  postDraft?: PostDraft;
  /** Little Quests finished, newest last. Stars are counted from this. */
  questsDone: QuestDone[];
  /** Quests passed on, so today's pick moves along. */
  questsSkipped: string[];
  notificationsEnabled: boolean;
  /**
   * Notifications are derived from state rather than stored, so they can never
   * drift out of sync; only which ones have been read is persisted.
   */
  readNotificationIds: ID[];
  /** Days the couple has both checked in, for the gentle streak. */
  checkInDays: number;
}
