import { Platform } from "react-native";

export type SupportedPlatform = "ios" | "android" | "both";

export interface MapAppOption {
  appName: string;
  url: string;
  checkUrl: string;
  platform: SupportedPlatform;
}

export const getMapOptions = (encodedAddress: string): MapAppOption[] => {
  console.log("[MapUtils] Generando URLs para:", encodedAddress);
  return [
    {
      appName: "Apple Maps",
      url: `maps:?daddr=${encodedAddress}&dirflg=d`,
      checkUrl: "maps:",
      platform: "ios",
    },
    {
      appName: "Google Maps",
      url: Platform.select({
        ios: `comgooglemaps://?daddr=${encodedAddress}&directionsmode=driving`,
        android: `google.navigation:q=${encodedAddress}`,
        default: `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`,
      }) as string,
      checkUrl:
        Platform.OS === "ios" ? "comgooglemaps://" : "https://www.google.com",
      platform: "both",
    },
    {
      appName: "Waze",
      url: `waze://?q=${encodedAddress}&navigate=yes`,
      checkUrl: "waze://",
      platform: "both",
    },
  ];
};
