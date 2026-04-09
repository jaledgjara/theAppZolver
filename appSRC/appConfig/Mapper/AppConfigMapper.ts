import { AppConfig, AppConfigDTO } from "../Type/AppConfigType";

export const mapAppConfigFromDTO = (dto: AppConfigDTO): AppConfig => ({
  maintenanceMode: dto.maintenance_mode,
  maintenanceMessage: dto.maintenance_message,
  minVersion: dto.min_version,
  forceUpdateMessage: dto.force_update_message,
  updatedAt: dto.updated_at,
});
