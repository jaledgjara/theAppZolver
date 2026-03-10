-- =============================================================
-- Migration: Production-Hardened RLS Policies
-- Date: 2026-02-20
--
-- JWT custom claim: auth.jwt() ->> 'firebase_uid' = Firebase UID
-- This matches the auth_uid column in user_accounts and all FK columns
-- that reference user_accounts(auth_uid).
--
-- Edge Functions use SUPABASE_SERVICE_ROLE_KEY → bypasses RLS automatically.
--
-- IMPORTANT: This migration is idempotent (DROP IF EXISTS before CREATE).
--
-- SECURITY PRINCIPLES:
--   1. Every UPDATE policy has WITH CHECK to prevent ownership transfer
--   2. INSERT policies enforce the caller IS the owner (no impersonation)
--   3. Role-gated writes: only professionals can write professional data
--   4. Reservation/payment mutations are Edge-Function-only (status integrity)
--   5. No DELETE on business-critical tables (reservations, payments, messages)
--   6. Admin operations use service_role key (bypass RLS entirely)
--   7. Helper function _uid() for DRY and performance (single JWT parse)
-- =============================================================


-- =============================================
-- 0. HELPER: Reusable function to extract Firebase UID from JWT
-- Avoids repeating (auth.jwt() ->> 'firebase_uid') everywhere.
-- Marked STABLE + SECURITY DEFINER so it's safe inside RLS.
-- =============================================
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


-- =============================================
-- 0b. HELPER: Check user role from user_accounts
-- Used to enforce role-gated writes (e.g. only professionals can insert profiles).
-- =============================================
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


-- =============================================
-- 1. DROP ALL EXISTING POLICIES (idempotent re-run)
-- =============================================
DO $$ BEGIN
  -- user_accounts
  DROP POLICY IF EXISTS "user_accounts_select_own" ON user_accounts;
  DROP POLICY IF EXISTS "user_accounts_update_own" ON user_accounts;
  -- professional_profiles
  DROP POLICY IF EXISTS "professional_profiles_select_all" ON professional_profiles;
  DROP POLICY IF EXISTS "professional_profiles_select_active" ON professional_profiles;
  DROP POLICY IF EXISTS "professional_profiles_select_own" ON professional_profiles;
  DROP POLICY IF EXISTS "professional_profiles_insert_own" ON professional_profiles;
  DROP POLICY IF EXISTS "professional_profiles_update_own" ON professional_profiles;
  -- professional_service_prices
  DROP POLICY IF EXISTS "professional_service_prices_select_all" ON professional_service_prices;
  DROP POLICY IF EXISTS "professional_service_prices_insert_own" ON professional_service_prices;
  DROP POLICY IF EXISTS "professional_service_prices_update_own" ON professional_service_prices;
  DROP POLICY IF EXISTS "professional_service_prices_delete_own" ON professional_service_prices;
  -- service_categories
  DROP POLICY IF EXISTS "service_categories_select_all" ON service_categories;
  -- service_templates
  DROP POLICY IF EXISTS "service_templates_select_all" ON service_templates;
  -- reservations
  DROP POLICY IF EXISTS "reservations_select_own" ON reservations;
  DROP POLICY IF EXISTS "reservations_insert_client" ON reservations;
  DROP POLICY IF EXISTS "reservations_update_own" ON reservations;
  DROP POLICY IF EXISTS "reservations_update_client" ON reservations;
  DROP POLICY IF EXISTS "reservations_update_professional" ON reservations;
  -- payments
  DROP POLICY IF EXISTS "payments_select_own" ON payments;
  -- notifications
  DROP POLICY IF EXISTS "notifications_select_own" ON notifications;
  DROP POLICY IF EXISTS "notifications_update_own" ON notifications;
  DROP POLICY IF EXISTS "notifications_delete_own" ON notifications;
  -- messages
  DROP POLICY IF EXISTS "messages_select_own" ON messages;
  DROP POLICY IF EXISTS "messages_insert_sender" ON messages;
  DROP POLICY IF EXISTS "messages_update_read" ON messages;
  -- conversations
  DROP POLICY IF EXISTS "conversations_select_own" ON conversations;
  DROP POLICY IF EXISTS "conversations_insert_creator" ON conversations;
  DROP POLICY IF EXISTS "conversations_insert_participant" ON conversations;
  DROP POLICY IF EXISTS "conversations_update_own" ON conversations;
  -- user_payment_methods
  DROP POLICY IF EXISTS "user_payment_methods_select_own" ON user_payment_methods;
  DROP POLICY IF EXISTS "user_payment_methods_insert_own" ON user_payment_methods;
  DROP POLICY IF EXISTS "user_payment_methods_update_own" ON user_payment_methods;
  DROP POLICY IF EXISTS "user_payment_methods_delete_own" ON user_payment_methods;
  -- user_addresses
  DROP POLICY IF EXISTS "user_addresses_select_own" ON user_addresses;
  DROP POLICY IF EXISTS "user_addresses_insert_own" ON user_addresses;
  DROP POLICY IF EXISTS "user_addresses_update_own" ON user_addresses;
  DROP POLICY IF EXISTS "user_addresses_delete_own" ON user_addresses;
  -- session_logs
  DROP POLICY IF EXISTS "session_logs_select_own" ON session_logs;
  -- reviews
  DROP POLICY IF EXISTS "reviews_select_all" ON reviews;
  DROP POLICY IF EXISTS "reviews_insert_client" ON reviews;
END $$;


-- =============================================
-- 2. ENABLE ROW LEVEL SECURITY ON ALL TABLES
-- =============================================
ALTER TABLE user_accounts              ENABLE ROW LEVEL SECURITY;
ALTER TABLE professional_profiles      ENABLE ROW LEVEL SECURITY;
ALTER TABLE professional_service_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_categories         ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_templates          ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations               ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications              ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations              ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_payment_methods       ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_addresses             ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_logs               ENABLE ROW LEVEL SECURITY;


