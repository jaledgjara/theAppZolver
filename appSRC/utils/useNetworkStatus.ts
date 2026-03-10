import { useEffect, useState } from "react";
import { Platform } from "react-native";

/**
 * Hook that monitors network connectivity.
 * Returns { isConnected, isInternetReachable } for UI decisions.
 *
 * Gracefully handles missing native module (e.g. before dev build rebuild).
 */
export function useNetworkStatus() {
  const [isConnected, setIsConnected] = useState(true);
  const [isInternetReachable, setIsInternetReachable] = useState(true);

  useEffect(() => {
    if (Platform.OS === "web") return;

    let unsubscribe: (() => void) | undefined;

    try {
      // Dynamic require to avoid crash if native module isn't linked yet
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const NetInfo = require("@react-native-community/netinfo").default;
      unsubscribe = NetInfo.addEventListener(
        (state: { isConnected: boolean | null; isInternetReachable: boolean | null }) => {
          setIsConnected(state.isConnected ?? true);
          setIsInternetReachable(state.isInternetReachable ?? true);
        },
      );
    } catch {
      // Native module not available — fall back to "connected"
    }

    return () => unsubscribe?.();
  }, []);

  return { isConnected, isInternetReachable };
}
