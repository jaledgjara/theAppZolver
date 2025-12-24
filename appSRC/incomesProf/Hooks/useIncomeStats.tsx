import { useState, useEffect, useCallback } from "react";
import { useAuthGuard } from "@/appSRC/auth/Hooks/useAuthGuard"; // Tu hook de auth existente
import { getIncomeStats } from "../Service/IncomesService";
import { IncomePayload } from "../Type/IncomesType";
import { useAuthStore } from "@/appSRC/auth/Store/AuthStore";

export const useIncomeStats = () => {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<IncomePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = useCallback(async () => {
    if (!user?.uid) return;

    try {
      const data = await getIncomeStats(user.uid);
      if (data) {
        setStats(data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  // Carga inicial
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Función para Pull-to-Refresh
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
