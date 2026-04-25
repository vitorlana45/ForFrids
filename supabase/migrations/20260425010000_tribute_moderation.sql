-- ============================================================
-- Eterno Pet - tribute moderation and authenticated submission
-- Safe to run more than once.
-- ============================================================

alter table public.tributes
  add column if not exists author_user_id uuid references public.profiles(id) on delete set null,
  add column if not exists status text not null default 'approved',
  add column if not exists reviewed_at timestamptz;

alter table public.tributes
  drop constraint if exists tributes_status_check;

alter table public.tributes
  add constraint tributes_status_check
  check (status in ('pending', 'approved', 'rejected'));

alter table public.tributes
  alter column status set default 'pending';

create index if not exists idx_tributes_status on public.tributes(status);
create index if not exists idx_tributes_author_user_id on public.tributes(author_user_id);

alter table public.tributes enable row level security;

drop policy if exists "Public can view tributes for public memorials" on public.tributes;
drop policy if exists "Public can create tributes for public memorials" on public.tributes;
drop policy if exists "Tutor can delete tributes from their pets" on public.tributes;
drop policy if exists "Anyone can view approved tributes for public memorials" on public.tributes;
drop policy if exists "Tutor can view all tributes from their pets" on public.tributes;
drop policy if exists "Authenticated users can create pending tributes" on public.tributes;
drop policy if exists "Tutor can review tributes from their pets" on public.tributes;
drop policy if exists "Tutor can delete tributes from their pets" on public.tributes;

create policy "Anyone can view approved tributes for public memorials"
  on public.tributes for select
  using (
    status = 'approved'
    and exists (
      select 1 from public.pets
      where pets.id = tributes.pet_id and pets.is_public = true
    )
  );

create policy "Tutor can view all tributes from their pets"
  on public.tributes for select
  using (exists (
    select 1 from public.pets
    where pets.id = tributes.pet_id and pets.owner_id = auth.uid()
  ));

create policy "Authenticated users can create pending tributes"
  on public.tributes for insert
  with check (
    auth.uid() is not null
    and author_user_id = auth.uid()
    and status = 'pending'
    and exists (
      select 1 from public.pets
      where pets.id = tributes.pet_id and pets.is_public = true
    )
  );

create policy "Tutor can review tributes from their pets"
  on public.tributes for update
  using (exists (
    select 1 from public.pets
    where pets.id = tributes.pet_id and pets.owner_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.pets
    where pets.id = tributes.pet_id and pets.owner_id = auth.uid()
  ));

create policy "Tutor can delete tributes from their pets"
  on public.tributes for delete
  using (exists (
    select 1 from public.pets
    where pets.id = tributes.pet_id and pets.owner_id = auth.uid()
  ));
