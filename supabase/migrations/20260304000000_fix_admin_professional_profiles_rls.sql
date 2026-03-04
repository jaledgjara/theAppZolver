-- =============================================================
-- Migration: Fix Admin RLS on professional_profiles
-- Date: 2026-03-04
--
-- PROBLEM:
--   professional_profiles_update_admin uses _has_role('admin')
--   which queries user_accounts internally. With FORCE ROW LEVEL
--   SECURITY on user_accounts, the inner query may fail silently.
--
-- FIX:
--   Use _jwt_role() (reads app_role from JWT, no table query)
--   for all admin policies on professional_profiles and
--   platform_settings. Also add WITH CHECK clause.
-- =============================================================

-- professional_profiles: admin UPDATE
DROP POLICY IF EXISTS "professional_profiles_update_admin" ON professional_profiles;
CREATE POLICY "professional_profiles_update_admin"
  ON professional_profiles FOR UPDATE TO authenticated
  USING  ((select _jwt_role()) = 'admin')
  WITH CHECK ((select _jwt_role()) = 'admin');

-- professional_profiles: admin SELECT (also fix for consistency)
DROP POLICY IF EXISTS "professional_profiles_select_admin" ON professional_profiles;
CREATE POLICY "professional_profiles_select_admin"
  ON professional_profiles FOR SELECT TO authenticated
  USING ((select _jwt_role()) = 'admin');

-- platform_settings: admin UPDATE (same issue)
DROP POLICY IF EXISTS "platform_settings_update_admin" ON platform_settings;
CREATE POLICY "platform_settings_update_admin"
  ON platform_settings FOR UPDATE TO authenticated
  USING  ((select _jwt_role()) = 'admin')
  WITH CHECK ((select _jwt_role()) = 'admin');
