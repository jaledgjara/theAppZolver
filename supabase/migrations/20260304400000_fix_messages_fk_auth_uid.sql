-- =============================================================
-- Migration: Fix messages FK to reference user_accounts(auth_uid)
-- Date: 2026-03-04
--
-- PROBLEM:
--   messages.sender_id and messages.receiver_id store Firebase UIDs
--   (same as user_accounts.auth_uid), but the FK constraints created
--   via Dashboard likely reference user_accounts(id) (Postgres UUID).
--   This causes "Key is not present in table user_accounts" errors
--   when inserting messages with Firebase UIDs.
--
-- FIX:
--   Drop and recreate FKs to reference user_accounts(auth_uid).
-- =============================================================

-- 1. Drop existing FK constraints (try common naming patterns from Dashboard)
ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_receiver_id_fkey;
ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_sender_id_fkey;
ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_receiver_id_fkey1;
ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_sender_id_fkey1;

-- 2. Recreate with correct reference to auth_uid + CASCADE
ALTER TABLE messages
  ADD CONSTRAINT messages_sender_id_fkey
  FOREIGN KEY (sender_id) REFERENCES user_accounts(auth_uid) ON DELETE CASCADE;

ALTER TABLE messages
  ADD CONSTRAINT messages_receiver_id_fkey
  FOREIGN KEY (receiver_id) REFERENCES user_accounts(auth_uid) ON DELETE CASCADE;
