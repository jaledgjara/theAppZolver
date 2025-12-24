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

  // Estado local
  const [requests, setRequests] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Control de reconexión: usamos un contador para forzar el re-render del efecto
  const [retryKey, setRetryKey] = useState(0);

  // Referencia para limpieza segura
  const channelRef = useRef<RealtimeChannel | null>(null);

  // 1. CARGA DE DATOS (Estable)
  const loadRequests = useCallback(
    async (isSilent = false) => {
      if (!user?.uid || !isActive) {
        if (!isActive) setRequests([]);
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
    [user?.uid, isActive]
  ); // Quitamos 'requests' de dependencias

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
    // Si no estamos activos o logueados, limpiamos y salimos
    if (!isActive || !user?.uid) {
      return;
    }

    // A. Carga inicial
    loadRequests();

    const handleConnectionError = () => {
      console.warn(
        "⚠️ [HOOK] Detectada caída de conexión. Reintentando en 5s..."
      );
      // Desconectamos inmediatamente para limpiar estado
      if (channelRef.current) unsubscribeFromChannel(channelRef.current);

      // Programamos reconexión incrementando la llave
      setTimeout(() => {
        setRetryKey((prev) => prev + 1);
      }, 5000);
    };

    // B. Suscripción
    channelRef.current = subscribeToIncomingRequestsService(
      user.uid,
      () => {
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
  }, [isActive, user?.uid, retryKey, loadRequests]);
  // 'retryKey' es la clave: si cambia, el efecto se desmonta y se monta de nuevo (Reconexión)

  return {
    requests,
    loading,
    processingId,
    refresh: () => loadRequests(false),
    acceptRequest,
  };
};
