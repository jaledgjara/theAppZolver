import { View, Text } from "react-native";
import React from "react";
import { Stack } from "expo-router";
import { useAuthStore } from "@/appSRC/auth/Store/AuthStore";

const _layout = () => {
  const transitionDirection = useAuthStore((s) => s.transitionDirection);

  const animation =
    transitionDirection === "forward" ? "slide_from_right" : "slide_from_left";

  return (
    <Stack>
      <Stack.Screen
        name="WelcomeScreen"
        options={{ headerShown: false, animation }}
      />
      <Stack.Screen
        name="SignInScreen"
        options={{ headerShown: false, animation }}
      />
      <Stack.Screen
        name="SignInEmailScreen"
        options={{ headerShown: false, animation }}
      />
      <Stack.Screen
        name="ConfirmationEmailScreen"
        options={{ headerShown: false, animation }}
      />
      <Stack.Screen
        name="UserBasicInfoScreen"
        options={{ headerShown: false, animation }}
      />
      <Stack.Screen
        name="PhoneVerificationScreen"
        options={{ headerShown: false, animation }}
      />
      <Stack.Screen
        name="TypeOfUserScreen"
        options={{ headerShown: false, animation }}
      />
      <Stack.Screen
        name="FormProfessionalOne"
        options={{ headerShown: false, animation }}
      />

      <Stack.Screen
        name="FormProfessionalTwo"
        options={{ headerShown: false, animation }}
      />
    </Stack>
  );
};

export default _layout;
