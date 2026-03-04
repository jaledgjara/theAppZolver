-- Fix Storage RLS for avatars and portfolio buckets.
-- Profile photo uploads (avatars) and portfolio image uploads were blocked
-- because these buckets had zero policies defined.

-- ── avatars ──────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "avatars_storage_insert" ON storage.objects;
DROP POLICY IF EXISTS "avatars_storage_select" ON storage.objects;

-- Only the owner can upload to their own folder (path: {uid}/filename)
CREATE POLICY "avatars_storage_insert"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'avatars'
  AND split_part(name, '/', 1) = (select public._uid())
);

-- Anyone authenticated can view profile photos (public catalog)
CREATE POLICY "avatars_storage_select"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'avatars');


-- ── portfolio ─────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "portfolio_storage_insert" ON storage.objects;
DROP POLICY IF EXISTS "portfolio_storage_select" ON storage.objects;

-- Only the owner can upload to their own folder (path: {uid}/filename)
CREATE POLICY "portfolio_storage_insert"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'portfolio'
  AND split_part(name, '/', 1) = (select public._uid())
);

-- Anyone authenticated can view portfolio images (public catalog)
CREATE POLICY "portfolio_storage_select"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'portfolio');


-- ── messages cleanup ─────────────────────────────────────────────────────────
-- Remove duplicate migration-created policies; dashboard policies
-- ("Permitir lectura/subida a usuarios autenticados") already cover this bucket.

DROP POLICY IF EXISTS "messages_storage_insert" ON storage.objects;
DROP POLICY IF EXISTS "messages_storage_select" ON storage.objects;
