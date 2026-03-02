-- =============================================================
-- Migration: Nuclear RLS Cleanup
-- Date: 2026-03-03
--
-- PURPOSE:
--   1. Drop ALL existing policies on ALL app tables (removes dashboard
--      duplicates + migration-created duplicates = fixes 80+ multiple_permissive warnings)
--   2. Recreate ONE clean set of ~42 policies using (select _uid()) pattern
--      (fixes 54 auth_rls_initplan warnings — function evaluated once, not per-row)
--   3. Drop duplicate index on professional_profiles.user_id
--
-- SCOPE: This migration is the single source of truth for ALL RLS policies.
--        Previous policy migrations (20260220, 20260226) are now superseded.
-- =============================================================


-- =============================================================
-- 0. DROP ALL EXISTING POLICIES ON ALL APP TABLES
--    Uses pg_policies catalog to catch dashboard-created policies
--    with unexpected names (Spanish, MVP, etc.)
-- =============================================================
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT policyname, tablename
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN (
        'user_accounts','professional_profiles','professional_service_prices',
        'service_categories','service_templates','reservations','payments',
        'notifications','messages','conversations','user_payment_methods',
        'user_addresses','session_logs','reviews','platform_settings'
      )
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);
  END LOOP;
END $$;


-- =============================================================
-- 1. DROP DUPLICATE UNIQUE CONSTRAINT
--    professional_profiles_user_id_key (auto-created by Supabase Dashboard)
--    duplicates professional_profiles_user_id_unique (from FK migration).
--
--    Two FKs reference the _user_id_key index, so we must:
--      a) Drop those FKs
--      b) Drop the duplicate constraint
--      c) Re-add the FKs (they'll now use _user_id_unique)
-- =============================================================
ALTER TABLE professional_service_prices
  DROP CONSTRAINT IF EXISTS professional_service_prices_prof_uid_fkey;
ALTER TABLE reservations
  DROP CONSTRAINT IF EXISTS reservations_to_pro_profile_fkey;

ALTER TABLE professional_profiles
  DROP CONSTRAINT IF EXISTS professional_profiles_user_id_key;

ALTER TABLE professional_service_prices
  ADD CONSTRAINT professional_service_prices_prof_uid_fkey
  FOREIGN KEY (professional_id) REFERENCES professional_profiles(user_id);
ALTER TABLE reservations
  ADD CONSTRAINT reservations_to_pro_profile_fkey
  FOREIGN KEY (professional_id) REFERENCES professional_profiles(user_id);


-- =============================================================
-- 2. RECREATE HELPER FUNCTIONS (idempotent, with (select ...) note)
--    The functions themselves are unchanged — the fix is using
--    (select _uid()) in policy expressions so Postgres treats them
--    as initplan (evaluated once) instead of per-row.
-- =============================================================
CREATE OR REPLACE FUNCTION public._uid()
RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT coalesce(
    current_setting('request.jwt.claims', true)::json ->> 'firebase_uid',
    ''
  );
$$;

CREATE OR REPLACE FUNCTION public._has_role(_role text)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_accounts
    WHERE auth_uid = public._uid()
      AND role = _role
  );
$$;


-- =============================================================
--
--   3. USER_ACCOUNTS (4 policies: 2 user + 2 admin)
--
-- =============================================================

CREATE POLICY "user_accounts_select_own"
  ON user_accounts FOR SELECT TO authenticated
  USING (auth_uid = (select _uid()));

CREATE POLICY "user_accounts_update_own"
  ON user_accounts FOR UPDATE TO authenticated
  USING  (auth_uid = (select _uid()))
  WITH CHECK (
    auth_uid = (select _uid())
    AND role = (SELECT ua.role FROM user_accounts ua WHERE ua.auth_uid = (select _uid()))
  );

CREATE POLICY "user_accounts_select_admin"
  ON user_accounts FOR SELECT TO authenticated
  USING ((select _has_role('admin')));

CREATE POLICY "user_accounts_update_admin"
  ON user_accounts FOR UPDATE TO authenticated
  USING ((select _has_role('admin')))
  WITH CHECK (auth_uid != (select _uid()) OR role = 'admin');


-- =============================================================
--
--   4. PROFESSIONAL_PROFILES (5 policies: 3 user + 2 admin)
--
-- =============================================================

CREATE POLICY "professional_profiles_select_all"
  ON professional_profiles FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "professional_profiles_insert_own"
  ON professional_profiles FOR INSERT TO authenticated
  WITH CHECK (
    user_id = (select _uid())
    AND (select _has_role('professional'))
  );

