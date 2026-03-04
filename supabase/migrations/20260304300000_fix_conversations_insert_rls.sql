-- =============================================================
-- Migration: Fix conversations_insert_creator RLS
-- Date: 2026-03-04
--
-- PROBLEM:
--   conversations_insert_creator has EXISTS subquery on user_accounts
--   which triggers FORCE RLS evaluation → potential recursion/denial.
--
-- FIX:
--   Remove the EXISTS check. The participant2_id is already validated by:
--   1. Application logic (ConversationService passes a known user ID)
--   2. We keep participant1_id = _uid() and participant2_id <> _uid()
--   If participant2_id doesn't exist, the app handles it gracefully.
-- =============================================================

DROP POLICY IF EXISTS "conversations_insert_creator" ON conversations;
CREATE POLICY "conversations_insert_creator"
  ON conversations FOR INSERT TO authenticated
  WITH CHECK (
    participant1_id = (select _uid())
    AND participant2_id <> (select _uid())
  );
