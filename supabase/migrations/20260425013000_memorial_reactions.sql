-- ============================================================
-- Eterno Pet - persisted memorial reactions
-- Safe to run more than once.
-- ============================================================

create extension if not exists "uuid-ossp";

create table if not exists public.memorial_reactions (
  id uuid primary key default uuid_generate_v4(),
  pet_id uuid not null references public.pets(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  reaction_type text not null default 'heart',
  created_at timestamptz not null default now(),
  constraint memorial_reactions_type_check check (reaction_type in ('heart')),
  constraint memorial_reactions_unique unique (pet_id, user_id, reaction_type)
);

create index if not exists idx_memorial_reactions_pet_id
  on public.memorial_reactions(pet_id);

create index if not exists idx_memorial_reactions_user_id
  on public.memorial_reactions(user_id);

alter table public.memorial_reactions enable row level security;

drop policy if exists "Anyone can view reactions for public memorials" on public.memorial_reactions;
drop policy if exists "Tutor can view reactions for own pets" on public.memorial_reactions;
drop policy if exists "Authenticated users can react to public memorials" on public.memorial_reactions;
drop policy if exists "Users can remove own reactions" on public.memorial_reactions;

create policy "Anyone can view reactions for public memorials"
  on public.memorial_reactions for select
  using (exists (
    select 1 from public.pets
    where pets.id = memorial_reactions.pet_id
      and pets.is_public = true
  ));

create policy "Tutor can view reactions for own pets"
  on public.memorial_reactions for select
  using (exists (
    select 1 from public.pets
    where pets.id = memorial_reactions.pet_id
      and pets.owner_id = auth.uid()
  ));

create policy "Authenticated users can react to public memorials"
  on public.memorial_reactions for insert
  with check (
    auth.uid() is not null
    and user_id = auth.uid()
    and exists (
      select 1 from public.pets
      where pets.id = memorial_reactions.pet_id
        and pets.is_public = true
    )
  );

create policy "Users can remove own reactions"
  on public.memorial_reactions for delete
  using (user_id = auth.uid());
