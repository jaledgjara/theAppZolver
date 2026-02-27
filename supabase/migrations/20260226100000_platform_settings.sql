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
