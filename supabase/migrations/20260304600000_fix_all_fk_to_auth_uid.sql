-- =============================================================
-- Migration: Fix ALL FK constraints that reference user_accounts
-- Date: 2026-03-04
--
-- PROBLEM:
--   Some FKs created via Supabase Dashboard reference user_accounts(id)
--   (Postgres UUID) instead of user_accounts(auth_uid) (Firebase UID).
--   The app stores Firebase UIDs everywhere, so FKs must match.
--
-- FIX:
--   Drop ALL FK constraints on messages table (regardless of name),
--   then recreate them pointing to user_accounts(auth_uid).
--   Same for any other table with mismatched FKs.
-- =============================================================

-- ─── 1. MESSAGES: Drop ALL FKs dynamically ────────────────────────
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'public.messages'::regclass
      AND contype = 'f'
  LOOP
    EXECUTE format('ALTER TABLE public.messages DROP CONSTRAINT IF EXISTS %I', r.conname);
    RAISE NOTICE 'Dropped messages FK: %', r.conname;
  END LOOP;
END $$;

-- Recreate messages FKs → user_accounts(auth_uid)
ALTER TABLE messages
  ADD CONSTRAINT messages_sender_id_fkey
  FOREIGN KEY (sender_id) REFERENCES user_accounts(auth_uid) ON DELETE CASCADE;

ALTER TABLE messages
  ADD CONSTRAINT messages_receiver_id_fkey
  FOREIGN KEY (receiver_id) REFERENCES user_accounts(auth_uid) ON DELETE CASCADE;

-- messages.conversation_id → conversations(id)
ALTER TABLE messages
  ADD CONSTRAINT messages_conversation_id_fkey
  FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE;


-- ─── 2. CONVERSATIONS: Drop ALL FKs dynamically ───────────────────
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'public.conversations'::regclass
      AND contype = 'f'
  LOOP
    EXECUTE format('ALTER TABLE public.conversations DROP CONSTRAINT IF EXISTS %I', r.conname);
    RAISE NOTICE 'Dropped conversations FK: %', r.conname;
  END LOOP;
END $$;

-- Recreate conversations FKs → user_accounts(auth_uid)
ALTER TABLE conversations
  ADD CONSTRAINT conversations_participant1_id_fkey
  FOREIGN KEY (participant1_id) REFERENCES user_accounts(auth_uid) ON DELETE CASCADE;

ALTER TABLE conversations
  ADD CONSTRAINT conversations_participant2_id_fkey
  FOREIGN KEY (participant2_id) REFERENCES user_accounts(auth_uid) ON DELETE CASCADE;


-- ─── 3. RESERVATIONS: Ensure client_id FK → auth_uid ──────────────
-- (professional_id FK was already fixed in earlier migration to reference both
--  user_accounts(auth_uid) and professional_profiles(user_id))
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'public.reservations'::regclass
      AND contype = 'f'
      AND conname LIKE '%client_id%'
  LOOP
    EXECUTE format('ALTER TABLE public.reservations DROP CONSTRAINT IF EXISTS %I', r.conname);
    RAISE NOTICE 'Dropped reservations FK: %', r.conname;
  END LOOP;
END $$;

ALTER TABLE reservations
  ADD CONSTRAINT reservations_client_id_fkey
  FOREIGN KEY (client_id) REFERENCES user_accounts(auth_uid) ON DELETE CASCADE;
