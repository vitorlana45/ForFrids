-- ============================================================
-- Eterno Pet - allow tribute authors to read their own pending rows
-- Required because the app inserts with .select('*').single().
-- ============================================================

alter table public.tributes enable row level security;

drop policy if exists "Author can view own tributes" on public.tributes;

create policy "Author can view own tributes"
  on public.tributes for select
  using (
    auth.uid() is not null
    and author_user_id = auth.uid()
  );
