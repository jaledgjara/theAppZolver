import { supabase } from "@/appSRC/services/supabaseClient";
import {
  PaymentDTO,
  Payment,
  CreatePaymentPayload,
  CreatePaymentResponseData,
  CancelPaymentPayload,
} from "../Type/PaymentType";
import { mapPaymentDTOToEntity } from "../Mapper/PaymentMapper";

export const PaymentService = {
  // =========================================================================
  // 1. CREATE: Process a booking payment via Edge Function
  // =========================================================================
  createPayment: async (
    payload: CreatePaymentPayload
  ): Promise<CreatePaymentResponseData> => {
    console.log(
      "[PaymentService] Creating payment...",
      payload.customer_id ? "SAVED CARD" : "NEW CARD"
    );

    const { data, error } = await supabase.functions.invoke(
      "process-booking-payment",
      { body: payload }
    );

    if (error) {
      console.error("[PaymentService] Edge Function error:", error.message);

      // Extract real server error from response body
      let serverMessage = error.message;
      try {
        const ctx = (error as Record<string, unknown>).context;
        if (ctx && typeof (ctx as Response).json === "function") {
          const body = await (ctx as Response).json();
          console.error("[PaymentService] Server response:", body);
          serverMessage = body?.error || serverMessage;
        } else if (ctx && (ctx as Record<string, unknown>)._bodyBlob) {
          const text = await new Response(
            (ctx as Record<string, unknown>)._bodyBlob as Blob
          ).text();
          const body = JSON.parse(text);
          console.error("[PaymentService] Server response:", body);
          serverMessage = body?.error || serverMessage;
        }
      } catch (_) {
        console.warn("[PaymentService] Could not parse error body.");
      }

      throw new Error(serverMessage);
    }

    if (!data || !data.success) {
      console.error("[PaymentService] Business logic failed:", data);
      throw new Error(data?.error || "No se pudo procesar el pago.");
    }

    console.log("[PaymentService] Payment created:", data.data.reservation_id);
    return data.data as CreatePaymentResponseData;
  },

  // =========================================================================
  // 2. READ: Fetch payment history for a user (as client)
  // =========================================================================
  fetchPaymentsByClient: async (clientId: string): Promise<Payment[]> => {
    console.log("[PaymentService] Fetching history for client:", clientId);

    const { data, error } = await supabase
      .from("payments")
      .select("*")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[PaymentService] Fetch error:", error);
      throw new Error("No se pudo cargar el historial de pagos.");
    }

    if (!data || data.length === 0) {
      console.log("[PaymentService] No payments found.");
      return [];
    }

    console.log(`[PaymentService] Found ${data.length} payments.`);
    return (data as PaymentDTO[]).map(mapPaymentDTOToEntity);
  },

  // =========================================================================
  // 3. READ: Fetch single payment by reservation ID
  // =========================================================================
  fetchPaymentByReservation: async (
    reservationId: string
  ): Promise<Payment | null> => {
    console.log(
      "[PaymentService] Fetching payment for reservation:",
      reservationId
    );

    const { data, error } = await supabase
      .from("payments")
      .select("*")
      .eq("reservation_id", reservationId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("[PaymentService] Fetch by reservation error:", error);
      throw new Error("No se pudo obtener el detalle del pago.");
    }

    if (!data) return null;

    return mapPaymentDTOToEntity(data as PaymentDTO);
  },

  // =========================================================================
  // 4. CANCEL: Request refund via Edge Function
  // =========================================================================
  cancelPayment: async (payload: CancelPaymentPayload): Promise<string> => {
    console.log(
      "[PaymentService] Cancelling reservation:",
      payload.reservation_id
    );

    const { data, error } = await supabase.functions.invoke(
      "cancel-reservation-refund",
      { body: payload }
    );

    if (error) {
      console.error("[PaymentService] Cancel Edge Function error:", error);
      throw new Error(`Fallo en el servidor: ${error.message}`);
    }

    if (!data || !data.success) {
      console.error("[PaymentService] Cancel logic failed:", data);
      throw new Error(data?.error || "No se pudo cancelar la reserva.");
    }

    console.log("[PaymentService] Cancel successful.");
    return data.message || "Reserva cancelada y reembolso procesado.";
  },
};
