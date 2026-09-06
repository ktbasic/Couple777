-- Private memories.
--
-- Some of what people keep here is not for the other person: a reflection
-- after an argument, something they are still working out. The capture flow
-- offers to keep those private, and a promise like that is only worth what the
-- policy behind it says — a flag the client checks is not privacy, it is a
-- request. So this adds the column and rewrites the memories policy around it.
--
-- Safe to run against a live project, and safe to run twice. Existing rows
-- default to 'shared', which is what they already were.

alter table public.memories
  add column if not exists visibility text not null default 'shared';

alter table public.memories
  drop constraint if exists memories_visibility_check;
alter table public.memories
  add constraint memories_visibility_check check (visibility in ('shared', 'private'));

create index if not exists memories_couple_visible_idx
  on public.memories (couple_id, visibility, happened_on desc);

-- The old policy was one `for all` for any couple member. It is replaced by
-- four, because a private memory reads differently from how it writes: only
-- its author may see it, and only its author may change or delete it, while
-- inserting is still just "a member of this couple, writing as themselves".

drop policy if exists memories_all_member on public.memories;

drop policy if exists memories_select_member on public.memories;
create policy memories_select_member on public.memories
  for select using (
    public.is_couple_member(couple_id)
    and (visibility <> 'private' or created_by = auth.uid())
  );

drop policy if exists memories_insert_member on public.memories;
create policy memories_insert_member on public.memories
  for insert with check (
    public.is_couple_member(couple_id) and created_by = auth.uid()
  );

drop policy if exists memories_update_member on public.memories;
create policy memories_update_member on public.memories
  for update using (
    public.is_couple_member(couple_id)
    and (visibility <> 'private' or created_by = auth.uid())
  )
  with check (
    public.is_couple_member(couple_id)
    and (visibility <> 'private' or created_by = auth.uid())
  );

drop policy if exists memories_delete_member on public.memories;
create policy memories_delete_member on public.memories
  for delete using (
    public.is_couple_member(couple_id)
    and (visibility <> 'private' or created_by = auth.uid())
  );