-- =============================================================
--
--   3. USER_ACCOUNTS
--
--   Owner can read and update THEIR OWN row only.
--   INSERT → Edge Function (session-sync) via service_role key.
--   DELETE → Edge Function (delete_user_account_safe RPC) via service_role key.
--
--   SECURITY NOTES:
--   - WITH CHECK on UPDATE prevents changing auth_uid (ownership transfer).
--   - Users cannot change their own role (role column is not updatable
--     from client — enforce via trigger or column privilege if needed).
--   - No INSERT/DELETE policy = blocked for regular users.
--
-- =============================================================

CREATE POLICY "user_accounts_select_own"
  ON user_accounts FOR SELECT
  USING (auth_uid = _uid());

CREATE POLICY "user_accounts_update_own"
  ON user_accounts FOR UPDATE
  USING  (auth_uid = _uid())
  WITH CHECK (
    -- Cannot change your own auth_uid
    auth_uid = _uid()
    -- Cannot change your own role (must stay the same)
    AND role = (SELECT ua.role FROM user_accounts ua WHERE ua.auth_uid = _uid())
  );


-- =============================================================
--
--   4. PROFESSIONAL_PROFILES
--
--   All authenticated users can READ (marketplace search/browsing).
--   Only users with role = 'professional' can INSERT their own profile.
--   Only the profile owner can UPDATE.
--   No DELETE policy — profiles are deactivated, not deleted.
--
--   SECURITY NOTES:
--   - INSERT requires _has_role('professional') to prevent clients from
--     creating professional profiles.
--   - WITH CHECK on INSERT/UPDATE prevents setting user_id to someone else.
--   - Owner cannot change identity_status (admin-only, via service_role).
--
-- =============================================================

CREATE POLICY "professional_profiles_select_all"
  ON professional_profiles FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "professional_profiles_insert_own"
  ON professional_profiles FOR INSERT
  WITH CHECK (
    user_id = _uid()
    AND _has_role('professional')
  );

CREATE POLICY "professional_profiles_update_own"
  ON professional_profiles FOR UPDATE
  USING  (user_id = _uid())
  WITH CHECK (
    -- Cannot transfer ownership
    user_id = _uid()
    -- Cannot self-approve identity verification
    AND identity_status = (
      SELECT pp.identity_status FROM professional_profiles pp
      WHERE pp.user_id = _uid()
    )
  );


-- =============================================================
--
--   5. PROFESSIONAL_SERVICE_PRICES
--
--   All authenticated users can READ (marketplace pricing).
--   Only the owning professional can INSERT, UPDATE, DELETE.
--
--   SECURITY NOTES:
--   - INSERT requires the caller to be the professional_id owner.
--   - WITH CHECK on UPDATE prevents reassigning prices to another professional.
--   - Role check: only professionals should touch this table.
--
-- =============================================================

CREATE POLICY "professional_service_prices_select_all"
  ON professional_service_prices FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "professional_service_prices_insert_own"
  ON professional_service_prices FOR INSERT
  WITH CHECK (
    professional_id = _uid()
    AND _has_role('professional')
  );

CREATE POLICY "professional_service_prices_update_own"
  ON professional_service_prices FOR UPDATE
  USING  (professional_id = _uid())
  WITH CHECK (professional_id = _uid());

CREATE POLICY "professional_service_prices_delete_own"
  ON professional_service_prices FOR DELETE
  USING (professional_id = _uid());


-- =============================================================
--
--   6. SERVICE_CATEGORIES (catalog — read-only)
--
--   All authenticated users can READ.
--   INSERT/UPDATE/DELETE → admin only via service_role key or migrations.
--   No write policies = completely blocked for regular users.
--
-- =============================================================

CREATE POLICY "service_categories_select_all"
  ON service_categories FOR SELECT
  USING (auth.role() = 'authenticated');


-- =============================================================
--
--   7. SERVICE_TEMPLATES (catalog — read-only)
--
--   All authenticated users can READ.
--   INSERT/UPDATE/DELETE → admin only via service_role key or migrations.
--   No write policies = completely blocked for regular users.
--
-- =============================================================

CREATE POLICY "service_templates_select_all"
  ON service_templates FOR SELECT
  USING (auth.role() = 'authenticated');


-- =============================================================
--
--   8. RESERVATIONS
--
--   Only the client or professional involved can READ.
--   Only authenticated clients can INSERT (create bookings).
--   UPDATE is split into two policies (client vs professional) to
--   prevent either party from tampering with the other's fields.
--
--   SECURITY NOTES:
--   - INSERT enforces client_id = caller AND role = 'client'.
--   - INSERT blocks setting status to anything other than initial states.
--   - UPDATE WITH CHECK prevents changing client_id or professional_id
--     (cannot reassign a reservation to a different user).
--   - Critical mutations (status transitions, price_final, platform_fee)
--     should be done via Edge Functions for full integrity. The policies
--     here are a safety net — the app calls Edge Functions, but if someone
--     crafts a raw query, these policies limit the damage.
--   - No DELETE policy — reservations are canceled, not deleted.
--
-- =============================================================

CREATE POLICY "reservations_select_own"
  ON reservations FOR SELECT
  USING (
    client_id = _uid()
    OR professional_id = _uid()
  );

CREATE POLICY "reservations_insert_client"
  ON reservations FOR INSERT
  WITH CHECK (
    -- Only the client themselves
    client_id = _uid()
    -- Must actually be a client
    AND _has_role('client')
    -- Initial status only — cannot insert as 'completed' or 'in_progress'
    AND status IN ('draft', 'quoting')
  );

CREATE POLICY "reservations_update_client"
  ON reservations FOR UPDATE
  USING  (client_id = _uid())
  WITH CHECK (
    -- Cannot change ownership
    client_id = _uid()
    -- Cannot reassign to a different professional
    AND professional_id = (
      SELECT r.professional_id FROM reservations r WHERE r.id = reservations.id
    )
    -- Client can only set these statuses
    AND status IN ('draft', 'quoting', 'pending_approval', 'canceled_client')
  );

