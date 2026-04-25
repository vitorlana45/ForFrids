-- ============================================================
-- Eterno Pet - social, chronicles, storage and billing schema
-- Safe to run more than once in Supabase SQL Editor.
-- ============================================================

create extension if not exists "uuid-ossp";

create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ------------------------------------------------------------
-- Tributes for public memorial pages
-- ------------------------------------------------------------
create table if not exists public.tributes (
  id uuid primary key default uuid_generate_v4(),
  pet_id uuid not null references public.pets(id) on delete cascade,
  author_name text not null,
  author_relation text,
  message text not null check (char_length(message) <= 600),
  created_at timestamptz not null default now()
);

create index if not exists idx_tributes_pet_id on public.tributes(pet_id);
create index if not exists idx_tributes_created_at on public.tributes(created_at desc);

alter table public.tributes enable row level security;

drop policy if exists "Public can view tributes for public memorials" on public.tributes;
drop policy if exists "Public can create tributes for public memorials" on public.tributes;
drop policy if exists "Tutor can delete tributes from their pets" on public.tributes;

create policy "Public can view tributes for public memorials"
  on public.tributes for select
  using (exists (
    select 1 from public.pets
    where pets.id = tributes.pet_id and pets.is_public = true
  ));

create policy "Public can create tributes for public memorials"
  on public.tributes for insert
  with check (exists (
    select 1 from public.pets
    where pets.id = tributes.pet_id and pets.is_public = true
  ));

create policy "Tutor can delete tributes from their pets"
  on public.tributes for delete
  using (exists (
    select 1 from public.pets
    where pets.id = tributes.pet_id and pets.owner_id = auth.uid()
  ));

-- ------------------------------------------------------------
-- Time capsules title + update policy
-- ------------------------------------------------------------
alter table public.time_capsules
  add column if not exists title text not null default 'Capsula do tempo';

drop policy if exists "Tutor atualiza capsulas de seus pets" on public.time_capsules;
drop policy if exists "Tutor updates capsules from their pets" on public.time_capsules;

create policy "Tutor updates capsules from their pets"
  on public.time_capsules for update
  using (exists (
    select 1 from public.pets
    where pets.id = time_capsules.pet_id and pets.owner_id = auth.uid()
  ));

-- ------------------------------------------------------------
-- Chronicles / diary
-- ------------------------------------------------------------
create table if not exists public.chronicles (
  id uuid primary key default uuid_generate_v4(),
  pet_id uuid not null references public.pets(id) on delete cascade,
  title text not null,
  content text not null,
  excerpt text,
  cover_url text,
  event_date date,
  life_phase text,
  mood text,
  is_published boolean not null default true,
  reading_minutes integer not null default 1 check (reading_minutes >= 1),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_chronicles_pet_id on public.chronicles(pet_id);
create index if not exists idx_chronicles_event_date on public.chronicles(event_date desc);
create index if not exists idx_chronicles_published on public.chronicles(is_published);

drop trigger if exists trg_chronicles_updated_at on public.chronicles;
create trigger trg_chronicles_updated_at
  before update on public.chronicles
  for each row execute function public.update_updated_at();

alter table public.chronicles enable row level security;

drop policy if exists "Tutor sees chronicles from their pets" on public.chronicles;
drop policy if exists "Public sees published chronicles from public memorials" on public.chronicles;
drop policy if exists "Tutor creates chronicles for their pets" on public.chronicles;
drop policy if exists "Tutor updates chronicles from their pets" on public.chronicles;
drop policy if exists "Tutor deletes chronicles from their pets" on public.chronicles;

create policy "Tutor sees chronicles from their pets"
  on public.chronicles for select
  using (exists (
    select 1 from public.pets
    where pets.id = chronicles.pet_id and pets.owner_id = auth.uid()
  ));

create policy "Public sees published chronicles from public memorials"
  on public.chronicles for select
  using (
    is_published = true
    and exists (
      select 1 from public.pets
      where pets.id = chronicles.pet_id and pets.is_public = true
    )
  );

create policy "Tutor creates chronicles for their pets"
  on public.chronicles for insert
  with check (exists (
    select 1 from public.pets
    where pets.id = chronicles.pet_id and pets.owner_id = auth.uid()
  ));

create policy "Tutor updates chronicles from their pets"
  on public.chronicles for update
  using (exists (
    select 1 from public.pets
    where pets.id = chronicles.pet_id and pets.owner_id = auth.uid()
  ));

create policy "Tutor deletes chronicles from their pets"
  on public.chronicles for delete
  using (exists (
    select 1 from public.pets
    where pets.id = chronicles.pet_id and pets.owner_id = auth.uid()
  ));

-- ------------------------------------------------------------
-- Billing state mirrored from Stripe
-- ------------------------------------------------------------
create table if not exists public.subscriptions (
  id uuid primary key default uuid_generate_v4(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  stripe_customer_id text,
  stripe_subscription_id text unique,
  plan_id text not null default 'free' check (plan_id in ('free', 'premium', 'lifetime')),
  status text not null default 'inactive',
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_subscriptions_profile_id on public.subscriptions(profile_id);
create index if not exists idx_subscriptions_customer_id on public.subscriptions(stripe_customer_id);

drop trigger if exists trg_subscriptions_updated_at on public.subscriptions;
create trigger trg_subscriptions_updated_at
  before update on public.subscriptions
  for each row execute function public.update_updated_at();

alter table public.subscriptions enable row level security;

drop policy if exists "Tutor sees own subscription" on public.subscriptions;

create policy "Tutor sees own subscription"
  on public.subscriptions for select
  using (auth.uid() = profile_id);

-- ------------------------------------------------------------
-- Public storage buckets used by client uploads
-- ------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('pet-photos', 'pet-photos', true, 5242880, array['image/jpeg', 'image/png', 'image/webp']),
  ('chronicle-photos', 'chronicle-photos', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Users upload pet photos" on storage.objects;
drop policy if exists "Users update pet photos" on storage.objects;
drop policy if exists "Users read public pet photos" on storage.objects;
drop policy if exists "Users upload chronicle photos" on storage.objects;
drop policy if exists "Users update chronicle photos" on storage.objects;
drop policy if exists "Users read public chronicle photos" on storage.objects;

create policy "Users upload pet photos"
  on storage.objects for insert
  with check (bucket_id = 'pet-photos' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users update pet photos"
  on storage.objects for update
  using (bucket_id = 'pet-photos' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users read public pet photos"
  on storage.objects for select
  using (bucket_id = 'pet-photos');

create policy "Users upload chronicle photos"
  on storage.objects for insert
  with check (bucket_id = 'chronicle-photos' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users update chronicle photos"
  on storage.objects for update
  using (bucket_id = 'chronicle-photos' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users read public chronicle photos"
  on storage.objects for select
  using (bucket_id = 'chronicle-photos');
