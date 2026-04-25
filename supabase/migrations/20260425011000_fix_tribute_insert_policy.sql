-- ============================================================
-- Eterno Pet - fix tribute insert RLS
-- Run after 20260425010000_tribute_moderation.sql.
-- ============================================================

alter table public.tributes enable row level security;

drop policy if exists "Authenticated users can create pending tributes" on public.tributes;

-- The app server action already validates that the memorial exists and is public.
-- Keep the RLS insert policy focused on identity and moderation state, so authenticated
-- visitors can submit a tribute without publishing it directly.
create policy "Authenticated users can create pending tributes"
  on public.tributes for insert
  with check (
    auth.uid() is not null
    and author_user_id = auth.uid()
    and status = 'pending'
  );
