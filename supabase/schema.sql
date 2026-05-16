create extension if not exists pgcrypto;

create table if not exists public.user_profiles (
  id text primary key,
  nickname text not null,
  grade_and_school text not null,
  contact text not null,
  email text,
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

create table if not exists public.program_interests (
  id uuid primary key default gen_random_uuid(),
  user_profile_id text not null references public.user_profiles(id) on delete cascade,
  major_id text not null,
  interest_level text not null default 'request_info',
  created_at timestamptz not null default now()
);

create index if not exists idx_quiz_results_user_profile_id on public.quiz_results(user_profile_id);
create index if not exists idx_program_interests_user_profile_id on public.program_interests(user_profile_id);
create index if not exists idx_program_interests_major_id on public.program_interests(major_id);

alter table public.user_profiles enable row level security;
alter table public.quiz_results enable row level security;
alter table public.program_interests enable row level security;

drop policy if exists "public read user_profiles" on public.user_profiles;
drop policy if exists "public insert user_profiles" on public.user_profiles;
drop policy if exists "public update user_profiles" on public.user_profiles;
drop policy if exists "public read quiz_results" on public.quiz_results;
drop policy if exists "public insert quiz_results" on public.quiz_results;
drop policy if exists "public read program_interests" on public.program_interests;
drop policy if exists "public insert program_interests" on public.program_interests;

create policy "public read user_profiles"
  on public.user_profiles
  for select
  using (true);

create policy "public insert user_profiles"
  on public.user_profiles
  for insert
  with check (true);

create policy "public update user_profiles"
  on public.user_profiles
  for update
  using (true)
  with check (true);

create policy "public read quiz_results"
  on public.quiz_results
  for select
  using (true);

create policy "public insert quiz_results"
  on public.quiz_results
  for insert
  with check (true);

create policy "public read program_interests"
  on public.program_interests
  for select
  using (true);

create policy "public insert program_interests"
  on public.program_interests
  for insert
  with check (true);

create table if not exists public.career_feedback (
  id uuid primary key default gen_random_uuid(),
  user_profile_id text not null references public.user_profiles(id) on delete cascade,
  career_cluster_id text not null,
  interest_level integer not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_career_feedback_user_profile_id on public.career_feedback(user_profile_id);

create policy "public insert career_feedback"
  on public.career_feedback
  for insert
  with check (true);

