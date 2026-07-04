-- ViralCut AI — Database schema (Supabase / PostgreSQL)
-- Run this in the Supabase SQL editor to set up the full data model.

create extension if not exists "pgcrypto";

-- Users (mirrors auth.users, extended with plan/billing info)
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  plan text not null default 'free' check (plan in ('free','starter','creator','agency')),
  stripe_customer_id text,
  created_at timestamptz not null default now()
);

-- One row per uploaded source video / link
create table projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  title text not null default 'Untitled project',
  source_type text not null check (source_type in ('upload','youtube','twitch','podcast')),
  source_url text,
  original_video_url text,
  duration_seconds numeric,
  status text not null default 'uploaded'
    check (status in ('uploaded','transcribing','analyzing','rendering','ready','failed')),
  created_at timestamptz not null default now()
);

-- Transcript with word/segment-level timestamps (from Whisper/Deepgram)
create table transcripts (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  full_text text,
  segments jsonb not null default '[]', -- [{start,end,text}]
  language text default 'en',
  created_at timestamptz not null default now()
);

-- AI-detected clip candidates and their rendered output
create table clips (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  title text not null,
  hook text,
  start_time numeric not null,
  end_time numeric not null,
  score numeric check (score between 0 and 100),
  reason text,
  caption_style text default 'bold-yellow',
  output_video_url text,
  status text not null default 'pending'
    check (status in ('pending','rendering','ready','failed')),
  created_at timestamptz not null default now()
);

-- Stripe subscription state, mirrored via webhooks
create table subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  stripe_subscription_id text unique,
  plan text not null,
  status text not null check (status in ('active','past_due','canceled','trialing')),
  current_period_end timestamptz,
  created_at timestamptz not null default now()
);

-- Monthly clip usage, reset on billing cycle
create table usage_limits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  clips_used integer not null default 0,
  clips_limit integer not null default 3,
  period_start timestamptz not null default now(),
  period_end timestamptz not null default (now() + interval '30 days')
);

create index idx_projects_user on projects(user_id);
create index idx_clips_project on clips(project_id);
create index idx_transcripts_project on transcripts(project_id);
create index idx_usage_user on usage_limits(user_id);

-- Row level security: users can only see their own data
alter table profiles enable row level security;
alter table projects enable row level security;
alter table transcripts enable row level security;
alter table clips enable row level security;
alter table subscriptions enable row level security;
alter table usage_limits enable row level security;

create policy "Users manage own profile" on profiles
  for all using (auth.uid() = id);

create policy "Users manage own projects" on projects
  for all using (auth.uid() = user_id);

create policy "Users read own transcripts" on transcripts
  for select using (auth.uid() = (select user_id from projects where id = project_id));

create policy "Users manage own clips" on clips
  for all using (auth.uid() = (select user_id from projects where id = project_id));

create policy "Users read own subscription" on subscriptions
  for select using (auth.uid() = user_id);

create policy "Users read own usage" on usage_limits
  for select using (auth.uid() = user_id);
