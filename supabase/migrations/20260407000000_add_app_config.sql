-- =============================================================
-- Migration: App Config (kill switch + force update)
-- Date: 2026-04-07
--
-- Singleton table (id=1) leída por el cliente en el boot para:
--   - Activar modo mantenimiento (`maintenance_mode`)
--   - Forzar actualización si la versión instalada es < `min_version`
--
-- Sin esta tabla, no hay forma de apagar la app remotamente si una
-- migración de DB falla o sale un bug crítico que no se puede resolver
-- con un EAS Update (p.ej. un crash en código nativo).
--
-- Escritura: SOLO vía service_role (SQL/Edge Function), nunca desde cliente.
-- Lectura: PÚBLICA — necesita funcionar antes del login.
-- =============================================================

CREATE TABLE IF NOT EXISTS app_config (
  id SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  maintenance_mode BOOLEAN NOT NULL DEFAULT FALSE,
  maintenance_message TEXT,
  min_version TEXT, -- semver string, ej. "1.0.3". NULL = sin restricción.
  force_update_message TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Garantiza singleton: siempre existe la fila id=1
INSERT INTO app_config (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- Trigger para mantener updated_at
CREATE OR REPLACE FUNCTION update_app_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_app_config_updated_at ON app_config;
CREATE TRIGGER trg_app_config_updated_at
  BEFORE UPDATE ON app_config
  FOR EACH ROW
  EXECUTE FUNCTION update_app_config_updated_at();

-- RLS: lectura pública, escritura bloqueada (solo service_role la ignora)
ALTER TABLE app_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "app_config_public_read" ON app_config;
CREATE POLICY "app_config_public_read"
  ON app_config
  FOR SELECT
  USING (true);

-- NO policy de INSERT/UPDATE/DELETE → solo service_role puede escribir.