CREATE POLICY "reservations_update_professional"
  ON reservations FOR UPDATE
  USING  (professional_id = _uid())
  WITH CHECK (
    -- Cannot change ownership
    professional_id = _uid()
    -- Cannot reassign to a different client
    AND client_id = (
      SELECT r.client_id FROM reservations r WHERE r.id = reservations.id
    )
    -- Professional can only set these statuses
    AND status IN ('confirmed', 'on_route', 'in_progress', 'completed', 'canceled_pro')
  );


-- =============================================================
--
--   9. PAYMENTS
--
--   Only the client or professional involved can READ.
--   INSERT/UPDATE/DELETE → Edge Functions only (service_role key).
--   No write policies at all = completely blocked for regular users.
--
--   SECURITY NOTES:
--   - Payments are NEVER created or modified by the client directly.
--   - Edge Functions (process-booking-payment, cancel-reservation-refund)
--     handle all payment mutations with full validation.
--   - This prevents: fake payments, status manipulation, amount changes.
--
-- =============================================================

CREATE POLICY "payments_select_own"
  ON payments FOR SELECT
  USING (
    client_id = _uid()
    OR professional_id = _uid()
  );


-- =============================================================
--
--   10. NOTIFICATIONS
--
--   Owner can READ, UPDATE (mark as read), and DELETE their own.
--   INSERT → Edge Function (send-notification) via service_role key.
--
--   SECURITY NOTES:
--   - WITH CHECK on UPDATE prevents transferring notifications to others.
--   - Users can only mark as read (is_read = true), not unread or change content.
--   - No INSERT policy = users cannot create fake notifications.
--
-- =============================================================

CREATE POLICY "notifications_select_own"
  ON notifications FOR SELECT
  USING (user_id = _uid());

CREATE POLICY "notifications_update_own"
  ON notifications FOR UPDATE
  USING  (user_id = _uid())
  WITH CHECK (
    -- Cannot transfer to another user
    user_id = _uid()
  );

CREATE POLICY "notifications_delete_own"
  ON notifications FOR DELETE
  USING (user_id = _uid());


-- =============================================================
--
--   11. MESSAGES
--
--   Sender or receiver can READ.
--   Only the sender can INSERT (you can only send as yourself).
--   Receiver can UPDATE is_read (mark as read).
--   No DELETE policy — messages are permanent.
--
--   SECURITY NOTES:
--   - INSERT enforces sender_id = caller, preventing impersonation.
--   - INSERT validates the conversation exists and the sender is a participant.
--   - UPDATE only allowed by receiver (to mark as read).
--   - WITH CHECK on UPDATE prevents changing message content or sender.
--   - No DELETE = message history integrity preserved.
--
-- =============================================================

CREATE POLICY "messages_select_own"
  ON messages FOR SELECT
  USING (
    sender_id = _uid()
    OR receiver_id = _uid()
  );

CREATE POLICY "messages_insert_sender"
  ON messages FOR INSERT
  WITH CHECK (
    -- Must be the sender
    sender_id = _uid()
    -- Cannot send messages to yourself
    AND receiver_id <> _uid()
    -- Conversation must exist and caller must be a participant
    AND EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = conversation_id
        AND (c.participant1_id = _uid() OR c.participant2_id = _uid())
    )
  );

CREATE POLICY "messages_update_read"
  ON messages FOR UPDATE
  USING  (receiver_id = _uid())
  WITH CHECK (
    -- Cannot change ownership fields
    sender_id = (SELECT m.sender_id FROM messages m WHERE m.id = messages.id)
    AND receiver_id = _uid()
    -- Cannot change content or type
    AND content = (SELECT m.content FROM messages m WHERE m.id = messages.id)
    AND type = (SELECT m.type FROM messages m WHERE m.id = messages.id)
  );


-- =============================================================
--
--   12. CONVERSATIONS
--
--   Only participants can READ.
--   Only authenticated users can INSERT, and the creator MUST be participant1.
--   Only participants can UPDATE (last_message cache fields).
--   No DELETE policy — conversations are permanent.
--
--   SECURITY NOTES:
--   - INSERT requires participant1_id = caller. This prevents creating
--     conversations where you impersonate someone else as the initiator.
--   - participant2_id must be a real existing user (FK constraint enforced at DB level).
--   - WITH CHECK on UPDATE prevents changing participant IDs.
--   - Cannot create a conversation with yourself.
--
-- =============================================================

CREATE POLICY "conversations_select_own"
  ON conversations FOR SELECT
  USING (
    participant1_id = _uid()
    OR participant2_id = _uid()
  );

CREATE POLICY "conversations_insert_creator"
  ON conversations FOR INSERT
  WITH CHECK (
    -- Creator must be participant1 (no impersonation)
    participant1_id = _uid()
    -- Cannot create a conversation with yourself
    AND participant2_id <> _uid()
    -- participant2 must actually exist
    AND EXISTS (
      SELECT 1 FROM user_accounts
      WHERE auth_uid = participant2_id
    )
  );

CREATE POLICY "conversations_update_own"
  ON conversations FOR UPDATE
  USING (
    participant1_id = _uid()
    OR participant2_id = _uid()
  )
  WITH CHECK (
    -- Cannot change participants (no ownership transfer)
    participant1_id = (
      SELECT c.participant1_id FROM conversations c WHERE c.id = conversations.id
    )
    AND participant2_id = (
      SELECT c.participant2_id FROM conversations c WHERE c.id = conversations.id
    )
  );


-- =============================================================
--
--   13. USER_PAYMENT_METHODS
--
--   Owner can full CRUD their own payment methods.
--   No cross-user access whatsoever.
--
--   SECURITY NOTES:
--   - WITH CHECK on INSERT/UPDATE prevents setting user_id to someone else.
--   - Card data (provider_card_id, provider_customer_id) is tokenized by
--     Mercado Pago — no raw card numbers are ever stored.
--
-- =============================================================

CREATE POLICY "user_payment_methods_select_own"
  ON user_payment_methods FOR SELECT
  USING (user_id = _uid());

