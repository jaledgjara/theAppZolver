export type UserRole = "client" | "professional" | "employer" | "admin";

export type AuthStatus =
  | "unknown"
  | "anonymous"
  | "preAuth"
  | "phoneVerified"
  | "preProfessionalForm"
  | "pendingReview"
  | "rejected"
  | "authenticated"
  | "authenticatedProfessional"
  | "authenticatedAdmin";

// appSRC/auth/Model/AuthUser.ts

export type AuthUser = {
  uid: string;
  email: string | null;
  displayName: string | null;
  legalName: string | null;
  photoURL: string | null;
  phoneNumber: string | null;
  role: "client" | "professional" | "admin" | null;
  profileComplete: boolean;
  identityStatus?: string | null; // 👈 NUEVO (Útil para lógica UI)
};

// appSRC/auth/Type/AuthUser.ts
export type AuthUserSession = {
  status: AuthStatus;
  user: AuthUser | null;
  isLoading?: boolean;
  lastError?: string | null;
};
