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
    if (!user?.uid) return;

    // Si el pro está "invisible", no gastamos recursos buscando
    if (!isActive) {
      setRequests([]);
      return;
    }

    setLoading(true);
    try {
      const data = await fetchProIncomingRequests(user.uid);
      setRequests(data);
    } catch (error) {
      console.error(error);
      // Opcional: No mostrar alerta intrusiva en cada refresco, solo log
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