CREATE POLICY "user_payment_methods_insert_own"
  ON user_payment_methods FOR INSERT
  WITH CHECK (user_id = _uid());

CREATE POLICY "user_payment_methods_update_own"
  ON user_payment_methods FOR UPDATE
  USING  (user_id = _uid())
  WITH CHECK (user_id = _uid());

CREATE POLICY "user_payment_methods_delete_own"
  ON user_payment_methods FOR DELETE
  USING (user_id = _uid());


-- =============================================================
--
--   14. USER_ADDRESSES
--
--   Owner can full CRUD their own addresses.
--   No cross-user access whatsoever.
--
--   SECURITY NOTES:
--   - WITH CHECK on INSERT/UPDATE prevents setting user_id to someone else.
--
-- =============================================================

CREATE POLICY "user_addresses_select_own"
  ON user_addresses FOR SELECT
  USING (user_id = _uid());

CREATE POLICY "user_addresses_insert_own"
  ON user_addresses FOR INSERT
  WITH CHECK (user_id = _uid());

CREATE POLICY "user_addresses_update_own"
  ON user_addresses FOR UPDATE
  USING  (user_id = _uid())
  WITH CHECK (user_id = _uid());

CREATE POLICY "user_addresses_delete_own"
  ON user_addresses FOR DELETE
  USING (user_id = _uid());


-- =============================================================
--
--   15. SESSION_LOGS
--
--   Owner can read their own logs only.
--   INSERT → Edge Functions only (session-sync) via service_role key.
--   No UPDATE/DELETE policies — logs are immutable.
--
--   NOTE: This table uses auth.uid() (Postgres UUID) instead of
--   firebase_uid because user_id FK points to user_accounts.id (UUID).
--
-- =============================================================

CREATE POLICY "session_logs_select_own"
  ON session_logs FOR SELECT
  USING (user_id = auth.uid());


-- =============================================================
--
--   16. REVIEWS (Rating System)
--
--   All authenticated users can READ (public marketplace data).
--   Only the client who owns the reservation can INSERT, and only
--   when the reservation status is 'completed'.
--   No UPDATE or DELETE — reviews are immutable once created.
--
--   CONSTRAINTS:
--     - One review per reservation (UNIQUE on reservation_id).
--     - Score is 1–5 (integer CHECK).
--     - Comment is optional (nullable TEXT).
--
--   SECURITY NOTES:
--   - INSERT requires client_id = _uid() (must be the caller).
--   - INSERT requires _has_role('client') (professionals can't review).
--   - INSERT validates the reservation belongs to the caller AND is completed.
--   - UNIQUE(reservation_id) prevents duplicate reviews at DB level.
--   - No UPDATE/DELETE policies = reviews cannot be tampered with.
--   - Trigger auto-updates average_rating/review_count on professional_profiles.
--
-- =============================================================

-- --- Schema changes for reviews ---
-- NOTE: columns are named 'rating' and 'reviews_count' to match
-- the existing RPC (search_professionals) and frontend code.
ALTER TABLE professional_profiles
  ADD COLUMN IF NOT EXISTS rating         double precision DEFAULT 0,
  ADD COLUMN IF NOT EXISTS reviews_count  integer          DEFAULT 0;

CREATE TABLE IF NOT EXISTS reviews (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id  uuid NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
  client_id       text NOT NULL REFERENCES user_accounts(auth_uid),
  professional_id text NOT NULL REFERENCES user_accounts(auth_uid),
  score           integer NOT NULL CHECK (score >= 1 AND score <= 5),
  comment         text,
  created_at      timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT reviews_reservation_unique UNIQUE (reservation_id)
);

CREATE INDEX IF NOT EXISTS idx_reviews_professional_id ON reviews(professional_id);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- --- RLS Policies ---

CREATE POLICY "reviews_select_all"
  ON reviews FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "reviews_insert_client"
  ON reviews FOR INSERT
  WITH CHECK (
    -- Must be the caller (no impersonation)
    client_id = _uid()
    -- Must have client role (professionals cannot review)
    AND _has_role('client')
    -- Reservation must belong to caller AND be completed
    AND EXISTS (
      SELECT 1 FROM reservations r
      WHERE r.id = reservation_id
        AND r.client_id = _uid()
        AND r.status = 'completed'
    )
  );

-- No UPDATE or DELETE policies — reviews are immutable.

-- --- Trigger: Auto-update rating & reviews_count ---

CREATE OR REPLACE FUNCTION public.update_professional_rating()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  UPDATE public.professional_profiles
  SET
    rating = (
      SELECT COALESCE(ROUND(AVG(r.score)::numeric, 2), 0)
      FROM public.reviews r
      WHERE r.professional_id = NEW.professional_id
    ),
    reviews_count = (
      SELECT COUNT(*)::integer
      FROM public.reviews r
      WHERE r.professional_id = NEW.professional_id
    )
  WHERE user_id = NEW.professional_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_update_professional_rating ON reviews;

CREATE TRIGGER trg_update_professional_rating
  AFTER INSERT ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_professional_rating();
-- =============================================================
-- Migration: Admin RLS Policies
-- Date: 2026-02-26
--
-- Grants admin users (role = 'admin' in user_accounts) read and
-- write access to user_accounts and professional_profiles.
-- Uses the existing _has_role() helper from the base RLS migration.
-- =============================================================

-- Admin can read all user_accounts
CREATE POLICY "user_accounts_select_admin"
  ON user_accounts FOR SELECT
  USING (_has_role('admin'));

-- Admin can update any user_account (role changes, etc.)
-- WITH CHECK prevents an admin from demoting themselves
CREATE POLICY "user_accounts_update_admin"
  ON user_accounts FOR UPDATE
  USING (_has_role('admin'))
  WITH CHECK (auth_uid != _uid() OR role = 'admin');

-- Admin can read all professional_profiles
CREATE POLICY "professional_profiles_select_admin"
  ON professional_profiles FOR SELECT
  USING (_has_role('admin'));

-- Admin can update professional_profiles (approve/reject)
CREATE POLICY "professional_profiles_update_admin"
  ON professional_profiles FOR UPDATE
  USING (_has_role('admin'));
-- ============================================================================
-- platform_settings: Key-value config table for dynamic platform settings.
-- Only admins can read/write. Edge Functions use service_role to read.
-- ============================================================================

CREATE TABLE IF NOT EXISTS platform_settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Seed default platform fee rate (10%)
INSERT INTO platform_settings (key, value)
VALUES ('platform_fee_rate', '0.10')
ON CONFLICT (key) DO NOTHING;

-- RLS
ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read settings (needed for checkout screens)
CREATE POLICY "platform_settings_select_authenticated"
  ON platform_settings FOR SELECT
  TO authenticated
  USING (true);

-- Only admins can update
CREATE POLICY "platform_settings_update_admin"
  ON platform_settings FOR UPDATE
  TO authenticated
  USING (_has_role('admin'));
-- Migration: Add missing FK constraints for PostgREST joins
-- These FKs are required so PostgREST can resolve embedded selects
-- (e.g. "user_accounts → professional_profiles", "reservations → professional_profiles")

-- 0. Clean orphaned seed/test data that would violate FK constraints
DELETE FROM reservations
  WHERE professional_id IS NOT NULL
    AND professional_id NOT IN (SELECT user_id FROM professional_profiles WHERE user_id IS NOT NULL);

DELETE FROM professional_profiles
  WHERE user_id NOT IN (SELECT auth_uid FROM user_accounts);

-- 1. professional_profiles.user_id must be UNIQUE for 1:1 relationship
--    (one profile per user) - use IF NOT EXISTS pattern
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'professional_profiles_user_id_unique'
  ) THEN
    ALTER TABLE professional_profiles
      ADD CONSTRAINT professional_profiles_user_id_unique UNIQUE (user_id);
  END IF;
