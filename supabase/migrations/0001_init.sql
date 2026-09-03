-- Couple777 — two-user test backend.
--
-- Shape of the thing: a couple is a shared space with exactly two members.
-- Everything the pair does together (the three 777 clocks, plans, invitations,
-- memories) hangs off couple_id and is readable by both members and nobody
-- else. The exceptions are deliberate and enforced here rather than in the
-- client, because a policy is the only place a privacy promise actually holds:
--
--   * a surprise plan is invisible to the partner until its date arrives or
--     its author reveals it;
--   * each partner's own words on a shared memory live in their own table row
--     and are readable only by their author.

-- gen_random_uuid() is core Postgres since 13, so there is no extension to enable.

/* -------------------------------------------------------------------------- */
/*  Profiles                                                                   */
/* -------------------------------------------------------------------------- */

create table if not exists public.profiles (
  id                       uuid primary key references auth.users (id) on delete cascade,
  display_name             text        not null default '',
  -- 'avatar' = one of the drawn Couple777 characters, 'photo' = uploaded image.
  avatar_type              text        not null default 'avatar'
                             check (avatar_type in ('avatar', 'photo')),
  avatar_value             text,
  relationship_preferences jsonb       not null default '{}'::jsonb,
  date_preferences         jsonb       not null default '{}'::jsonb,
  home_base                text,
  created_at               timestamptz not null default now()
);

-- Every auth user gets a profile row the moment they sign up, so the client
-- never has to cope with a signed-in user that has nowhere to write to.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data ->> 'display_name',
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name',
      ''
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

/* -------------------------------------------------------------------------- */
/*  Couples                                                                    */
/* -------------------------------------------------------------------------- */

create table if not exists public.couples (
  id                 uuid primary key default gen_random_uuid(),
  created_by         uuid        not null references public.profiles (id) on delete cascade,
  partner_1_user_id  uuid        not null references public.profiles (id) on delete cascade,
  partner_2_user_id  uuid                 references public.profiles (id) on delete set null,
  relationship_status text,
  together_since     date,
  home_base          text,
  distance_setup     text,
  -- What the creator calls their partner before that partner has an account.
  -- Everything on screen says "Bring Marian in", not "Bring your partner in",
  -- and that has to survive until the second seat is actually filled.
  partner_2_name     text,
  -- The couple-level answers from onboarding (wishes, vibes, how often they
  -- see each other). Kept as one document because the app reads them as one
  -- object and nothing queries across them.
  profile            jsonb       not null default '{}'::jsonb,
  invite_code        text        not null unique,
  -- The day all three clocks started ticking.
  rhythm_start       date        not null default current_date,
  created_at         timestamptz not null default now(),
  -- Exactly two people, and never the same person twice.
  constraint couples_two_distinct_people
    check (partner_2_user_id is null or partner_2_user_id <> partner_1_user_id)
);

create index if not exists couples_partner_1_idx on public.couples (partner_1_user_id);
create index if not exists couples_partner_2_idx on public.couples (partner_2_user_id);

/*
 * Membership test used by every shared table's policies.
 *
 * SECURITY DEFINER on purpose: it reads public.couples, and a policy on a
 * shared table that queried couples directly would re-enter couples' own
 * policies. Postgres detects that as infinite recursion and the query fails.
 * Running as owner steps outside RLS, which is safe here because the function
 * only ever answers a yes/no about the *calling* user.
 */
create or replace function public.is_couple_member(couple uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.couples c
    where c.id = couple
      and auth.uid() in (c.partner_1_user_id, c.partner_2_user_id)
  );
$$;

/* -------------------------------------------------------------------------- */
/*  The 777 clocks                                                             */
/* -------------------------------------------------------------------------- */

