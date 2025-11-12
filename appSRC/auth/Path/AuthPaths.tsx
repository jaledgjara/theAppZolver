export const AUTH_PATHS = {
  unknown: "/(auth)/WelcomeScreen",
  anonymous: "/(auth)/SignInScreen",      
  preAuth: "/(auth)/UserBasicInfoScreen",
  preTypeOfUser: "(auth)/TypeOfUserScreen",
  authenticated: "/(tabs)/Home"
} as const;
