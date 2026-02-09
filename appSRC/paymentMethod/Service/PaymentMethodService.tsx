import { supabase } from "@/appSRC/services/supabaseClient";
import {
  PaymentMethodDTO,
  UISavedCard,
  SavePaymentMethodPayload,
} from "../Type/PaymentMethodType";
import { mapDtoToUi } from "../Mapper/PaymentMethodMapper";

export const PaymentMethodsService = {
  /**
   * 1. READ: Obtener métodos de pago (FETCHING)
   * Nombre anterior: getAll
   */
  fetchPaymentMethodsByUser: async (userId: string): Promise<UISavedCard[]> => {
    console.log("📡 [Service] Iniciando fetch para User ID:", userId);

    const { data, error } = await supabase
      .from("user_payment_methods")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    // [DEBUGGING]
    if (error) {
      console.error("❌ [Service] Error CRÍTICO en Supabase:", error);
      throw new Error("No se pudieron cargar tus métodos de pago.");
    }

    if (!data) {
      console.warn("⚠️ [Service] Data es null/undefined.");
      return [];
    }

    console.log(`📦 [Service] Supabase devolvió ${data.length} filas.`);

    // Si data tiene 0 elementos, imprimirlo claramente
    if (data.length === 0) {
      console.log(
        "⚠️ [Service] El array está vacío. Posibles causas: RLS o UserID incorrecto."
      );
    }

    // Usamos el Mapper
    try {
      const mappedCards = (data as PaymentMethodDTO[]).map(mapDtoToUi);
      console.log("✅ [Service] Mapeo finalizado con éxito.");
      return mappedCards;
    } catch (mapError) {
      console.error("❌ [Service] Error en el Mapper:", mapError);
      return [];
    }
  },

  /**
   * 2. CREATE: Guardar nuevo método (CREATING)
   * Nombre anterior: save
   * Llama a la Edge Function segura.
   */
  savePaymentMethod: async (
    payload: SavePaymentMethodPayload
  ): Promise<UISavedCard> => {
    console.log("[PaymentService] Guardando tarjeta vía Edge Function...");

    console.log(
      "🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀[PaymentService] Payload saliendo hacia Edge Function:",
      JSON.stringify(payload)
    );
    console.log("📦 PAYLOAD FINAL:", JSON.stringify(payload));
    const { data, error } = await supabase.functions.invoke(
      "save-payment-method",
      {
        body: payload,
      }
    );

    // [DEBUG] Extract real error from Edge Function response
    if (error) {
      console.error("[PaymentService] Save error:", error.message);

      // supabase-js wraps non-2xx responses: the real body is in error.context
      let serverMessage = error.message;
      try {
        const ctx = (error as any).context;
        if (ctx && typeof ctx.json === "function") {
          const body = await ctx.json();
          console.error("[PaymentService] Server response:", body);
          serverMessage = body?.error || serverMessage;
        } else if (ctx && ctx._bodyBlob) {
          // React Native: body is a Blob, read it as text
          const text = await new Response(ctx._bodyBlob).text();
          const body = JSON.parse(text);
          console.error("[PaymentService] Server response:", body);
          serverMessage = body?.error || serverMessage;
        }
      } catch (parseErr) {
        console.warn("[PaymentService] Could not parse error body.");
      }

      throw new Error(serverMessage);
    }

    if (!data || !data.success) {
      console.error("[PaymentService] Business logic failed:", data);
      throw new Error(data?.error || "No se pudo procesar la tarjeta.");
    }

    return mapDtoToUi(data.data as PaymentMethodDTO);
  },

  /**
   * 2.5 READ (Raw): Obtener datos del proveedor (provider IDs) de una tarjeta
   * específica. Necesario para re-tokenizar tarjetas guardadas al momento del pago.
   */
  fetchCardProviderDetails: async (
    cardId: string,
  ): Promise<{
    provider_card_id: string;
    provider_customer_id: string;
    brand: string;
  }> => {
    const { data, error } = await supabase
      .from("user_payment_methods")
      .select("provider_card_id, provider_customer_id, brand")
      .eq("id", cardId)
      .single();

    if (error || !data) {
      console.error("[PaymentService] fetchCardProviderDetails error:", error);
      throw new Error("No se encontraron los datos del proveedor para esta tarjeta.");
    }

    return {
      provider_card_id: data.provider_card_id,
      provider_customer_id: data.provider_customer_id,
      brand: data.brand,
    };
  },

  /**
   * 3. DELETE: Eliminar método (DELETING)
   * Flujo seguro: obtiene los IDs del proveedor desde la DB,
   * luego invoca la Edge Function que borra en Mercado Pago + Supabase.
   */
  deletePaymentMethod: async (cardId: string): Promise<boolean> => {
    console.log("[PaymentService] Iniciando delete seguro para:", cardId);

    // STEP 1: Fetch provider IDs from DB (needed for MP API call in Edge Function)
    const { data: card, error: fetchError } = await supabase
      .from("user_payment_methods")
      .select("provider_customer_id, provider_card_id")
      .eq("id", cardId)
      .single();

    if (fetchError || !card) {
      console.error("[PaymentService] No se encontró la tarjeta:", fetchError);
      throw new Error("No se encontró la tarjeta a eliminar.");
    }

    // STEP 2: Invoke Edge Function (handles MP delete + DB delete atomically)
    const { data, error } = await supabase.functions.invoke(
      "delete-payment-method",
      {
        body: {
          card_id: cardId,
          provider_customer_id: card.provider_customer_id,
          provider_card_id: card.provider_card_id,
        },
      }
    );

    if (error) {
      console.error("[PaymentService] Edge Function Error:", error.message);
      throw new Error(`Fallo en el servidor: ${error.message}`);
    }

    if (!data || !data.success) {
      console.error("[PaymentService] Delete lógico falló:", data);
      throw new Error(data?.error || "No se pudo eliminar la tarjeta.");
    }

    console.log("[PaymentService] Tarjeta eliminada exitosamente.");
    return true;
  },
};
