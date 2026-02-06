// appSRC/services/MediaService.ts
import { supabase } from "@/appSRC/services/supabaseClient";

export const MediaService = {
  resolveUrl: (
    path: string | null | undefined,
    bucket: string = "avatars"
  ): string | null => {
    console.log(
      `🔍 [MediaService] Resolviendo path: ${path} en bucket: ${bucket}`
    );

    if (!path || path.trim() === "") return null;

    // ✅ FIX: Si es local (Picker) o externa, retornamos directo para preview inmediato
    if (path.startsWith("file://") || path.startsWith("http")) {
      console.log(
        "📱 [MediaService] URI Local/Externa detectada, omitiendo Supabase."
      );
      return path;
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    console.log("🌐 [MediaService] URL de Supabase generada:", data.publicUrl);
    return data.publicUrl;
  },

  shouldShowInitials: (path: string | null | undefined): boolean =>
    !path || path.trim() === "",
};