CREATE POLICY "professional_profiles_update_own"
  ON professional_profiles FOR UPDATE TO authenticated
  USING  (user_id = (select _uid()))
  WITH CHECK (
    user_id = (select _uid())
    AND identity_status = (
      SELECT pp.identity_status FROM professional_profiles pp
      WHERE pp.user_id = (select _uid())
    )
  );

CREATE POLICY "professional_profiles_select_admin"
  ON professional_profiles FOR SELECT TO authenticated
  USING ((select _has_role('admin')));

CREATE POLICY "professional_profiles_update_admin"
  ON professional_profiles FOR UPDATE TO authenticated
  USING ((select _has_role('admin')));


-- =============================================================
--
--   5. PROFESSIONAL_SERVICE_PRICES (4 policies)
--
-- =============================================================

CREATE POLICY "professional_service_prices_select_all"
  ON professional_service_prices FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "professional_service_prices_insert_own"
  ON professional_service_prices FOR INSERT TO authenticated
  WITH CHECK (
    professional_id = (select _uid())
    AND (select _has_role('professional'))
  );

CREATE POLICY "professional_service_prices_update_own"
  ON professional_service_prices FOR UPDATE TO authenticated
  USING  (professional_id = (select _uid()))
  WITH CHECK (professional_id = (select _uid()));

CREATE POLICY "professional_service_prices_delete_own"
  ON professional_service_prices FOR DELETE TO authenticated
  USING (professional_id = (select _uid()));


-- =============================================================
--
--   6. SERVICE_CATEGORIES (1 policy — read-only catalog)
--
-- =============================================================

CREATE POLICY "service_categories_select_all"
  ON service_categories FOR SELECT TO authenticated
  USING (true);


-- =============================================================
--
--   7. SERVICE_TEMPLATES (1 policy — read-only catalog)
--
-- =============================================================

CREATE POLICY "service_templates_select_all"
  ON service_templates FOR SELECT TO authenticated
  USING (true);


-- =============================================================
--
--   8. RESERVATIONS (4 policies)
--
-- =============================================================

CREATE POLICY "reservations_select_own"
  ON reservations FOR SELECT TO authenticated
  USING (
    client_id = (select _uid())
    OR professional_id = (select _uid())
  );

CREATE POLICY "reservations_insert_client"
  ON reservations FOR INSERT TO authenticated
  WITH CHECK (
    client_id = (select _uid())
    AND (select _has_role('client'))
    AND status IN ('draft', 'quoting')
  );

CREATE POLICY "reservations_update_client"
  ON reservations FOR UPDATE TO authenticated
  USING  (client_id = (select _uid()))
  WITH CHECK (
    client_id = (select _uid())
    AND professional_id = (
      SELECT r.professional_id FROM reservations r WHERE r.id = reservations.id
    )
    AND status IN ('draft', 'quoting', 'pending_approval', 'canceled_client')
  );

CREATE POLICY "reservations_update_professional"
  ON reservations FOR UPDATE TO authenticated
  USING  (professional_id = (select _uid()))
  WITH CHECK (
    professional_id = (select _uid())
    AND client_id = (
      SELECT r.client_id FROM reservations r WHERE r.id = reservations.id
    )
    AND status IN ('confirmed', 'on_route', 'in_progress', 'completed', 'canceled_pro')
  );


-- =============================================================
--
--   9. PAYMENTS (1 policy — read-only, writes via Edge Functions)
--
-- =============================================================

CREATE POLICY "payments_select_own"
  ON payments FOR SELECT TO authenticated
  USING (
    client_id = (select _uid())
    OR professional_id = (select _uid())
  );


-- =============================================================
--
--   10. NOTIFICATIONS (3 policies)
--
-- =============================================================

CREATE POLICY "notifications_select_own"
  ON notifications FOR SELECT TO authenticated
  USING (user_id = (select _uid()));

CREATE POLICY "notifications_update_own"
  ON notifications FOR UPDATE TO authenticated
  USING  (user_id = (select _uid()))
  WITH CHECK (user_id = (select _uid()));

CREATE POLICY "notifications_delete_own"
  ON notifications FOR DELETE TO authenticated
  USING (user_id = (select _uid()));


-- =============================================================
--
--   11. MESSAGES (3 policies)
--
-- =============================================================

CREATE POLICY "messages_select_own"
  ON messages FOR SELECT TO authenticated
  USING (
    sender_id = (select _uid())
    OR receiver_id = (select _uid())
  );

