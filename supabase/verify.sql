-- Did the migration land correctly?
--
-- Paste this whole file into the Supabase SQL editor and run it. You want one
-- row back, reading: ok | ok | ok | ok.
--
-- Anything that is not "ok" tells you exactly what to fix, and re-running
-- 0001_init.sql is safe — it is written to be run more than once.

with expected_tables(name) as (
  values ('profiles'), ('couples'), ('cycles'), ('plans'),
         ('plan_invites'), ('memories'), ('memory_private_notes'), ('notifications')
),
present as (
  select t.name,
         c.oid is not null as exists,
         coalesce(c.relrowsecurity, false) as rls_on
  from expected_tables t
  left join pg_class c
    on c.relname = t.name and c.relnamespace = 'public'::regnamespace and c.relkind = 'r'
),
missing as (select string_agg(name, ', ') m from present where not exists),
unprotected as (select string_agg(name, ', ') m from present where exists and not rls_on),
policy_count as (select count(*) n from pg_policies where schemaname = 'public'),
fns as (
  select string_agg(name, ', ') m
  from (values ('is_couple_member'), ('join_couple_by_code'),
               ('peek_invite'), ('generate_invite_code')) as f(name)
  where not exists (
    select 1 from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = f.name
  )
)
select
  coalesce('MISSING TABLES: ' || (select m from missing), 'ok')          as tables,
  coalesce('RLS OFF: ' || (select m from unprotected), 'ok')             as row_level_security,
  case when (select n from policy_count) >= 18
       then 'ok'
       else 'ONLY ' || (select n from policy_count) || ' POLICIES — expected 18 or more'
  end                                                                    as policies,
  coalesce('MISSING FUNCTIONS: ' || (select m from fns), 'ok')           as functions;
