import { useEffect, useState } from "react";
import { Platform } from "react-native";
import NetInfo, { NetInfoState } from "@react-native-community/netinfo";

/**
 * Hook that monitors network connectivity.
 * Returns { isConnected, isInternetReachable } for UI decisions.
 *
 * Usage:
 *   const { isConnected } = useNetworkStatus();
 *   if (!isConnected) return <OfflineBanner />;
 */
export function useNetworkStatus() {
  const [isConnected, setIsConnected] = useState(true);
  const [isInternetReachable, setIsInternetReachable] = useState(true);

  useEffect(() => {
    // NetInfo is not reliable on web — skip subscription
    if (Platform.OS === "web") return;

    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      setIsConnected(state.isConnected ?? true);
      setIsInternetReachable(state.isInternetReachable ?? true);
    });

    return () => unsubscribe();
  }, []);

  return { isConnected, isInternetReachable };
}
