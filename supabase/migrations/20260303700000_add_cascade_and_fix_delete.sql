-- =============================================================
-- Add ON DELETE CASCADE to all FK constraints referencing user_accounts
-- that are currently missing it. Then rewrite delete_user_account_safe
-- to be simple and correct.
--
-- TABLES ALREADY WITH CASCADE (no changes needed):
--   user_addresses, user_payment_methods, session_logs,
--   conversations, messages, reservations.client_id
--
-- TABLES NEEDING CASCADE ADDED:
--   notifications, payments, reviews, professional_profiles,
--   reservations.professional_id
--
-- professional_service_prices cascades via professional_profiles
-- =============================================================

-- 1. notifications.user_id → user_accounts(auth_uid) + CASCADE
ALTER TABLE notifications
  DROP CONSTRAINT IF EXISTS notifications_user_id_fkey;
ALTER TABLE notifications
  ADD CONSTRAINT notifications_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES user_accounts(auth_uid) ON DELETE CASCADE;

-- 2. payments.client_id → user_accounts(auth_uid) + CASCADE
ALTER TABLE payments
  DROP CONSTRAINT IF EXISTS payments_client_id_fkey;
ALTER TABLE payments
  ADD CONSTRAINT payments_client_id_fkey
  FOREIGN KEY (client_id) REFERENCES user_accounts(auth_uid) ON DELETE CASCADE;

-- 3. reviews.client_id → user_accounts(auth_uid) + CASCADE
ALTER TABLE reviews
  DROP CONSTRAINT IF EXISTS reviews_client_id_fkey;
ALTER TABLE reviews
  ADD CONSTRAINT reviews_client_id_fkey
  FOREIGN KEY (client_id) REFERENCES user_accounts(auth_uid) ON DELETE CASCADE;

-- 4. reviews.professional_id → user_accounts(auth_uid) + CASCADE
ALTER TABLE reviews
  DROP CONSTRAINT IF EXISTS reviews_professional_id_fkey;
ALTER TABLE reviews
  ADD CONSTRAINT reviews_professional_id_fkey
  FOREIGN KEY (professional_id) REFERENCES user_accounts(auth_uid) ON DELETE CASCADE;

-- 5. reservations.professional_id → user_accounts(auth_uid) + CASCADE
ALTER TABLE reservations
  DROP CONSTRAINT IF EXISTS reservations_professional_id_fkey;
ALTER TABLE reservations
  ADD CONSTRAINT reservations_professional_id_fkey
  FOREIGN KEY (professional_id) REFERENCES user_accounts(auth_uid) ON DELETE CASCADE;

-- 6. professional_profiles.user_id → user_accounts(auth_uid) + CASCADE
ALTER TABLE professional_profiles
  DROP CONSTRAINT IF EXISTS professional_profiles_user_id_fkey;
ALTER TABLE professional_profiles
  ADD CONSTRAINT professional_profiles_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES user_accounts(auth_uid) ON DELETE CASCADE;

-- 7. professional_service_prices.professional_id → professional_profiles(user_id) + CASCADE
ALTER TABLE professional_service_prices
  DROP CONSTRAINT IF EXISTS professional_service_prices_prof_uid_fkey;
ALTER TABLE professional_service_prices
  ADD CONSTRAINT professional_service_prices_prof_uid_fkey
  FOREIGN KEY (professional_id) REFERENCES professional_profiles(user_id) ON DELETE CASCADE;

-- 8. reservations.professional_id → professional_profiles(user_id) + CASCADE
ALTER TABLE reservations
  DROP CONSTRAINT IF EXISTS reservations_to_pro_profile_fkey;
ALTER TABLE reservations
  ADD CONSTRAINT reservations_to_pro_profile_fkey
  FOREIGN KEY (professional_id) REFERENCES professional_profiles(user_id) ON DELETE CASCADE;


-- =============================================================
-- Rewrite delete function: now that all FKs cascade,
-- we just check for active reservations, then delete user_accounts.
-- Postgres handles the rest via CASCADE.
-- =============================================================

CREATE OR REPLACE FUNCTION public.delete_user_account_safe()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid text;
  v_active_count int;
BEGIN
  v_uid := current_setting('request.jwt.claims', true)::json->>'firebase_uid';

  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  RAISE LOG '[delete_account] Starting for UID: %', v_uid;

  -- 1. Block if active reservations exist (as client or professional)
  SELECT count(*) INTO v_active_count
  FROM reservations
  WHERE (client_id = v_uid OR professional_id = v_uid)
    AND status IN ('pending_approval', 'confirmed', 'on_route', 'in_progress');

  IF v_active_count > 0 THEN
    RAISE EXCEPTION 'BLOCK_ACTIVE_RESERVATIONS: Cannot delete account with % active reservation(s)', v_active_count;
  END IF;

  -- 2. Delete user_accounts row — all other tables CASCADE automatically
  DELETE FROM user_accounts WHERE auth_uid = v_uid;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User account not found for UID: %', v_uid;
  END IF;

  RAISE LOG '[delete_account] Completed for UID: %', v_uid;
END;
$$;
