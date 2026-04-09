/**
 * Domain type for the singleton app_config row.
 * Mirrors `public.app_config` in Supabase.
 */
export interface AppConfig {
  maintenanceMode: boolean;
  maintenanceMessage: string | null;
  minVersion: string | null;
  forceUpdateMessage: string | null;
  updatedAt: string;
}

/**
 * Raw DTO as it comes back from Supabase (snake_case).
 */
export interface AppConfigDTO {
  id: number;
  maintenance_mode: boolean;
  maintenance_message: string | null;
  min_version: string | null;
  force_update_message: string | null;
  updated_at: string;
}

/**
 * Resultado de evaluar el estado remoto contra la versión instalada.
 */
export type AppGateStatus =
  | { kind: "ok" }
  | { kind: "maintenance"; message: string }
  | { kind: "force_update"; message: string; minVersion: string };
