import { useQuery } from "@tanstack/react-query";
import Constants from "expo-constants";
import { fetchAppConfigService } from "../Service/AppConfigService";
import { AppGateStatus } from "../Type/AppConfigType";

/**
 * Compara dos strings semver "MAJOR.MINOR.PATCH".
 * Devuelve:
 *  -1 si a < b
 *   0 si a === b
 *   1 si a > b
 * Inputs inválidos se tratan como "0.0.0".
 */
function compareSemver(a: string, b: string): number {
  const parse = (s: string): [number, number, number] => {
    const parts = s.split(".").map((n) => {
      const parsed = parseInt(n, 10);
      return Number.isFinite(parsed) ? parsed : 0;
    });
    return [parts[0] ?? 0, parts[1] ?? 0, parts[2] ?? 0];
  };

  const [aMaj, aMin, aPatch] = parse(a);
  const [bMaj, bMin, bPatch] = parse(b);

  if (aMaj !== bMaj) return aMaj < bMaj ? -1 : 1;
  if (aMin !== bMin) return aMin < bMin ? -1 : 1;
  if (aPatch !== bPatch) return aPatch < bPatch ? -1 : 1;
  return 0;
}

/**
 * Versión instalada de la app, leída de `app.json` vía expo-constants.
 * En dev client es la del fingerprint actual; en builds de prod es la
 * `expo.version` del momento del build.
 */
function getInstalledVersion(): string {
  return Constants.expoConfig?.version ?? "0.0.0";
}

/**
 * Hook que evalúa el estado del gate remoto contra la versión instalada.
 *
 * Política de fallo:
 *  - Si la config remota no se puede leer (red caída, RLS rota, etc.),
 *    `status = { kind: "ok" }` (fail-open). NO bloqueamos al usuario por
 *    un fallo de red en una feature auxiliar.
 *  - `isLoading` solo es true durante el primer fetch. Mientras carga,
 *    el caller debería mostrar el LoadingScreen existente.
 *
 * Refresco:
 *  - Polling cada 60s: si flipeamos `maintenance_mode` en Supabase, los
 *    usuarios activos lo ven dentro del siguiente minuto. No usamos
 *    Realtime para no abrir un canal extra solo para esto.
 */
export const useAppGate = () => {
  const { data: config, isLoading } = useQuery({
    queryKey: ["app-config"],
    queryFn: fetchAppConfigService,
    staleTime: 60 * 1000,
    refetchInterval: 60 * 1000,
    refetchOnWindowFocus: true,
    // Si falla, react-query retenta una sola vez y luego cae al fail-open.
    retry: 1,
  });

  const status: AppGateStatus = (() => {
    if (!config) return { kind: "ok" };

    if (config.maintenanceMode) {
      return {
        kind: "maintenance",
        message: config.maintenanceMessage ?? "Estamos haciendo mejoras. Volvemos en un rato.",
      };
    }

    if (config.minVersion) {
      const installed = getInstalledVersion();
      if (compareSemver(installed, config.minVersion) < 0) {
        return {
          kind: "force_update",
          message:
            config.forceUpdateMessage ??
            "Hay una nueva versión disponible. Actualizá la app para continuar.",
          minVersion: config.minVersion,
        };
      }
    }

    return { kind: "ok" };
  })();

  return { status, isLoading };
};
