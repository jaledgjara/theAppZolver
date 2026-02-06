import { supabase } from "@/appSRC/services/supabaseClient";
import * as FileSystem from "expo-file-system";

/**
 * ZOLVER ARCHITECTURE: Storage Layer (Modern API)
 * Utiliza la nueva API de FileSystem (SDK 54) para garantizar la integridad binaria.
 */
export const StorageService = {
  /**
   * Sube una imagen procesando el archivo mediante la clase File nativa.
   * Esto elimina la necesidad de decodificadores base64 externos.
   */
  uploadMessageImage: async (
    uri: string,
    conversationId: string
  ): Promise<string> => {
    try {
      console.log(
        `🚀 [Storage] Iniciando upload con nueva API File: ${conversationId}`
      );

      // 1. 💡 SOLUCIÓN MODERNA: Crear instancia de File a partir de la URI
      // La nueva API de Expo gestiona el buffer de forma nativa y eficiente.
      const file = new FileSystem.File(uri);

      // Obtenemos el ArrayBuffer directamente del archivo
      const arrayBuffer = await file.arrayBuffer();

      const fileExt = uri.split(".").pop() || "jpg";
      const fileName = `${Date.now()}.${fileExt}`;
      const path = `${conversationId}/${fileName}`;

      // 2. Ejecución del Upload al bucket 'messages'
      const { data, error } = await supabase.storage
        .from("messages")
        .upload(path, arrayBuffer, {
          contentType: `image/${fileExt}`,
          upsert: false,
        });

      if (error) {
        if (error.message.includes("Bucket not found")) {
          throw new Error(
            "ERROR CRÍTICO: El bucket 'messages' no existe en Supabase Storage."
          );
        }
        throw error;
      }

      // 3. Obtención de la URL pública persistente
      const {
        data: { publicUrl },
      } = supabase.storage.from("messages").getPublicUrl(data.path);

      console.log("✅ [Storage] Upload exitoso con peso real:", publicUrl);
      return publicUrl;
    } catch (error) {
      console.error(
        "❌ [StorageService] Error crítico en la capa de almacenamiento (SDK 54):",
        error
      );
      throw error;
    }
  },

  /**
   * Sube un archivo a un bucket específico siguiendo la estructura de carpetas por UID.
   */
  uploadFile: async (
    uri: string,
    userId: string,
    bucket: "avatars" | "portfolio"
  ): Promise<string> => {
    try {
      console.log(
        `🚀 [Storage] Iniciando upload a [${bucket}] para usuario: ${userId}`
      );

      const file = new FileSystem.File(uri);
      const arrayBuffer = await file.arrayBuffer();
      console.log(
        `📦 [Storage] Archivo procesado. Tamaño buffer: ${arrayBuffer.byteLength} bytes`
      );

      const fileExt = uri.split(".").pop() || "jpg";
      const fileName = `${Date.now()}.${fileExt}`;
      const path = `${userId}/${fileName}`;

      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(path, arrayBuffer, {
          contentType: `image/${fileExt}`,
          upsert: true,
        });

      if (error) {
        console.error("❌ [Storage] Error de Supabase:", error.message);
        throw error;
      }

      console.log("✅ [Storage] Upload exitoso. Path remoto:", data.path);
      return data.path;
    } catch (error) {
      console.error("❌ [StorageService] Error crítico:", error);
      throw error;
    }
  },
};
