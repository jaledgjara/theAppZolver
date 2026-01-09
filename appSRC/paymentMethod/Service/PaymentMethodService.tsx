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
    const { data, error } = await supabase
      .from("user_payment_methods")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[PaymentService] Error fetching cards:", error);
      throw new Error("No se pudieron cargar tus métodos de pago.");
    }

    // Usamos el Mapper Helper para convertir DTO -> UI limpiamente
    return ((data as PaymentMethodDTO[]) || []).map(mapDtoToUi);
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

    const { data, error } = await supabase.functions.invoke(
      "save-payment-method",
      {
        body: payload, // { user_id, email, token }
      }
    );

    // [DEBUG CRÍTICO]
    if (error) {
      console.error("🛑 [PaymentService] FATAL ERROR DETECTADO:");
      console.error("1. Mensaje:", error.message);
      // A veces el detalle viene en context
      if ("context" in error)
        console.error("2. Contexto:", (error as any).context);

      // Intentamos leer el body de la respuesta si existe (aunque supabase-js a veces lo consume)
      throw new Error(`Fallo en el servidor: ${error.message}`);
    }

    if (!data || !data.success) {
      console.error("⚠️ [PaymentService] Lógica de Negocio falló:", data);
      throw new Error(data?.error || "No se pudo procesar la tarjeta.");
    }

    return mapDtoToUi(data.data as PaymentMethodDTO);
  },

  /**
   * 3. DELETE: Eliminar método (DELETING)
   * Nombre anterior: delete
   */
  deletePaymentMethod: async (cardId: string): Promise<boolean> => {
    const { error } = await supabase
      .from("user_payment_methods")
      .delete()
      .eq("id", cardId);

    if (error) {
      console.error("[PaymentService] Delete Error:", error);
      throw new Error("No se pudo eliminar el método de pago.");
    }

    return true;
  },
};
