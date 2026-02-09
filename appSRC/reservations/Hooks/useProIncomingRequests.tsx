import { useAuthStore } from "@/appSRC/auth/Store/AuthStore";
import { useCallback, useEffect, useState, useRef } from "react";
import { Reservation } from "../Type/ReservationType";
import { RealtimeChannel } from "@supabase/supabase-js";
import {
  fetchProIncomingRequests,
  confirmInstantReservationService,
  subscribeToIncomingRequestsService,
  unsubscribeFromChannel,
} from "../Service/ReservationService";

export const useProIncomingRequests = (isActive: boolean) => {
  const user = useAuthStore((state) => state.user);

  // GUARD: Solo profesionales deben usar este hook
  const isProfessional = user?.role === "professional";

  // Estado local
  const [requests, setRequests] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Control de reconexión: usamos un contador para forzar el re-render del efecto
  const [retryKey, setRetryKey] = useState(0);
  const retryCountRef = useRef(0);
  const gaveUpRef = useRef(false); // Persiste "ya me rendi" incluso tras remount del efecto
  const MAX_RETRIES = 5;

  // Referencia para limpieza segura
  const channelRef = useRef<RealtimeChannel | null>(null);

  // 1. CARGA DE DATOS (Estable)
  const loadRequests = useCallback(
    async (isSilent = false) => {
      if (!user?.uid || !isActive || !isProfessional) {
        if (!isActive || !isProfessional) setRequests([]);
        return;
      }

      if (!isSilent && requests.length === 0) setLoading(true);

      try {
        console.log("📥 [HOOK] Sincronizando datos...");
        const data = await fetchProIncomingRequests(user.uid);
        setRequests(data);
      } catch (error) {
        console.error("❌ [HOOK] Error al cargar solicitudes:", error);
      } finally {
        setLoading(false);
      }
    },
    [user?.uid, isActive, isProfessional]
  );

  // 2. LÓGICA DE NEGOCIO (Aceptar)
  const acceptRequest = async (reservationId: string) => {
    if (!user?.uid) return null;
    setProcessingId(reservationId);
    try {
      const confirmedJob = await confirmInstantReservationService(
        reservationId,
        user.uid
      );
      // Optimistic Update
      setRequests((prev) => prev.filter((r) => r.id !== reservationId));
      return confirmedJob;
    } catch (error) {
      console.error("❌ [HOOK] Error al aceptar trabajo:", error);
      throw error;
    } finally {
      setProcessingId(null);
    }
  };

  // 3. ORQUESTACIÓN REALTIME CON AUTO-RECONEXIÓN
  useEffect(() => {
    // GUARD: Solo profesionales activos y logueados pueden suscribirse
    if (!isActive || !user?.uid || !isProfessional) {
      return;
    }

    // Si ya nos rendimos en un ciclo anterior, no reintentar
    if (gaveUpRef.current) {
      console.warn(
        "[HOOK] Realtime: Reconexión deshabilitada (max retries alcanzado anteriormente)."
      );
      return;
    }

    // A. Carga inicial
    loadRequests();

    const handleConnectionError = () => {
      retryCountRef.current += 1;

      if (retryCountRef.current > MAX_RETRIES) {
        gaveUpRef.current = true; // No reintentar ni con remount
        console.error(
          `[HOOK] Realtime: Max retries (${MAX_RETRIES}) alcanzado. Deteniendo reconexión permanentemente.`
        );
        if (channelRef.current) unsubscribeFromChannel(channelRef.current);
        return;
      }

      // Exponential backoff: 5s, 10s, 20s, 40s, 80s
      const delay = 5000 * Math.pow(2, retryCountRef.current - 1);
      console.warn(
        `⚠️ [HOOK] Caída de conexión. Reintento ${retryCountRef.current}/${MAX_RETRIES} en ${delay / 1000}s...`
      );

      if (channelRef.current) unsubscribeFromChannel(channelRef.current);

      setTimeout(() => {
        setRetryKey((prev) => prev + 1);
      }, delay);
    };

    // B. Suscripción
    channelRef.current = subscribeToIncomingRequestsService(
      user.uid,
      () => {
        // Connection is healthy — reset retry counter
        retryCountRef.current = 0;
        gaveUpRef.current = false;
        console.log("🔄 [HOOK] Evento Realtime -> Refrescando lista");
        loadRequests(true); // Silent reload
      },
      handleConnectionError // Callback de error
    );

    // C. Limpieza al desmontar o cambiar dependencias
    return () => {
      if (channelRef.current) {
        unsubscribeFromChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [isActive, user?.uid, isProfessional, retryKey, loadRequests]);
  // 'retryKey' es la clave: si cambia, el efecto se desmonta y se monta de nuevo (Reconexión)

  return {
    requests,
    loading,
    processingId,
    refresh: () => loadRequests(false),
    acceptRequest,
  };
};
