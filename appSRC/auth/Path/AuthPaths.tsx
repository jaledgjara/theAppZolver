export const AUTH_PATHS = {
  unknown: "/(auth)/WelcomeScreen",
  anonymous: "/(auth)/SignInScreen",      
  preAuth: "/(auth)/UserBasicInfoScreen",
  authenticated: "/(tabs)/Home"
} as const;
