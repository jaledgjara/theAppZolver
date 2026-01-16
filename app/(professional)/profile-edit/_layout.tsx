import { Stack } from "expo-router";

export default function ProfessionalProfileEditLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="person-outline" options={{ headerShown: false }} />
      <Stack.Screen name="briefcase-outline" options={{ headerShown: false }} />
      <Stack.Screen name="map-outline" options={{ headerShown: false }} />
    </Stack>
  );
}