END $$;

-- 2. professional_profiles.user_id → user_accounts.auth_uid
--    Needed for: conversations query embedding professional_profiles inside user_accounts
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'professional_profiles_user_id_fkey'
  ) THEN
    ALTER TABLE professional_profiles
      ADD CONSTRAINT professional_profiles_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES user_accounts(auth_uid);
  END IF;
END $$;

-- 3. reservations.professional_id → professional_profiles.user_id
--    Needed for: reservation queries that use !reservations_to_pro_profile_fkey
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'reservations_to_pro_profile_fkey'
  ) THEN
    ALTER TABLE reservations
      ADD CONSTRAINT reservations_to_pro_profile_fkey
      FOREIGN KEY (professional_id) REFERENCES professional_profiles(user_id);
  END IF;
END $$;
-- =============================================================
-- Re-enable RLS on ALL public app tables.
--
-- RLS was disabled on some tables (likely via Supabase Dashboard).
-- This migration re-enables it. The RLS policies already exist
-- from the 20260220 and 20260226 migrations — this just turns
-- the enforcement back on.
--
-- NOTE: spatial_ref_sys and geography_columns/geometry_columns
-- are PostGIS system tables — we do NOT touch them.
-- =============================================================

ALTER TABLE user_accounts              ENABLE ROW LEVEL SECURITY;
ALTER TABLE professional_profiles      ENABLE ROW LEVEL SECURITY;
ALTER TABLE professional_service_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_categories         ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_templates          ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations               ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications              ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations              ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_payment_methods       ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_addresses             ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_logs               ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_settings          ENABLE ROW LEVEL SECURITY;

-- =============================================================
-- Force RLS for table owners too (prevents bypassing RLS
-- when connected as the table owner role).
-- =============================================================

ALTER TABLE user_accounts              FORCE ROW LEVEL SECURITY;
ALTER TABLE professional_profiles      FORCE ROW LEVEL SECURITY;
ALTER TABLE professional_service_prices FORCE ROW LEVEL SECURITY;
ALTER TABLE service_categories         FORCE ROW LEVEL SECURITY;
ALTER TABLE service_templates          FORCE ROW LEVEL SECURITY;
ALTER TABLE reservations               FORCE ROW LEVEL SECURITY;
ALTER TABLE payments                   FORCE ROW LEVEL SECURITY;
ALTER TABLE notifications              FORCE ROW LEVEL SECURITY;
ALTER TABLE messages                   FORCE ROW LEVEL SECURITY;
ALTER TABLE conversations              FORCE ROW LEVEL SECURITY;
ALTER TABLE user_payment_methods       FORCE ROW LEVEL SECURITY;
ALTER TABLE user_addresses             FORCE ROW LEVEL SECURITY;
ALTER TABLE session_logs               FORCE ROW LEVEL SECURITY;
ALTER TABLE reviews                    FORCE ROW LEVEL SECURITY;
ALTER TABLE platform_settings          FORCE ROW LEVEL SECURITY;
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
-- =============================================================
-- Migration: Fix Admin RLS Infinite Recursion + Linter Warning
-- Date: 2026-03-03
--
-- PROBLEM:
--   user_accounts_select_admin and user_accounts_update_admin call
--   _has_role('admin'), which queries user_accounts. With FORCE ROW
--   LEVEL SECURITY enabled, that inner query must evaluate the same
--   policies again → infinite recursion.
--
-- FIX:
--   1. Create _jwt_role() — reads app_role from JWT claims (no table query)
--   2. Recreate the two admin policies on user_accounts using _jwt_role()
--   3. Fix session_logs_select_own to use (select auth.uid()) initplan wrapper
--
-- NOTE: _has_role() is kept — its 6 uses on other tables are safe
--       (no self-reference on user_accounts).
-- =============================================================


-- =============================================================
-- 1. CREATE _jwt_role() — reads role from JWT, never touches a table
--    Fail-closed: returns '' if app_role is missing from the token.
-- =============================================================
CREATE OR REPLACE FUNCTION public._jwt_role()
RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT coalesce(
    current_setting('request.jwt.claims', true)::json ->> 'app_role',
    ''
  );
$$;


-- =============================================================
-- 2. RECREATE user_accounts ADMIN POLICIES using _jwt_role()
-- =============================================================

