-- =============================================================
-- FIX: _guard_role_change trigger must allow service_role updates
--
-- PROBLEM:
--   Edge Functions use service_role key to set roles via set-user-role.
--   The trigger blocks them because the JWT doesn't have app_role='admin'.
--   service_role is trusted — it bypasses RLS but triggers still fire.
--
-- FIX:
--   Also allow updates when the JWT role claim is 'service_role'.
--   This lets Edge Functions (session-sync, set-user-role) update roles
--   while still blocking regular users from changing their own role.
-- =============================================================

CREATE OR REPLACE FUNCTION public._guard_role_change()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  jwt_role text;
BEGIN
  -- If role didn't change, allow
  IF NEW.role IS NOT DISTINCT FROM OLD.role THEN
    RETURN NEW;
  END IF;

  -- Read the role from JWT claims
  jwt_role := coalesce(
    current_setting('request.jwt.claims', true)::json ->> 'role',
    ''
  );

  -- Allow if caller is service_role (Edge Functions)
  IF jwt_role = 'service_role' THEN
    RETURN NEW;
  END IF;

  -- Allow if caller is admin (from custom app_role claim)
  IF coalesce(
    current_setting('request.jwt.claims', true)::json ->> 'app_role',
    ''
  ) = 'admin' THEN
    RETURN NEW;
  END IF;

  -- Non-admin, non-service-role trying to change role → block
  RAISE EXCEPTION 'Cannot change your own role'
    USING ERRCODE = 'insufficient_privilege';
END;
$$;
