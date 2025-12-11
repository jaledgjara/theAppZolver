import { useState, useCallback } from "react";
import { useFocusEffect } from "expo-router"; // O @react-navigation/native
import { Reservation } from "../Type/ReservationType";
import {
  fetchProTodayReservations,
  fetchProPendingConfirmations,
  fetchProAlerts,
} from "../Service/ReservationService";

/**
 * Interface del Estado del Dashboard
 * Centraliza toda la data que la UI necesita pintar.
 */
interface DashboardState {
  today: Reservation[];
  pending: Reservation[];
  alerts: Reservation[];
}

interface UseProDashboardReturn {
  // Datos
  data: DashboardState;

  // Estados de UX
  isLoading: boolean; // Para Skeleton o Spinner pantalla completa
  isRefreshing: boolean; // Para Pull-to-Refresh
  error: string | null;

  // Acciones
  refetch: () => Promise<void>; // Acción manual de recarga
}

/**
 * HOOK: useProDashboard
 * "The Thinker": Orquestador de datos para el Home del Profesional.
 * Se encarga de sincronizar con Supabase y manejar el ciclo de vida de la pantalla.
 */
export const useProDashboard = (
  professionalId: string | undefined
): UseProDashboardReturn => {
  // 1. Estados
  const [data, setData] = useState<DashboardState>({
    today: [],
    pending: [],
    alerts: [],
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 2. Lógica de Fetching (Núcleo)
  const fetchData = async (mode: "initial" | "refresh") => {
    if (!professionalId) return;

    if (mode === "initial") setIsLoading(true);
    else setIsRefreshing(true);

    setError(null);

    try {
      // EJECUCIÓN PARALELA: Disparamos las 3 balas al mismo tiempo 🚀
      const [todayData, pendingData, alertsData] = await Promise.all([
        fetchProTodayReservations(professionalId),
        fetchProPendingConfirmations(professionalId),
        fetchProAlerts(professionalId),
      ]);

      setData({
        today: todayData,
        pending: pendingData,
        alerts: alertsData,
      });
    } catch (err: any) {
      console.error("Dashboard Sync Error:", err);
      setError("Hubo un problema actualizando tu agenda.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // 3. Efecto de Foco (Auto-Update)
  // Se ejecuta cada vez que la pantalla gana el foco (Tab switch o navegación back)
  useFocusEffect(
    useCallback(() => {
      // Usamos una bandera para evitar race conditions si el componente se desmonta
      let isActive = true;

      if (isActive && professionalId) {
        fetchData("initial");
      }

      return () => {
        isActive = false;
      };
    }, [professionalId])
  );

  // 4. Acción Manual (Pull to Refresh)
  const refetch = async () => {
    await fetchData("refresh");
  };

  return {
    data,
    isLoading,
    isRefreshing,
    error,
    refetch,
  };
};
