-- =============================================================
-- Migration: Reviews / Rating System
-- Date: 2026-02-23
--
-- Creates the `reviews` table and adds `average_rating` +
-- `review_count` to `professional_profiles` with an auto-update
-- trigger so the aggregates stay in sync without on-the-fly
-- calculations.
--
-- CONSTRAINTS:
--   - One review per reservation (UNIQUE on reservation_id).
--   - Score is 1–5 (integer CHECK).
--   - Only the client who owns the reservation can create the review.
--   - Reviews are immutable — no UPDATE or DELETE by users.
--   - Comment is optional (nullable TEXT).
--
-- SECURITY:
--   - SELECT: all authenticated users (public marketplace data).
--   - INSERT: only the client of the linked reservation, only when
--     the reservation status is 'completed'.
--   - No UPDATE/DELETE policies (immutable once created).
-- =============================================================


-- =============================================
-- 1. ADD AGGREGATE COLUMNS TO PROFESSIONAL_PROFILES
-- =============================================
ALTER TABLE professional_profiles
  ADD COLUMN IF NOT EXISTS average_rating numeric(3,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS review_count   integer       DEFAULT 0;


-- =============================================
-- 2. CREATE REVIEWS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS reviews (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id  uuid NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
  client_id       text NOT NULL REFERENCES user_accounts(auth_uid),
  professional_id text NOT NULL REFERENCES user_accounts(auth_uid),
  score           integer NOT NULL CHECK (score >= 1 AND score <= 5),
  comment         text,
  created_at      timestamptz NOT NULL DEFAULT now(),

  -- One review per reservation
  CONSTRAINT reviews_reservation_unique UNIQUE (reservation_id)
);

-- Index for fetching all reviews of a professional
CREATE INDEX IF NOT EXISTS idx_reviews_professional_id ON reviews(professional_id);


-- =============================================
-- 3. ENABLE RLS
-- =============================================
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;


-- =============================================
-- 4. RLS POLICIES
-- =============================================

-- Drop existing policies for idempotent re-runs
DO $$ BEGIN
  DROP POLICY IF EXISTS "reviews_select_all" ON reviews;
  DROP POLICY IF EXISTS "reviews_insert_client" ON reviews;
END $$;

-- All authenticated users can read reviews (public marketplace data)
CREATE POLICY "reviews_select_all"
  ON reviews FOR SELECT
  USING (auth.role() = 'authenticated');

-- Only the client of the reservation can insert, and only if:
--   1) They are the client_id
--   2) The reservation is completed
--   3) They have the 'client' role
CREATE POLICY "reviews_insert_client"
  ON reviews FOR INSERT
  WITH CHECK (
    client_id = public._uid()
    AND public._has_role('client')
    AND EXISTS (
      SELECT 1 FROM reservations r
      WHERE r.id = reservation_id
        AND r.client_id = public._uid()
        AND r.status = 'completed'
    )
  );

-- No UPDATE or DELETE policies — reviews are immutable.


-- =============================================
-- 5. TRIGGER: Auto-update average_rating & review_count
-- =============================================
CREATE OR REPLACE FUNCTION public.update_professional_rating()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  UPDATE public.professional_profiles
  SET
    average_rating = (
      SELECT COALESCE(ROUND(AVG(r.score)::numeric, 2), 0)
      FROM public.reviews r
      WHERE r.professional_id = NEW.professional_id
    ),
    review_count = (
      SELECT COUNT(*)
      FROM public.reviews r
      WHERE r.professional_id = NEW.professional_id
    )
  WHERE user_id = NEW.professional_id;

  RETURN NEW;
END;
$$;

-- Drop and recreate for idempotency
DROP TRIGGER IF EXISTS trg_update_professional_rating ON reviews;

CREATE TRIGGER trg_update_professional_rating
  AFTER INSERT ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_professional_rating();
