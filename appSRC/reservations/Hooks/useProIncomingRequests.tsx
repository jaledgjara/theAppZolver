import { useState, useEffect, useCallback } from "react";
import { Alert } from "react-native";
import { useAuthStore } from "@/appSRC/auth/Store/AuthStore";
import { fetchProIncomingRequests } from "../Service/ReservationService";
import { Reservation } from "../Type/ReservationType";

export const useProIncomingRequests = (isActive: boolean) => {
  const user = useAuthStore((state) => state.user);
  const [requests, setRequests] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(false);

  const loadRequests = useCallback(async () => {
    if (!user?.uid) {
      console.log("[ZOLVER-DEBUG] Hook: No user UID");
      return;
    }

    if (!isActive) {
      console.log("[ZOLVER-DEBUG] Hook: Pro is NOT active (Invisible)");
      setRequests([]);
      return;
    }

    setLoading(true);
    try {
      console.log("[ZOLVER-DEBUG] 04: Hook calling fetch...");
      const data = await fetchProIncomingRequests(user.uid);

      console.log("[ZOLVER-DEBUG] 05: Hook received data:", data.length);
      setRequests(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [user?.uid, isActive]);

  // Efecto: Cargar al montar o cambiar estado activo
  useEffect(() => {
    loadRequests();

    // Opcional: Polling simple cada 30 seg si está activo (para MVP)
    // Para Realtime real, usaríamos supabase.channel().subscribe() en V2
    let interval: NodeJS.Timeout;
    if (isActive) {
      interval = setInterval(loadRequests, 30000);
    }
    return () => clearInterval(interval);
  }, [loadRequests, isActive]);

  return {
    requests,
    loading,
    refresh: loadRequests,
  };
};
