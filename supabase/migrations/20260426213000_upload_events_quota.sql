-- Tracks server-side uploads for plan quotas and abuse detection.

create extension if not exists "uuid-ossp";

create table if not exists public.upload_events (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  scope text not null check (scope in ('profile_avatar', 'pet_avatar', 'pet_timeline', 'chronicle_cover')),
  object_key text not null,
  bytes integer not null check (bytes > 0),
  created_at timestamptz not null default now()
);

create index if not exists idx_upload_events_user_created
  on public.upload_events(user_id, created_at desc);

create index if not exists idx_upload_events_scope_created
  on public.upload_events(scope, created_at desc);

alter table public.upload_events enable row level security;

drop policy if exists "Users can read own upload events" on public.upload_events;
drop policy if exists "Users cannot mutate upload events directly" on public.upload_events;

create policy "Users can read own upload events"
  on public.upload_events for select
  using (auth.uid() = user_id);

-- No client insert/update/delete policy on purpose. Upload events are written
-- only by server routes using the Supabase service role.
