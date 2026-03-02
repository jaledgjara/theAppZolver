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
