// appSRC/shared/Hooks/useAvatar.ts
import { useState, useMemo } from "react";
import { MediaService } from "../Service/MediaService";

export const useAvatar = (
  path: string | null | undefined,
  bucket: string = "avatars"
) => {
  const [hasError, setHasError] = useState(false);

  const url = useMemo(() => {
    if (hasError) return null;
    return MediaService.resolveUrl(path, bucket);
  }, [path, bucket, hasError]);

  return {
    url,
    showFallback: !url || hasError,
    onError: () => setHasError(true),
  };
};
