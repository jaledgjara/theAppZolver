import { Redirect } from "expo-router";
import { Platform, View } from "react-native";
import { useAuthStore } from "@/appSRC/auth/Store/AuthStore";

/**
 * Root index — Entry point redirect.
 * - Web: Redirects to the public landing page.
 * - Native (iOS/Android): Shows nothing; useAuthGuard handles navigation.
 */
export default function Index() {
  const status = useAuthStore((s) => s.status);
  const isBootLoading = useAuthStore((s) => s.isBootLoading);

  console.log(
    `📍 [Index] RENDER | Platform: ${Platform.OS} | status: ${status} | isBootLoading: ${isBootLoading}`
  );

  // On web, if the user is NOT authenticated, show the public landing page.
  if (Platform.OS === "web") {
    if (isBootLoading) {
      console.log("📍 [Index] Web: Still boot loading, showing empty View");
      return <View />;
    }

    if (status === "authenticated") {
      console.log("📍 [Index] Web: Redirecting to client home");
      return <Redirect href="/(client)/(tabs)/home" />;
    }
    if (status === "authenticatedProfessional") {
      console.log("📍 [Index] Web: Redirecting to professional home");
      return <Redirect href="/(professional)/(tabs)/home" />;
    }
    if (status === "authenticatedAdmin") {
      console.log("📍 [Index] Web: Redirecting to admin dashboard");
      return <Redirect href="/(admin)/dashboard" />;
    }

    // Default: show public landing
    console.log("📍 [Index] Web: Redirecting to (public) landing");
    return <Redirect href="/(public)" />;
  }

  // On native, AuthGuard handles the redirect. Render nothing.
  return <View />;
}
