import { useMemo } from "react";
import { MediaService } from "../Service/MediaService";

/**
 * Hook para resolver múltiples imágenes del portafolio.
 * @param paths Array de strings (paths relativos en Supabase)
 */
export const usePortfolio = (paths: string[] | null | undefined) => {
  const resolvedUrls = useMemo(() => {
    if (!paths || !Array.isArray(paths)) return [];

    return paths
      .map((path) => MediaService.resolveUrl(path, "portfolio"))
      .filter((url): url is string => url !== null);
  }, [paths]);

  return {
    urls: resolvedUrls,
    hasImages: resolvedUrls.length > 0,
  };
};
