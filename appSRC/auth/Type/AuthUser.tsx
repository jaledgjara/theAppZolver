
export type UserRole = "client" | "professional" | "employer" | "admin";

export type AuthStatus =
  | "unknown"
  | "anonymous"
  | "preAuth"             
  | "phoneVerified"       
  | "preProfessionalForm" 
  | "authenticated";


// appSRC/auth/Model/AuthUser.ts

export type AuthUser = {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  phoneNumber: string | null;
  role: "client" | "professional" | "admin";
  profileComplete: boolean;
};


// appSRC/auth/Type/AuthUser.ts
export type AuthUserSession = {
  status: AuthStatus;
  user: AuthUser | null;
  isLoading?: boolean;
  lastError?: string | null;
};