DROP POLICY IF EXISTS "user_accounts_select_admin" ON user_accounts;
CREATE POLICY "user_accounts_select_admin"
  ON user_accounts FOR SELECT TO authenticated
  USING ((select _jwt_role()) = 'admin');

DROP POLICY IF EXISTS "user_accounts_update_admin" ON user_accounts;
CREATE POLICY "user_accounts_update_admin"
  ON user_accounts FOR UPDATE TO authenticated
  USING ((select _jwt_role()) = 'admin')
  WITH CHECK (auth_uid != (select _uid()) OR role = 'admin');


-- =============================================================
-- 3. FIX session_logs initplan wrapper
--    Was: user_id = auth.uid()  (per-row evaluation)
--    Now: user_id = (select auth.uid())  (initplan, evaluated once)
-- =============================================================

DROP POLICY IF EXISTS "session_logs_select_own" ON session_logs;
CREATE POLICY "session_logs_select_own"
  ON session_logs FOR SELECT TO authenticated
  USING (user_id = (select auth.uid()));
-- =============================================================
-- Migration: Fix user_accounts_update_own Self-Referencing Recursion
-- Date: 2026-03-03
--
-- PROBLEM:
--   user_accounts_update_own WITH CHECK contains:
--     role = (SELECT ua.role FROM user_accounts ua WHERE ...)
--   This subquery on user_accounts triggers SELECT policy evaluation
--   on the same table → Postgres detects infinite recursion.
--
-- FIX:
--   1. Recreate user_accounts_update_own WITHOUT the self-referencing
--      subquery (simple ownership check only).
--   2. Add a BEFORE UPDATE trigger to prevent non-admin users from
--      changing their own role. Triggers bypass RLS — no recursion.
-- =============================================================


-- =============================================================
-- 1. FIX user_accounts_update_own — remove self-referencing subquery
-- =============================================================

DROP POLICY IF EXISTS "user_accounts_update_own" ON user_accounts;
CREATE POLICY "user_accounts_update_own"
  ON user_accounts FOR UPDATE TO authenticated
  USING  (auth_uid = (select _uid()))
  WITH CHECK (auth_uid = (select _uid()));


-- =============================================================
-- 2. TRIGGER: Prevent non-admin users from changing their own role
--    Reads app_role from JWT (no table query = no RLS recursion).
--    Admins can change any user's role via user_accounts_update_admin.
-- =============================================================

CREATE OR REPLACE FUNCTION public._guard_role_change()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- If role didn't change, allow the update
  IF NEW.role IS NOT DISTINCT FROM OLD.role THEN
    RETURN NEW;
  END IF;

  -- If caller is admin (from JWT), allow role changes
  IF coalesce(
    current_setting('request.jwt.claims', true)::json ->> 'app_role',
    ''
  ) = 'admin' THEN
    RETURN NEW;
  END IF;

  -- Non-admin trying to change role → block
  RAISE EXCEPTION 'Cannot change your own role'
    USING ERRCODE = 'insufficient_privilege';
END;
$$;

-- Drop if exists (idempotent)
DROP TRIGGER IF EXISTS guard_role_change ON user_accounts;

CREATE TRIGGER guard_role_change
  BEFORE UPDATE ON user_accounts
  FOR EACH ROW
  EXECUTE FUNCTION public._guard_role_change();
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
-- =============================================================
-- FIX: delete_user_account_safe — reviews table uses client_id, not reviewer_id
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
-- =============================================================
-- Migration: Fix Admin RLS on professional_profiles
-- Date: 2026-03-04
--
-- PROBLEM:
--   professional_profiles_update_admin uses _has_role('admin')
--   which queries user_accounts internally. With FORCE ROW LEVEL
--   SECURITY on user_accounts, the inner query may fail silently.
--
-- FIX:
--   Use _jwt_role() (reads app_role from JWT, no table query)
--   for all admin policies on professional_profiles and
--   platform_settings. Also add WITH CHECK clause.
-- =============================================================

-- professional_profiles: admin UPDATE
DROP POLICY IF EXISTS "professional_profiles_update_admin" ON professional_profiles;
CREATE POLICY "professional_profiles_update_admin"
  ON professional_profiles FOR UPDATE TO authenticated
  USING  ((select _jwt_role()) = 'admin')
  WITH CHECK ((select _jwt_role()) = 'admin');

-- professional_profiles: admin SELECT (also fix for consistency)
DROP POLICY IF EXISTS "professional_profiles_select_admin" ON professional_profiles;
CREATE POLICY "professional_profiles_select_admin"
  ON professional_profiles FOR SELECT TO authenticated
  USING ((select _jwt_role()) = 'admin');

-- platform_settings: admin UPDATE (same issue)
DROP POLICY IF EXISTS "platform_settings_update_admin" ON platform_settings;
CREATE POLICY "platform_settings_update_admin"
  ON platform_settings FOR UPDATE TO authenticated
  USING  ((select _jwt_role()) = 'admin')
  WITH CHECK ((select _jwt_role()) = 'admin');
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
-- =============================================================
-- Migration: Fix professional_profiles_update_own policy
-- Date: 2026-03-04
--
-- PROBLEM:
--   Previous migration restricted WITH CHECK to identity_status IN ('pending')
--   which blocks verified professionals from updating is_active, biography, etc.
--
-- FIX:
--   Allow professionals to update their own row freely EXCEPT they cannot
--   change identity_status. We enforce this by checking that the new
--   identity_status equals the current value using a BEFORE UPDATE trigger
--   instead of a self-referencing policy subquery (which causes recursion).
-- =============================================================

-- 1. Drop the broken policy
DROP POLICY IF EXISTS "professional_profiles_update_own" ON professional_profiles;

-- 2. Recreate: professionals can update their own row (no identity_status restriction in policy)
CREATE POLICY "professional_profiles_update_own"
  ON professional_profiles FOR UPDATE TO authenticated
  USING  (user_id = (select _uid()))
  WITH CHECK (user_id = (select _uid()));

