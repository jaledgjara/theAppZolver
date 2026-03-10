-- =============================================================
-- Migration: Webhook Idempotency Table
-- Date: 2026-03-10
--
-- Tracks processed webhook IDs to prevent duplicate processing
-- of payment webhooks from Mercado Pago.
-- =============================================================

CREATE TABLE IF NOT EXISTS processed_webhooks (
  webhook_id TEXT PRIMARY KEY,
  payment_id TEXT NOT NULL,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status_transition TEXT -- e.g. "pending → approved"
);

-- Auto-cleanup: entries older than 7 days (MP retries max 48h)
CREATE INDEX IF NOT EXISTS idx_processed_webhooks_processed_at
  ON processed_webhooks (processed_at);

-- RLS: no direct client access needed — only Edge Functions via service_role
ALTER TABLE processed_webhooks ENABLE ROW LEVEL SECURITY;
