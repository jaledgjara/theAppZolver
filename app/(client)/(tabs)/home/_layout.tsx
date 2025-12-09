import { Stack } from "expo-router";

export default function HomeLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="LocationScreen" />
      <Stack.Screen name="AddLocationScreen" />
      <Stack.Screen name="SearchScreen" />
      <Stack.Screen name="CategoryDetailsView/[id]" />
      <Stack.Screen name="ProfessionalDetails/[id]" />
      <Stack.Screen name="ReservationRequestScreen" />
    </Stack>
  );
}
