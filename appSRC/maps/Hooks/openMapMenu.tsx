import { useState } from "react";
import { Linking, Platform } from "react-native";
import { getMapOptions, MapAppOption } from "../Type/MapsType";

export const useMapNavigation = (address: string) => {
  const [mapMenuVisible, setMapMenuVisible] = useState(false);
  const [availableMaps, setAvailableMaps] = useState<MapAppOption[]>([]);

  const handleOpenMap = async (address: string) => {
    const encodedAddress = encodeURIComponent(address);
    const options = getMapOptions(encodedAddress);
    const detectedApps: MapAppOption[] = [];

    for (const map of options) {
      if (map.platform === "both" || map.platform === Platform.OS) {
        try {
          const isSupported = await Linking.canOpenURL(map.checkUrl);
          if (isSupported) detectedApps.push(map);
        } catch (e) {
          if (map.appName === "Apple Maps" && Platform.OS === "ios")
            detectedApps.push(map);
        }
      }
    }

    if (detectedApps.length <= 1) {
      const target = detectedApps[0] || options[0];
      Linking.openURL(target.url);
    } else {
      setAvailableMaps(detectedApps);
      setMapMenuVisible(true);
    }
  };

  return {
    mapMenuVisible,
    availableMaps,
    setMapMenuVisible,
    handleOpenMap,
  };
};