create table if not exists public.cycles (
  id            uuid primary key default gen_random_uuid(),
  couple_id     uuid        not null references public.couples (id) on delete cascade,
  tier          text        not null check (tier in ('day', 'week', 'month')),
  seq           integer     not null,
  start_date    date        not null,
  due_date      date        not null,
  completed_at  timestamptz,
  -- Set when a larger overlapping cycle counted for this one, so the stats
  -- never charge the couple twice for one evening.
  satisfied_by  uuid        references public.cycles (id) on delete set null,
  created_at    timestamptz not null default now(),
  unique (couple_id, tier, seq)
);

create index if not exists cycles_couple_idx on public.cycles (couple_id, tier, completed_at);

/* -------------------------------------------------------------------------- */
/*  Plans                                                                      */
/* -------------------------------------------------------------------------- */

create table if not exists public.plans (
  id             uuid primary key default gen_random_uuid(),
  couple_id      uuid        not null references public.couples (id) on delete cascade,
  cycle_id       uuid                 references public.cycles (id) on delete set null,
  created_by     uuid        not null references public.profiles (id) on delete cascade,
  -- Which clock this belongs to. Set by the app from the cycle, never chosen
  -- by the user: the rhythm decides when, the couple decides what.
  cycle_type     text        not null check (cycle_type in ('day', 'week', 'month')),
  title          text        not null,
  description    text,
  emoji          text        not null default '',
  scheduled_date date,
  scheduled_time text,
  location       text,
  external_link  text,
  cost           text,
  reserved       boolean     not null default false,
  -- Hidden from the partner until the date arrives or the author reveals it.
  surprise       boolean     not null default false,
  status         text        not null default 'draft'
                   check (status in ('draft', 'planned', 'invite_sent',
                                     'confirmed', 'completed', 'declined')),
  trip           jsonb,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists plans_couple_idx on public.plans (couple_id, scheduled_date);

/* -------------------------------------------------------------------------- */
/*  Plan invitations                                                           */
/* -------------------------------------------------------------------------- */

create table if not exists public.plan_invites (
  id                uuid primary key default gen_random_uuid(),
  plan_id           uuid        not null references public.plans (id) on delete cascade,
  couple_id         uuid        not null references public.couples (id) on delete cascade,
  sender_user_id    uuid        not null references public.profiles (id) on delete cascade,
  recipient_user_id uuid        not null references public.profiles (id) on delete cascade,
  status            text        not null default 'pending'
                      check (status in ('pending', 'accepted', 'suggested_change', 'declined')),
  message           text,
  -- Filled in when the recipient proposes a different time.
  suggested_date    date,
  suggested_time    text,
  suggested_note    text,
  created_at        timestamptz not null default now(),
  responded_at      timestamptz
);

create index if not exists plan_invites_recipient_idx
  on public.plan_invites (recipient_user_id, status);
create index if not exists plan_invites_plan_idx on public.plan_invites (plan_id);

/* -------------------------------------------------------------------------- */
/*  Memories                                                                   */
/* -------------------------------------------------------------------------- */

create table if not exists public.memories (
  id          uuid primary key default gen_random_uuid(),
  couple_id   uuid        not null references public.couples (id) on delete cascade,
  plan_id     uuid                 references public.plans (id) on delete set null,
  cycle_id    uuid                 references public.cycles (id) on delete set null,
  created_by  uuid        not null references public.profiles (id) on delete cascade,
  happened_on date        not null,
  title       text        not null,
  emoji       text        not null default '',
  kind        text        not null default 'moment',
  place       text,
  mood        text,
  -- The line both partners see.
  shared_note text,
  photos      text[]      not null default '{}',
  created_at  timestamptz not null default now()
);

create index if not exists memories_couple_idx on public.memories (couple_id, happened_on desc);

-- Each partner's own words on a shared memory. Separate table, not a column,
-- because "only its author can read this" is a row-level statement.
create table if not exists public.memory_private_notes (
  memory_id  uuid        not null references public.memories (id) on delete cascade,
  user_id    uuid        not null references public.profiles (id) on delete cascade,
  body       text        not null default '',
  updated_at timestamptz not null default now(),
  primary key (memory_id, user_id)
);

/* -------------------------------------------------------------------------- */
/*  Notifications                                                              */
/* -------------------------------------------------------------------------- */

create table if not exists public.notifications (
  id         uuid primary key default gen_random_uuid(),
  couple_id  uuid        not null references public.couples (id) on delete cascade,
  user_id    uuid        not null references public.profiles (id) on delete cascade,
  kind       text        not null
               check (kind in ('plan_invite', 'invite_accepted', 'invite_declined',
                               'invite_suggested', 'partner_joined',
                               'cycle_reminder', 'memory_reminder')),
  title      text        not null,
  body       text,
  plan_id    uuid        references public.plans (id) on delete cascade,
  read_at    timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_idx
  on public.notifications (user_id, read_at, created_at desc);

/* ========================================================================== */
/*  Row Level Security                                                        */
/*                                                                            */
/*  Every table below is RLS-enabled with no permissive default, so a table   */
/*  that somehow reaches production without a policy is closed, not open.     */
/* ========================================================================== */

alter table public.profiles             enable row level security;
alter table public.couples              enable row level security;
alter table public.cycles               enable row level security;
alter table public.plans                enable row level security;
alter table public.plan_invites         enable row level security;
alter table public.memories             enable row level security;
alter table public.memory_private_notes enable row level security;
alter table public.notifications        enable row level security;

/* ---- Profiles ----------------------------------------------------------- */
-- You can always read and write your own. You can also read your partner's,
-- because their name and avatar are on every screen you share.

drop policy if exists profiles_select_self_or_partner on public.profiles;
create policy profiles_select_self_or_partner on public.profiles
  for select using (
    id = auth.uid()
    or exists (
      select 1 from public.couples c
      where auth.uid() in (c.partner_1_user_id, c.partner_2_user_id)
        and public.profiles.id in (c.partner_1_user_id, c.partner_2_user_id)
    )
  );

drop policy if exists profiles_insert_self on public.profiles;
create policy profiles_insert_self on public.profiles
  for insert with check (id = auth.uid());

drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

/* ---- Couples ------------------------------------------------------------ */
-- Membership is tested against the row's own columns rather than through
-- is_couple_member(), so this policy does not re-enter itself.

drop policy if exists couples_select_member on public.couples;
create policy couples_select_member on public.couples
  for select using (auth.uid() in (partner_1_user_id, partner_2_user_id));

drop policy if exists couples_insert_self on public.couples;
create policy couples_insert_self on public.couples
  for insert with check (
    created_by = auth.uid() and partner_1_user_id = auth.uid()
  );

-- A member may edit the shared details of the space they are in.
drop policy if exists couples_update_member on public.couples;
create policy couples_update_member on public.couples
  for update
  using (auth.uid() in (partner_1_user_id, partner_2_user_id))
  with check (auth.uid() in (partner_1_user_id, partner_2_user_id));

/*
 * Who is in the couple is not an editable detail.
 *
 * The policy above cannot express this on its own: a WITH CHECK only sees the
 * new row, so a member overwriting partner_1_user_id with a stranger still
 * satisfies "the caller is one of the two people" — they are still the other
 * one. The result was that either partner could quietly evict the other and
 * keep the shared history. Comparing against OLD needs a trigger.
 */
create or replace function public.couples_guard_membership()
returns trigger
language plpgsql
as $$
begin
  if new.created_by is distinct from old.created_by
     or new.partner_1_user_id is distinct from old.partner_1_user_id then
    raise exception 'The people in a Couple777 space cannot be changed.'
      using errcode = '42501';
  end if;

  -- The second seat may be filled once. After that it is neither swappable nor
  -- emptiable: leaving is a different operation, with different stakes.
  if old.partner_2_user_id is not null
     and new.partner_2_user_id is distinct from old.partner_2_user_id then
    raise exception 'The second person in a space cannot be replaced.'
      using errcode = '42501';
  end if;

  -- A code may be rotated while the seat is still open, so a creator who has
  -- shared it too widely is not stuck with it. Once someone has joined, the
  -- code has done its job and freezes.
  if new.invite_code is distinct from old.invite_code
     and (old.partner_2_user_id is not null or auth.uid() <> old.partner_1_user_id) then
    raise exception 'The invite code cannot be changed now.' using errcode = '42501';
  end if;

  return new;
end;
$$;

drop trigger if exists couples_guard_membership on public.couples;
create trigger couples_guard_membership
  before update on public.couples
  for each row execute function public.couples_guard_membership();

/* ---- The shared tables -------------------------------------------------- */
-- Same shape throughout: you may touch a row if you are one of the two people
-- the row belongs to.

drop policy if exists cycles_all_member on public.cycles;
create policy cycles_all_member on public.cycles
  for all using (public.is_couple_member(couple_id))
  with check (public.is_couple_member(couple_id));

/*
 * Plans are the one shared table with a carve-out. A surprise stays invisible
 * to the partner until the day it happens, so the reveal is the author's to
 * give. Everything else about it — that it exists, its title, where it is —
 * is withheld at the database, not merely hidden in the UI.
 */
drop policy if exists plans_select_member on public.plans;
create policy plans_select_member on public.plans
  for select using (
    public.is_couple_member(couple_id)
    and (
      not surprise
      or created_by = auth.uid()
      or (scheduled_date is not null and scheduled_date <= current_date)
    )
  );

drop policy if exists plans_insert_member on public.plans;
create policy plans_insert_member on public.plans
  for insert with check (
    public.is_couple_member(couple_id) and created_by = auth.uid()
  );

drop policy if exists plans_update_member on public.plans;
create policy plans_update_member on public.plans
  for update using (public.is_couple_member(couple_id))
  with check (public.is_couple_member(couple_id));

drop policy if exists plans_delete_author on public.plans;
create policy plans_delete_author on public.plans
  for delete using (public.is_couple_member(couple_id) and created_by = auth.uid());

drop policy if exists plan_invites_select_member on public.plan_invites;
create policy plan_invites_select_member on public.plan_invites
  for select using (public.is_couple_member(couple_id));

drop policy if exists plan_invites_insert_sender on public.plan_invites;
create policy plan_invites_insert_sender on public.plan_invites
  for insert with check (
    public.is_couple_member(couple_id) and sender_user_id = auth.uid()
  );

-- Only the person who was asked can answer. The sender cannot mark their own
-- invitation accepted, which is the whole point of it being an invitation.
drop policy if exists plan_invites_update_recipient on public.plan_invites;
create policy plan_invites_update_recipient on public.plan_invites
  for update using (recipient_user_id = auth.uid())
  with check (recipient_user_id = auth.uid());

drop policy if exists memories_all_member on public.memories;
create policy memories_all_member on public.memories
  for all using (public.is_couple_member(couple_id))
  with check (public.is_couple_member(couple_id));

-- Private notes: yours, and only yours, in both directions.
drop policy if exists memory_private_notes_own on public.memory_private_notes;
create policy memory_private_notes_own on public.memory_private_notes
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists notifications_select_own on public.notifications;
create policy notifications_select_own on public.notifications
  for select using (user_id = auth.uid());

-- A member may write a notification to either person in the couple (that is
-- how "Marian said yes" reaches Katy), but may only mark their own as read.
drop policy if exists notifications_insert_member on public.notifications;
create policy notifications_insert_member on public.notifications
  for insert with check (public.is_couple_member(couple_id));

drop policy if exists notifications_update_own on public.notifications;
create policy notifications_update_own on public.notifications
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

/* ========================================================================== */
/*  Joining a couple                                                          */
/*                                                                            */
/*  A person holding an invite code is, by definition, not yet a member, so    */
/*  RLS correctly refuses to let them read the couple row. Both functions      */
/*  below are the deliberate, narrow way in: SECURITY DEFINER, and each        */
/*  returns only what that step of the flow actually needs.                    */
/* ========================================================================== */

-- Readable codes: no O/0, I/1, or 5/S to mistype over the phone.
create or replace function public.generate_invite_code()
returns text
language plpgsql
volatile
as $$
declare
  alphabet constant text := 'ABCDEFGHJKLMNPQRTUVWXYZ2346789';
  candidate text;
  i integer;
begin
  loop
    candidate := '';
    for i in 1..6 loop
      candidate := candidate || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
    end loop;
    -- "K74M2P" reads as "K7-4M2P".
    candidate := substr(candidate, 1, 2) || '-' || substr(candidate, 3, 4);
    exit when not exists (select 1 from public.couples where invite_code = candidate);
  end loop;
  return candidate;
end;
$$;

/*
 * What the invite landing page is allowed to know before anyone signs in:
 * who is inviting, and whether the space still has room. Not the couple id,
 * not the partner's details, not anything about their plans.
 */
create or replace function public.peek_invite(code text)
returns table (inviter_name text, inviter_avatar_type text, inviter_avatar_value text, is_open boolean)
language sql
stable
security definer
set search_path = public
as $$
  select p.display_name, p.avatar_type, p.avatar_value, c.partner_2_user_id is null
  from public.couples c
  join public.profiles p on p.id = c.partner_1_user_id
  where c.invite_code = upper(trim(code));
$$;

/*
 * Take the second seat. Returns the couple id on success.
 *
 * Every refusal is its own message because the client has to be able to say
 * something true to the person: a wrong code and a full space are different
 * problems. The single-statement UPDATE with `partner_2_user_id is null` in
 * the WHERE clause is what makes "exactly two people" hold under a race —
 * two people redeeming the same code at once cannot both win.
 */
create or replace function public.join_couple_by_code(code text)
returns uuid
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  target public.couples%rowtype;
  joined_id uuid;
begin
  if auth.uid() is null then
    raise exception 'not signed in' using errcode = '28000';
  end if;

  select * into target from public.couples c where c.invite_code = upper(trim(code));

  if not found then
    raise exception 'That code does not match a Couple777 space.' using errcode = 'P0002';
  end if;

  if auth.uid() in (target.partner_1_user_id, target.partner_2_user_id) then
    return target.id;  -- Already in it; opening the link twice is not an error.
  end if;

  if exists (
    select 1 from public.couples c
    where auth.uid() in (c.partner_1_user_id, c.partner_2_user_id)
  ) then
    raise exception 'You are already in a Couple777 space.' using errcode = 'P0001';
  end if;

  update public.couples
     set partner_2_user_id = auth.uid()
   where id = target.id
     and partner_2_user_id is null
  returning id into joined_id;

  if joined_id is null then
    raise exception 'This space already has two people in it.' using errcode = 'P0001';
  end if;

  return joined_id;
end;
$$;

revoke all on function public.join_couple_by_code(text) from public, anon;
grant execute on function public.join_couple_by_code(text) to authenticated;
grant execute on function public.peek_invite(text) to anon, authenticated;

/* ---- Housekeeping ------------------------------------------------------- */

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists plans_touch_updated_at on public.plans;
create trigger plans_touch_updated_at
  before update on public.plans
  for each row execute function public.touch_updated_at();

/* ---- Realtime ----------------------------------------------------------- */
-- So a partner's yes lands on the other phone without a refresh. Realtime
-- respects RLS, so this publishes nothing a user could not already read.
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table public.plans;
    alter publication supabase_realtime add table public.plan_invites;
    alter publication supabase_realtime add table public.couples;
    alter publication supabase_realtime add table public.notifications;
    alter publication supabase_realtime add table public.cycles;
    alter publication supabase_realtime add table public.memories;
  end if;
exception when duplicate_object then
  null;  -- Re-running the migration is fine.
end $$;
