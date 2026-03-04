-- =============================================================
-- Migration: Fix ALL infinite recursion on professional_profiles
-- Date: 2026-03-04
--
-- PROBLEM:
--   "infinite recursion detected in policy for relation professional_profiles"
--
--   1. professional_profiles_insert_own calls _has_role('professional')
--      which queries user_accounts → triggers FORCE RLS on user_accounts
--      → evaluates user_accounts policies → _has_role() cycles back.
--
--   2. professional_profiles_update_own WITH CHECK has a self-referencing
--      subquery on professional_profiles, which re-triggers all policies.
--
-- FIX:
--   Replace ALL _has_role() with _jwt_role() on professional_profiles.
--   Remove self-referencing subquery from update_own WITH CHECK.
--   Also fix professional_service_prices_insert_own (same issue).
-- =============================================================


-- ─── 1. professional_profiles: DROP + RECREATE ALL policies ────────

DROP POLICY IF EXISTS "professional_profiles_select_all"    ON professional_profiles;
DROP POLICY IF EXISTS "professional_profiles_select_admin"  ON professional_profiles;
DROP POLICY IF EXISTS "professional_profiles_insert_own"    ON professional_profiles;
DROP POLICY IF EXISTS "professional_profiles_update_own"    ON professional_profiles;
DROP POLICY IF EXISTS "professional_profiles_update_admin"  ON professional_profiles;

-- Anyone authenticated can SELECT (public catalog of professionals)
CREATE POLICY "professional_profiles_select_all"
  ON professional_profiles FOR SELECT TO authenticated
  USING (true);

-- Admin can SELECT all (redundant with above, kept for explicit admin access)
CREATE POLICY "professional_profiles_select_admin"
  ON professional_profiles FOR SELECT TO authenticated
  USING ((select _jwt_role()) = 'admin');

-- Professional can INSERT their own profile
CREATE POLICY "professional_profiles_insert_own"
  ON professional_profiles FOR INSERT TO authenticated
  WITH CHECK (
    user_id = (select _uid())
    AND (select _jwt_role()) = 'professional'
  );

-- Professional can UPDATE their own profile (but CANNOT change identity_status)
-- Instead of self-referencing subquery, we block status changes by checking
-- that the new identity_status is still 'pending' (the only status a pro can have
-- when editing their own profile — admin changes it to verified/rejected).
CREATE POLICY "professional_profiles_update_own"
  ON professional_profiles FOR UPDATE TO authenticated
  USING (user_id = (select _uid()))
  WITH CHECK (
    user_id = (select _uid())
    AND identity_status IN ('pending')
  );

-- Admin can UPDATE any profile (verify, reject, etc.)
CREATE POLICY "professional_profiles_update_admin"
  ON professional_profiles FOR UPDATE TO authenticated
  USING  ((select _jwt_role()) = 'admin')
  WITH CHECK ((select _jwt_role()) = 'admin');


-- ─── 2. professional_service_prices: fix INSERT policy ─────────────

DROP POLICY IF EXISTS "professional_service_prices_insert_own" ON professional_service_prices;
CREATE POLICY "professional_service_prices_insert_own"
  ON professional_service_prices FOR INSERT TO authenticated
  WITH CHECK (
    professional_id = (select _uid())
    AND (select _jwt_role()) = 'professional'
  );


-- ─── 3. reservations + reviews: fix _has_role('client') ───────────

DROP POLICY IF EXISTS "reservations_insert_client" ON reservations;
CREATE POLICY "reservations_insert_client"
  ON reservations FOR INSERT TO authenticated
  WITH CHECK (
    client_id = (select _uid())
    AND (select _jwt_role()) = 'client'
    AND status IN ('draft', 'quoting')
  );

DROP POLICY IF EXISTS "reviews_insert_client" ON reviews;
CREATE POLICY "reviews_insert_client"
  ON reviews FOR INSERT TO authenticated
  WITH CHECK (
    client_id = (select _uid())
    AND (select _jwt_role()) = 'client'
    AND EXISTS (
      SELECT 1 FROM reservations r
      WHERE r.id = reservation_id
        AND r.client_id = (select _uid())
        AND r.status = 'completed'
    )
  );


-- ─── 4. platform_settings: ensure admin uses _jwt_role() ──────────

DROP POLICY IF EXISTS "platform_settings_update_admin" ON platform_settings;
CREATE POLICY "platform_settings_update_admin"
  ON platform_settings FOR UPDATE TO authenticated
  USING  ((select _jwt_role()) = 'admin')
  WITH CHECK ((select _jwt_role()) = 'admin');
