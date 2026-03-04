-- Fix Storage RLS for messages bucket
-- Allows authenticated conversation participants to upload and view image messages

-- DROP (idempotent)
DROP POLICY IF EXISTS "messages_storage_insert" ON storage.objects;
DROP POLICY IF EXISTS "messages_storage_select" ON storage.objects;

-- INSERT: uploader must be a participant in the conversation (folder name = conversationId)
CREATE POLICY "messages_storage_insert"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'messages'
  AND EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = (storage.foldername(name))[1]::uuid
      AND (
        c.participant1_id = (select public._uid())
        OR c.participant2_id = (select public._uid())
      )
  )
);

-- SELECT: only conversation participants can access their images
CREATE POLICY "messages_storage_select"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'messages'
  AND EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = (storage.foldername(name))[1]::uuid
      AND (
        c.participant1_id = (select public._uid())
        OR c.participant2_id = (select public._uid())
      )
  )
);
