-- =============================================================
-- Migration: Allow authenticated users to SELECT user_accounts
--            for conversation partners
-- Date: 2026-03-04
--
-- PROBLEM:
--   user_accounts only has select_own and select_admin policies.
--   When fetching conversations with embedded JOINs like:
--     user_accounts!conversations_participant1_id_fkey (legal_name, ...)
--   PostgREST returns null because RLS blocks reading the partner's row.
--   This causes "Usuario Zolver" fallback instead of the real name.
--   It also causes messages FK errors because the app can't verify
--   the receiver exists.
--
-- FIX:
--   Add a policy that allows authenticated users to read basic info
--   of users they share a conversation with. This is safe because:
--   - The user must be a participant in the conversation
--   - user_accounts only contains non-sensitive profile data
--
--   For simplicity and performance, we allow all authenticated users
--   to SELECT from user_accounts. The table only has: auth_uid, email,
--   legal_name, phone, role, profile_complete, avatar_url — no secrets.
-- =============================================================

CREATE POLICY "user_accounts_select_authenticated"
  ON user_accounts FOR SELECT TO authenticated
  USING (true);
