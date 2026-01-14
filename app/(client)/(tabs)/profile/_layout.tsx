import { Stack } from "expo-router";

export default function ProfileLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />

      {/* MAIN CATEGORIES*/}
      <Stack.Screen name="payment-methods" />
      <Stack.Screen name="locations" />
      <Stack.Screen name="notifications" />
      <Stack.Screen name="privacy" />
      <Stack.Screen name="app-settings" />
      <Stack.Screen name="help-center" />

      {/*Payment*/}
      <Stack.Screen name="ProfilePaymentFormScreen" />

      {/*Location*/}
      <Stack.Screen name="AddLocationScreen" />

      {/*Legal*/}
      <Stack.Screen name="terms-conditions" />
      <Stack.Screen name="privacy-policy" />
    </Stack>
  );
}
