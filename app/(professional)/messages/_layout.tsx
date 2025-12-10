import { Stack } from "expo-router";

export default function MessagesLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name="MessagesDetailsProfessionalScreen/[id]"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ReservationRequestScreen"
        options={{ headerShown: false }}
      />
    </Stack>
  );
}