CREATE POLICY "messages_insert_sender"
  ON messages FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = (select _uid())
    AND receiver_id <> (select _uid())
    AND EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = conversation_id
        AND (c.participant1_id = (select _uid()) OR c.participant2_id = (select _uid()))
    )
  );

CREATE POLICY "messages_update_read"
  ON messages FOR UPDATE TO authenticated
  USING  (receiver_id = (select _uid()))
  WITH CHECK (
    sender_id = (SELECT m.sender_id FROM messages m WHERE m.id = messages.id)
    AND receiver_id = (select _uid())
    AND content = (SELECT m.content FROM messages m WHERE m.id = messages.id)
    AND type = (SELECT m.type FROM messages m WHERE m.id = messages.id)
  );


-- =============================================================
--
--   12. CONVERSATIONS (3 policies)
--
-- =============================================================

CREATE POLICY "conversations_select_own"
  ON conversations FOR SELECT TO authenticated
  USING (
    participant1_id = (select _uid())
    OR participant2_id = (select _uid())
  );

CREATE POLICY "conversations_insert_creator"
  ON conversations FOR INSERT TO authenticated
  WITH CHECK (
    participant1_id = (select _uid())
    AND participant2_id <> (select _uid())
    AND EXISTS (
      SELECT 1 FROM user_accounts
      WHERE auth_uid = participant2_id
    )
  );

CREATE POLICY "conversations_update_own"
  ON conversations FOR UPDATE TO authenticated
  USING (
    participant1_id = (select _uid())
    OR participant2_id = (select _uid())
  )
  WITH CHECK (
    participant1_id = (
      SELECT c.participant1_id FROM conversations c WHERE c.id = conversations.id
    )
    AND participant2_id = (
      SELECT c.participant2_id FROM conversations c WHERE c.id = conversations.id
    )
  );


-- =============================================================
--
--   13. USER_PAYMENT_METHODS (4 policies — full CRUD own)
--
-- =============================================================

CREATE POLICY "user_payment_methods_select_own"
  ON user_payment_methods FOR SELECT TO authenticated
  USING (user_id = (select _uid()));

CREATE POLICY "user_payment_methods_insert_own"
  ON user_payment_methods FOR INSERT TO authenticated
  WITH CHECK (user_id = (select _uid()));

CREATE POLICY "user_payment_methods_update_own"
  ON user_payment_methods FOR UPDATE TO authenticated
  USING  (user_id = (select _uid()))
  WITH CHECK (user_id = (select _uid()));

CREATE POLICY "user_payment_methods_delete_own"
  ON user_payment_methods FOR DELETE TO authenticated
  USING (user_id = (select _uid()));


-- =============================================================
--
--   14. USER_ADDRESSES (4 policies — full CRUD own)
--
-- =============================================================

CREATE POLICY "user_addresses_select_own"
  ON user_addresses FOR SELECT TO authenticated
  USING (user_id = (select _uid()));

CREATE POLICY "user_addresses_insert_own"
  ON user_addresses FOR INSERT TO authenticated
  WITH CHECK (user_id = (select _uid()));

CREATE POLICY "user_addresses_update_own"
  ON user_addresses FOR UPDATE TO authenticated
  USING  (user_id = (select _uid()))
  WITH CHECK (user_id = (select _uid()));

CREATE POLICY "user_addresses_delete_own"
  ON user_addresses FOR DELETE TO authenticated
  USING (user_id = (select _uid()));


-- =============================================================
--
--   15. SESSION_LOGS (1 policy)
--   NOTE: Uses auth.uid() (UUID) — this table's user_id is a UUID FK
--
-- =============================================================

CREATE POLICY "session_logs_select_own"
  ON session_logs FOR SELECT TO authenticated
  USING (user_id = auth.uid());


-- =============================================================
--
--   16. REVIEWS (2 policies)
--
-- =============================================================

CREATE POLICY "reviews_select_all"
  ON reviews FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "reviews_insert_client"
  ON reviews FOR INSERT TO authenticated
  WITH CHECK (
    client_id = (select _uid())
    AND (select _has_role('client'))
    AND EXISTS (
      SELECT 1 FROM reservations r
      WHERE r.id = reservation_id
        AND r.client_id = (select _uid())
        AND r.status = 'completed'
    )
  );


-- =============================================================
--
--   17. PLATFORM_SETTINGS (2 policies)
--
-- =============================================================

CREATE POLICY "platform_settings_select_authenticated"
  ON platform_settings FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "platform_settings_update_admin"
  ON platform_settings FOR UPDATE TO authenticated
  USING ((select _has_role('admin')));
