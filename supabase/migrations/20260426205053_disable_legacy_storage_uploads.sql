-- ============================================================
-- Disable direct client uploads to legacy Supabase Storage.
-- Media uploads now go through /api/upload, which applies
-- plan, ownership, path, MIME and size validation server-side.
-- Existing public reads are intentionally kept for old assets.
-- ============================================================

drop policy if exists "Users upload pet photos" on storage.objects;
drop policy if exists "Users update pet photos" on storage.objects;
drop policy if exists "Users upload chronicle photos" on storage.objects;
drop policy if exists "Users update chronicle photos" on storage.objects;

-- Keep the buckets readable for previously generated public URLs, but
-- block browser/client writes by removing write policies above.
update storage.buckets
set file_size_limit = 5242880,
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']
where id in ('pet-photos', 'chronicle-photos');
