-- =============================================================
-- Migration: Fix professional_profiles_update_own policy
-- Date: 2026-03-04
--
-- PROBLEM:
--   Previous migration restricted WITH CHECK to identity_status IN ('pending')
--   which blocks verified professionals from updating is_active, biography, etc.
--
-- FIX:
--   Allow professionals to update their own row freely EXCEPT they cannot
--   change identity_status. We enforce this by checking that the new
--   identity_status equals the current value using a BEFORE UPDATE trigger
--   instead of a self-referencing policy subquery (which causes recursion).
-- =============================================================

-- 1. Drop the broken policy
DROP POLICY IF EXISTS "professional_profiles_update_own" ON professional_profiles;

-- 2. Recreate: professionals can update their own row (no identity_status restriction in policy)
CREATE POLICY "professional_profiles_update_own"
  ON professional_profiles FOR UPDATE TO authenticated
  USING  (user_id = (select _uid()))
  WITH CHECK (user_id = (select _uid()));

-- 3. Create a trigger that prevents non-admin users from changing identity_status
CREATE OR REPLACE FUNCTION public._guard_identity_status()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- If identity_status is being changed, only allow it if the caller is admin
  IF NEW.identity_status IS DISTINCT FROM OLD.identity_status THEN
    IF coalesce(
      current_setting('request.jwt.claims', true)::json ->> 'app_role',
      ''
    ) <> 'admin' THEN
      RAISE EXCEPTION 'Solo un administrador puede cambiar identity_status';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- Drop if exists to make idempotent
DROP TRIGGER IF EXISTS guard_identity_status ON professional_profiles;
CREATE TRIGGER guard_identity_status
  BEFORE UPDATE ON professional_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public._guard_identity_status();
