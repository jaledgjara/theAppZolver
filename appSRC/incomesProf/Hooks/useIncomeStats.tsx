import { useState, useEffect, useCallback } from "react";
import { useAuthStore } from "@/appSRC/auth/Store/AuthStore";
import { getIncomeStats } from "../Service/IncomesService";
import { IncomePayload } from "../Type/IncomesType";
import { ProfessionalDataService } from "@/appSRC/users/Professional/General/Service/ProfessionalDataService";

// Extendemos el tipo localmente para incluir la categoría
export type ExtendedIncomeStats = IncomePayload & {
  categoryName: string;
};

export const useIncomeStats = () => {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<ExtendedIncomeStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = useCallback(async () => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    try {
      console.log(`---- [useIncomeStats] Fetching data for: ${user.uid} ----`);

      // Ejecución paralela (Serverless-First optimization)
      const [incomeData, categoryName] = await Promise.all([
        getIncomeStats(user.uid),
        ProfessionalDataService.fetchProfessionalCategory(user.uid),
      ]);

      if (incomeData) {
        setStats({
          ...incomeData,
          // Forzamos el mapeo de incomeToday para evitar el 0 persistente si el RPC devuelve null
          incomeToday: incomeData.incomeToday ?? 0,
          categoryName: categoryName,
        });
      }
    } catch (error) {
      console.error("---- [useIncomeStats] Error fatal:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchStats();
  };

  return {
    stats,
    loading,
    refreshing,
    onRefresh,
  };
};
