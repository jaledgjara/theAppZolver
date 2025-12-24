import { useState, useCallback, useEffect } from "react";
import { useAuthStore } from "@/appSRC/auth/Store/AuthStore";
import { Reservation } from "../Type/ReservationType";
import { fetchActiveProfessionalReservation } from "../Service/ReservationService";

export const useCurrentActiveJob = () => {
  const { user } = useAuthStore();
  const [currentJob, setCurrentJob] = useState<Reservation | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchActiveJob = useCallback(async () => {
    if (!user?.uid) return;

    // No ponemos isLoading(true) aquí para evitar parpadeos si se llama en background
    try {
      console.log("[ZOLVER-DEBUG] Hook: Buscando trabajo activo...");
      const activeReservation = await fetchActiveProfessionalReservation(
        user.uid
      );
      setCurrentJob(activeReservation);
    } catch (error) {
      console.error("[ZOLVER-DEBUG] Error fetching active job:", error);
      setCurrentJob(null);
    } finally {
      setIsLoading(false);
    }
  }, [user?.uid]);

  // Efecto inicial al montar
  useEffect(() => {
    fetchActiveJob();
  }, [fetchActiveJob]);

  return {
    currentJob,
    isLoading,
    refresh: fetchActiveJob,
  };
};
