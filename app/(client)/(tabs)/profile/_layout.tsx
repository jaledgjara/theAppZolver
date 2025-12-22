import { Stack } from "expo-router";

export default function ProfileLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />

      <Stack.Screen name="payment-methods" />
      <Stack.Screen name="locations" />
      <Stack.Screen name="notifications" />
      <Stack.Screen name="privacy" />
      <Stack.Screen name="app-settings" />

      <Stack.Screen name="AddLocationScreen" />
    </Stack>
  );
}
