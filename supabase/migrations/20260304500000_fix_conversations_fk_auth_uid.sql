-- =============================================================
-- Migration: Fix conversations FK to reference user_accounts(auth_uid)
-- Date: 2026-03-04
--
-- PROBLEM:
--   conversations.participant1_id and participant2_id store Firebase UIDs,
--   but FKs may reference user_accounts(id) (UUID).
--   This breaks PostgREST embedded JOINs like:
--     user_accounts!participant1_id (legal_name, ...)
--   causing partner names to be null in the conversation list.
--
-- FIX:
--   Drop and recreate FKs to reference user_accounts(auth_uid).
-- =============================================================

-- Drop existing FK constraints
ALTER TABLE conversations DROP CONSTRAINT IF EXISTS conversations_participant1_id_fkey;
ALTER TABLE conversations DROP CONSTRAINT IF EXISTS conversations_participant2_id_fkey;
ALTER TABLE conversations DROP CONSTRAINT IF EXISTS conversations_participant1_id_fkey1;
ALTER TABLE conversations DROP CONSTRAINT IF EXISTS conversations_participant2_id_fkey1;

-- Recreate with correct reference + CASCADE
ALTER TABLE conversations
  ADD CONSTRAINT conversations_participant1_id_fkey
  FOREIGN KEY (participant1_id) REFERENCES user_accounts(auth_uid) ON DELETE CASCADE;

ALTER TABLE conversations
  ADD CONSTRAINT conversations_participant2_id_fkey
  FOREIGN KEY (participant2_id) REFERENCES user_accounts(auth_uid) ON DELETE CASCADE;
