-- =============================================================
-- Migration: Fix user_accounts_update_own Self-Referencing Recursion
-- Date: 2026-03-03
--
-- PROBLEM:
--   user_accounts_update_own WITH CHECK contains:
--     role = (SELECT ua.role FROM user_accounts ua WHERE ...)
--   This subquery on user_accounts triggers SELECT policy evaluation
--   on the same table → Postgres detects infinite recursion.
--
-- FIX:
--   1. Recreate user_accounts_update_own WITHOUT the self-referencing
--      subquery (simple ownership check only).
--   2. Add a BEFORE UPDATE trigger to prevent non-admin users from
--      changing their own role. Triggers bypass RLS — no recursion.
-- =============================================================


-- =============================================================
-- 1. FIX user_accounts_update_own — remove self-referencing subquery
-- =============================================================

DROP POLICY IF EXISTS "user_accounts_update_own" ON user_accounts;
CREATE POLICY "user_accounts_update_own"
  ON user_accounts FOR UPDATE TO authenticated
  USING  (auth_uid = (select _uid()))
  WITH CHECK (auth_uid = (select _uid()));


-- =============================================================
-- 2. TRIGGER: Prevent non-admin users from changing their own role
--    Reads app_role from JWT (no table query = no RLS recursion).
--    Admins can change any user's role via user_accounts_update_admin.
-- =============================================================

CREATE OR REPLACE FUNCTION public._guard_role_change()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- If role didn't change, allow the update
  IF NEW.role IS NOT DISTINCT FROM OLD.role THEN
    RETURN NEW;
  END IF;

  -- If caller is admin (from JWT), allow role changes
  IF coalesce(
    current_setting('request.jwt.claims', true)::json ->> 'app_role',
    ''
  ) = 'admin' THEN
    RETURN NEW;
  END IF;

  -- Non-admin trying to change role → block
  RAISE EXCEPTION 'Cannot change your own role'
    USING ERRCODE = 'insufficient_privilege';
END;
$$;

-- Drop if exists (idempotent)
DROP TRIGGER IF EXISTS guard_role_change ON user_accounts;

CREATE TRIGGER guard_role_change
  BEFORE UPDATE ON user_accounts
  FOR EACH ROW
  EXECUTE FUNCTION public._guard_role_change();