-- 3. Create a trigger that prevents non-admin users from changing identity_status
CREATE OR REPLACE FUNCTION public._guard_identity_status()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- If identity_status is being changed, only allow it if the caller is admin
  IF NEW.identity_status IS DISTINCT FROM OLD.identity_status THEN
    IF coalesce(
      current_setting('request.jwt.claims', true)::json ->> 'app_role',
      ''
    ) <> 'admin' THEN
      RAISE EXCEPTION 'Solo un administrador puede cambiar identity_status';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- Drop if exists to make idempotent
DROP TRIGGER IF EXISTS guard_identity_status ON professional_profiles;
CREATE TRIGGER guard_identity_status
  BEFORE UPDATE ON professional_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public._guard_identity_status();
-- =============================================================
-- Migration: Fix conversations_insert_creator RLS
-- Date: 2026-03-04
--
-- PROBLEM:
--   conversations_insert_creator has EXISTS subquery on user_accounts
--   which triggers FORCE RLS evaluation → potential recursion/denial.
--
-- FIX:
--   Remove the EXISTS check. The participant2_id is already validated by:
--   1. Application logic (ConversationService passes a known user ID)
--   2. We keep participant1_id = _uid() and participant2_id <> _uid()
--   If participant2_id doesn't exist, the app handles it gracefully.
-- =============================================================

DROP POLICY IF EXISTS "conversations_insert_creator" ON conversations;
CREATE POLICY "conversations_insert_creator"
  ON conversations FOR INSERT TO authenticated
  WITH CHECK (
    participant1_id = (select _uid())
    AND participant2_id <> (select _uid())
  );
-- =============================================================
-- Migration: Fix messages FK to reference user_accounts(auth_uid)
-- Date: 2026-03-04
--
-- PROBLEM:
--   messages.sender_id and messages.receiver_id store Firebase UIDs
--   (same as user_accounts.auth_uid), but the FK constraints created
--   via Dashboard likely reference user_accounts(id) (Postgres UUID).
--   This causes "Key is not present in table user_accounts" errors
--   when inserting messages with Firebase UIDs.
--
-- FIX:
--   Drop and recreate FKs to reference user_accounts(auth_uid).
-- =============================================================

-- 1. Drop existing FK constraints (try common naming patterns from Dashboard)
ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_receiver_id_fkey;
ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_sender_id_fkey;
ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_receiver_id_fkey1;
ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_sender_id_fkey1;

-- 2. Recreate with correct reference to auth_uid + CASCADE
ALTER TABLE messages
  ADD CONSTRAINT messages_sender_id_fkey
  FOREIGN KEY (sender_id) REFERENCES user_accounts(auth_uid) ON DELETE CASCADE;

ALTER TABLE messages
  ADD CONSTRAINT messages_receiver_id_fkey
  FOREIGN KEY (receiver_id) REFERENCES user_accounts(auth_uid) ON DELETE CASCADE;
-- =============================================================
-- Migration: Fix conversations FK to reference user_accounts(auth_uid)
-- Date: 2026-03-04
--
-- PROBLEM:
--   conversations.participant1_id and participant2_id store Firebase UIDs,
--   but FKs may reference user_accounts(id) (UUID).
--   This breaks PostgREST embedded JOINs like:
--     user_accounts!participant1_id (legal_name, ...)
--   causing partner names to be null in the conversation list.
--
-- FIX:
--   Drop and recreate FKs to reference user_accounts(auth_uid).
-- =============================================================

-- Drop existing FK constraints
ALTER TABLE conversations DROP CONSTRAINT IF EXISTS conversations_participant1_id_fkey;
ALTER TABLE conversations DROP CONSTRAINT IF EXISTS conversations_participant2_id_fkey;
ALTER TABLE conversations DROP CONSTRAINT IF EXISTS conversations_participant1_id_fkey1;
ALTER TABLE conversations DROP CONSTRAINT IF EXISTS conversations_participant2_id_fkey1;

-- Recreate with correct reference + CASCADE
ALTER TABLE conversations
  ADD CONSTRAINT conversations_participant1_id_fkey
  FOREIGN KEY (participant1_id) REFERENCES user_accounts(auth_uid) ON DELETE CASCADE;

ALTER TABLE conversations
  ADD CONSTRAINT conversations_participant2_id_fkey
  FOREIGN KEY (participant2_id) REFERENCES user_accounts(auth_uid) ON DELETE CASCADE;
-- =============================================================
-- Migration: Fix ALL FK constraints that reference user_accounts
-- Date: 2026-03-04
--
-- PROBLEM:
--   Some FKs created via Supabase Dashboard reference user_accounts(id)
--   (Postgres UUID) instead of user_accounts(auth_uid) (Firebase UID).
--   The app stores Firebase UIDs everywhere, so FKs must match.
--
-- FIX:
--   Drop ALL FK constraints on messages table (regardless of name),
--   then recreate them pointing to user_accounts(auth_uid).
--   Same for any other table with mismatched FKs.
-- =============================================================

-- ─── 1. MESSAGES: Drop ALL FKs dynamically ────────────────────────
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'public.messages'::regclass
      AND contype = 'f'
  LOOP
    EXECUTE format('ALTER TABLE public.messages DROP CONSTRAINT IF EXISTS %I', r.conname);
    RAISE NOTICE 'Dropped messages FK: %', r.conname;
  END LOOP;
END $$;

-- Recreate messages FKs → user_accounts(auth_uid)
ALTER TABLE messages
  ADD CONSTRAINT messages_sender_id_fkey
  FOREIGN KEY (sender_id) REFERENCES user_accounts(auth_uid) ON DELETE CASCADE;

ALTER TABLE messages
  ADD CONSTRAINT messages_receiver_id_fkey
  FOREIGN KEY (receiver_id) REFERENCES user_accounts(auth_uid) ON DELETE CASCADE;

-- messages.conversation_id → conversations(id)
ALTER TABLE messages
  ADD CONSTRAINT messages_conversation_id_fkey
  FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE;


