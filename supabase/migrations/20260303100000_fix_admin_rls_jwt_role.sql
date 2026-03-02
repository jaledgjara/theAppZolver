-- =============================================================
-- Migration: Fix Admin RLS Infinite Recursion + Linter Warning
-- Date: 2026-03-03
--
-- PROBLEM:
--   user_accounts_select_admin and user_accounts_update_admin call
--   _has_role('admin'), which queries user_accounts. With FORCE ROW
--   LEVEL SECURITY enabled, that inner query must evaluate the same
--   policies again → infinite recursion.
--
-- FIX:
--   1. Create _jwt_role() — reads app_role from JWT claims (no table query)
--   2. Recreate the two admin policies on user_accounts using _jwt_role()
--   3. Fix session_logs_select_own to use (select auth.uid()) initplan wrapper
--
-- NOTE: _has_role() is kept — its 6 uses on other tables are safe
--       (no self-reference on user_accounts).
-- =============================================================


-- =============================================================
-- 1. CREATE _jwt_role() — reads role from JWT, never touches a table
--    Fail-closed: returns '' if app_role is missing from the token.
-- =============================================================
CREATE OR REPLACE FUNCTION public._jwt_role()
RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT coalesce(
    current_setting('request.jwt.claims', true)::json ->> 'app_role',
    ''
  );
$$;


-- =============================================================
-- 2. RECREATE user_accounts ADMIN POLICIES using _jwt_role()
-- =============================================================

DROP POLICY IF EXISTS "user_accounts_select_admin" ON user_accounts;
CREATE POLICY "user_accounts_select_admin"
  ON user_accounts FOR SELECT TO authenticated
  USING ((select _jwt_role()) = 'admin');

DROP POLICY IF EXISTS "user_accounts_update_admin" ON user_accounts;
CREATE POLICY "user_accounts_update_admin"
  ON user_accounts FOR UPDATE TO authenticated
  USING ((select _jwt_role()) = 'admin')
  WITH CHECK (auth_uid != (select _uid()) OR role = 'admin');


-- =============================================================
-- 3. FIX session_logs initplan wrapper
--    Was: user_id = auth.uid()  (per-row evaluation)
--    Now: user_id = (select auth.uid())  (initplan, evaluated once)
-- =============================================================

DROP POLICY IF EXISTS "session_logs_select_own" ON session_logs;
CREATE POLICY "session_logs_select_own"
  ON session_logs FOR SELECT TO authenticated
  USING (user_id = (select auth.uid()));
