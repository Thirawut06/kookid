create extension if not exists pgcrypto;

create table if not exists public.user_profiles (
  id text primary key,
  nickname text not null,
  user_type text,
  grade_and_school text,
  contact text,
  email text,
  line_id text,
  education_level text,
  school_province text,
  consent_accepted boolean not null default true,
  consent_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.quiz_results (
  id uuid primary key default gen_random_uuid(),
  user_profile_id text not null references public.user_profiles(id) on delete cascade,
  result jsonb not null,
  linked_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'quiz_results_user_profile_id_key'
      and conrelid = 'public.quiz_results'::regclass
  ) then
    alter table public.quiz_results
      add constraint quiz_results_user_profile_id_key unique (user_profile_id);
  end if;
end $$;

create table if not exists public.program_interests (
  id uuid primary key default gen_random_uuid(),
  user_profile_id text not null references public.user_profiles(id) on delete cascade,
  major_id text not null,
  university_id text,
  interest_level text not null default 'request_info',
  created_at timestamptz not null default now()
);

alter table public.program_interests
  add column if not exists university_id text;

create index if not exists idx_quiz_results_user_profile_id on public.quiz_results(user_profile_id);
create index if not exists idx_program_interests_user_profile_id on public.program_interests(user_profile_id);
create index if not exists idx_program_interests_major_id on public.program_interests(major_id);

alter table public.user_profiles enable row level security;
alter table public.quiz_results enable row level security;
alter table public.program_interests enable row level security;

alter table public.user_profiles
  add column if not exists user_type text;

alter table public.user_profiles
  add column if not exists line_id text;

alter table public.user_profiles
  add column if not exists education_level text;

alter table public.user_profiles
  alter column grade_and_school drop not null;

alter table public.user_profiles
  alter column contact drop not null;

do $$
begin
  if exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'user_profiles' and policyname = 'public read user_profiles'
  ) then
    drop policy "public read user_profiles" on public.user_profiles;
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'user_profiles' and policyname = 'public insert user_profiles'
  ) then
    create policy "public insert user_profiles"
      on public.user_profiles
      for insert
      with check (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'user_profiles' and policyname = 'public update user_profiles'
  ) then
    create policy "public update user_profiles"
      on public.user_profiles
      for update
      using (true)
      with check (true);
  end if;

  if exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'quiz_results' and policyname = 'public read quiz_results'
  ) then
    drop policy "public read quiz_results" on public.quiz_results;
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'quiz_results' and policyname = 'public insert quiz_results'
  ) then
    create policy "public insert quiz_results"
      on public.quiz_results
      for insert
      with check (true);
  end if;

  if exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'program_interests' and policyname = 'public read program_interests'
  ) then
    drop policy "public read program_interests" on public.program_interests;
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'program_interests' and policyname = 'public insert program_interests'
  ) then
    create policy "public insert program_interests"
      on public.program_interests
      for insert
      with check (true);
  end if;
end $$;

create table if not exists public.career_feedback (
  id uuid primary key default gen_random_uuid(),
  user_profile_id text not null references public.user_profiles(id) on delete cascade,
  career_cluster_id text not null,
  interest_level integer not null,
  created_at timestamptz not null default now()
);

alter table public.career_feedback enable row level security;

create index if not exists idx_career_feedback_user_profile_id on public.career_feedback(user_profile_id);

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'career_feedback' and policyname = 'public insert career_feedback'
  ) then
    create policy "public insert career_feedback"
      on public.career_feedback
      for insert
      with check (true);
  end if;
end $$;

create table if not exists public.event_logs (
  id uuid primary key default gen_random_uuid(),
  event_name text not null,
  user_profile_id text references public.user_profiles(id) on delete set null,
  session_id text,
  page text,
  payload jsonb,
  created_at timestamptz not null default now()
);

alter table public.event_logs enable row level security;

create index if not exists idx_event_logs_event_name on public.event_logs(event_name);
create index if not exists idx_event_logs_created_at on public.event_logs(created_at);
create index if not exists idx_event_logs_user_profile_id on public.event_logs(user_profile_id);

do $$
begin
  if exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'event_logs' and policyname = 'public read event_logs'
  ) then
    drop policy "public read event_logs" on public.event_logs;
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'event_logs' and policyname = 'public insert event_logs'
  ) then
    create policy "public insert event_logs"
      on public.event_logs
      for insert
      with check (true);
  end if;
end $$;

