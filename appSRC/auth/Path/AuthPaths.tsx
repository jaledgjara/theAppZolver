// appSRC/auth/Path/AuthPaths.ts

// Use a simple string map, avoid literal types
export const AUTH_PATHS: Record<string, string> = {
  unknown: "/(auth)/WelcomeScreen",
  anonymous: "/(auth)/SignInScreen",
  preAuth: "/(auth)/UserBasicInfoScreen",
  phoneVerified: "/(auth)/TypeOfUserScreen",
  preProfessionalForm: "/(auth)/FormProfessionalOne",
  // Nuevas Rutas
  pendingReview: "/(auth)/AccountStatusScreen", // La pantalla que creamos arriba
  rejected: "/(auth)/AccountStatusScreen",

  authenticated: "/(client)/(tabs)/home",
  authenticatedProfessional: "/(professional)/(tabs)/home",
  authenticatedAdmin: "/(admin)/dashboard",
};

// Always return a plain string
export function getPathForStatus(status: string): string {
  return AUTH_PATHS[status] ?? AUTH_PATHS.unknown;
}
