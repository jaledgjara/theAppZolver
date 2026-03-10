-- =============================================================
-- Migration: Performance Indexes for Production
-- Date: 2026-03-10
--
-- Adds indexes on foreign keys and frequently queried columns
-- to prevent slow queries as tables grow with thousands of users.
--
-- All indexes use CREATE INDEX IF NOT EXISTS for idempotency.
-- =============================================================

-- ─── user_accounts ───
CREATE INDEX IF NOT EXISTS idx_user_accounts_auth_uid
  ON user_accounts (auth_uid);

CREATE INDEX IF NOT EXISTS idx_user_accounts_role
  ON user_accounts (role);

CREATE INDEX IF NOT EXISTS idx_user_accounts_email
  ON user_accounts (email);

-- ─── professional_profiles ───
CREATE INDEX IF NOT EXISTS idx_professional_profiles_user_id
  ON professional_profiles (user_id);

CREATE INDEX IF NOT EXISTS idx_professional_profiles_identity_status
  ON professional_profiles (identity_status);

-- ─── professional_service_prices ───
CREATE INDEX IF NOT EXISTS idx_professional_service_prices_professional_id
  ON professional_service_prices (professional_id);

-- ─── reservations ───
CREATE INDEX IF NOT EXISTS idx_reservations_client_id
  ON reservations (client_id);

CREATE INDEX IF NOT EXISTS idx_reservations_professional_id
  ON reservations (professional_id);

CREATE INDEX IF NOT EXISTS idx_reservations_status
  ON reservations (status);

CREATE INDEX IF NOT EXISTS idx_reservations_created_at
  ON reservations (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_reservations_service_modality
  ON reservations (service_modality);

-- Composite: frequently used in conflict checks (process-booking-payment)
CREATE INDEX IF NOT EXISTS idx_reservations_pro_modality_status
  ON reservations (professional_id, service_modality, status);

-- ─── payments ───
CREATE INDEX IF NOT EXISTS idx_payments_reservation_id
  ON payments (reservation_id);

CREATE INDEX IF NOT EXISTS idx_payments_client_id
  ON payments (client_id);

CREATE INDEX IF NOT EXISTS idx_payments_professional_id
  ON payments (professional_id);

CREATE INDEX IF NOT EXISTS idx_payments_status
  ON payments (status);

CREATE INDEX IF NOT EXISTS idx_payments_provider_payment_id
  ON payments (provider_payment_id);

CREATE INDEX IF NOT EXISTS idx_payments_created_at
  ON payments (created_at DESC);

-- ─── notifications ───
CREATE INDEX IF NOT EXISTS idx_notifications_user_id
  ON notifications (user_id);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id_is_read
  ON notifications (user_id, is_read);

CREATE INDEX IF NOT EXISTS idx_notifications_created_at
  ON notifications (created_at DESC);

-- ─── messages ───
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id
  ON messages (conversation_id);

CREATE INDEX IF NOT EXISTS idx_messages_sender_id
  ON messages (sender_id);

CREATE INDEX IF NOT EXISTS idx_messages_created_at
  ON messages (created_at DESC);

-- ─── conversations ───
CREATE INDEX IF NOT EXISTS idx_conversations_participant1_id
  ON conversations (participant1_id);

CREATE INDEX IF NOT EXISTS idx_conversations_participant2_id
  ON conversations (participant2_id);

-- ─── user_payment_methods ───
CREATE INDEX IF NOT EXISTS idx_user_payment_methods_user_id
  ON user_payment_methods (user_id);

-- ─── user_addresses ───
CREATE INDEX IF NOT EXISTS idx_user_addresses_user_id
  ON user_addresses (user_id);

-- ─── reviews ───
CREATE INDEX IF NOT EXISTS idx_reviews_professional_id
  ON reviews (professional_id);

CREATE INDEX IF NOT EXISTS idx_reviews_client_id
  ON reviews (client_id);

CREATE INDEX IF NOT EXISTS idx_reviews_reservation_id
  ON reviews (reservation_id);