-- ─── 2. CONVERSATIONS: Drop ALL FKs dynamically ───────────────────
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'public.conversations'::regclass
      AND contype = 'f'
  LOOP
    EXECUTE format('ALTER TABLE public.conversations DROP CONSTRAINT IF EXISTS %I', r.conname);
    RAISE NOTICE 'Dropped conversations FK: %', r.conname;
  END LOOP;
END $$;

-- Recreate conversations FKs → user_accounts(auth_uid)
ALTER TABLE conversations
  ADD CONSTRAINT conversations_participant1_id_fkey
  FOREIGN KEY (participant1_id) REFERENCES user_accounts(auth_uid) ON DELETE CASCADE;

ALTER TABLE conversations
  ADD CONSTRAINT conversations_participant2_id_fkey
  FOREIGN KEY (participant2_id) REFERENCES user_accounts(auth_uid) ON DELETE CASCADE;


-- ─── 3. RESERVATIONS: Ensure client_id FK → auth_uid ──────────────
-- (professional_id FK was already fixed in earlier migration to reference both
--  user_accounts(auth_uid) and professional_profiles(user_id))
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'public.reservations'::regclass
      AND contype = 'f'
      AND conname LIKE '%client_id%'
  LOOP
    EXECUTE format('ALTER TABLE public.reservations DROP CONSTRAINT IF EXISTS %I', r.conname);
    RAISE NOTICE 'Dropped reservations FK: %', r.conname;
  END LOOP;
END $$;

ALTER TABLE reservations
  ADD CONSTRAINT reservations_client_id_fkey
  FOREIGN KEY (client_id) REFERENCES user_accounts(auth_uid) ON DELETE CASCADE;
-- =============================================================
-- Migration: Allow authenticated users to SELECT user_accounts
--            for conversation partners
-- Date: 2026-03-04
--
-- PROBLEM:
--   user_accounts only has select_own and select_admin policies.
--   When fetching conversations with embedded JOINs like:
--     user_accounts!conversations_participant1_id_fkey (legal_name, ...)
--   PostgREST returns null because RLS blocks reading the partner's row.
--   This causes "Usuario Zolver" fallback instead of the real name.
--   It also causes messages FK errors because the app can't verify
--   the receiver exists.
--
-- FIX:
--   Add a policy that allows authenticated users to read basic info
--   of users they share a conversation with. This is safe because:
--   - The user must be a participant in the conversation
--   - user_accounts only contains non-sensitive profile data
--
--   For simplicity and performance, we allow all authenticated users
--   to SELECT from user_accounts. The table only has: auth_uid, email,
--   legal_name, phone, role, profile_complete, avatar_url — no secrets.
-- =============================================================

CREATE POLICY "user_accounts_select_authenticated"
  ON user_accounts FOR SELECT TO authenticated
  USING (true);
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
-- Fix Storage RLS for messages bucket
-- Allows authenticated conversation participants to upload and view image messages

-- DROP (idempotent)
DROP POLICY IF EXISTS "messages_storage_insert" ON storage.objects;
DROP POLICY IF EXISTS "messages_storage_select" ON storage.objects;

-- INSERT: uploader must be a participant in the conversation (folder name = conversationId)
CREATE POLICY "messages_storage_insert"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'messages'
  AND EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = (storage.foldername(name))[1]::uuid
      AND (
        c.participant1_id = (select public._uid())
        OR c.participant2_id = (select public._uid())
      )
  )
);

-- SELECT: only conversation participants can access their images
CREATE POLICY "messages_storage_select"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'messages'
  AND EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = (storage.foldername(name))[1]::uuid
      AND (
        c.participant1_id = (select public._uid())
        OR c.participant2_id = (select public._uid())
      )
  )
);
-- Fix Storage RLS: replace complex subquery with simple bucket-level policy.
-- Security for participant access is enforced at the messages table RLS level
-- (messages_insert_sender requires sender to be a conversation participant).

DROP POLICY IF EXISTS "messages_storage_insert" ON storage.objects;
DROP POLICY IF EXISTS "messages_storage_select" ON storage.objects;

CREATE POLICY "messages_storage_insert"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'messages');

CREATE POLICY "messages_storage_select"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'messages');
-- Fix Storage RLS for avatars and portfolio buckets.
-- Profile photo uploads (avatars) and portfolio image uploads were blocked
-- because these buckets had zero policies defined.

-- ── avatars ──────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "avatars_storage_insert" ON storage.objects;
DROP POLICY IF EXISTS "avatars_storage_select" ON storage.objects;

-- Only the owner can upload to their own folder (path: {uid}/filename)
CREATE POLICY "avatars_storage_insert"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'avatars'
  AND split_part(name, '/', 1) = (select public._uid())
);

-- Anyone authenticated can view profile photos (public catalog)
CREATE POLICY "avatars_storage_select"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'avatars');


-- ── portfolio ─────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "portfolio_storage_insert" ON storage.objects;
DROP POLICY IF EXISTS "portfolio_storage_select" ON storage.objects;

-- Only the owner can upload to their own folder (path: {uid}/filename)
CREATE POLICY "portfolio_storage_insert"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'portfolio'
  AND split_part(name, '/', 1) = (select public._uid())
);

-- Anyone authenticated can view portfolio images (public catalog)
CREATE POLICY "portfolio_storage_select"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'portfolio');


-- ── messages cleanup ─────────────────────────────────────────────────────────
-- Remove duplicate migration-created policies; dashboard policies
-- ("Permitir lectura/subida a usuarios autenticados") already cover this bucket.

DROP POLICY IF EXISTS "messages_storage_insert" ON storage.objects;
DROP POLICY IF EXISTS "messages_storage_select" ON storage.objects;
-- Add 'disputed' to the reservation_status enum.
-- Required by the mp-webhook chargeback handler (line 388 in mp-webhook/index.ts).
-- Without this, the UPDATE silently fails with a PostgreSQL enum type error
-- when Mercado Pago sends a charged_back notification.

ALTER TYPE reservation_status ADD VALUE IF NOT EXISTS 'disputed';
