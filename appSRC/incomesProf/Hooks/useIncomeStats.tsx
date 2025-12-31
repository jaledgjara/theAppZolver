import { useState, useEffect, useCallback } from "react";
import { useAuthStore } from "@/appSRC/auth/Store/AuthStore";
import { getIncomeStats } from "../Service/IncomesService";
import { IncomePayload } from "../Type/IncomesType";

export const useIncomeStats = () => {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<IncomePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = useCallback(async () => {
    // [DEBUG] Verificar si tenemos usuario
    console.log("---- [useIncomeStats] Inicio de fetchStats ----");
    if (!user?.uid) {
      console.warn("---- [useIncomeStats] No hay User ID disponible ----");
      setLoading(false);
      return;
    }

    try {
      console.log(
        `---- [useIncomeStats] Solicitando stats para UID: ${user.uid} ----`
      );

      const data = await getIncomeStats(user.uid);

      // [DEBUG] Ver qué devuelve exactamente la DB
      console.log(
        "---- [useIncomeStats] Datos crudos recibidos de RPC:",
        JSON.stringify(data, null, 2)
      );

      if (data) {
        setStats(data);
      } else {
        console.warn("---- [useIncomeStats] La data llegó nula ----");
      }
    } catch (error) {
      console.error("---- [useIncomeStats] Error capturado:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
      console.log("---- [useIncomeStats] Fin de carga (loading: false) ----");
    }
  }, [user]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const onRefresh = () => {
    console.log("---- [useIncomeStats] Refrescando manualmente... ----");
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
