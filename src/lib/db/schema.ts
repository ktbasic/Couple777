/**
 * The database as TypeScript sees it. Hand-written to match
 * supabase/migrations/0001_init.sql — if you change one, change the other.
 * (`supabase gen types typescript` can regenerate this once the CLI is set up.)
 */

/** Postgres json/jsonb, as the client sees it. */
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type CycleTier = 'day' | 'week' | 'month';

export type PlanStatus =
  | 'draft'
  | 'planned'
  | 'invite_sent'
  | 'confirmed'
  | 'completed'
  | 'declined';

export type InviteStatus = 'pending' | 'accepted' | 'suggested_change' | 'declined';

export type NotificationKind =
  | 'plan_invite'
  | 'invite_accepted'
  | 'invite_declined'
  | 'invite_suggested'
  | 'partner_joined'
  | 'cycle_reminder'
  | 'memory_reminder';

/* Rows are type aliases, not interfaces, on purpose: postgrest-js constrains
 * each table to Record<string, unknown>, and an interface has no implicit
 * index signature, so it silently fails the constraint and every query in the
 * app infers as `never`. */
export type ProfileRow = {
  id: string;
  display_name: string;
  avatar_type: 'avatar' | 'photo';
  avatar_value: string | null;
  relationship_preferences: Json;
  date_preferences: Json;
  home_base: string | null;
  created_at: string;
}

export type CoupleRow = {
  id: string;
  created_by: string;
  partner_1_user_id: string;
  partner_2_user_id: string | null;
  relationship_status: string | null;
  together_since: string | null;
  home_base: string | null;
  distance_setup: string | null;
  partner_2_name: string | null;
  profile: Json;
  invite_code: string;
  rhythm_start: string;
  created_at: string;
}

export type CycleRow = {
  id: string;
  couple_id: string;
  tier: CycleTier;
  seq: number;
  start_date: string;
  due_date: string;
  completed_at: string | null;
  satisfied_by: string | null;
  created_at: string;
}

export type PlanRow = {
  id: string;
  couple_id: string;
  cycle_id: string | null;
  created_by: string;
  cycle_type: CycleTier;
  title: string;
  description: string | null;
  emoji: string;
  scheduled_date: string | null;
  scheduled_time: string | null;
  location: string | null;
  external_link: string | null;
  cost: string | null;
  reserved: boolean;
  surprise: boolean;
  status: PlanStatus;
  trip: Json | null;
  created_at: string;
  updated_at: string;
}

export type PlanInviteRow = {
  id: string;
  plan_id: string;
  couple_id: string;
  sender_user_id: string;
  recipient_user_id: string;
  status: InviteStatus;
  message: string | null;
  suggested_date: string | null;
  suggested_time: string | null;
  suggested_note: string | null;
  created_at: string;
  responded_at: string | null;
}

export type MemoryRow = {
  id: string;
  couple_id: string;
  plan_id: string | null;
  cycle_id: string | null;
  created_by: string;
  happened_on: string;
  title: string;
  emoji: string;
  kind: string;
  place: string | null;
  mood: string | null;
  shared_note: string | null;
  photos: string[];
  created_at: string;
}

export type MemoryPrivateNoteRow = {
  memory_id: string;
  user_id: string;
  body: string;
  updated_at: string;
}

export type NotificationRow = {
  id: string;
  couple_id: string;
  user_id: string;
  kind: NotificationKind;
  title: string;
  body: string | null;
  plan_id: string | null;
  read_at: string | null;
  created_at: string;
}

type Table<Row, Insert = Partial<Row>, Update = Partial<Row>> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

export type Database = {
  public: {
    Tables: {
      profiles: Table<ProfileRow>;
      couples: Table<CoupleRow>;
      cycles: Table<CycleRow>;
      plans: Table<PlanRow>;
      plan_invites: Table<PlanInviteRow>;
      memories: Table<MemoryRow>;
      memory_private_notes: Table<MemoryPrivateNoteRow>;
      notifications: Table<NotificationRow>;
    };
    // `{ [_ in never]: never }` rather than Record<string, never>: the latter
    // fails postgrest-js's Record<string, GenericView> constraint, which makes
    // the whole schema fail to match and every query infer as `never`.
    Views: { [_ in never]: never };
    Functions: {
      generate_invite_code: { Args: Record<PropertyKey, never>; Returns: string };
      join_couple_by_code: { Args: { code: string }; Returns: string };
      peek_invite: {
        Args: { code: string };
        Returns: {
          inviter_name: string;
          inviter_avatar_type: string;
          inviter_avatar_value: string | null;
          is_open: boolean;
        }[];
      };
    };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
}
