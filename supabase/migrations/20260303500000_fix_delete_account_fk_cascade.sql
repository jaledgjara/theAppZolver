-- =============================================================
-- FIX: delete_user_account_safe — proper FK-aware cascade delete
--
-- Delete order matters due to FK constraints:
--   reviews.reservation_id → reservations(id)
--   reviews.client_id → user_accounts(auth_uid)
--   reviews.professional_id → user_accounts(auth_uid)
--   reservations.professional_id → professional_profiles(user_id)
--   professional_profiles.user_id → user_accounts(auth_uid)
--
-- Added: conversations, messages (were missing)
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

  RAISE LOG '[delete_user_account_safe] Starting for UID: %', v_uid;

  -- 1. Check for active reservations (fail-closed)
  SELECT count(*) INTO v_active_count
  FROM reservations
  WHERE (client_id = v_uid OR professional_id = v_uid)
    AND status IN ('pending_approval', 'confirmed', 'on_route', 'in_progress');

  IF v_active_count > 0 THEN
    RAISE EXCEPTION 'BLOCK_ACTIVE_RESERVATIONS: Cannot delete account with % active reservation(s)', v_active_count;
  END IF;

  -- 2. Delete in FK-safe order (children before parents)

  -- Layer 1: Leaf tables (no other table references these)
  DELETE FROM notifications WHERE user_id = v_uid;
  DELETE FROM session_logs WHERE user_id = v_uid;
  DELETE FROM user_addresses WHERE user_id = v_uid;
  DELETE FROM user_payment_methods WHERE user_id = v_uid;

  -- Layer 2: Messages → depends on conversations
  DELETE FROM messages WHERE sender_id = v_uid;
  DELETE FROM conversations WHERE participant1_id = v_uid OR participant2_id = v_uid;

  -- Layer 3: Reviews → references reservations + user_accounts
  DELETE FROM reviews WHERE client_id = v_uid OR professional_id = v_uid;

  -- Layer 4: Payments → references reservations
  DELETE FROM payments WHERE client_id = v_uid;

  -- Layer 5: Reservations → references professional_profiles
  DELETE FROM reservations WHERE client_id = v_uid OR professional_id = v_uid;

  -- Layer 6: Professional data → references user_accounts
  DELETE FROM professional_service_prices WHERE professional_id = v_uid;
  DELETE FROM professional_profiles WHERE user_id = v_uid;

  -- Layer 7: Root table
  DELETE FROM user_accounts WHERE auth_uid = v_uid;

  RAISE LOG '[delete_user_account_safe] Completed for UID: %', v_uid;
END;
$$;
