import { Stack } from "expo-router";
import GlobalReviewAlert from "@/appSRC/reviews/Screen/GlobalReviewAlert";

export default function ClientLayout() {
  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="messages" options={{ headerShown: false }} />
      </Stack>

      {/* Global review alert - appears */}
      <GlobalReviewAlert />
    </>
  );
}
