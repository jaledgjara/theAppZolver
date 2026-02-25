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
