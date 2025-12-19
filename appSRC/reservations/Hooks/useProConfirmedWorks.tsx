import { useState, useCallback } from "react";
import { useFocusEffect } from "expo-router";
import { fetchProConfirmedWorks } from "../Service/ReservationService";
import { useAuthStore } from "@/appSRC/auth/Store/AuthStore";
import { Reservation } from "../Type/ReservationType";

export const useProConfirmedWorks = () => {
  const { user } = useAuthStore();
  const [works, setWorks] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadWorks = async () => {
    if (!user) return;

    try {
      console.log(
        "[ZOLVER-DEBUG] >> Hook: useProConfirmedWorks triggering fetch..."
      );
      const data = await fetchProConfirmedWorks(user.uid);
      setWorks(data);
    } catch (error) {
      console.error("[ZOLVER-DEBUG] Hook Error:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Se ejecuta cada vez que la pantalla gana foco (navegación)
  useFocusEffect(
    useCallback(() => {
      loadWorks();
    }, [user])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadWorks();
  };

  return {
    works,
    loading,
    refreshing,
    onRefresh,
  };
};
