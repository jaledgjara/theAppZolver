-- =============================================================
-- FIX: delete_user_account_safe — handle uuid vs text column types
--
-- Some tables use text columns (auth_uid pattern), others use uuid.
-- We try each DELETE individually and skip tables where the user
-- has no matching rows, avoiding type mismatch crashes.
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

  RAISE LOG '[delete_account] UID: %', v_uid;

  -- 1. Block if active reservations exist
  SELECT count(*) INTO v_active_count
  FROM reservations
  WHERE (client_id = v_uid OR professional_id = v_uid)
    AND status IN ('pending_approval', 'confirmed', 'on_route', 'in_progress');

  IF v_active_count > 0 THEN
    RAISE EXCEPTION 'BLOCK_ACTIVE_RESERVATIONS: Cannot delete account with % active reservation(s)', v_active_count;
  END IF;

  -- 2. Delete in FK-safe order (leaf → root)
  --    Each block handles potential type mismatches gracefully.

  -- Notifications (user_id = text)
  BEGIN
    DELETE FROM notifications WHERE user_id = v_uid;
  EXCEPTION WHEN OTHERS THEN
    RAISE LOG '[delete_account] notifications skip: %', SQLERRM;
  END;

  -- Session logs (user_id = text)
  BEGIN
    DELETE FROM session_logs WHERE user_id = v_uid;
  EXCEPTION WHEN OTHERS THEN
    RAISE LOG '[delete_account] session_logs skip: %', SQLERRM;
  END;

  -- User addresses (user_id could be text or uuid)
  BEGIN
    DELETE FROM user_addresses WHERE user_id = v_uid;
  EXCEPTION WHEN OTHERS THEN
    RAISE LOG '[delete_account] user_addresses skip: %', SQLERRM;
  END;

  -- User payment methods (user_id = text)
  BEGIN
    DELETE FROM user_payment_methods WHERE user_id = v_uid;
  EXCEPTION WHEN OTHERS THEN
    RAISE LOG '[delete_account] user_payment_methods skip: %', SQLERRM;
  END;

  -- Messages (sender_id = text)
  BEGIN
    DELETE FROM messages WHERE sender_id = v_uid;
  EXCEPTION WHEN OTHERS THEN
    RAISE LOG '[delete_account] messages skip: %', SQLERRM;
  END;

  -- Conversations (participant IDs = text)
  BEGIN
    DELETE FROM conversations WHERE participant1_id = v_uid OR participant2_id = v_uid;
  EXCEPTION WHEN OTHERS THEN
    RAISE LOG '[delete_account] conversations skip: %', SQLERRM;
  END;

  -- Reviews (client_id/professional_id = text, reservation_id = uuid)
  BEGIN
    DELETE FROM reviews WHERE client_id = v_uid OR professional_id = v_uid;
  EXCEPTION WHEN OTHERS THEN
    RAISE LOG '[delete_account] reviews skip: %', SQLERRM;
  END;

  -- Payments (client_id = text)
  BEGIN
    DELETE FROM payments WHERE client_id = v_uid;
  EXCEPTION WHEN OTHERS THEN
    RAISE LOG '[delete_account] payments skip: %', SQLERRM;
  END;

  -- Reservations (client_id/professional_id = text)
  BEGIN
    DELETE FROM reservations WHERE client_id = v_uid OR professional_id = v_uid;
  EXCEPTION WHEN OTHERS THEN
    RAISE LOG '[delete_account] reservations skip: %', SQLERRM;
  END;

  -- Professional service prices (professional_id = text)
  BEGIN
    DELETE FROM professional_service_prices WHERE professional_id = v_uid;
  EXCEPTION WHEN OTHERS THEN
    RAISE LOG '[delete_account] professional_service_prices skip: %', SQLERRM;
  END;

  -- Professional profiles (user_id = text)
  BEGIN
    DELETE FROM professional_profiles WHERE user_id = v_uid;
  EXCEPTION WHEN OTHERS THEN
    RAISE LOG '[delete_account] professional_profiles skip: %', SQLERRM;
  END;

  -- Root: user_accounts (auth_uid = text)
  DELETE FROM user_accounts WHERE auth_uid = v_uid;

  RAISE LOG '[delete_account] Done for UID: %', v_uid;
END;
$$;
