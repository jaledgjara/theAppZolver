import { supabase } from "@/appSRC/services/supabaseClient";

export const ProfileService = {
  /**
   * Actualiza solo los campos permitidos del perfil.
   * Incluye logs de depuración para diagnosticar RLS.
   */
  async updateProfile(userId: string, updates: { legal_name: string }) {
    console.log("🔍 [ProfileService] Inicio de Update...");
    console.log(`   👉 User ID (Auth UID): ${userId}`);
    console.log(`   👉 Datos a actualizar:`, JSON.stringify(updates));

    try {
      // ---------------------------------------------------------
      // PASO 1: DIAGNÓSTICO (Intentar leer sin fallar)
      // ---------------------------------------------------------
      const { data: checkData, error: checkError } = await supabase
        .from("user_accounts")
        .select("*")
        .eq("auth_uid", userId);

      if (checkError) {
        console.error(
          "❌ [ProfileService] ERROR CRÍTICO al leer user_accounts:",
          checkError
        );
      } else {
        const count = checkData?.length || 0;
        console.log(
          `📊 [ProfileService] Lectura previa: Se encontraron ${count} filas.`
        );

        if (count === 0) {
          console.warn(
            "⚠️ [ProfileService] ALERTA: La base de datos retornó 0 filas para este ID.",
            "\n   Posibles causas:",
            "\n   1. RLS está activo y faltan las Policies (SELECT/UPDATE).",
            "\n   2. El auth_uid no coincide exactamente."
          );
        } else {
          console.log(
            "✅ [ProfileService] El usuario es visible. RLS de lectura parece OK."
          );
        }
      }

      // ---------------------------------------------------------
      // PASO 2: INTENTO DE UPDATE
      // ---------------------------------------------------------
      const { data, error } = await supabase
        .from("user_accounts")
        .update(updates)
        .eq("auth_uid", userId)
        .select()
        .maybeSingle();
      if (error) {
        console.error("❌ [ProfileService] Falló el UPDATE:", error);
        throw error;
      }

      console.log("✅ [ProfileService] Update exitoso. Dato retornado:", data);
      return data;
    } catch (error: any) {
      console.error("🔥 [ProfileService] Excepción final:", error);
      throw error;
    }
  },
};
