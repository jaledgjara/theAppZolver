-- =============================================================
-- FIX: delete_user_account_safe — use correct reservation_status enum values
--
-- The previous version used "pending" which doesn't exist in the enum.
-- Valid active statuses: pending_approval, confirmed, on_route, in_progress
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
  -- Get the caller's Firebase UID from the JWT
  v_uid := current_setting('request.jwt.claims', true)::json->>'firebase_uid';

  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Check for active reservations (as client OR professional)
  SELECT count(*) INTO v_active_count
  FROM reservations
  WHERE (client_id = v_uid OR professional_id = v_uid)
    AND status IN ('pending_approval', 'confirmed', 'on_route', 'in_progress');

  IF v_active_count > 0 THEN
    RAISE EXCEPTION 'BLOCK_ACTIVE_RESERVATIONS: Cannot delete account with % active reservation(s)', v_active_count;
  END IF;

  -- Safe to delete — cascade through related tables
  DELETE FROM notifications WHERE user_id = v_uid;
  DELETE FROM messages WHERE sender_id = v_uid;
  DELETE FROM payments WHERE client_id = v_uid;
  DELETE FROM user_payment_methods WHERE user_id = v_uid;
  DELETE FROM user_addresses WHERE user_id = v_uid;
  DELETE FROM reviews WHERE client_id = v_uid OR professional_id = v_uid;
  DELETE FROM reservations WHERE client_id = v_uid OR professional_id = v_uid;
  DELETE FROM professional_service_prices WHERE professional_id = v_uid;
  DELETE FROM professional_profiles WHERE user_id = v_uid;
  DELETE FROM session_logs WHERE user_id = v_uid;
  DELETE FROM user_accounts WHERE auth_uid = v_uid;
END;
$$;
