-- Supabase current-state inspection query set
-- Run this in Supabase SQL Editor to compare the live database against the app's expectations.

-- 1) Tables in public schema that matter to the app.
select
  table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in (
    'user_profiles',
    'quiz_results',
    'program_interests',
    'career_feedback',
    'event_logs'
  )
order by table_name;

-- 2) Columns for the app tables.
select
  table_name,
  ordinal_position,
  column_name,
  data_type,
  is_nullable,
  column_default
from information_schema.columns
where table_schema = 'public'
  and table_name in (
    'user_profiles',
    'quiz_results',
    'program_interests',
    'career_feedback',
    'event_logs'
  )
order by table_name, ordinal_position;

-- 3) RLS status for the same tables.
select
  c.relname as table_name,
  c.relrowsecurity as rls_enabled,
  c.relforcerowsecurity as force_rls
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in (
    'user_profiles',
    'quiz_results',
    'program_interests',
    'career_feedback',
    'event_logs'
  )
order by c.relname;

-- 4) Policies currently attached to the app tables.
select
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
from pg_policies
where schemaname = 'public'
  and tablename in (
    'user_profiles',
    'quiz_results',
    'program_interests',
    'career_feedback',
    'event_logs'
  )
order by tablename, policyname;

-- 5) Quick row counts for sanity checks.
select 'user_profiles' as table_name, count(*) as row_count from public.user_profiles
union all
select 'quiz_results' as table_name, count(*) as row_count from public.quiz_results
union all
select 'program_interests' as table_name, count(*) as row_count from public.program_interests
union all
select 'career_feedback' as table_name, count(*) as row_count from public.career_feedback
union all
select 'event_logs' as table_name, count(*) as row_count from public.event_logs
order by table_name;
