-- =============================================================================
-- FIX: Infinite recursion in reservations UPDATE RLS policies
-- =============================================================================
-- The old policies (reservations_update_client / reservations_update_professional)
-- contained self-referencing subqueries like:
--   SELECT r.professional_id FROM reservations r WHERE r.id = reservations.id
-- PostgreSQL re-evaluates RLS on the inner query → infinite recursion.
--
-- Solution:
--   1. Drop the broken policies
--   2. Add a BEFORE UPDATE trigger to guard ownership (uses OLD/NEW directly)
--   3. Recreate simple policies without subqueries
--   4. Add SECURITY DEFINER RPC for accept flow (pro doesn't "own" reservation yet)
-- =============================================================================

-- 1. Drop broken policies
DROP POLICY IF EXISTS "reservations_update_client" ON reservations;
DROP POLICY IF EXISTS "reservations_update_professional" ON reservations;

-- 2. Trigger prevents ownership transfer (replaces the self-referencing subquery)
CREATE OR REPLACE FUNCTION _guard_reservation_ownership()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.client_id IS DISTINCT FROM OLD.client_id THEN
    RAISE EXCEPTION 'Cannot change client_id on a reservation';
  END IF;
  IF NEW.professional_id IS DISTINCT FROM OLD.professional_id
     AND OLD.professional_id IS NOT NULL THEN
    RAISE EXCEPTION 'Cannot reassign professional_id once set';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_reservation_ownership ON reservations;
CREATE TRIGGER guard_reservation_ownership
  BEFORE UPDATE ON reservations
  FOR EACH ROW EXECUTE FUNCTION _guard_reservation_ownership();

-- 3. Simple non-recursive policies
CREATE POLICY "reservations_update_client" ON reservations
  FOR UPDATE TO authenticated
  USING  (client_id = (select _uid()))
  WITH CHECK (
    client_id = (select _uid())
    AND status IN ('draft','quoting','pending_approval','canceled_client')
  );

CREATE POLICY "reservations_update_professional" ON reservations
  FOR UPDATE TO authenticated
  USING  (professional_id = (select _uid()))
  WITH CHECK (
    professional_id = (select _uid())
    AND status IN ('confirmed','on_route','in_progress','completed','canceled_pro')
  );

-- 4. SECURITY DEFINER RPC for accepting instant reservations
--    (professional doesn't "own" the reservation yet at pending_approval stage)
CREATE OR REPLACE FUNCTION accept_instant_reservation(
  p_reservation_id uuid,
  p_professional_id text
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE reservations
  SET status = 'confirmed',
      professional_id = p_professional_id,
      updated_at = now()
  WHERE id = p_reservation_id
    AND status = 'pending_approval';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Reservation unavailable (already taken or canceled)';
  END IF;

  UPDATE professional_profiles
  SET is_active = false
  WHERE user_id = p_professional_id;
END;
$$;
