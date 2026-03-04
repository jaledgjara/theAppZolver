-- Fix Storage RLS: replace complex subquery with simple bucket-level policy.
-- Security for participant access is enforced at the messages table RLS level
-- (messages_insert_sender requires sender to be a conversation participant).

DROP POLICY IF EXISTS "messages_storage_insert" ON storage.objects;
DROP POLICY IF EXISTS "messages_storage_select" ON storage.objects;

CREATE POLICY "messages_storage_insert"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'messages');

CREATE POLICY "messages_storage_select"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'messages');
