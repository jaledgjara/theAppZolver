-- =============================================================
-- FIX: delete_user_account_safe — make idempotent
--
-- PROBLEM:
--   If a previous delete attempt removed the DB row but Firebase
--   deletion failed (e.g. requires-recent-login), on the next
--   attempt the function throws "User account not found" and the
--   client never reaches the Firebase delete step.
--
-- FIX:
--   Remove the IF NOT FOUND exception. If the row is already
--   gone, that's fine — the goal is deletion. Let the client
--   proceed to delete the Firebase user.
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
  --    If already gone (previous partial delete), this is a no-op.
  DELETE FROM user_accounts WHERE auth_uid = v_uid;

  RAISE LOG '[delete_account] Completed for UID: % (found: %)', v_uid, FOUND;
END;
$$;
